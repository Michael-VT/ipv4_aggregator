# 📡 IPv4 Price Aggregator

Monitoring of IPv4 block prices: **live lease prices** from a public
market API and **market purchase prices** per RIR
region, with history, charts and a 6-language interface
(English, Ukrainian, Russian, Portuguese, German, French).

Three program variants share **one SQLite database** — run any combination of
them, the history accumulates in a single place:

| Variant | Stack | What it does | Saves data? |
|---|---|---|---|
| **1. Python dashboard** | Python + Streamlit | Full dashboard: live tables, purchase by region, history charts | Yes → SQLite |
| **2. Local web (Node.js)** | Node ≥ 22.5, zero npm deps | Collects every 5 min **in the background** (no browser needed) + same web UI | Yes → SQLite |
| **3. GitHub Pages** | Static HTML/JS, free hosting | Pure session monitoring: values + charts only while the page is open | No |

🌐 Interface languages: the Python dashboard has a language selector in the
sidebar; the web variants have one in the header. The choice is remembered.

---

> ✅ **Status (2026-09-21):** verified and live on GitHub Pages — <https://michael-vt.github.io/ipv4_aggregator/>

## Language / Мова / Язык

[English](README.md) · [Українська](README.UA.md) · [Русский](README.RU.md) ·
[Português](README.PT.md) · [Deutsch](README.DE.md) · [Français](README.FR.md)

---

## 1. Python dashboard (Streamlit)

### Requirements
- Python ≥ 3.10

### Install & run
```bash
cd ipv4_aggregator
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```
Open http://localhost:8501. The dashboard has four tabs: live lease prices
(live), purchase prices by region, history & charts, and about.

- **Auto-refresh** (checkbox in the sidebar) re-renders the live tab every
  5 minutes; each successful refresh is saved to SQLite.
- **Refresh now** button forces a fresh fetch.
- Region and block-size filters affect the tables and charts.

### Exit
Just `Ctrl+C` in the terminal. Every snapshot is committed to SQLite
immediately after a successful fetch, so nothing is ever lost; connections
are closed and no WAL files are left behind.

## 2. Local web variant (Node.js)

### Requirements
- **Node.js ≥ 22.5** (for the built-in `node:sqlite` module). Check:
  `node --version`. No `npm install` is needed — there are **zero
  dependencies**.

### Run
```bash
node server.js
# or: npm start
```
Open **http://localhost:8787**.

What it does:
- Immediately on start and then every **5 minutes** it fetches live lease
  prices and writes a snapshot into the shared `ipv4_prices.db`
  (rows are marked `writer='node'`). The browser does **not** need to be
  open — collection runs in the background.
- Serves the web UI from `docs/` (same page as the GitHub Pages variant,
  but in "local server" mode with the full history from the database).
- JSON API:
  - `GET /api/config` → mode, version, interval, last update;
  - `GET /api/history?block=/24&days=7&limit=2000` → history rows;
  - `GET /api/quotes` → fresh server-side fetch of all 9 blocks.

### Configuration (environment variables)
| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | HTTP port |
| `LARUS_LOCATION` | `US` | API location passed to the price API (`US`, `EU`) |

### Exit
`Ctrl+C` or `kill <pid>` (SIGTERM): the collection timer stops, the HTTP
server closes, the database is closed with a WAL checkpoint, exit code 0.
Pressing `Ctrl+C` twice is safe. A kill in the middle of a write cannot
corrupt the database — SQLite rolls the transaction back on next open.

## 3. GitHub Pages (static monitoring)

The static variant lives in [`docs/`](docs/) and shows live prices + charts
**only while the page is open** (one point every 5 minutes, in memory only).
No server, no database, free hosting.

### Setup
1. Push this repository to GitHub.
2. Repository → **Settings** → **Pages**.
3. **Source**: *Deploy from a branch* → branch `main`, folder **`/docs`** → Save.
4. In a minute the site is live at `https://<username>.github.io/<repo>/`.

That's all — no build step, no GitHub Actions workflow.

## Shared storage (how the two writers coexist)

Both the Python dashboard and the Node server write to the same
`ipv4_prices.db` in the project root:

- **WAL mode** (`PRAGMA journal_mode=WAL`) + `busy_timeout=5000` allow both
  programs to write simultaneously without "database is locked" errors. Run
  both for weeks — rows from both writers (`writer='python'` /
  `writer='node'`) land in one table and are shown together in the history.
- Each snapshot is a single atomic transaction: an interrupted write is
  rolled back automatically.
- While either program runs you may see `ipv4_prices.db-wal` /
  `ipv4_prices.db-shm` files — this is normal; they disappear after a clean
  exit. WAL does not work on network shares (NFS/SMB): keep the project on a
  local disk.
- The database file is **not** committed to the repository (see
  `.gitignore`); it is created automatically on first run.

## CORS (GitHub Pages variant)

The browser on GitHub Pages fetches the price API directly. This works
because the API returns `access-control-allow-origin: *` — verified on
**2026-09-20** with:

```bash
curl -sS -D - -o /dev/null -H "Origin: https://<username>.github.io" "<PRICE_API_URL>"
```
(`PRICE_API_URL` — the address of the price API used by the app.)

If the API ever drops that header, the page shows a warning banner. Fallback:
set a read-only public CORS proxy in the browser console:

```js
localStorage.setItem("ipv4agg.proxy", "https://corsproxy.io/?");
// clear: localStorage.removeItem("ipv4agg.proxy")
```

Caveats: a third party sees the request URLs, rate limits apply, responses
may be cached. The local Node variant never needs a proxy.

## Project structure

```
ipv4_aggregator/
├── app.py            # Python dashboard (Streamlit) — variant 1
├── i18n.py           # UI strings, 6 languages (Python side)
├── data_sources.py   # live price fetcher + market purchase prices
├── db.py             # SQLite layer (shared storage, WAL, writer column)
├── requirements.txt  # Python dependencies (4 packages)
├── server.js         # Local Node variant — variant 2 (zero npm deps)
├── package.json      # Node metadata, engines: >=22.5
├── docs/             # Web UI — variant 3 (GitHub Pages) + served by server.js
│   ├── index.html
│   ├── app.js        # mode detection, fetching, Chart.js rendering
│   ├── i18n.js       # UI strings, 6 languages (web side)
│   └── styles.css    # mobile-first, dark theme
├── README.md         # this file (English, canonical)
├── README.*.md       # UA / RU / PT / DE / FR translations
└── .gitignore
```

## Troubleshooting

| Problem | Solution |
|---|---|
| `database is locked` | Wait 5 s — the writers retry automatically (busy_timeout). If it persists, don't put the project on a network share. |
| `node:sqlite` missing | Your Node < 22.5 — upgrade Node. |
| Charts empty on GitHub Pages, warning banner shown | CORS or network problem — see the CORS section above. |
| Charts replaced by plain text | The Chart.js CDN was unreachable; charts return when it is. |
| History is empty | Data appears after several successful refreshes (or let `server.js` run for a few minutes). |

## Data sources

- **Lease (live)**: public market API — CAPACITY_ONLY and
  CONTINUITY_PRODUCTION plans, /24…/16, USD.
- **Purchase**: manual market snapshots (IPv4Center / IPv4.Global reports)
  per RIR region, in `data_sources.py`.

## License

MIT — see `package.json`. Data belongs to its respective providers.
