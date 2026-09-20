/*
 * IPv4 Price Aggregator — общий веб-интерфейс для двух вариантов:
 *  - GitHub Pages: чистый мониторинг сессии, ничего не сохраняется;
 *  - локальный Node-сервер (server.js): дополнительно читает историю
 *    из общей SQLite-базы через /api/history.
 *
 * Режим определяется запросом api/config: локальный сервер отвечает JSON
 * {"mode":"local", ...}; на GitHub Pages такой путь отдаёт HTML/404.
 *
 * Валюта: исходные цены LARUS и рыночные — в USD. Конвертация по живым
 * курсам open.er-api.com (обновление раз в сутки, кэш в localStorage),
 * при недоступности — встроенные приблизительные курсы.
 */

(function () {
    "use strict";

    // ---------- Константы ----------
    var LARUS_URL = "https://larus.net/ipv4/api/price/continuity-quote";
    var RATES_URL = "https://open.er-api.com/v6/latest/USD";
    var RATES_TTL = 24 * 60 * 60 * 1000; // сутки
    var REFRESH_MS = 5 * 60 * 1000;      // 5 минут

    var BLOCKS = [
        { num: 1,   size: "/24", ips: 256 },
        { num: 2,   size: "/23", ips: 512 },
        { num: 4,   size: "/22", ips: 1024 },
        { num: 8,   size: "/21", ips: 2048 },
        { num: 16,  size: "/20", ips: 4096 },
        { num: 32,  size: "/19", ips: 8192 },
        { num: 64,  size: "/18", ips: 16384 },
        { num: 128, size: "/17", ips: 32768 },
        { num: 256, size: "/16", ips: 65536 },
    ];
    var REGION_CODES = ["RIPE", "ARIN", "APNIC", "LACNIC", "AFRINIC"];

    // Запасные курсы к 1 USD (сентябрь 2026) — используются офлайн
    var FALLBACK_RATES = { USD: 1, EUR: 0.92, GBP: 0.78, PLN: 3.95, UAH: 41.5 };
    var SYMBOLS = { USD: "$", EUR: "€", GBP: "£", PLN: "zł", UAH: "₴" };

    // ---------- Состояние ----------
    var state = {
        lang: localStorage.getItem("ipv4agg.lang") || "en",
        mode: "session",          // 'session' | 'local'
        location: "US",
        currency: localStorage.getItem("ipv4agg.currency") || "USD",
        rates: FALLBACK_RATES,
        ratesLive: false,
        selectedBlock: "/24",
        selectedRegion: "RIPE",
        quotes: [],               // последний успешный снимок аренды
        sessionSeries: {},        // Pages-режим: { "/24": [{t, base, prod}] } — только в памяти
        chartLease: null,
        chartPurchase: null,
        chartHistory: null,
        nextRefreshAt: 0,
        dbRows: null,
    };

    // ---------- Утилиты ----------
    function $(id) { return document.getElementById(id); }

    function t(key, params) {
        var dict = window.I18N[state.lang] || window.I18N.en;
        var s = dict[key] != null ? dict[key] : (window.I18N.en[key] || key);
        if (params) {
            Object.keys(params).forEach(function (k) {
                s = s.replace("{" + k + "}", params[k]);
            });
        }
        return s;
    }

    // Конвертация USD → выбранная валюта и форматирование
    function fmtPrice(usd, digits) {
        var rate = state.rates[state.currency] || 1;
        var v = usd * rate;
        var sym = SYMBOLS[state.currency] || "$";
        var s = Number(v).toFixed(digits == null ? 3 : digits);
        return state.currency === "PLN" ? s + " " + sym : sym + s;
    }

    function fmtInt(v) {
        return Number(v).toLocaleString(state.lang);
    }

    // ---------- Курсы валют ----------
    function loadRates() {
        var cached = null;
        try {
            cached = JSON.parse(localStorage.getItem("ipv4agg.rates") || "null");
        } catch (_) { /* битый кэш — игнорируем */ }
        if (cached && Date.now() - cached.time < RATES_TTL && cached.rates) {
            state.rates = cached.rates;
            state.ratesLive = true;
            updateRatesNote();
            return Promise.resolve();
        }
        return fetch(RATES_URL)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.result === "success" && data.rates && data.rates.EUR) {
                    state.rates = data.rates;
                    state.ratesLive = true;
                    try {
                        localStorage.setItem("ipv4agg.rates",
                            JSON.stringify({ time: Date.now(), rates: data.rates }));
                    } catch (_) { /* приватный режим — не критично */ }
                }
            })
            .catch(function () { /* остаёмся на FALLBACK_RATES */ })
            .then(updateRatesNote);
    }

    function updateRatesNote() {
        var note = $("rates-note");
        if (state.ratesLive) {
            note.classList.add("hidden");
        } else {
            note.textContent = t("rates_offline");
            note.classList.remove("hidden");
        }
    }

    // ---------- Определение режима ----------
    function detectMode() {
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 1500);
        return fetch("api/config", { signal: ctrl.signal })
            .then(function (r) { return r.json(); })
            .then(function (cfg) {
                if (cfg && cfg.mode === "local") {
                    state.mode = "local";
                }
            })
            .catch(function () { /* Pages-режим или офлайн — остаёмся в session */ })
            .then(function () { clearTimeout(timer); });
    }

    // ---------- Загрузка данных с LARUS ----------
    function fetchQuoteFor(block, location) {
        var url = LARUS_URL +
            "?num=" + block.num + "&months=1&location=" + encodeURIComponent(location);

        // Необязательный CORS-прокси (запасной вариант для GitHub Pages,
        // см. README): localStorage["ipv4agg.proxy"] = "https://proxy.example/?url="
        var proxy = localStorage.getItem("ipv4agg.proxy");
        if (proxy) url = proxy + encodeURIComponent(url);

        return fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.status !== "success") throw new Error("API non-success");
                var cap = data.plans.CAPACITY_ONLY || {};
                var prod = data.plans.CONTINUITY_PRODUCTION || {};
                return {
                    size: block.size,
                    ips: block.ips,
                    base_pip: parseFloat(cap.base_unit_price || 0),
                    base_total: parseFloat(cap.monthly_total || 0),
                    prod_pip: parseFloat(prod.final_unit_price || 0),
                    prod_total: parseFloat(prod.monthly_total || 0),
                };
            });
    }

    function fetchAllQuotes() {
        var results = [];
        var failures = 0;
        return Promise.all(BLOCKS.map(function (b) {
            return fetchQuoteFor(b, state.location)
                .then(function (q) { results.push(q); })
                .catch(function () { failures += 1; });
        })).then(function () {
            if (results.length === 0) {
                var allBlocked = failures === BLOCKS.length;
                showError(t(allBlocked ? "err_cors" : "err_fetch"));
                return null;
            }
            hideError();
            results.sort(function (a, b) { return a.ips - b.ips; });
            return results;
        });
    }

    // ---------- История аренды ----------
    function loadHistory() {
        if (state.mode === "local") {
            return fetch("api/history?block=" + state.selectedBlock + "&days=7&limit=2000")
                .then(function (r) { return r.json(); })
                .then(function (rows) {
                    state.dbRows = rows.length;
                    return rows.map(function (r) {
                        return { t: r.timestamp, base: r.base_per_ip, prod: r.production_per_ip };
                    });
                })
                .catch(function () { return []; });
        }
        var series = state.sessionSeries[state.selectedBlock] || [];
        return Promise.resolve(series);
    }

    // ---------- Конвертер: регион + подсеть → цена в валютах ----------
    function renderConverter() {
        var regionSel = $("conv-region");
        var blockSel = $("conv-block");
        var regions = t("regions") || {};

        // Заполняем селекторы (сохраняя выбранные значения)
        var prevRegion = state.convRegion || regionSel.value;
        var prevBlock = state.convBlock || blockSel.value;
        regionSel.innerHTML = "";
        REGION_CODES.forEach(function (code) {
            var opt = document.createElement("option");
            opt.value = code;
            opt.textContent = regions[code] || code;
            regionSel.appendChild(opt);
        });
        blockSel.innerHTML = "";
        BLOCKS.forEach(function (b) {
            var opt = document.createElement("option");
            opt.value = b.size;
            opt.textContent = b.size;
            blockSel.appendChild(opt);
        });
        state.convRegion = REGION_CODES.indexOf(prevRegion) !== -1 ? prevRegion : REGION_CODES[0];
        state.convBlock = prevBlock || state.selectedBlock;
        regionSel.value = state.convRegion;
        blockSel.value = state.convBlock;

        // Цена покупки: средняя (основная) + мин–макс
        var data = (window.PURCHASE_PRICES || {})[state.convRegion];
        var p = data && data[state.convBlock];
        if (p) {
            $("conv-main").textContent = fmtPrice(p.avg, 2);
            $("conv-range").textContent = t("col_min") + " " + fmtPrice(p.min, 2) +
                " – " + t("col_max") + " " + fmtPrice(p.max, 2);
            // Пересчёт в альтернативные валюты
            var alts = $("conv-alts");
            alts.innerHTML = "";
            Object.keys(SYMBOLS).forEach(function (cur) {
                if (cur === state.currency) return;
                var rate = state.rates[cur] || 1;
                var v = p.avg * rate;
                var s = Number(v).toFixed(2);
                var text = cur === "PLN" ? s + " " + SYMBOLS[cur] : SYMBOLS[cur] + s;
                var span = document.createElement("span");
                span.textContent = cur + " " + text;
                alts.appendChild(span);
            });
        } else {
            $("conv-main").textContent = "—";
            $("conv-range").textContent = "";
            $("conv-alts").innerHTML = "";
        }
    }

    // ---------- Легенда (модальное окно) ----------
    function initModal() {
        var modal = $("about-modal");
        $("about-btn").addEventListener("click", function () { modal.classList.remove("hidden"); });
        $("about-close").addEventListener("click", function () { modal.classList.add("hidden"); });
        // Клик по тёмному фону закрывает окно
        modal.addEventListener("click", function (e) {
            if (e.target === modal) modal.classList.add("hidden");
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") modal.classList.add("hidden");
        });
    }

    // ---------- Отрисовка ----------
    function applyLang() {
        document.documentElement.lang = state.lang;
        document.querySelectorAll("[data-i18n]").forEach(function (el) {
            el.textContent = t(el.getAttribute("data-i18n"));
        });
        // Легенда — HTML (ссылка на README)
        $("about-body").innerHTML = t("about_html");

        // Селектор языка
        var sel = $("lang-select");
        sel.innerHTML = "";
        Object.keys(window.I18N).forEach(function (code) {
            var opt = document.createElement("option");
            opt.value = code;
            opt.textContent = {
                en: "English", ua: "Українська", ru: "Русский",
                pt: "Português", de: "Deutsch", fr: "Français",
            }[code];
            if (code === state.lang) opt.selected = true;
            sel.appendChild(opt);
        });
        renderBlockChips();
        renderRegionChips();
        renderAll();
    }

    function renderBlockChips() {
        var wrap = $("block-chips");
        wrap.innerHTML = "";
        BLOCKS.forEach(function (b) {
            var chip = document.createElement("button");
            chip.className = "chip" + (b.size === state.selectedBlock ? " active" : "");
            chip.textContent = b.size;
            chip.addEventListener("click", function () {
                state.selectedBlock = b.size;
                renderBlockChips();
                renderAll();
            });
            wrap.appendChild(chip);
        });
    }

    function renderRegionChips() {
        var wrap = $("region-chips");
        wrap.innerHTML = "";
        var regions = t("regions") || {};
        REGION_CODES.forEach(function (code) {
            var chip = document.createElement("button");
            chip.className = "chip" + (code === state.selectedRegion ? " active" : "");
            chip.textContent = regions[code] || code;
            chip.addEventListener("click", function () {
                state.selectedRegion = code;
                renderRegionChips();
                renderPurchase();
            });
            wrap.appendChild(chip);
        });
    }

    function renderMetrics() {
        var box = $("metrics");
        box.innerHTML = "";
        var q = state.quotes.find(function (x) { return x.size === state.selectedBlock; });
        if (!q) return;
        [
            { label: t("col_base_pip"), value: fmtPrice(q.base_pip) },
            { label: t("col_prod_pip"), value: fmtPrice(q.prod_pip) },
            { label: t("col_base_total"), value: fmtPrice(q.base_total, 2) },
            { label: t("col_prod_total"), value: fmtPrice(q.prod_total, 2) },
        ].forEach(function (m) {
            var card = document.createElement("div");
            card.className = "metric-card";
            card.innerHTML = "<div class=\"metric-value\"></div><div class=\"metric-label\"></div>";
            card.querySelector(".metric-value").textContent = m.value;
            card.querySelector(".metric-label").textContent = m.label;
            box.appendChild(card);
        });
    }

    function fillTable(table, headCells, rows) {
        var thead = table.querySelector("thead");
        var tbody = table.querySelector("tbody");
        thead.innerHTML = "";
        tbody.innerHTML = "";
        var headRow = document.createElement("tr");
        headCells.forEach(function (h) {
            var th = document.createElement("th");
            th.textContent = h;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        rows.forEach(function (cells) {
            var tr = document.createElement("tr");
            cells.forEach(function (v, i) {
                var td = document.createElement("td");
                td.textContent = v;
                if (i === 0) td.className = "strong";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function renderTable() {
        if (!state.quotes.length) return;
        fillTable(
            $("price-table"),
            [t("col_block"), t("col_ips"), t("col_base_pip"), t("col_base_total"),
             t("col_prod_pip"), t("col_prod_total")],
            state.quotes.map(function (q) {
                return [q.size, fmtInt(q.ips), fmtPrice(q.base_pip), fmtPrice(q.base_total, 2),
                        fmtPrice(q.prod_pip), fmtPrice(q.prod_total, 2)];
            })
        );
    }

    function chartOk(canvasId, fallbackId) {
        if (typeof window.Chart === "undefined") {
            $(canvasId).parentElement.classList.add("hidden");
            $(fallbackId).classList.remove("hidden");
            return false;
        }
        $(canvasId).parentElement.classList.remove("hidden");
        $(fallbackId).classList.add("hidden");
        return true;
    }

    function renderLeaseChart() {
        if (!chartOk("chart-lease", "chart-lease-fallback")) {
            $("chart-lease-fallback").innerHTML = "<pre>" + state.quotes
                .map(function (q) {
                    return q.size + "  base " + fmtPrice(q.base_pip) + "  prod " + fmtPrice(q.prod_pip);
                }).join("\n") + "</pre>";
            return;
        }
        var ctx = $("chart-lease").getContext("2d");
        if (state.chartLease) state.chartLease.destroy();
        state.chartLease = new window.Chart(ctx, {
            type: "bar",
            data: {
                labels: state.quotes.map(function (q) { return q.size; }),
                datasets: [
                    { label: t("trace_base"), data: state.quotes.map(function (q) { return q.base_pip; }), backgroundColor: "#2ecc71" },
                    { label: t("trace_prod"), data: state.quotes.map(function (q) { return q.prod_pip; }), backgroundColor: "#f39c12" },
                ],
            },
            options: chartOpts(t("yaxis_pip"), state.currency === "USD"),
        });
    }

    function renderPurchase() {
        var data = (window.PURCHASE_PRICES || {})[state.selectedRegion];
        if (!data) return;
        var regions = t("regions") || {};
        var regionName = regions[state.selectedRegion] || state.selectedRegion;

        // Таблица мин/среднее/макс
        fillTable(
            $("purchase-table"),
            [t("col_block"), t("col_min"), t("col_avg"), t("col_max"), t("col_range")],
            BLOCKS.map(function (b) {
                var p = data[b.size];
                if (!p) return null;
                return [b.size, fmtPrice(p.min, 2), fmtPrice(p.avg, 2), fmtPrice(p.max, 2),
                        fmtPrice(p.min, 2) + " – " + fmtPrice(p.max, 2)];
            }).filter(Boolean)
        );

        // График средней цены по блокам
        if (!chartOk("chart-purchase", "chart-purchase-fallback")) {
            $("chart-purchase-fallback").innerHTML = "<pre>" + BLOCKS.map(function (b) {
                var p = data[b.size];
                return p ? b.size + "  avg " + fmtPrice(p.avg, 2) : "";
            }).filter(Boolean).join("\n") + "</pre>";
            return;
        }
        var ctx = $("chart-purchase").getContext("2d");
        if (state.chartPurchase) state.chartPurchase.destroy();
        state.chartPurchase = new window.Chart(ctx, {
            type: "bar",
            data: {
                labels: BLOCKS.map(function (b) { return b.size; }),
                datasets: [{
                    label: t("chart_purchase", { region: regionName }),
                    data: BLOCKS.map(function (b) {
                        var p = data[b.size];
                        return p ? Number((p.avg * (state.rates[state.currency] || 1)).toFixed(4)) : null;
                    }),
                    backgroundColor: "#4a90d9",
                }],
            },
            options: chartOpts(t("yaxis_pip"), false, t("chart_purchase", { region: regionName })),
        });
    }

    function chartOpts(yTitle, usdAxis, datasetLabel) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", display: !datasetLabel },
                title: datasetLabel ? { display: true, text: datasetLabel } : undefined,
                tooltip: { callbacks: { label: function (c) {
                    var v = c.parsed.y;
                    var sym = SYMBOLS[state.currency] || "$";
                    var s = Number(v).toFixed(3);
                    return (datasetLabel ? datasetLabel + ": " : "") +
                        (state.currency === "PLN" ? s + " " + sym : sym + s);
                } } },
            },
            scales: {
                y: { title: { display: !!yTitle, text: yTitle } },
                x: { title: { display: true, text: t("xaxis_block") } },
            },
        };
    }

    function renderHistoryChart(series) {
        $("history-title").textContent = t("chart_history", { block: state.selectedBlock });
        $("history-note").textContent = state.mode === "local"
            ? t("history_note_local")
            : t("history_note_session");

        var info = [];
        if (state.mode === "local" && state.dbRows != null) info.push(state.dbRows + " " + t("db_rows"));
        if (series.length === 0) info.push(t("history_empty"));
        $("db-info").textContent = info.length ? info.join(" · ") : "";
        $("db-info").classList.toggle("hidden", info.length === 0);

        if (!chartOk("chart-history", "chart-history-fallback")) {
            $("chart-history-fallback").innerHTML = "<pre>" + series
                .map(function (p) {
                    return p.t + "  " + fmtPrice(p.base) + " / " + fmtPrice(p.prod);
                }).join("\n") + "</pre>";
            return;
        }
        var rate = state.rates[state.currency] || 1;
        var ctx = $("chart-history").getContext("2d");
        if (state.chartHistory) state.chartHistory.destroy();
        state.chartHistory = new window.Chart(ctx, {
            type: "line",
            data: {
                labels: series.map(function (p) {
                    return new Date(p.t).toLocaleTimeString(state.lang, { hour: "2-digit", minute: "2-digit" });
                }),
                datasets: [
                    { label: t("trace_base"), data: series.map(function (p) { return p.base * rate; }),
                      borderColor: "#2ecc71", tension: 0.25, pointRadius: 2 },
                    { label: t("trace_prod"), data: series.map(function (p) { return p.prod * rate; }),
                      borderColor: "#f39c12", tension: 0.25, pointRadius: 2 },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: {
                    y: { title: { display: true, text: t("yaxis_pip") } },
                    x: { title: { display: true, text: t("xaxis_date") } },
                },
            },
        });
    }

    function renderAll() {
        renderMetrics();
        renderTable();
        renderLeaseChart();
        renderPurchase();
        renderConverter();
        loadHistory().then(renderHistoryChart);
    }

    // ---------- Ошибки ----------
    function showError(msg) {
        var b = $("error-banner");
        b.textContent = msg;
        b.classList.remove("hidden");
    }
    function hideError() {
        $("error-banner").classList.add("hidden");
    }

    // ---------- Цикл обновления ----------
    function tick() {
        fetchAllQuotes().then(function (quotes) {
            if (quotes) {
                state.quotes = quotes;
                // В Pages-режиме пополняем серию в памяти (локальный сервер
                // пишет в SQLite сам, страница лишь читает историю)
                if (state.mode !== "local") {
                    var ts = new Date().toISOString();
                    quotes.forEach(function (q) {
                        var arr = (state.sessionSeries[q.size] = state.sessionSeries[q.size] || []);
                        arr.push({ t: ts, base: q.base_pip, prod: q.prod_pip });
                    });
                }
                renderAll();
            }
            state.nextRefreshAt = Date.now() + REFRESH_MS;
        });
    }

    function startPolling() {
        // Обновляем только при видимой вкладке — экономия батареи на смартфоне
        setInterval(function () {
            if (document.visibilityState === "visible") tick();
        }, REFRESH_MS);
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") tick();
        });
        setInterval(function () {
            var left = Math.max(0, Math.round((state.nextRefreshAt - Date.now()) / 1000));
            $("next-refresh").textContent = t("next_refresh", { s: left });
        }, 1000);
    }

    // ---------- Инициализация ----------
    function init() {
        $("lang-select").addEventListener("change", function (e) {
            state.lang = e.target.value;
            localStorage.setItem("ipv4agg.lang", state.lang);
            applyLang();
        });
        $("location-select").addEventListener("change", function (e) {
            state.location = e.target.value;
            tick();
        });
        $("currency-select").addEventListener("change", function (e) {
            state.currency = e.target.value;
            localStorage.setItem("ipv4agg.currency", state.currency);
            renderAll();
        });
        $("currency-select").value = state.currency;
        $("refresh-btn").addEventListener("click", tick);

        // Конвертер: смена региона/подсети перерисовывает только его
        $("conv-region").addEventListener("change", function (e) {
            state.convRegion = e.target.value;
            renderConverter();
        });
        $("conv-block").addEventListener("change", function (e) {
            state.convBlock = e.target.value;
            renderConverter();
        });

        initModal();
        loadRates();

        // ВАЖНО: заполняем интерфейс (включая селектор языка) сразу при загрузке
        applyLang();

        detectMode().then(function () {
            var badge = $("mode-badge");
            badge.textContent = t(state.mode === "local" ? "mode_local" : "mode_session");
            badge.classList.toggle("badge-local", state.mode === "local");
            tick();
            startPolling();
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
