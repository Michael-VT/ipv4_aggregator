/*
 * IPv4 Price Aggregator — локальный вариант на Node.js.
 *
 * Что делает:
 *  1. Каждые 5 минут (и сразу при старте) собирает живые цены аренды IPv4
 *     из LARUS API и сохраняет их в ОБЩУЮ с Python-версией SQLite-базу
 *     (ipv4_prices.db, режим WAL, записи помечены writer='node').
 *  2. Раздаёт веб-интерфейс из docs/ (тот же, что и на GitHub Pages,
 *     но в режиме «локальный сервер» — с полной историей из БД).
 *  3. Отдаёт JSON API: /api/config, /api/history, /api/quotes.
 *
 * Зависимости: только встроенные модули Node.js (требуется Node >= 22.5
 * из-за node:sqlite). npm install не нужен.
 *
 * Безопасное прерывание: Ctrl+C (SIGINT) / SIGTERM / kill — останавливают
 * цикл сбора, закрывают HTTP-сервер и базу (WAL-чекпоинт), выход с кодом 0.
 */

"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

// ---------- Проверка версии Node ----------
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 5)) {
    console.error(`Нужен Node >= 22.5 (доступен node:sqlite), а установлен ${process.versions.node}.`);
    console.error("Обновите Node: https://nodejs.org/ или используйте nvm.");
    process.exit(1);
}

// ---------- Конфигурация ----------
const PORT = Number(process.env.PORT) || 8787;
const LOCATION = process.env.LARUS_LOCATION || "US";
const INTERVAL_MS = 5 * 60 * 1000;
const DB_PATH = path.join(__dirname, "ipv4_prices.db");
const DOCS_DIR = path.join(__dirname, "docs");
const VERSION = "2.0.0";

const LARUS_URL = "https://larus.net/ipv4/api/price/continuity-quote";
const BLOCKS = [
    { num: 1, size: "/24", ips: 256 },
    { num: 2, size: "/23", ips: 512 },
    { num: 4, size: "/22", ips: 1024 },
    { num: 8, size: "/21", ips: 2048 },
    { num: 16, size: "/20", ips: 4096 },
    { num: 32, size: "/19", ips: 8192 },
    { num: 64, size: "/18", ips: 16384 },
    { num: 128, size: "/17", ips: 32768 },
    { num: 256, size: "/16", ips: 65536 },
];

// ---------- База данных (общая с Python) ----------
const db = new DatabaseSync(DB_PATH);
// WAL позволяет Python и Node писать в одну базу параллельно
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA busy_timeout=5000");
db.exec("PRAGMA synchronous=NORMAL");

function ensureSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS lease_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            block_size TEXT NOT NULL,
            ips INTEGER NOT NULL,
            base_per_ip REAL NOT NULL,
            base_total REAL NOT NULL,
            production_per_ip REAL,
            production_total REAL,
            source TEXT DEFAULT 'LARUS'
        );
        CREATE TABLE IF NOT EXISTS purchase_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            region TEXT NOT NULL,
            block_size TEXT NOT NULL,
            min_price REAL,
            avg_price REAL,
            max_price REAL,
            source TEXT DEFAULT 'market'
        );
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);
    // Аддитивная миграция writer — та же, что в db.py; идемпотентна
    for (const table of ["lease_history", "purchase_history"]) {
        const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name);
        if (!cols.includes("writer")) {
            db.exec(`ALTER TABLE ${table} ADD COLUMN writer TEXT`);
        }
    }
}
ensureSchema();

// ---------- Сборщик данных ----------
async function fetchQuote(block) {
    const url = `${LARUS_URL}?num=${block.num}&months=1&location=${encodeURIComponent(LOCATION)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const data = await res.json();
    if (data.status !== "success") throw new Error("LARUS API вернул не-success");
    const cap = data.plans.CAPACITY_ONLY || {};
    const prod = data.plans.CONTINUITY_PRODUCTION || {};
    return {
        block_size: block.size,
        ips: block.ips,
        base_per_ip: parseFloat(cap.base_unit_price || 0),
        base_total: parseFloat(cap.monthly_total || 0),
        production_per_ip: parseFloat(prod.final_unit_price || 0),
        production_total: parseFloat(prod.monthly_total || 0),
    };
}

async function collectSnapshot() {
    const quotes = [];
    const failures = [];
    await Promise.all(BLOCKS.map(async (b) => {
        try {
            quotes.push(await fetchQuote(b));
        } catch (e) {
            failures.push(`${b.size}: ${e.message}`);
        }
    }));
    if (quotes.length === 0) {
        throw new Error(`все запросы к LARUS провалились (${failures.join("; ")})`);
    }
    if (failures.length) {
        console.log(`[collect] частичные ошибки: ${failures.join("; ")}`);
    }

    quotes.sort((a, b) => a.ips - b.ips);
    const ts = new Date().toISOString();

    // Один снапшот = одна транзакция: либо все 9 строк, либо ни одной
    db.exec("BEGIN IMMEDIATE");
    try {
        const insert = db.prepare(`
            INSERT INTO lease_history
            (timestamp, block_size, ips, base_per_ip, base_total, production_per_ip, production_total, writer)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'node')
        `);
        for (const q of quotes) {
            insert.run(ts, q.block_size, q.ips, q.base_per_ip, q.base_total,
                       q.production_per_ip, q.production_total);
        }
        db.prepare(`
            INSERT INTO meta (key, value) VALUES ('last_lease_update', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(ts);
        db.exec("COMMIT");
        console.log(`[collect] ${ts} — сохранено блоков: ${quotes.length}`);
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
}

