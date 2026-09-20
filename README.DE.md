# 📡 IPv4 Price Aggregator

Monitoring von Preisen für IPv4-Blöcke: ** Live-Mietpreise** über die öffentliche
[LARUS IPv4 API](https://larus.net/) und **Marktkaufpreise** je RIR-Region,
mit Historie, Diagrammen und einer Oberfläche in 6 Sprachen
(Englisch, Ukrainisch, Russisch, Portugiesisch, Deutsch, Französisch).

Drei Programmvarianten teilen sich **eine SQLite-Datenbank** — jede Kombination
davon kann gleichzeitig laufen, die Historie sammelt sich an einem einzigen Ort:

| Variante | Stack | Was sie tut | Speichert Daten? |
|---|---|---|---|
| **1. Python-Dashboard** | Python + Streamlit | Volles Dashboard: Live-Tabellen, Kaufpreise je Region, Verlaufsdiagramme | Ja → SQLite |
| **2. Lokales Web (Node.js)** | Node ≥ 22.5, null npm-Abhängigkeiten | Sammelt alle 5 Minuten **im Hintergrund** (kein Browser nötig) + dieselbe Web-UI | Ja → SQLite |
| **3. GitHub Pages** | Statisches HTML/JS, kostenloses Hosting | Reines Sitzungs-Monitoring: Werte + Diagramme nur, solange die Seite offen ist | Nein |

🌐 Oberflächensprachen: Das Python-Dashboard hat einen Sprachwähler in der
Seitenleiste; die Web-Varianten haben einen in der Kopfzeile. Die Wahl wird
gespeichert.

---

## Language / Мова / Язык

[English](README.md) · [Українська](README.UA.md) · [Русский](README.RU.md) ·
[Português](README.PT.md) · [Deutsch](README.DE.md) · [Français](README.FR.md)

---

## 1. Python-Dashboard (Streamlit)

### Voraussetzungen
- Python ≥ 3.10

### Installation & Start
```bash
cd ipv4_aggregator
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```
Öffne http://localhost:8501. Das Dashboard hat vier Tabs: Live-Mietpreise
(LARUS), Kaufpreise je Region, Historie & Diagramme sowie Über/Info.

- **Auto-Aktualisierung** (Kontrollkästchen in der Seitenleiste) rendert den
  Live-Tab alle 5 Minuten neu; jede erfolgreiche Aktualisierung wird in SQLite
  gespeichert.
- Der Button **Jetzt aktualisieren** erzwingt einen frischen Abruf.
- Filter für Region und Blockgröße wirken auf Tabellen und Diagramme.

### Beenden
Einfach `Ctrl+C` im Terminal. Jeder Snapshot wird unmittelbar nach einem
erfolgreichen Abruf in SQLite committed (festgeschrieben), es geht also nie
etwas verloren; Verbindungen werden geschlossen und keine WAL-Dateien
(Journal-Dateien des Write-Ahead-Logging-Modus) bleiben zurück.

## 2. Lokale Web-Variante (Node.js)

### Voraussetzungen
- **Node.js ≥ 22.5** (für das eingebaute Modul `node:sqlite`). Prüfen mit:
  `node --version`. Ein `npm install` ist nicht nötig — es gibt **null
  Abhängigkeiten**.

### Start
```bash
node server.js
# oder: npm start
```
Öffne **http://localhost:8787**.

Was sie tut:
- Direkt beim Start und danach alle **5 Minuten** ruft sie die LARUS-Mietpreise
  ab und schreibt einen Snapshot in die gemeinsame `ipv4_prices.db`
  (Zeilen werden mit `writer='node'` markiert). Der Browser muss **nicht**
  geöffnet sein — die Sammlung läuft im Hintergrund.
- Liefert die Web-UI aus `docs/` aus (dieselbe Seite wie die GitHub-Pages-
  Variante, aber im Modus „lokaler Server" mit der vollständigen Historie aus
  der Datenbank).
- JSON-API:
  - `GET /api/config` → Modus, Version, Intervall, letzte Aktualisierung;
  - `GET /api/history?block=/24&days=7&limit=2000` → Verlaufszeilen;
  - `GET /api/quotes` → frischer serverseitiger Abruf aller 9 Blöcke.

### Konfiguration (Umgebungsvariablen)
| Variable | Standard | Bedeutung |
|---|---|---|
| `PORT` | `8787` | HTTP-Port |
| `LARUS_LOCATION` | `US` | An die LARUS-API übergebener Standort (`US`, `EU`) |

### Beenden
`Ctrl+C` oder `kill <pid>` (SIGTERM): der Sammel-Timer stoppt, der
HTTP-Server schließt, die Datenbank wird mit einem WAL-Checkpoint geschlossen,
Exit-Code 0. Ein doppeltes `Ctrl+C` ist gefahrlos. Ein Kill mitten im
Schreibvorgang kann die Datenbank nicht beschädigen — SQLite rollt die
Transaktion beim nächsten Öffnen zurück.

## 3. GitHub Pages (statisches Monitoring)

Die statische Variante liegt in [`docs/`](docs/) und zeigt Live-Preise +
Diagramme **nur, solange die Seite offen ist** (ein Punkt alle 5 Minuten,
ausschließlich im Speicher). Kein Server, keine Datenbank, kostenloses Hosting.

### Einrichtung
1. Dieses Repository zu GitHub pushen.
2. Repository → **Settings** → **Pages**.
3. **Source**: *Deploy from a branch* → Branch `main`, Ordner **`/docs`** → Save.
4. In einer Minute ist die Seite live unter `https://<username>.github.io/<repo>/`.

Mehr ist nicht nötig — kein Build-Schritt, kein GitHub-Actions-Workflow.

## Gemeinsamer Speicher (wie die beiden Schreibenden koexistieren)

Sowohl das Python-Dashboard als auch der Node-Server schreiben in dieselbe
`ipv4_prices.db` im Projektstammverzeichnis:

- **WAL mode** (Write-Ahead-Logging, `PRAGMA journal_mode=WAL`) +
  `busy_timeout=5000` erlauben beiden Programmen, gleichzeitig zu schreiben,
  ohne „database is locked"-Fehler. Lass beide wochenlang laufen — die Zeilen
  beider Schreibenden (`writer='python'` / `writer='node'`) landen in einer
  Tabelle und werden gemeinsam in der Historie angezeigt.
- Jeder Snapshot ist eine einzelne atomare Transaktion: ein unterbrochener
  Schreibvorgang wird automatisch zurückgerollt.
- Während eines der Programme läuft, siehst du eventuell die Dateien
  `ipv4_prices.db-wal` / `ipv4_prices.db-shm` — das ist normal; sie
  verschwinden nach einem sauberen Beenden. WAL funktioniert nicht auf
  Netzlaufwerken (NFS/SMB): halte das Projekt auf einer lokalen Festplatte.
- Die Datenbankdatei wird **nicht** ins Repository committed (siehe
  `.gitignore`); sie wird beim ersten Lauf automatisch angelegt.

## CORS (GitHub-Pages-Variante)

Der Browser auf GitHub Pages ruft die LARUS-API direkt ab. Das funktioniert,
weil LARUS `access-control-allow-origin: *` zurückliefert — überprüft am
**2026-09-20** mit:

```bash
curl -sS -D - -o /dev/null -H "Origin: https://<username>.github.io" \
  "https://larus.net/ipv4/api/price/continuity-quote?num=1&months=1&location=US"
```

Sollte LARUS diesen Header einmal streichen, zeigt die Seite ein
Warnbanner. Ausweichlösung: einen nur lesenden öffentlichen CORS-Proxy in der
Browser-Konsole setzen:

```js
localStorage.setItem("ipv4agg.proxy", "https://corsproxy.io/?");
// clear: localStorage.removeItem("ipv4agg.proxy")
```

Einschränkungen: ein Dritter sieht die Anfrage-URLs, Rate-Limits greifen,
Antworten können zwischengespeichert sein. Die lokale Node-Variante braucht
nie einen Proxy.

## Projektstruktur

```
ipv4_aggregator/
├── app.py            # Python dashboard (Streamlit) — variant 1
├── i18n.py           # UI strings, 6 languages (Python side)
├── data_sources.py   # LARUS API fetcher + market purchase prices
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

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| `database is locked` | 5 s warten — die Schreibenden wiederholen automatisch (busy_timeout). Falls es bestehen bleibt, das Projekt nicht auf ein Netzlaufwerk legen. |
| `node:sqlite` fehlt | Dein Node ist < 22.5 — Node aktualisieren. |
| Diagramme auf GitHub Pages leer, Warnbanner erscheint | CORS- oder Netzwerkproblem — siehe den CORS-Abschnitt oben. |
| Diagramme durch reinen Text ersetzt | Das Chart.js-CDN war nicht erreichbar; sobald es das wieder ist, kehren die Diagramme zurück. |
| Historie ist leer | Daten erscheinen nach mehreren erfolgreichen Aktualisierungen (oder lass `server.js` ein paar Minuten laufen). |

## Datenquellen

- **Miete (live)**: [LARUS IPv4 API](https://larus.net/) — Tarife CAPACITY_ONLY
  und CONTINUITY_PRODUCTION, /24…/16, in USD.
- **Kauf**: manuelle Markt-Snapshots (Berichte von IPv4Center / IPv4.Global)
  je RIR-Region, in `data_sources.py`.

## Lizenz

MIT — siehe `package.json`. Die Daten gehören den jeweiligen Anbietern.
