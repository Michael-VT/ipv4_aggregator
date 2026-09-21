"""
IPv4 Price Aggregator — Streamlit Dashboard
Полная версия: таблицы + графики + автообновление + история в SQLite + выбор региона.

Интерфейс доступен на 6 языках (EN/UA/RU/PT/DE/FR) — строки в i18n.py.
Безопасный выход: Ctrl+C / SIGTERM закрывают соединения без остаточных WAL-файлов.
"""

import atexit
import signal
import sys

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

from data_sources import (
    fetch_larus_lease_prices,
    get_purchase_prices,
    get_all_regions,
)
from db import (
    init_db,
    save_lease_snapshot,
    save_purchase_snapshot,
    get_lease_history,
    get_purchase_history,
    get_last_update,
)
from i18n import t, LANGUAGES, get_lang, set_lang, region_display

# ====================== Настройки страницы ======================

st.set_page_config(
    page_title="IPv4 Price Aggregator",
    page_icon="📡",
    layout="wide",
    # «auto»: на компьютере сайдбар развёрнут, на смартфоне свёрнут
    initial_sidebar_state="auto",
)

REFRESH_INTERVAL = 300  # секунд между автообновлениями


# ====================== Безопасный выход ======================
# Соединения с БД открываются и закрываются на каждый вызов (db.py), поэтому
# данные не теряются при любом завершении. Здесь — страховка: при SIGTERM
# корректно выходим, чтобы сработал atexit и не оставались WAL-файлы.

def _cleanup():
    """Финальная зачистка при завершении процесса."""
    # sqlite3-соединения в db.py закрываются в каждом save/get; здесь
    # дополнительно ничего держать не должны. Лог для отладки в терминале.
    print("[ipv4-aggregator] остановлено, база закрыта", file=sys.stderr)


def _sigterm_handler(_signum, _frame):
    print("[ipv4-aggregator] получен SIGTERM, корректное завершение...", file=sys.stderr)
    sys.exit(0)


atexit.register(_cleanup)
try:
    # Скрипт Streamlit исполняется не в главном потоке — там signal.signal
    # запрещён; в этом случае достаточно atexit и стандартной обработки SIGINT.
    signal.signal(signal.SIGTERM, _sigterm_handler)
except ValueError:
    pass

# Инициализация БД
init_db()

# ====================== Мобильные стили ======================
# Меньше шрифты и отступы на узких экранах, скрываем тулбар Plotly дублированием
# (сами графики создаются с config={"displayModeBar": False}).

st.markdown("""
<style>
    @media (max-width: 640px) {
        .block-container { padding: 1rem 0.75rem 2rem; }
        h1 { font-size: 1.4rem !important; }
        h2 { font-size: 1.15rem !important; }
        h3 { font-size: 1.05rem !important; }
        [data-testid="stMetricValue"] { font-size: 1.1rem; }
    }
    div[data-testid="stDataFrame"] { overflow-x: auto; }
</style>
""", unsafe_allow_html=True)

# ====================== Sidebar ======================

st.sidebar.title("📡 IPv4 Aggregator")
st.sidebar.markdown("---")

# Выбор языка — первый элемент, чтобы всё ниже сразу перерисовалось на выбранном языке
lang_codes = list(LANGUAGES.keys())
current_lang = get_lang()
chosen_lang = st.sidebar.selectbox(
    t("lang_label"),
    lang_codes,
    index=lang_codes.index(current_lang) if current_lang in lang_codes else 0,
    format_func=lambda c: LANGUAGES[c],
    key="lang_selector",
)
if chosen_lang != current_lang:
    set_lang(chosen_lang)
    st.rerun()

# Выбор региона (внутри хранится ключ БД, отображается переведённое имя)
region_keys = get_all_regions()  # ключи БД: "RIPE NCC (Европа)" и т.п.
selected_region = st.sidebar.selectbox(
    t("sidebar_region"),
    [t("region_all")] + region_keys,
    index=0,
    format_func=lambda r: r if r == t("region_all") else region_display(r),
)
selected_region_key = None if selected_region == t("region_all") else selected_region