function collectLoop() {
    collectSnapshot().catch((e) => {
        // Ошибка одного цикла не останавливает сборщик
        console.error(`[collect] ошибка (цикл пропущен): ${e.message}`);
    });
}

// ---------- HTTP: статика из docs/ + JSON API ----------
const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
};

function sendJson(res, code, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(body);
}

function serveStatic(res, urlPath) {
    // Защита от path traversal: путь обязан остаться внутри docs/
    const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const filePath = path.normalize(path.join(DOCS_DIR, rel));
    if (!filePath.startsWith(DOCS_DIR + path.sep) && filePath !== DOCS_DIR) {
        res.writeHead(403).end("Forbidden");
        return;
    }
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not Found");
            return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
        res.end(data);
    });
}

function apiHistory(query, res) {
    const block = query.get("block");
    const days = Math.min(Math.max(Number(query.get("days")) || 7, 1), 365);
    const limit = Math.min(Math.max(Number(query.get("limit")) || 2000, 1), 20000);
    let sql = `
        SELECT timestamp, block_size, ips, base_per_ip, base_total,
               production_per_ip, production_total, writer
        FROM lease_history
        WHERE timestamp >= datetime('now', ?)
    `;
    const params = [`-${days} days`];
    if (block) { sql += " AND block_size = ?"; params.push(block); }
    sql += " ORDER BY timestamp ASC LIMIT ?";
    params.push(limit);
    sendJson(res, 200, db.prepare(sql).all(...params));
}

async function apiQuotes(res) {
    try {
        const quotes = await Promise.all(BLOCKS.map((b) =>
            fetchQuote(b).catch(() => null)));
        sendJson(res, 200, quotes.filter(Boolean));
    } catch (e) {
        sendJson(res, 502, { error: e.message });
    }
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    if (pathname === "/api/config") {
        const row = db.prepare("SELECT value FROM meta WHERE key = 'last_lease_update'").get();
        sendJson(res, 200, {
            mode: "local",
            version: VERSION,
            interval_min: INTERVAL_MS / 60000,
            location: LOCATION,
            last_update: row ? row.value : null,
        });
    } else if (pathname === "/api/history") {
        apiHistory(url.searchParams, res);
    } else if (pathname === "/api/quotes") {
        apiQuotes(res);
    } else {
        serveStatic(res, pathname);
    }
});

// ---------- Корректное завершение (идемпотентно, двойной Ctrl+C безопасен) ----------
let closing = false;
let collectTimer = null;

function shutdown(exitCode) {
    if (closing) return;
    closing = true;
    console.log("\n[server] остановка: таймер сбора, HTTP-сервер, база...");
    if (collectTimer) clearInterval(collectTimer);
    server.close(() => {
        try { db.close(); } catch (_) { /* уже закрыта */ }
        console.log("[server] база закрыта, выход.");
        process.exit(exitCode);
    });
    // Если HTTP-сервер не закрылся за 3 с (зависшие соединения) — выходим принудительно
    setTimeout(() => {
        try { db.close(); } catch (_) { /* уже закрыта */ }
        process.exit(exitCode);
    }, 3000).unref();
}

process.on("SIGINT", () => shutdown(0));   // Ctrl+C
process.on("SIGTERM", () => shutdown(0)); // kill
process.on("uncaughtException", (e) => {
    console.error("[server] неперехваченная ошибка:", e);
    shutdown(1);
});

// ---------- Запуск ----------
server.listen(PORT, () => {
    console.log(`IPv4 Price Aggregator (локальный вариант) v${VERSION}`);
    console.log(`  веб-интерфейс:  http://localhost:${PORT}`);
    console.log(`  база данных:    ${DB_PATH} (общая с Python, WAL)`);
    console.log(`  локация API:    ${LOCATION}, интервал: ${INTERVAL_MS / 60000} мин`);
    console.log("  остановка: Ctrl+C");
    collectLoop();                    // первый сбор сразу
    collectTimer = setInterval(collectLoop, INTERVAL_MS);
});
