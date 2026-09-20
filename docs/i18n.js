/*
 * i18n — строки веб-интерфейса IPv4 Price Aggregator на 6 языках.
 *
 * КЛЮЧИ синхронизированы с i18n.py (Python-вариант): общие ключи называются
 * одинаково. Добавляя ключ здесь, добавьте его и в i18n.py.
 */
window.I18N = {
    en: {
        app_title: "📡 IPv4 Price Aggregator",
        lang_label: "Language",
        mode_session: "Session monitoring — data only while the page is open",
        mode_local: "Local server — data is saved to SQLite",
        db_rows: "rows in DB",
        location_label: "API location",
        currency_label: "Currency",
        rates_offline: "approximate rates (offline)",
        refresh_now: "🔄 Refresh now",
        next_refresh: "Next refresh in {s}s",
        table_title: "Current lease prices by block",
        col_block: "Block",
        col_ips: "IP count",
        col_base_pip: "Base $/IP/mo",
        col_base_total: "Base $/mo",
        col_prod_pip: "Production $/IP/mo",
        col_prod_total: "Production $/mo",
        trace_base: "Base (Capacity Only)",
        trace_prod: "Production",
        yaxis_pip: "$ per IP / month",
        xaxis_block: "Block size",
        xaxis_date: "Time",
        chart_lease: "Lease: Base vs Production ($/IP/month)",
        chart_history: "Lease history — {block}",
        history_note_session: "History builds from the moment the page is opened (one point every 5 minutes). Nothing is saved.",
        history_note_local: "History is loaded from the shared SQLite database (Python and Node writes combined).",
        history_empty: "No data yet — the first point appears after the first successful fetch.",
        purchase_title: "Purchase prices by region (market)",
        purchase_hint: "One-time purchase of addresses in RIR regions, USD per 1 IP (converted at the selected rate)",
        chart_purchase: "Average purchase price — {region}",
        col_min: "Min",
        col_avg: "Avg",
        col_max: "Max",
        col_range: "Range",
        err_fetch: "Failed to load data from the LARUS API",
        err_cors: "Request to LARUS API blocked (CORS or network). If this is the GitHub Pages version, see README → «CORS» for the proxy fallback.",
        footer_source: "Data source: larus.net IPv4 API · source prices in USD",
        conv_region: "Region (purchase)",
        conv_block: "Subnet",
        regions: { RIPE: "RIPE NCC (Europe)", ARIN: "ARIN (North America)", APNIC: "APNIC (Asia-Pacific)", LACNIC: "LACNIC (Latin America)", AFRINIC: "AFRINIC (Africa)" },
        about_title: "📖 What this page shows (legend)",
        about_html: `
<p><b>Lease (LARUS API)</b> — monthly rental of IPv4 blocks /24–/16, updated live every 5 minutes.
Two plans: <b>Base</b> (Capacity Only) — minimum price per IP, and <b>Production</b> — with SLA and production support.</p>
<p><b>Purchase by region</b> — one-time market price of addresses per RIR region
(RIPE NCC — Europe, ARIN — North America, APNIC — Asia-Pacific, LACNIC — Latin America, AFRINIC — Africa):
min / average / max per 1 IP. Updated manually from market reports.</p>
<p><b>Currency</b> — source data is in USD; other currencies use live exchange rates (open.er-api.com),
or approximate rates when offline.</p>
<p>This page does not save any data: the lease history chart is built only while the page is open.
For persistent history use the local Node server or the Python dashboard — see the
<a href="https://github.com/Michael-VT/ipv4_aggregator#readme">README</a>.</p>`,
    },
    ua: {
        app_title: "📡 IPv4 Price Aggregator",
        lang_label: "Мова",
        mode_session: "Моніторинг сесії — дані лише доки відкрита сторінка",
        mode_local: "Локальний сервер — дані зберігаються в SQLite",
        db_rows: "записів у БД",
        location_label: "Локація API",
        currency_label: "Валюта",
        rates_offline: "приблизні курси (офлайн)",
        refresh_now: "🔄 Оновити зараз",
        next_refresh: "Наступне оновлення за {s} с",
        table_title: "Поточні ціни оренди за блоками",
        col_block: "Блок",
        col_ips: "Кількість IP",
        col_base_pip: "Base $/IP/міс",
        col_base_total: "Base $/міс",
        col_prod_pip: "Production $/IP/міс",
        col_prod_total: "Production $/міс",
        trace_base: "Base (Capacity Only)",
        trace_prod: "Production",
        yaxis_pip: "$ за IP на місяць",
        xaxis_block: "Розмір блоку",
        xaxis_date: "Час",
        chart_lease: "Оренда: Base vs Production ($/IP/міс)",
        chart_history: "Історія оренди — {block}",
        history_note_session: "Історія будується з моменту відкриття сторінки (одна точка кожні 5 хвилин). Нічого не зберігається.",
        history_note_local: "Історія завантажується зі спільної бази SQLite (записи Python і Node разом).",
        history_empty: "Даних ще немає — перша точка з'явиться після першого успішного запиту.",
        purchase_title: "Ціни купівлі за регіонами (ринок)",
        purchase_hint: "Разова купівля адрес у регіонах RIR, USD за 1 IP (перераховано за обраним курсом)",
        chart_purchase: "Середня ціна купівлі — {region}",
        col_min: "Мін",
        col_avg: "Середнє",
        col_max: "Макс",
        col_range: "Діапазон",
        err_fetch: "Не вдалося завантажити дані з LARUS API",
        err_cors: "Запит до LARUS API заблоковано (CORS або мережа). Якщо це версія GitHub Pages — див. README → «CORS» щодо запасного проксі.",
        footer_source: "Джерело даних: larus.net IPv4 API · вихідні ціни в USD",
        conv_region: "Регіон (купівля)",
        conv_block: "Підмережа",
        regions: { RIPE: "RIPE NCC (Європа)", ARIN: "ARIN (Північна Америка)", APNIC: "APNIC (Азія та Тихий океан)", LACNIC: "LACNIC (Латинська Америка)", AFRINIC: "AFRINIC (Африка)" },
        about_title: "📖 Що показує ця сторінка (легенда)",
        about_html: `
<p><b>Оренда (LARUS API)</b> — щомісячна оренда блоків IPv4 /24–/16, оновлюється наживо кожні 5 хвилин.
Два тарифи: <b>Base</b> (Capacity Only) — мінімальна ціна за IP, та <b>Production</b> — зі SLA та production-підтримкою.</p>
<p><b>Купівля за регіонами</b> — разова ринкова ціна адрес у регіонах RIR
(RIPE NCC — Європа, ARIN — Північна Америка, APNIC — Азія та Тихий океан, LACNIC — Латинська Америка, AFRINIC — Африка):
мін / середнє / макс за 1 IP. Оновлюється вручну за ринковими звітами.</p>
<p><b>Валюта</b> — вихідні дані в USD; інші валюти — за живими курсами (open.er-api.com),
офлайн — за приблизними.</p>
<p>Ця сторінка не зберігає жодних даних: графік історії оренди будується лише доки відкрита сторінка.
Для постійної історії використовуйте локальний Node-сервер або Python-дашборд — див.
<a href="https://github.com/Michael-VT/ipv4_aggregator#readme">README</a>.</p>`,
    },
    ru: {
        app_title: "📡 IPv4 Price Aggregator",
        lang_label: "Язык",
        mode_session: "Мониторинг сессии — данные только пока открыта страница",
        mode_local: "Локальный сервер — данные сохраняются в SQLite",
        db_rows: "записей в БД",
        location_label: "Локация API",
        currency_label: "Валюта",
        rates_offline: "приблизительные курсы (офлайн)",
        refresh_now: "🔄 Обновить сейчас",
        next_refresh: "Следующее обновление через {s} с",
        table_title: "Текущие цены аренды по блокам",
        col_block: "Блок",
        col_ips: "Количество IP",
        col_base_pip: "Base $/IP/мес",
        col_base_total: "Base $/мес",
        col_prod_pip: "Production $/IP/мес",
        col_prod_total: "Production $/мес",
        trace_base: "Base (Capacity Only)",
        trace_prod: "Production",
        yaxis_pip: "$ за IP в месяц",
        xaxis_block: "Размер блока",
        xaxis_date: "Время",
        chart_lease: "Аренда: Base vs Production ($/IP/мес)",
        chart_history: "История аренды — {block}",
        history_note_session: "История строится с момента открытия страницы (одна точка каждые 5 минут). Ничего не сохраняется.",
        history_note_local: "История загружается из общей базы SQLite (записи Python и Node вместе).",
        history_empty: "Данных пока нет — первая точка появится после первого успешного запроса.",
        purchase_title: "Цены покупки по регионам (рынок)",
        purchase_hint: "Разовая покупка адресов в регионах RIR, USD за 1 IP (пересчитано по выбранному курсу)",
        chart_purchase: "Средняя цена покупки — {region}",
        col_min: "Мин",
        col_avg: "Среднее",
        col_max: "Макс",
        col_range: "Диапазон",
        err_fetch: "Не удалось загрузить данные с LARUS API",
        err_cors: "Запрос к LARUS API заблокирован (CORS или сеть). Если это версия GitHub Pages — см. README → «CORS» про запасной прокси.",
        footer_source: "Источник данных: larus.net IPv4 API · исходные цены в USD",
        conv_region: "Регион (покупка)",
        conv_block: "Подсеть",
        regions: { RIPE: "RIPE NCC (Европа)", ARIN: "ARIN (Северная Америка)", APNIC: "APNIC (Азия-Тихий океан)", LACNIC: "LACNIC (Латинская Америка)", AFRINIC: "AFRINIC (Африка)" },
        about_title: "📖 Что показывает эта страница (легенда)",
        about_html: `
<p><b>Аренда (LARUS API)</b> — ежемесячная аренда блоков IPv4 /24–/16, обновляется вживую каждые 5 минут.
Два тарифа: <b>Base</b> (Capacity Only) — минимальная цена за IP, и <b>Production</b> — со SLA и production-поддержкой.</p>
<p><b>Покупка по регионам</b> — разовая рыночная цена адресов в регионах RIR
(RIPE NCC — Европа, ARIN — Северная Америка, APNIC — Азия-Тихий океан, LACNIC — Латинская Америка, AFRINIC — Африка):
мин / среднее / макс за 1 IP. Обновляется вручную по рыночным отчётам.</p>
<p><b>Валюта</b> — исходные данные в USD; другие валюты — по живым курсам (open.er-api.com),
офлайн — по приблизительным.</p>
<p>Эта страница не сохраняет данные: график истории аренды строится только пока открыта страница.
Для постоянной истории используйте локальный Node-сервер или Python-дашборд — см.
<a href="https://github.com/Michael-VT/ipv4_aggregator#readme">README</a>.</p>`,
    },
    pt: {
        app_title: "📡 IPv4 Price Aggregator",
        lang_label: "Idioma",
        mode_session: "Monitoramento de sessão — dados apenas enquanto a página estiver aberta",
        mode_local: "Servidor local — dados salvos em SQLite",
        db_rows: "registros no BD",
        location_label: "Localização da API",
        currency_label: "Moeda",
        rates_offline: "câmbios aproximados (offline)",
        refresh_now: "🔄 Atualizar agora",
        next_refresh: "Próxima atualização em {s} s",
        table_title: "Preços atuais de locação por bloco",
        col_block: "Bloco",
        col_ips: "Nº de IPs",
        col_base_pip: "Base $/IP/mês",
        col_base_total: "Base $/mês",
        col_prod_pip: "Production $/IP/mês",
        col_prod_total: "Production $/mês",
        trace_base: "Base (Capacity Only)",
        trace_prod: "Production",
        yaxis_pip: "$ por IP / mês",
        xaxis_block: "Tamanho do bloco",
        xaxis_date: "Hora",
        chart_lease: "Locação: Base vs Production ($/IP/mês)",
        chart_history: "Histórico de locação — {block}",
        history_note_session: "O histórico começa no momento em que a página é aberta (um ponto a cada 5 minutos). Nada é salvo.",
        history_note_local: "O histórico é carregado do banco SQLite compartilhado (gravações de Python e Node juntas).",
        history_empty: "Ainda sem dados — o primeiro ponto aparece após a primeira busca bem-sucedida.",
        purchase_title: "Preços de compra por região (mercado)",
        purchase_hint: "Compra única de endereços nas regiões RIR, USD por 1 IP (convertido pelo câmbio selecionado)",
        chart_purchase: "Preço médio de compra — {region}",
        col_min: "Mín",
        col_avg: "Média",
        col_max: "Máx",
        col_range: "Faixa",
        err_fetch: "Falha ao carregar dados da API LARUS",
        err_cors: "Requisição à API LARUS bloqueada (CORS ou rede). Se esta é a versão GitHub Pages, veja o README → «CORS» sobre o proxy alternativo.",
        footer_source: "Fonte de dados: API IPv4 do larus.net · preços originais em USD",
        conv_region: "Região (compra)",
        conv_block: "Sub-rede",
        regions: { RIPE: "RIPE NCC (Europa)", ARIN: "ARIN (América do Norte)", APNIC: "APNIC (Ásia-Pacífico)", LACNIC: "LACNIC (América Latina)", AFRINIC: "AFRINIC (África)" },
        about_title: "📖 O que esta página mostra (legenda)",
        about_html: `
<p><b>Locação (API LARUS)</b> — aluguel mensal de blocos IPv4 /24–/16, atualizado em tempo real a cada 5 minutos.
Dois planos: <b>Base</b> (Capacity Only) — preço mínimo por IP, e <b>Production</b> — com SLA e suporte de produção.</p>
<p><b>Compra por região</b> — preço de mercado único dos endereços por região RIR
(RIPE NCC — Europa, ARIN — América do Norte, APNIC — Ásia-Pacífico, LACNIC — América Latina, AFRINIC — África):
mín / média / máx por 1 IP. Atualizado manualmente conforme relatórios de mercado.</p>
<p><b>Moeda</b> — os dados originais estão em USD; outras moedas usam câmbio em tempo real (open.er-api.com)
ou câmbios aproximados quando offline.</p>
<p>Esta página não salva nenhum dado: o gráfico de histórico de locação é construído apenas enquanto a página está aberta.
Para histórico persistente, use o servidor Node local ou o painel Python — veja o
<a href="https://github.com/Michael-VT/ipv4_aggregator#readme">README</a>.</p>`,
    },
    de: {
        app_title: "📡 IPv4 Price Aggregator",
        lang_label: "Sprache",
        mode_session: "Sitzungs-Monitoring — Daten nur bei geöffneter Seite",
        mode_local: "Lokaler Server — Daten werden in SQLite gespeichert",
        db_rows: "Einträge in der DB",
        location_label: "API-Standort",
        currency_label: "Währung",
        rates_offline: "ungefähre Kurse (offline)",
        refresh_now: "🔄 Jetzt aktualisieren",
        next_refresh: "Nächste Aktualisierung in {s} s",
        table_title: "Aktuelle Mietpreise pro Block",
        col_block: "Block",
        col_ips: "IP-Anzahl",
        col_base_pip: "Base $/IP/Mo.",
        col_base_total: "Base $/Mo.",
        col_prod_pip: "Production $/IP/Mo.",
        col_prod_total: "Production $/Mo.",
        trace_base: "Base (Capacity Only)",
        trace_prod: "Production",
        yaxis_pip: "$ pro IP / Monat",
        xaxis_block: "Blockgröße",
        xaxis_date: "Zeit",
        chart_lease: "Miete: Base vs. Production ($/IP/Monat)",
        chart_history: "Mietverlauf — {block}",
        history_note_session: "Der Verlauf beginnt mit dem Öffnen der Seite (ein Punkt alle 5 Minuten). Nichts wird gespeichert.",
        history_note_local: "Der Verlauf wird aus der gemeinsamen SQLite-Datenbank geladen (Python- und Node-Einträge zusammen).",
        history_empty: "Noch keine Daten — der erste Punkt erscheint nach dem ersten erfolgreichen Abruf.",
        purchase_title: "Kaufpreise nach Region (Markt)",
        purchase_hint: "Einmalkauf von Adressen in RIR-Regionen, USD pro 1 IP (zum gewählten Kurs umgerechnet)",
        chart_purchase: "Durchschnittlicher Kaufpreis — {region}",
        col_min: "Min",
        col_avg: "Durchschn.",
        col_max: "Max",
        col_range: "Spanne",
        err_fetch: "Daten konnten nicht von der LARUS-API geladen werden",
        err_cors: "Anfrage an die LARUS-API blockiert (CORS oder Netzwerk). Falls dies die GitHub-Pages-Version ist, siehe README → „CORS“ zum Proxy-Fallback.",
        footer_source: "Datenquelle: IPv4-API von larus.net · Originalpreise in USD",
        conv_region: "Region (Kauf)",
        conv_block: "Subnetz",
        regions: { RIPE: "RIPE NCC (Europa)", ARIN: "ARIN (Nordamerika)", APNIC: "APNIC (Asien-Pazifik)", LACNIC: "LACNIC (Lateinamerika)", AFRINIC: "AFRINIC (Afrika)" },
        about_title: "📖 Was diese Seite zeigt (Legende)",
        about_html: `
<p><b>Miete (LARUS-API)</b> — monatliche Miete von IPv4-Blöcken /24–/16, live alle 5 Minuten aktualisiert.
Zwei Tarife: <b>Base</b> (Capacity Only) — Mindestpreis pro IP, und <b>Production</b> — mit SLA und Produktions-support.</p>
<p><b>Kauf nach Region</b> — Einmalkaufpreis der Adressen je RIR-Region
(RIPE NCC — Europa, ARIN — Nordamerika, APNIC — Asien-Pazifik, LACNIC — Lateinamerika, AFRINIC — Afrika):
Min./Durchschn./Max. pro 1 IP. Wird manuell anhand von Marktberichten aktualisiert.</p>
<p><b>Währung</b> — die Originaldaten sind in USD; andere Währungen nutzen Live-Kurse (open.er-api.com),
offline ungefähre Kurse.</p>
<p>Diese Seite speichert keine Daten: Das Mietverlaufsdiagramm entsteht nur bei geöffneter Seite.
Für dauerhaften Verlauf nutzen Sie den lokalen Node-Server oder das Python-Dashboard — siehe
<a href="https://github.com/Michael-VT/ipv4_aggregator#readme">README</a>.</p>`,
    },
    fr: {
        app_title: "📡 IPv4 Price Aggregator",
        lang_label: "Langue",
        mode_session: "Surveillance de session — données seulement tant que la page est ouverte",
        mode_local: "Serveur local — données enregistrées dans SQLite",
        db_rows: "entrées dans la BD",
        location_label: "Localisation API",
        currency_label: "Devise",
        rates_offline: "taux approximatifs (hors ligne)",
        refresh_now: "🔄 Actualiser maintenant",
        next_refresh: "Prochaine actualisation dans {s} s",
        table_title: "Prix de location actuels par bloc",
        col_block: "Bloc",
        col_ips: "Nombre d'IP",
        col_base_pip: "Base $/IP/mois",
        col_base_total: "Base $/mois",
        col_prod_pip: "Production $/IP/mois",
        col_prod_total: "Production $/mois",
        trace_base: "Base (Capacity Only)",
        trace_prod: "Production",
        yaxis_pip: "$ par IP / mois",
        xaxis_block: "Taille du bloc",
        xaxis_date: "Heure",
        chart_lease: "Location : Base vs Production ($/IP/mois)",
        chart_history: "Historique de location — {block}",
        history_note_session: "L'historique démarre à l'ouverture de la page (un point toutes les 5 minutes). Rien n'est enregistré.",
        history_note_local: "L'historique est chargé depuis la base SQLite partagée (écritures Python et Node réunies).",
        history_empty: "Pas encore de données — le premier point apparaîtra après le premier chargement réussi.",
        purchase_title: "Prix d'achat par région (marché)",
        purchase_hint: "Achat unique d'adresses dans les régions RIR, USD par 1 IP (converti au taux choisi)",
        chart_purchase: "Prix moyen d'achat — {region}",
        col_min: "Min",
        col_avg: "Moyenne",
        col_max: "Max",
        col_range: "Plage",
        err_fetch: "Échec du chargement des données depuis l'API LARUS",
        err_cors: "Requête vers l'API LARUS bloquée (CORS ou réseau). S'il s'agit de la version GitHub Pages, voir le README → « CORS » concernant le proxy de secours.",
        footer_source: "Source des données : API IPv4 de larus.net · prix d'origine en USD",
        conv_region: "Région (achat)",
        conv_block: "Sous-réseau",
        regions: { RIPE: "RIPE NCC (Europe)", ARIN: "ARIN (Amérique du Nord)", APNIC: "APNIC (Asie-Pacifique)", LACNIC: "LACNIC (Amérique latine)", AFRINIC: "AFRINIC (Afrique)" },
        about_title: "📖 Ce que montre cette page (légende)",
        about_html: `
<p><b>Location (API LARUS)</b> — location mensuelle de blocs IPv4 /24–/16, mise à jour en direct toutes les 5 minutes.
Deux offres : <b>Base</b> (Capacity Only) — prix minimum par IP, et <b>Production</b> — avec SLA et support de production.</p>
<p><b>Achat par région</b> — prix de marché unique des adresses par région RIR
(RIPE NCC — Europe, ARIN — Amérique du Nord, APNIC — Asie-Pacifique, LACNIC — Amérique latine, AFRINIC — Afrique) :
min / moyenne / max par 1 IP. Mis à jour manuellement selon les rapports de marché.</p>
<p><b>Devise</b> — les données d'origine sont en USD ; les autres devises utilisent des taux en temps réel (open.er-api.com),
ou des taux approximatifs hors ligne.</p>
<p>Cette page n'enregistre aucune donnée : le graphique d'historique de location n'est construit que tant que la page est ouverte.
Pour un historique permanent, utilisez le serveur Node local ou le tableau de bord Python — voir le
<a href="https://github.com/Michael-VT/ipv4_aggregator#readme">README</a>.</p>`,
    },
};