# Размер блока для фильтрации графиков
block_sizes = ["/24", "/23", "/22", "/21", "/20", "/19", "/18", "/17", "/16"]
selected_blocks = st.sidebar.multiselect(
    t("sidebar_blocks"),
    block_sizes,
    default=["/24", "/22", "/20", "/16"],
)

# Автообновление (управляет st.fragment ниже)
auto_refresh = st.sidebar.checkbox(t("sidebar_autorefresh"), value=False)

st.sidebar.markdown("---")
st.sidebar.markdown(f"### {t('sidebar_sources_title')}")
st.sidebar.markdown(t("src_lease"))
st.sidebar.markdown(t("src_purchase"))
st.sidebar.markdown(t("src_history"))

st.sidebar.markdown("---")
if st.sidebar.button(t("btn_refresh"), width="stretch"):
    st.cache_data.clear()
    st.rerun()

# ====================== Кэширование данных ======================

@st.cache_data(ttl=REFRESH_INTERVAL, show_spinner=t("spinner_lease"))
def load_lease_data(location: str = "US"):
    data = fetch_larus_lease_prices(location=location)
    # Сохраняем в историю
    if data and not any("error" in v for v in data.values()):
        save_lease_snapshot(data)
    return data


@st.cache_data(ttl=3600)
def load_purchase_data():
    data = get_purchase_prices()
    save_purchase_snapshot(data)
    return data


# ====================== Основной интерфейс ======================

st.title(t("app_title"))
st.caption(t("caption_updated").format(ts=datetime.now().strftime("%Y-%m-%d %H:%M")))

# ---------- Вкладки ----------
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    t("tab_lease"),
    t("tab_purchase"),
    t("tab_history"),
    t("tab_calc"),
    t("tab_about"),
])

# Количество IP в блоке — для калькулятора подсети
BLOCK_IPS = {"/24": 256, "/23": 512, "/22": 1024, "/21": 2048, "/20": 4096,
             "/19": 8192, "/18": 16384, "/17": 32768, "/16": 65536}

# ====================== TAB 1: Аренда ======================

def render_lease_tab(container):
    """Живые цены аренды: таблица + график сравнения тарифов."""
    with container:
        st.subheader(t("lease_header"))

        _col1, col2 = st.columns([3, 1])
        with col2:
            location = st.selectbox(t("api_location"), ["US", "EU"], index=0)

        lease_data = load_lease_data(location)

        if lease_data:
            rows = []
            for label, d in lease_data.items():
                if "error" in d:
                    continue
                rows.append({
                    t("col_block"): d.get("block_size", label),
                    t("col_ips"): d["ips"],
                    t("col_base_pip"): round(d["base_per_ip"], 3),
                    t("col_base_total"): round(d["base_total"], 2),
                    t("col_prod_pip"): round(d["production_per_ip"], 3),
                    t("col_prod_total"): round(d["production_total"], 2),
                })

            df_lease = pd.DataFrame(rows)
            st.dataframe(
                df_lease,
                width="stretch",
                hide_index=True,
                height=300,
            )

            # График сравнения Base vs Production
            st.subheader(t("lease_compare"))
            fig = go.Figure()
            fig.add_trace(go.Bar(
                name=t("trace_base"),
                x=df_lease[t("col_block")],
                y=df_lease[t("col_base_pip")],
                marker_color="#2ecc71",
            ))
            fig.add_trace(go.Bar(
                name=t("trace_prod"),
                x=df_lease[t("col_block")],
                y=df_lease[t("col_prod_pip")],
                marker_color="#f39c12",
            ))
            fig.update_layout(
                barmode="group",
                yaxis_title=t("yaxis_pip"),
                xaxis_title=t("xaxis_block"),
                height=380,
                margin=dict(l=10, r=10, t=30, b=10),
                legend=dict(orientation="h", yanchor="bottom", y=1.02),
            )
            st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})

            last_upd = get_last_update("last_lease_update")
            if last_upd:
                st.caption(t("saved_caption").format(ts=last_upd))
        else:
            st.error(t("err_larus"))


