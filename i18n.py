"""
i18n — строки интерфейса IPv4 Price Aggregator на 6 языках.

КЛЮЧИ должны синхронизироваться с docs/i18n.js (веб-вариант): добавляя ключ
здесь, добавьте его и в docs/i18n.js для всех 6 языков.
"""

import streamlit as st

# Коды и названия языков (для селектора)
LANGUAGES = {
    "en": "English",
    "ua": "Українська",
    "ru": "Русский",
    "pt": "Português",
    "de": "Deutsch",
    "fr": "Français",
}

_DEFAULT = "en"

STRINGS = {
    # ============================== ENGLISH ==============================
    "en": {
        "lang_label": "🌐 Language",
        "sidebar_region": "Region (purchase)",
        "region_all": "All regions",
        "sidebar_blocks": "Block sizes for charts",
        "sidebar_autorefresh": "Auto-refresh (every 5 min)",
        "sidebar_sources_title": "Sources",
        "src_lease": "- **Lease**: LARUS Live API",
        "src_purchase": "- **Purchase**: IPv4Center + market reports",
        "src_history": "- **History**: local SQLite",
        "btn_refresh": "🔄 Refresh data now",
        "app_title": "📡 IPv4 Price Aggregator",
        "caption_updated": "Updated {ts} | Data refreshes automatically",
        "tab_lease": "🟢 Lease (Live)",
        "tab_purchase": "🔵 Purchase by region",
        "tab_history": "📈 History & charts",
        "tab_about": "ℹ️ About",
        "lease_header": "Live IPv4 lease prices (LARUS)",
        "api_location": "API location",
        "col_block": "Block",
        "col_ips": "IP count",
        "col_base_pip": "Base $/IP/mo",
        "col_base_total": "Base $/mo",
        "col_prod_pip": "Production $/IP/mo",
        "col_prod_total": "Production $/mo",
        "lease_compare": "Base vs Production plans",
        "yaxis_pip": "$ per IP / month",
        "xaxis_block": "Block size",
        "trace_base": "Base (Capacity Only)",
        "trace_prod": "Production",
        "saved_caption": "Last saved to history: {ts} UTC",
        "err_larus": "Failed to load data from the LARUS API",
        "spinner_lease": "Loading live lease prices from LARUS...",
        "purchase_header": "Average IPv4 purchase prices by region",
        "col_min": "Min $",
        "col_avg": "Avg $",
        "col_max": "Max $",
        "col_range": "Range",
        "purchase_chart_title": "Average purchase price — {region}",
        "yaxis_per_ip": "$ per 1 IP",
        "history_header": "Price history and dynamics",
        "days_slider": "History period (days)",
        "hist_block_select": "Block size for lease history",
        "lease_dynamics": "Lease dynamics (LARUS)",
        "trace_base_ip": "Base $/IP",
        "trace_prod_ip": "Production $/IP",
        "lease_hist_title": "Lease history {block}",
        "xaxis_date": "Date",
        "expander_lease_raw": "Raw lease history data",
        "empty_lease": "Lease history is empty yet. Data appears after several refreshes.",
        "purchase_dynamics": "Purchase dynamics by region",
        "purchase_hist_title": "Average purchase price over time",
        "expander_purchase_raw": "Raw purchase history data",
        "no_filter_data": "No data for the selected filters.",
        "empty_purchase": "Purchase history is empty.",
        "regions": {
            "RIPE": "RIPE NCC (Europe)",
            "ARIN": "ARIN (North America)",
            "APNIC": "APNIC (Asia-Pacific)",
            "LACNIC": "LACNIC (Latin America)",
            "AFRINIC": "AFRINIC (Africa)",
        },
        "about_md": """
### About IPv4 Price Aggregator

This dashboard collects current IPv4 block prices from open sources:

| Source | Data type | Update |
|--------|-----------|--------|
| **LARUS API** | Lease (live) | every 5 minutes |
| **IPv4Center / market reports** | Purchase | manual + snapshots |
| **Local SQLite** | History | on every refresh |

#### RIR regions
- **RIPE NCC** — Europe, Middle East, Central Asia
- **ARIN** — North America
- **APNIC** — Asia-Pacific
- **LACNIC** — Latin America and Caribbean
- **AFRINIC** — Africa

#### How to use
1. Pick a region in the sidebar
2. Enable auto-refresh if needed
3. Watch tables and charts
4. History accumulates automatically in `ipv4_prices.db`

#### Running
Three variants share one SQLite storage — see README.md:
```bash
# 1. Python dashboard (Streamlit)
pip install -r requirements.txt
streamlit run app.py

# 2. Local web variant (Node.js, Node >= 22.5)
node server.js            # http://localhost:8787

# 3. GitHub Pages — static monitoring, see README.md
```
""",
    },

    # ============================== УКРАЇНСЬКА ==============================
    "ua": {
        "lang_label": "🌐 Мова",
        "sidebar_region": "Регіон (купівля)",
        "region_all": "Усі регіони",
        "sidebar_blocks": "Розміри блоків для графіків",
        "sidebar_autorefresh": "Автооновлення (кожні 5 хв)",
        "sidebar_sources_title": "Джерела",
        "src_lease": "- **Оренда**: LARUS Live API",
        "src_purchase": "- **Купівля**: IPv4Center + ринкові звіти",
        "src_history": "- **Історія**: локальний SQLite",
        "btn_refresh": "🔄 Оновити дані зараз",
        "app_title": "📡 IPv4 Price Aggregator",
        "caption_updated": "Актуально на {ts} | Дані оновлюються автоматично",
        "tab_lease": "🟢 Оренда (Live)",
        "tab_purchase": "🔵 Купівля за регіонами",
        "tab_history": "📈 Історія та графіки",
        "tab_about": "ℹ️ Про проєкт",
        "lease_header": "Живі ціни оренди IPv4 (LARUS)",
        "api_location": "Локація API",
        "col_block": "Блок",
        "col_ips": "Кількість IP",
        "col_base_pip": "Base $/IP/міс",
        "col_base_total": "Base $/міс",
        "col_prod_pip": "Production $/IP/міс",
        "col_prod_total": "Production $/міс",
        "lease_compare": "Порівняння тарифів Base vs Production",
        "yaxis_pip": "$ за IP на місяць",
        "xaxis_block": "Розмір блоку",
        "trace_base": "Base (Capacity Only)",
        "trace_prod": "Production",
        "saved_caption": "Останнє збереження в історію: {ts} UTC",
        "err_larus": "Не вдалося завантажити дані з LARUS API",
        "spinner_lease": "Завантажую живі ціни оренди з LARUS...",
        "purchase_header": "Середні ціни купівлі IPv4 за регіонами",
        "col_min": "Мін $",
        "col_avg": "Середнє $",
        "col_max": "Макс $",
        "col_range": "Діапазон",
        "purchase_chart_title": "Середня ціна купівлі — {region}",
        "yaxis_per_ip": "$ за 1 IP",
        "history_header": "Історія цін і динаміка",
        "days_slider": "Період історії (днів)",
        "hist_block_select": "Розмір блоку для історії оренди",
        "lease_dynamics": "Динаміка оренди (LARUS)",
        "trace_base_ip": "Base $/IP",
        "trace_prod_ip": "Production $/IP",
        "lease_hist_title": "Історія оренди {block}",
        "xaxis_date": "Дата",
        "expander_lease_raw": "Сирі дані історії оренди",
        "empty_lease": "Історія оренди поки порожня. Дані з'являться після кількох оновлень.",
        "purchase_dynamics": "Динаміка купівлі за регіонами",
        "purchase_hist_title": "Середня ціна купівлі в часі",
        "expander_purchase_raw": "Сирі дані історії купівлі",
        "no_filter_data": "Немає даних для обраних фільтрів.",
        "empty_purchase": "Історія купівлі поки порожня.",
        "regions": {
            "RIPE": "RIPE NCC (Європа)",
            "ARIN": "ARIN (Північна Америка)",
            "APNIC": "APNIC (Азія та Тихий океан)",
            "LACNIC": "LACNIC (Латинська Америка)",
            "AFRINIC": "AFRINIC (Африка)",
        },
        "about_md": """
### Про IPv4 Price Aggregator

Цей дашборд збирає актуальні ціни на блоки IPv4 з відкритих джерел:

| Джерело | Тип даних | Оновлення |
|---------|-----------|-----------|
| **LARUS API** | Оренда (live) | кожні 5 хвилин |
| **IPv4Center / ринкові звіти** | Купівля | вручну + збереження знімків |
| **Локальний SQLite** | Історія | при кожному оновленні |

#### Регіони (RIR)
- **RIPE NCC** — Європа, Близький Схід, Центральна Азія
- **ARIN** — Північна Америка
- **APNIC** — Азія та Тихий океан
- **LACNIC** — Латинська Америка та Кариби
- **AFRINIC** — Африка

#### Як користуватися
1. Оберіть регіон у бічній панелі
2. Увімкніть автооновлення за потреби
3. Дивіться таблиці та графіки
4. Історія накопичується автоматично в `ipv4_prices.db`

#### Запуск
Три варіанти спільно використовують одне SQLite-сховище — див. README.UA.md:
```bash
# 1. Python-дашборд (Streamlit)
pip install -r requirements.txt
streamlit run app.py

# 2. Локальний веб-варіант (Node.js, Node >= 22.5)
node server.js            # http://localhost:8787

# 3. GitHub Pages — статичний моніторинг, див. README.UA.md
```
""",
    },

    # ============================== РУССКИЙ ==============================
    "ru": {
        "lang_label": "🌐 Язык",
        "sidebar_region": "Регион (покупка)",
        "region_all": "Все регионы",
        "sidebar_blocks": "Размеры блоков для графиков",
        "sidebar_autorefresh": "Автообновление (каждые 5 мин)",
        "sidebar_sources_title": "Источники",
        "src_lease": "- **Аренда**: LARUS Live API",
        "src_purchase": "- **Покупка**: IPv4Center + рыночные отчёты",
        "src_history": "- **История**: локальный SQLite",
        "btn_refresh": "🔄 Обновить данные сейчас",
        "app_title": "📡 IPv4 Price Aggregator",
        "caption_updated": "Актуально на {ts} | Данные обновляются автоматически",
        "tab_lease": "🟢 Аренда (Live)",
        "tab_purchase": "🔵 Покупка по регионам",
        "tab_history": "📈 История и графики",
        "tab_about": "ℹ️ О проекте",
        "lease_header": "Живые цены аренды IPv4 (LARUS)",
        "api_location": "Локация API",
        "col_block": "Блок",
        "col_ips": "Количество IP",
        "col_base_pip": "Base $/IP/мес",
        "col_base_total": "Base $/мес",
        "col_prod_pip": "Production $/IP/мес",
        "col_prod_total": "Production $/мес",
        "lease_compare": "Сравнение тарифов Base vs Production",
        "yaxis_pip": "$ за IP в месяц",
        "xaxis_block": "Размер блока",
        "trace_base": "Base (Capacity Only)",
        "trace_prod": "Production",
        "saved_caption": "Последнее сохранение в историю: {ts} UTC",
        "err_larus": "Не удалось загрузить данные с LARUS API",
        "spinner_lease": "Загружаю живые цены аренды с LARUS...",
        "purchase_header": "Средние цены покупки IPv4 по регионам",
        "col_min": "Мин $",
        "col_avg": "Среднее $",
        "col_max": "Макс $",
        "col_range": "Диапазон",
        "purchase_chart_title": "Средняя цена покупки — {region}",
        "yaxis_per_ip": "$ за 1 IP",
        "history_header": "История цен и динамика",
        "days_slider": "Период истории (дней)",
        "hist_block_select": "Размер блока для истории аренды",
        "lease_dynamics": "Динамика аренды (LARUS)",
        "trace_base_ip": "Base $/IP",
        "trace_prod_ip": "Production $/IP",
        "lease_hist_title": "История аренды {block}",
        "xaxis_date": "Дата",
        "expander_lease_raw": "Сырые данные истории аренды",
        "empty_lease": "История аренды пока пуста. Данные появятся после нескольких обновлений.",
        "purchase_dynamics": "Динамика покупки по регионам",
        "purchase_hist_title": "Средняя цена покупки во времени",
        "expander_purchase_raw": "Сырые данные истории покупки",
        "no_filter_data": "Нет данных для выбранных фильтров.",
        "empty_purchase": "История покупки пока пуста.",
        "regions": {
            "RIPE": "RIPE NCC (Европа)",
            "ARIN": "ARIN (Северная Америка)",
            "APNIC": "APNIC (Азия-Тихий океан)",
            "LACNIC": "LACNIC (Латинская Америка)",
            "AFRINIC": "AFRINIC (Африка)",
        },
        "about_md": """
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
Три варианта используют общее SQLite-хранилище — см. README.RU.md:
```bash
# 1. Python-дашборд (Streamlit)
pip install -r requirements.txt
streamlit run app.py

# 2. Локальный веб-вариант (Node.js, Node >= 22.5)
node server.js            # http://localhost:8787

# 3. GitHub Pages — статический мониторинг, см. README.RU.md
```
""",
    },

    # ============================== PORTUGUÊS ==============================
    "pt": {
        "lang_label": "🌐 Idioma",
        "sidebar_region": "Região (compra)",
        "region_all": "Todas as regiões",
        "sidebar_blocks": "Tamanhos de bloco para os gráficos",
        "sidebar_autorefresh": "Atualização automática (a cada 5 min)",
        "sidebar_sources_title": "Fontes",
        "src_lease": "- **Arrendamento**: LARUS Live API",
        "src_purchase": "- **Compra**: IPv4Center + relatórios de mercado",
        "src_history": "- **Histórico**: SQLite local",
        "btn_refresh": "🔄 Atualizar dados agora",
        "app_title": "📡 IPv4 Price Aggregator",
        "caption_updated": "Atualizado em {ts} | Os dados são atualizados automaticamente",
        "tab_lease": "🟢 Arrendamento (Live)",
        "tab_purchase": "🔵 Compra por região",
        "tab_history": "📈 Histórico e gráficos",
        "tab_about": "ℹ️ Sobre",
        "lease_header": "Preços de arrendamento IPv4 em tempo real (LARUS)",
        "api_location": "Localização da API",
        "col_block": "Bloco",
        "col_ips": "Nº de IPs",
        "col_base_pip": "Base $/IP/mês",
        "col_base_total": "Base $/mês",
        "col_prod_pip": "Production $/IP/mês",
        "col_prod_total": "Production $/mês",
        "lease_compare": "Comparação de planos Base vs Production",
        "yaxis_pip": "$ por IP / mês",
        "xaxis_block": "Tamanho do bloco",
        "trace_base": "Base (Capacity Only)",
        "trace_prod": "Production",
        "saved_caption": "Última gravação no histórico: {ts} UTC",
        "err_larus": "Falha ao carregar dados da API LARUS",
        "spinner_lease": "Carregando preços de arrendamento do LARUS...",
        "purchase_header": "Preços médios de compra de IPv4 por região",
        "col_min": "Mín $",
        "col_avg": "Média $",
        "col_max": "Máx $",
        "col_range": "Faixa",
        "purchase_chart_title": "Preço médio de compra — {region}",
        "yaxis_per_ip": "$ por 1 IP",
        "history_header": "Histórico de preços e dinâmica",
        "days_slider": "Período do histórico (dias)",
        "hist_block_select": "Tamanho do bloco para o histórico de arrendamento",
        "lease_dynamics": "Dinâmica de arrendamento (LARUS)",
        "trace_base_ip": "Base $/IP",
        "trace_prod_ip": "Production $/IP",
        "lease_hist_title": "Histórico de arrendamento {block}",
        "xaxis_date": "Data",
        "expander_lease_raw": "Dados brutos do histórico de arrendamento",
        "empty_lease": "O histórico de arrendamento ainda está vazio. Os dados aparecem após várias atualizações.",
        "purchase_dynamics": "Dinâmica de compra por região",
        "purchase_hist_title": "Preço médio de compra ao longo do tempo",
        "expander_purchase_raw": "Dados brutos do histórico de compra",
        "no_filter_data": "Sem dados para os filtros selecionados.",
        "empty_purchase": "O histórico de compra está vazio.",
        "regions": {
            "RIPE": "RIPE NCC (Europa)",
            "ARIN": "ARIN (América do Norte)",
            "APNIC": "APNIC (Ásia-Pacífico)",
            "LACNIC": "LACNIC (América Latina)",
            "AFRINIC": "AFRINIC (África)",
        },
        "about_md": """
### Sobre o IPv4 Price Aggregator

Este painel coleta preços atuais de blocos IPv4 de fontes abertas:

| Fonte | Tipo de dados | Atualização |
|-------|---------------|-------------|
| **LARUS API** | Arrendamento (live) | a cada 5 minutos |
| **IPv4Center / relatórios de mercado** | Compra | manual + snapshots |
| **SQLite local** | Histórico | a cada atualização |

#### Regiões (RIR)
- **RIPE NCC** — Europa, Oriente Médio, Ásia Central
- **ARIN** — América do Norte
- **APNIC** — Ásia-Pacífico
- **LACNIC** — América Latina e Caribe
- **AFRINIC** — África

#### Como usar
1. Escolha uma região na barra lateral
2. Ative a atualização automática se necessário
3. Veja as tabelas e gráficos
4. O histórico se acumula automaticamente em `ipv4_prices.db`

#### Execução
As três variantes compartilham o mesmo armazenamento SQLite — veja README.PT.md:
```bash
# 1. Painel Python (Streamlit)
pip install -r requirements.txt
streamlit run app.py

# 2. Variante web local (Node.js, Node >= 22.5)
node server.js            # http://localhost:8787

# 3. GitHub Pages — monitoramento estático, veja README.PT.md
```
""",
    },

    # ============================== DEUTSCH ==============================
    "de": {
        "lang_label": "🌐 Sprache",
        "sidebar_region": "Region (Kauf)",
        "region_all": "Alle Regionen",
        "sidebar_blocks": "Blockgrößen für Diagramme",
        "sidebar_autorefresh": "Auto-Aktualisierung (alle 5 Min.)",
        "sidebar_sources_title": "Quellen",
        "src_lease": "- **Miete**: LARUS Live API",
        "src_purchase": "- **Kauf**: IPv4Center + Marktberichte",
        "src_history": "- **Verlauf**: lokales SQLite",
        "btn_refresh": "🔄 Daten jetzt aktualisieren",
        "app_title": "📡 IPv4 Price Aggregator",
        "caption_updated": "Stand {ts} | Daten werden automatisch aktualisiert",
        "tab_lease": "🟢 Miete (Live)",
        "tab_purchase": "🔵 Kauf nach Region",
        "tab_history": "📈 Verlauf & Diagramme",
        "tab_about": "ℹ️ Über",
        "lease_header": "Live-Mietpreise für IPv4 (LARUS)",
        "api_location": "API-Standort",
        "col_block": "Block",
        "col_ips": "IP-Anzahl",
        "col_base_pip": "Base $/IP/Mo.",
        "col_base_total": "Base $/Mo.",
        "col_prod_pip": "Production $/IP/Mo.",
        "col_prod_total": "Production $/Mo.",
        "lease_compare": "Vergleich der Tarife Base vs. Production",
        "yaxis_pip": "$ pro IP / Monat",
        "xaxis_block": "Blockgröße",
        "trace_base": "Base (Capacity Only)",
        "trace_prod": "Production",
        "saved_caption": "Zuletzt im Verlauf gespeichert: {ts} UTC",
        "err_larus": "Daten konnten nicht von der LARUS-API geladen werden",
        "spinner_lease": "Lade Live-Mietpreise von LARUS...",
        "purchase_header": "Durchschnittliche IPv4-Kaufpreise nach Region",
        "col_min": "Min. $",
        "col_avg": "Durchschn. $",
        "col_max": "Max. $",
        "col_range": "Spanne",
        "purchase_chart_title": "Durchschnittlicher Kaufpreis — {region}",
        "yaxis_per_ip": "$ pro 1 IP",
        "history_header": "Preisverlauf und Dynamik",
        "days_slider": "Verlaufszeitraum (Tage)",
        "hist_block_select": "Blockgröße für Mietverlauf",
        "lease_dynamics": "Mietdynamik (LARUS)",
        "trace_base_ip": "Base $/IP",
        "trace_prod_ip": "Production $/IP",
        "lease_hist_title": "Mietverlauf {block}",
        "xaxis_date": "Datum",
        "expander_lease_raw": "Rohdaten des Mietverlaufs",
        "empty_lease": "Der Mietverlauf ist noch leer. Daten erscheinen nach mehreren Aktualisierungen.",
        "purchase_dynamics": "Kaufdynamik nach Region",
        "purchase_hist_title": "Durchschnittlicher Kaufpreis im Zeitverlauf",
        "expander_purchase_raw": "Rohdaten des Kaufverlaufs",
        "no_filter_data": "Keine Daten für die ausgewählten Filter.",
        "empty_purchase": "Der Kaufverlauf ist leer.",
        "regions": {
            "RIPE": "RIPE NCC (Europa)",
            "ARIN": "ARIN (Nordamerika)",
            "APNIC": "APNIC (Asien-Pazifik)",
            "LACNIC": "LACNIC (Lateinamerika)",
            "AFRINIC": "AFRINIC (Afrika)",
        },
        "about_md": """
### Über IPv4 Price Aggregator

Dieses Dashboard sammelt aktuelle Preise für IPv4-Blöcke aus offenen Quellen:

| Quelle | Datentyp | Aktualisierung |
|--------|----------|----------------|
| **LARUS API** | Miete (live) | alle 5 Minuten |
| **IPv4Center / Marktberichte** | Kauf | manuell + Snapshots |
| **Lokales SQLite** | Verlauf | bei jeder Aktualisierung |

#### RIR-Regionen
- **RIPE NCC** — Europa, Naher Osten, Zentralasien
- **ARIN** — Nordamerika
- **APNIC** — Asien-Pazifik
- **LACNIC** — Lateinamerika und Karibik
- **AFRINIC** — Afrika

#### Verwendung
1. Region in der Seitenleiste wählen
2. Bei Bedarf Auto-Aktualisierung aktivieren
3. Tabellen und Diagramme ansehen
4. Der Verlauf sammelt sich automatisch in `ipv4_prices.db`

#### Ausführung
Alle drei Varianten nutzen denselben SQLite-Speicher — siehe README.DE.md:
```bash
# 1. Python-Dashboard (Streamlit)
pip install -r requirements.txt
streamlit run app.py

# 2. Lokale Web-Variante (Node.js, Node >= 22.5)
node server.js            # http://localhost:8787

# 3. GitHub Pages — statisches Monitoring, siehe README.DE.md
```
""",
    },

    # ============================== FRANÇAIS ==============================
    "fr": {
        "lang_label": "🌐 Langue",
        "sidebar_region": "Région (achat)",
        "region_all": "Toutes les régions",
        "sidebar_blocks": "Tailles de blocs pour les graphiques",
        "sidebar_autorefresh": "Actualisation auto (toutes les 5 min)",
        "sidebar_sources_title": "Sources",
        "src_lease": "- **Location** : API LARUS Live",
        "src_purchase": "- **Achat** : IPv4Center + rapports de marché",
        "src_history": "- **Historique** : SQLite local",
        "btn_refresh": "🔄 Actualiser les données",
        "app_title": "📡 IPv4 Price Aggregator",
        "caption_updated": "Mis à jour le {ts} | Les données s'actualisent automatiquement",
        "tab_lease": "🟢 Location (Live)",
        "tab_purchase": "🔵 Achat par région",
        "tab_history": "📈 Historique et graphiques",
        "tab_about": "ℹ️ À propos",
        "lease_header": "Prix de location IPv4 en temps réel (LARUS)",
        "api_location": "Localisation API",
        "col_block": "Bloc",
        "col_ips": "Nombre d'IP",
        "col_base_pip": "Base $/IP/mois",
        "col_base_total": "Base $/mois",
        "col_prod_pip": "Production $/IP/mois",
        "col_prod_total": "Production $/mois",
        "lease_compare": "Comparaison des offres Base vs Production",
        "yaxis_pip": "$ par IP / mois",
        "xaxis_block": "Taille du bloc",
        "trace_base": "Base (Capacity Only)",
        "trace_prod": "Production",
        "saved_caption": "Dernier enregistrement dans l'historique : {ts} UTC",
        "err_larus": "Échec du chargement des données depuis l'API LARUS",
        "spinner_lease": "Chargement des prix de location en direct depuis LARUS...",
        "purchase_header": "Prix moyens d'achat d'IPv4 par région",
        "col_min": "Min $",
        "col_avg": "Moyenne $",
        "col_max": "Max $",
        "col_range": "Plage",
        "purchase_chart_title": "Prix moyen d'achat — {region}",
        "yaxis_per_ip": "$ par 1 IP",
        "history_header": "Historique des prix et dynamique",
        "days_slider": "Période d'historique (jours)",
        "hist_block_select": "Taille de bloc pour l'historique de location",
        "lease_dynamics": "Dynamique de location (LARUS)",
        "trace_base_ip": "Base $/IP",
        "trace_prod_ip": "Production $/IP",
        "lease_hist_title": "Historique de location {block}",
        "xaxis_date": "Date",
        "expander_lease_raw": "Données brutes de l'historique de location",
        "empty_lease": "L'historique de location est encore vide. Les données apparaîtront après plusieurs actualisations.",
        "purchase_dynamics": "Dynamique d'achat par région",
        "purchase_hist_title": "Prix moyen d'achat dans le temps",
        "expander_purchase_raw": "Données brutes de l'historique d'achat",
        "no_filter_data": "Aucune donnée pour les filtres sélectionnés.",
        "empty_purchase": "L'historique d'achat est vide.",
        "regions": {
            "RIPE": "RIPE NCC (Europe)",
            "ARIN": "ARIN (Amérique du Nord)",
            "APNIC": "APNIC (Asie-Pacifique)",
            "LACNIC": "LACNIC (Amérique latine)",
            "AFRINIC": "AFRINIC (Afrique)",
        },
        "about_md": """
### À propos d'IPv4 Price Aggregator

Ce tableau de bord collecte les prix actuels des blocs IPv4 depuis des sources ouvertes :

| Source | Type de données | Mise à jour |
|--------|-----------------|-------------|
| **API LARUS** | Location (live) | toutes les 5 minutes |
| **IPv4Center / rapports de marché** | Achat | manuel + instantanés |
| **SQLite local** | Historique | à chaque actualisation |

#### Régions (RIR)
- **RIPE NCC** — Europe, Moyen-Orient, Asie centrale
- **ARIN** — Amérique du Nord
- **APNIC** — Asie-Pacifique
- **LACNIC** — Amérique latine et Caraïbes
- **AFRINIC** — Afrique

#### Utilisation
1. Choisissez une région dans la barre latérale
2. Activez l'actualisation automatique si besoin
3. Consultez les tableaux et graphiques
4. L'historique s'accumule automatiquement dans `ipv4_prices.db`

#### Exécution
Les trois variantes partagent le même stockage SQLite — voir README.FR.md :
```bash
# 1. Tableau de bord Python (Streamlit)
pip install -r requirements.txt
streamlit run app.py

# 2. Variante web locale (Node.js, Node >= 22.5)
node server.js            # http://localhost:8787

# 3. GitHub Pages — surveillance statique, voir README.FR.md
```
""",
    },
}


def get_lang() -> str:
    """Текущий язык из session_state (по умолчанию — английский)."""
    return st.session_state.get("lang", _DEFAULT)


def set_lang(code: str):
    st.session_state["lang"] = code


def t(key: str) -> str:
    """Перевод ключа на текущий язык с fallback на английский."""
    lang = get_lang()
    return (
        STRINGS.get(lang, {}).get(key)
        or STRINGS[_DEFAULT].get(key)
        or key
    )


def regions_dict() -> dict:
    """Словарь {код RIR: переведённое имя региона} на текущем языке."""
    lang = get_lang()
    return (
        STRINGS.get(lang, {}).get("regions")
        or STRINGS[_DEFAULT]["regions"]
    )


def region_display(db_region: str) -> str:
    """Человекочитаемое имя региона RIR на текущем языке.

    В БД регионы хранятся строками вида 'RIPE NCC (Европа)' — сопоставляем
    по первому словку (RIPE / ARIN / APNIC / LACNIC / AFRINIC), чтобы
    история оставалась совместимой со старыми записями.
    """
    code = db_region.split(" ")[0].split("(")[0].strip()
    return regions_dict().get(code, db_region)
