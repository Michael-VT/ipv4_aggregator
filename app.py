"""
IPv4 Price Aggregator — Streamlit Dashboard
Полная версия: таблицы + графики + автообновление + история в SQLite + выбор региона
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time

from data_sources import (
    fetch_larus_lease_prices,
    get_purchase_prices,
    get_all_regions,
    PURCHASE_PRICES,
)
from db import (
    init_db,
    save_lease_snapshot,
    save_purchase_snapshot,
    get_lease_history,
    get_purchase_history,
    get_last_update,
    get_latest_lease,
)

# ====================== Настройки страницы ======================

st.set_page_config(
    page_title="IPv4 Price Aggregator",
    page_icon="📡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Инициализация БД
init_db()

# ====================== Sidebar ======================

st.sidebar.title("📡 IPv4 Aggregator")
st.sidebar.markdown("---")

# Выбор региона
regions = ["Все регионы"] + get_all_regions()
selected_region = st.sidebar.selectbox(
    "Регион (покупка)",
    regions,
    index=0,
)

# Размер блока для фильтрации графиков
block_sizes = ["/24", "/23", "/22", "/21", "/20", "/19", "/18", "/17", "/16"]
selected_blocks = st.sidebar.multiselect(
    "Размеры блоков для графиков",
    block_sizes,
    default=["/24", "/22", "/20", "/16"],
)

# Автообновление
auto_refresh = st.sidebar.checkbox("Автообновление (каждые 5 мин)", value=False)
refresh_interval = 300  # секунд

st.sidebar.markdown("---")
st.sidebar.markdown("### Источники")
st.sidebar.markdown("- **Аренда**: LARUS Live API")
st.sidebar.markdown("- **Покупка**: IPv4Center + рыночные отчёты")
st.sidebar.markdown("- **История**: локальный SQLite")

st.sidebar.markdown("---")
if st.sidebar.button("🔄 Обновить данные сейчас", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

# ====================== Кэширование данных ======================

@st.cache_data(ttl=300, show_spinner="Загружаю живые цены аренды с LARUS...")
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

st.title("📡 IPv4 Price Aggregator")
st.caption(f"Актуально на {datetime.now().strftime('%Y-%m-%d %H:%M')} | Данные обновляются автоматически")

# ---------- Вкладки ----------
tab1, tab2, tab3, tab4 = st.tabs([
    "🟢 Аренда (Live)",
    "🔵 Покупка по регионам",
    "📈 История и графики",
    "ℹ️ О проекте"
])

# ====================== TAB 1: Аренда ======================
with tab1:
    st.subheader("Живые цены аренды IPv4 (LARUS)")

    col1, col2 = st.columns([3, 1])
    with col2:
        location = st.selectbox("Локация API", ["US", "EU"], index=0)

    lease_data = load_lease_data(location)

    if lease_data:
        # Таблица
        rows = []
        for label, d in lease_data.items():
            if "error" in d:
                continue
            rows.append({
                "Блок": d.get("block_size", label),
                "Количество IP": d["ips"],
                "Base $/IP/мес": round(d["base_per_ip"], 3),
                "Base $/мес": round(d["base_total"], 2),
                "Production $/IP/мес": round(d["production_per_ip"], 3),
                "Production $/мес": round(d["production_total"], 2),
            })

        df_lease = pd.DataFrame(rows)
        st.dataframe(
            df_lease.style.format({
                "Base $/IP/мес": "${:.3f}",
                "Base $/мес": "${:,.2f}",
                "Production $/IP/мес": "${:.3f}",
                "Production $/мес": "${:,.2f}",
                "Количество IP": "{:,}",
            }),
            use_container_width=True,
            hide_index=True,
        )

        # График сравнения Base vs Production
        st.subheader("Сравнение тарифов Base vs Production")
        fig = go.Figure()
        fig.add_trace(go.Bar(
            name="Base (Capacity Only)",
            x=df_lease["Блок"],
            y=df_lease["Base $/IP/мес"],
            marker_color="#2ecc71",
        ))
        fig.add_trace(go.Bar(
            name="Production",
            x=df_lease["Блок"],
            y=df_lease["Production $/IP/мес"],
            marker_color="#f39c12",
        ))
        fig.update_layout(
            barmode="group",
            yaxis_title="$ за IP в месяц",
            xaxis_title="Размер блока",
            height=420,
            legend=dict(orientation="h", yanchor="bottom", y=1.02),
        )
        st.plotly_chart(fig, use_container_width=True)

        last_upd = get_last_update("last_lease_update")
        if last_upd:
            st.caption(f"Последнее сохранение в историю: {last_upd} UTC")
    else:
        st.error("Не удалось загрузить данные с LARUS API")

# ====================== TAB 2: Покупка ======================
with tab2:
    st.subheader("Средние цены покупки IPv4 по регионам")

    purchase_data = load_purchase_data()

    if selected_region == "Все регионы":
        regions_to_show = get_all_regions()
    else:
        regions_to_show = [selected_region]

    for region in regions_to_show:
        st.markdown(f"### {region}")
        blocks = purchase_data.get(region, {})
        if not blocks:
            continue

        rows = []
        for size, p in blocks.items():
            rows.append({
                "Блок": size,
                "Мин $": p["min"],
                "Среднее $": p["avg"],
                "Макс $": p["max"],
                "Диапазон": f"${p['min']:.0f} – ${p['max']:.0f}",
            })

        df = pd.DataFrame(rows)
        st.dataframe(
            df.style.format({
                "Мин $": "${:.1f}",
                "Среднее $": "${:.1f}",
                "Макс $": "${:.1f}",
            }),
            use_container_width=True,
            hide_index=True,
        )

        # Мини-график по региону
        fig = px.bar(
            df,
            x="Блок",
            y="Среднее $",
            error_y=df["Макс $"] - df["Среднее $"],
            error_y_minus=df["Среднее $"] - df["Мин $"],
            title=f"Средняя цена покупки — {region}",
            labels={"Среднее $": "$ за 1 IP"},
            color="Среднее $",
            color_continuous_scale="Blues",
        )
        fig.update_layout(height=380, showlegend=False)
        st.plotly_chart(fig, use_container_width=True)
        st.markdown("---")

# ====================== TAB 3: История и графики ======================
with tab3:
    st.subheader("История цен и динамика")

    col1, col2 = st.columns(2)
    with col1:
        days = st.slider("Период истории (дней)", 7, 180, 30)
    with col2:
        hist_block = st.selectbox("Размер блока для истории аренды", block_sizes, index=0)

    # --- История аренды ---
    st.markdown("#### Динамика аренды (LARUS)")
    lease_hist = get_lease_history(block_size=hist_block, days=days)

    if lease_hist:
        df_h = pd.DataFrame(lease_hist)
        df_h["timestamp"] = pd.to_datetime(df_h["timestamp"])

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df_h["timestamp"],
            y=df_h["base_per_ip"],
            mode="lines+markers",
            name="Base $/IP",
            line=dict(color="#2ecc71", width=2),
        ))
        if "production_per_ip" in df_h.columns:
            fig.add_trace(go.Scatter(
                x=df_h["timestamp"],
                y=df_h["production_per_ip"],
                mode="lines+markers",
                name="Production $/IP",
                line=dict(color="#f39c12", width=2),
            ))
        fig.update_layout(
            title=f"История аренды {hist_block}",
            yaxis_title="$ за IP / месяц",
            xaxis_title="Дата",
            height=420,
            hovermode="x unified",
        )
        st.plotly_chart(fig, use_container_width=True)

        with st.expander("Сырые данные истории аренды"):
            st.dataframe(df_h, use_container_width=True)
    else:
        st.info("История аренды пока пуста. Данные появятся после нескольких обновлений.")

    st.markdown("---")

    # --- История покупки ---
    st.markdown("#### Динамика покупки по регионам")
    purchase_hist = get_purchase_history(days=days)

    if purchase_hist:
        df_p = pd.DataFrame(purchase_hist)
        df_p["timestamp"] = pd.to_datetime(df_p["timestamp"])

        # Фильтр по выбранным блокам
        if selected_blocks:
            df_p = df_p[df_p["block_size"].isin(selected_blocks)]

        if selected_region != "Все регионы":
            df_p = df_p[df_p["region"] == selected_region]

        if not df_p.empty:
            fig2 = px.line(
                df_p,
                x="timestamp",
                y="avg_price",
                color="region",
                line_dash="block_size",
                markers=True,
                title="Средняя цена покупки во времени",
                labels={"avg_price": "$ за 1 IP", "timestamp": "Дата"},
            )
            fig2.update_layout(height=480, hovermode="x unified")
            st.plotly_chart(fig2, use_container_width=True)

            with st.expander("Сырые данные истории покупки"):
                st.dataframe(df_p, use_container_width=True)
        else:
            st.info("Нет данных для выбранных фильтров.")
    else:
        st.info("История покупки пока пуста.")

# ====================== TAB 4: О проекте ======================
with tab4:
    st.markdown("""
    ### О IPv4 Price Aggregator

    Этот дашборд собирает актуальные цены на блоки IPv4 из открытых источников:

    | Источник | Тип данных | Обновление |
    |----------|------------|------------|
    | **LARUS API** | Аренда (live) | каждые 5 минут |
    | **IPv4Center / рыночные отчёты** | Покупка | вручную + сохранение снимков |
    | **Локальный SQLite** | История | при каждом обновлении |

    #### Регионы (RIR)
    - **RIPE NCC** — Европа, Ближний Восток, Центральная Азия
    - **ARIN** — Северная Америка
    - **APNIC** — Азия-Тихий океан
    - **LACNIC** — Латинская Америка и Карибы
    - **AFRINIC** — Африка

    #### Как пользоваться
    1. Выберите регион в боковой панели
    2. Включите автообновление, если нужно
    3. Смотрите таблицы и графики
    4. История накапливается автоматически в `ipv4_prices.db`

    #### Запуск
    ```bash
    cd ipv4_aggregator
    pip install -r requirements.txt
    streamlit run app.py
    ```
    """)

# ====================== Автообновление ======================
if auto_refresh:
    st.sidebar.info(f"Автообновление каждые {refresh_interval // 60} мин")
    time.sleep(refresh_interval)
    st.rerun()