# Автообновление через фрагмент: перерисовывается каждые 5 минут БЕЗ блокировки
# потока (в отличие от time.sleep + rerun), поэтому Ctrl+C срабатывает мгновенно.
if auto_refresh:
    @st.fragment(run_every=REFRESH_INTERVAL)
    def lease_fragment():
        render_lease_tab(tab1)
    lease_fragment()
else:
    render_lease_tab(tab1)

# ====================== TAB 2: Покупка ======================
with tab2:
    st.subheader(t("purchase_header"))

    purchase_data = load_purchase_data()

    if selected_region_key is None:
        regions_to_show = get_all_regions()
    else:
        regions_to_show = [selected_region_key]

    for region in regions_to_show:
        st.markdown(f"### {region_display(region)}")
        blocks = purchase_data.get(region, {})
        if not blocks:
            continue

        rows = []
        for size, p in blocks.items():
            rows.append({
                t("col_block"): size,
                t("col_min"): p["min"],
                t("col_avg"): p["avg"],
                t("col_max"): p["max"],
                t("col_range"): f"${p['min']:.0f} – ${p['max']:.0f}",
            })

        df = pd.DataFrame(rows)
        st.dataframe(
            df,
            width="stretch",
            hide_index=True,
            height=280,
        )

        # Мини-график по региону
        fig = px.bar(
            df,
            x=t("col_block"),
            y=t("col_avg"),
            error_y=df[t("col_max")] - df[t("col_avg")],
            error_y_minus=df[t("col_avg")] - df[t("col_min")],
            title=t("purchase_chart_title").format(region=region_display(region)),
            labels={t("col_avg"): t("yaxis_per_ip")},
            color=t("col_avg"),
            color_continuous_scale="Blues",
        )
        fig.update_layout(height=340, showlegend=False, margin=dict(l=10, r=10, t=40, b=10))
        st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
        st.markdown("---")

# ====================== TAB 3: История и графики ======================
with tab3:
    st.subheader(t("history_header"))

    col1, col2 = st.columns(2)
    with col1:
        days = st.slider(t("days_slider"), 7, 180, 30)
    with col2:
        hist_block = st.selectbox(t("hist_block_select"), block_sizes, index=0)

    # --- История аренды ---
    st.markdown(f"#### {t('lease_dynamics')}")
    lease_hist = get_lease_history(block_size=hist_block, days=days)

    if lease_hist:
        df_h = pd.DataFrame(lease_hist)
        df_h["timestamp"] = pd.to_datetime(df_h["timestamp"], format="mixed", utc=True)

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df_h["timestamp"],
            y=df_h["base_per_ip"],
            mode="lines+markers",
            name=t("trace_base_ip"),
            line=dict(color="#2ecc71", width=2),
        ))
        if "production_per_ip" in df_h.columns:
            fig.add_trace(go.Scatter(
                x=df_h["timestamp"],
                y=df_h["production_per_ip"],
                mode="lines+markers",
                name=t("trace_prod_ip"),
                line=dict(color="#f39c12", width=2),
            ))
        fig.update_layout(
            title=t("lease_hist_title").format(block=hist_block),
            yaxis_title=t("yaxis_pip"),
            xaxis_title=t("xaxis_date"),
            height=380,
            margin=dict(l=10, r=10, t=40, b=10),
            hovermode="x unified",
        )
        st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})

        with st.expander(t("expander_lease_raw")):
            st.dataframe(df_h, width="stretch", height=260)
    else:
        st.info(t("empty_lease"))

    st.markdown("---")

    # --- История покупки ---
    st.markdown(f"#### {t('purchase_dynamics')}")
    purchase_hist = get_purchase_history(days=days)

    if purchase_hist:
        df_p = pd.DataFrame(purchase_hist)
        df_p["timestamp"] = pd.to_datetime(df_p["timestamp"], format="mixed", utc=True)
        # Показываем переведённые имена регионов, в БД остаются ключи
        df_p["region"] = df_p["region"].map(region_display)

        # Фильтр по выбранным блокам
        if selected_blocks:
            df_p = df_p[df_p["block_size"].isin(selected_blocks)]

        if selected_region_key is not None:
            df_p = df_p[df_p["region"] == region_display(selected_region_key)]

        if not df_p.empty:
            fig2 = px.line(
                df_p,
                x="timestamp",
                y="avg_price",
                color="region",
                line_dash="block_size",
                markers=True,
                title=t("purchase_hist_title"),
                labels={"avg_price": t("yaxis_per_ip"), "timestamp": t("xaxis_date")},
            )
            fig2.update_layout(
                height=420,
                margin=dict(l=10, r=10, t=40, b=10),
                hovermode="x unified",
            )
            st.plotly_chart(fig2, width="stretch", config={"displayModeBar": False})

            with st.expander(t("expander_purchase_raw")):
                st.dataframe(df_p, width="stretch", height=260)
        else:
            st.info(t("no_filter_data"))
    else:
        st.info(t("empty_purchase"))

