/*
 * IPv4 Price Aggregator — общий веб-интерфейс для двух вариантов:
 *  - GitHub Pages: чистый мониторинг сессии, ничего не сохраняется;
 *  - локальный Node-сервер (server.js): дополнительно читает историю
 *    из общей SQLite-базы через /api/history.
 *
 * Режим определяется запросом api/config: локальный сервер отвечает JSON
 * {"mode":"local", ...}; на GitHub Pages такой путь отдаёт HTML/404.
 */

(function () {
    "use strict";

    // ---------- Константы ----------
    var LARUS_URL = "https://larus.net/ipv4/api/price/continuity-quote";
    var REFRESH_MS = 5 * 60 * 1000; // 5 минут
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

    // ---------- Состояние ----------
    var state = {
        lang: localStorage.getItem("ipv4agg.lang") || "en",
        mode: "session",          // 'session' | 'local'
        location: "US",
        selectedBlock: "/24",
        quotes: [],               // последний успешный снимок: [{size, ips, base_pip, base_total, prod_pip, prod_total}]
        sessionSeries: {},        // Pages-режим: { "/24": [{t, base, prod}], ... } — только в памяти
        chartLease: null,
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

    function fmtMoney(v, digits) {
        return "$" + Number(v).toFixed(digits == null ? 3 : digits);
    }

    function fmtInt(v) {
        return Number(v).toLocaleString(state.lang);
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
            // Сортируем от /24 к /16
            results.sort(function (a, b) { return a.ips - b.ips; });
            return results;
        });
    }

    // ---------- История ----------
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
        // Pages-режим: серия накапливается в памяти с момента открытия страницы
        var series = state.sessionSeries[state.selectedBlock] || [];
        return Promise.resolve(series);
    }

    // ---------- Отрисовка ----------
    function applyLang() {
        document.documentElement.lang = state.lang;
        // Статические тексты
        document.querySelectorAll("[data-i18n]").forEach(function (el) {
            el.textContent = t(el.getAttribute("data-i18n"));
        });
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
        renderChips();
        renderAll();
    }

    function renderChips() {
        var wrap = $("block-chips");
        wrap.innerHTML = "";
        BLOCKS.forEach(function (b) {
            var chip = document.createElement("button");
            chip.className = "chip" + (b.size === state.selectedBlock ? " active" : "");
            chip.textContent = b.size;
            chip.addEventListener("click", function () {
                state.selectedBlock = b.size;
                renderChips();
                renderAll();
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
            { label: t("col_base_pip"), value: fmtMoney(q.base_pip) },
            { label: t("col_prod_pip"), value: fmtMoney(q.prod_pip) },
            { label: t("col_base_total"), value: fmtMoney(q.base_total, 2) },
            { label: t("col_prod_total"), value: fmtMoney(q.prod_total, 2) },
        ].forEach(function (m) {
            var card = document.createElement("div");
            card.className = "metric-card";
            card.innerHTML = "<div class=\"metric-value\"></div><div class=\"metric-label\"></div>";
            card.querySelector(".metric-value").textContent = m.value;
            card.querySelector(".metric-label").textContent = m.label;
            box.appendChild(card);
        });
    }

    function renderTable() {
        var thead = $("price-table").querySelector("thead");
        var tbody = $("price-table").querySelector("tbody");
        thead.innerHTML = "";
        tbody.innerHTML = "";
        if (!state.quotes.length) return;

        var headRow = document.createElement("tr");
        [t("col_block"), t("col_ips"), t("col_base_pip"), t("col_base_total"),
         t("col_prod_pip"), t("col_prod_total")].forEach(function (h) {
            var th = document.createElement("th");
            th.textContent = h;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);

        state.quotes.forEach(function (q) {
            var tr = document.createElement("tr");
            [q.size, fmtInt(q.ips), fmtMoney(q.base_pip), fmtMoney(q.base_total, 2),
             fmtMoney(q.prod_pip), fmtMoney(q.prod_total, 2)].forEach(function (v, i) {
                var td = document.createElement("td");
                td.textContent = v;
                if (i === 0) td.className = "strong";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function chartOrNull(canvasId, fallbackId) {
        // Fallback при недоступном CDN: таблица вместо графиков
        if (typeof window.Chart === "undefined") {
            $(canvasId).parentElement.classList.add("hidden");
            $(fallbackId).classList.remove("hidden");
            return null;
        }
        $(canvasId).parentElement.classList.remove("hidden");
        $(fallbackId).classList.add("hidden");
        return true;
    }

    function renderLeaseChart() {
        if (!chartOrNull("chart-lease", "chart-lease-fallback")) return renderLeaseFallback();
        var ctx = $("chart-lease").getContext("2d");
        var labels = state.quotes.map(function (q) { return q.size; });
        var data = {
            labels: labels,
            datasets: [
                { label: t("trace_base"), data: state.quotes.map(function (q) { return q.base_pip; }), backgroundColor: "#2ecc71" },
                { label: t("trace_prod"), data: state.quotes.map(function (q) { return q.prod_pip; }), backgroundColor: "#f39c12" },
            ],
        };
        if (state.chartLease) state.chartLease.destroy();
        state.chartLease = new window.Chart(ctx, {
            type: "bar",
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: { y: { title: { display: true, text: t("yaxis_pip") } } },
            },
        });
    }

    function renderLeaseFallback() {
        var box = $("chart-lease-fallback");
        box.innerHTML = "<pre></pre>";
        box.querySelector("pre").textContent = state.quotes
            .map(function (q) { return q.size + "  base " + fmtMoney(q.base_pip) + "  prod " + fmtMoney(q.prod_pip); })
            .join("\n");
    }

    function renderHistoryChart(series) {
        $("history-title").textContent = t("chart_history", { block: state.selectedBlock });
        $("history-note").textContent = state.mode === "local"
            ? t("history_note_local")
            : t("history_note_session");

        var info = [];
        if (state.mode === "local" && state.dbRows != null) {
            info.push(state.dbRows + " " + t("db_rows"));
        }
        if (series.length === 0) info.push(t("history_empty"));
        $("db-info").textContent = info.length ? info.join(" · ") : "";
        $("db-info").classList.toggle("hidden", info.length === 0);

        if (!chartOrNull("chart-history", "chart-history-fallback")) {
            var box = $("chart-history-fallback");
            box.innerHTML = "<pre></pre>";
            box.querySelector("pre").textContent = series
                .map(function (p) { return p.t + "  " + fmtMoney(p.base) + " / " + fmtMoney(p.prod); })
                .join("\n");
            return;
        }

        var ctx = $("chart-history").getContext("2d");
        var labels = series.map(function (p) {
            return new Date(p.t).toLocaleTimeString(state.lang, { hour: "2-digit", minute: "2-digit" });
        });
        if (state.chartHistory) state.chartHistory.destroy();
        state.chartHistory = new window.Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: t("trace_base"), data: series.map(function (p) { return p.base; }),
                        borderColor: "#2ecc71", tension: 0.25, pointRadius: 2,
                    },
                    {
                        label: t("trace_prod"), data: series.map(function (p) { return p.prod; }),
                        borderColor: "#f39c12", tension: 0.25, pointRadius: 2,
                    },
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
        // Таймер «до обновления» в шапке
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
        $("refresh-btn").addEventListener("click", tick);

        // Корректный выход: отменяем зависшие запросы при закрытии страницы
        window.addEventListener("pagehide", function () { hideError(); });

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