# ====================== TAB: Калькулятор ======================
with tab4:
    st.subheader(t("tab_calc"))

    # Рыночная средняя цена выбранного региона/блока — второй план
    purchase_data_all = load_purchase_data()

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        calc_block = st.selectbox(t("conv_block"), block_sizes, index=0)
    with col2:
        calc_region = st.selectbox(
            t("conv_region"),
            get_all_regions(),
            format_func=region_display,
        )
    with col3:
        own_price = st.number_input(t("conv_own"), min_value=0.0, value=0.0, step=0.01)
    with col4:
        lawyer_pct = st.number_input(t("conv_fee"), min_value=0.0, value=1.0, step=0.1)

    ips = BLOCK_IPS[calc_block]
    sum_sub = own_price * ips
    fee_ip = own_price * lawyer_pct / 100
    fee_sub = sum_sub * lawyer_pct / 100
    total_sub = sum_sub + fee_sub
    per_ip_total = own_price + fee_ip

    # Рыночная средняя для сравнения (второй план, мелко)
    market_avg = purchase_data_all.get(calc_region, {}).get(calc_block, {}).get("avg")
    if market_avg:
        st.caption(t("purchase_chart_title").format(region=region_display(calc_region)) +
                   f" — ${market_avg:.2f} ({t('col_min')} ${purchase_data_all[calc_region][calc_block]['min']:.2f}" +
                   f" – {t('col_max')} ${purchase_data_all[calc_region][calc_block]['max']:.2f})")

    if own_price > 0:
        m1, m2, m3, m4 = st.columns(4)
        m1.metric(t("conv_sum24"), f"${sum_sub:,.2f}", f"{ips:,} IP")
        m2.metric(t("conv_fee_ip"), f"${fee_ip:,.2f}")
        m3.metric(t("conv_fee24"), f"${fee_sub:,.2f}")
        m4.metric(t("conv_total24"), f"${total_sub:,.2f}")

        if market_avg:
            diff = per_ip_total - market_avg
            pct = diff / market_avg * 100 if market_avg else 0
            sign = "+" if diff >= 0 else "−"
            st.markdown(
                f"**{t('conv_diff')}:** {sign}${abs(diff):,.2f} ({sign}{abs(pct):.0f}%)",
                unsafe_allow_html=False,
            )
    else:
        st.info(t("conv_own") + " > 0")

# ====================== TAB: О проекте ======================
with tab5:
    st.markdown(t("about_md"))
