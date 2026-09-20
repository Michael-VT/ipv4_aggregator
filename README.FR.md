# 📡 IPv4 Price Aggregator

Suivi des prix des blocs IPv4 : **prix de location en direct** d'une API
publique de marché et **prix d'achat sur le marché**
par région RIR, avec historique, graphiques et une interface en 6 langues
(anglais, ukrainien, russe, portugais, allemand, français).

Trois variantes du programme partagent **une seule base SQLite** — exécutez-les
dans n'importe quelle combinaison, l'historique s'accumule au même endroit :

| Variante | Stack | Ce qu'elle fait | Sauvegarde les données ? |
|---|---|---|---|
| **1. Tableau de bord Python** | Python + Streamlit | Tableau de bord complet : tableaux en direct, achat par région, graphiques d'historique | Oui → SQLite |
| **2. Web local (Node.js)** | Node ≥ 22.5, zéro dépendance npm | Collecte toutes les 5 min **en arrière-plan** (sans navigateur) + même interface web | Oui → SQLite |
| **3. GitHub Pages** | HTML/JS statique, hébergement gratuit | Surveillance de session uniquement : valeurs + graphiques tant que la page est ouverte | Non |

🌐 Langues de l'interface : le tableau de bord Python a un sélecteur de langue
dans la barre latérale ; les variantes web en ont un dans l'en-tête. Le choix
est mémorisé.

---

[English](README.md) · [Українська](README.UA.md) · [Русский](README.RU.md) · [Português](README.PT.md) · [Deutsch](README.DE.md) · [Français](README.FR.md)

---

## 1. Tableau de bord Python (Streamlit)

### Prérequis
- Python ≥ 3.10

### Installation et exécution
```bash
cd ipv4_aggregator
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```
Ouvrez http://localhost:8501. Le tableau de bord comporte quatre onglets :
prix de location en direct de l'API de marché, prix d'achat par région, historique et
graphiques, et à propos.

- **Actualisation automatique** (case à cocher dans la barre latérale)
  rafraîchit l'onglet « en direct » toutes les 5 minutes ; chaque
  actualisation réussie est enregistrée dans SQLite.
- Le bouton **Actualiser maintenant** force une récupération immédiate.
- Les filtres par région et par taille de bloc affectent les tableaux et les
  graphiques.

### Arrêt
Il suffit de faire `Ctrl+C` dans le terminal. Chaque snapshot est validé dans
SQLite immédiatement après une récupération réussie, donc rien n'est jamais
perdu ; les connexions sont fermées et aucun fichier WAL n'est laissé derrière.

## 2. Variante web locale (Node.js)

### Prérequis
- **Node.js ≥ 22.5** (pour le module intégré `node:sqlite`). Vérifiez avec
  `node --version`. Aucun `npm install` n'est nécessaire — il y a **zéro
  dépendance**.

### Exécution
```bash
node server.js
# or: npm start
```
Ouvrez **http://localhost:8787**.

Ce qu'elle fait :
- Dès le démarrage puis toutes les **5 minutes**, elle récupère les prix de
  location de l'API de marché et écrit un snapshot dans la base partagée `ipv4_prices.db`
  (les lignes sont marquées `writer='node'`). Le navigateur n'a **pas**
  besoin d'être ouvert — la collecte tourne en arrière-plan.
- Sert l'interface web depuis `docs/` (même page que la variante GitHub
  Pages, mais en mode « serveur local » avec l'historique complet de la base).
- API JSON :
  - `GET /api/config` → mode, version, intervalle, dernière mise à jour ;
  - `GET /api/history?block=/24&days=7&limit=2000` → lignes d'historique ;
  - `GET /api/quotes` → récupération fraîche côté serveur des 9 blocs.

### Configuration (variables d'environnement)
| Variable | Défaut | Signification |
|---|---|---|
| `PORT` | `8787` | Port HTTP |
| `LARUS_LOCATION` | `US` | Localisation de l'API passée à l'API de prix (`US`, `EU`) |

### Arrêt
`Ctrl+C` ou `kill <pid>` (SIGTERM) : le minuteur de collecte s'arrête, le
serveur HTTP se ferme, la base est fermée avec un checkpoint WAL, code de
sortie 0. Appuyer deux fois sur `Ctrl+C` est sans danger. Un kill au milieu
d'une écriture ne peut pas corrompre la base — SQLite annule la transaction
à la prochaine ouverture.

## 3. GitHub Pages (surveillance statique)

La variante statique se trouve dans [`docs/`](docs/) et affiche les prix en
direct + les graphiques **uniquement tant que la page est ouverte** (un point
toutes les 5 minutes, en mémoire seulement). Pas de serveur, pas de base de
données, hébergement gratuit.

### Mise en place
1. Poussez ce dépôt sur GitHub.
2. Dépôt → **Settings** → **Pages**.
3. **Source** : *Deploy from a branch* → branche `main`, dossier **`/docs`** → Save.
4. Dans une minute, le site est en ligne à l'adresse `https://<username>.github.io/<repo>/`.

C'est tout — aucune étape de build, aucun workflow GitHub Actions.

## Stockage partagé (comment les deux écrivains coexistent)

Le tableau de bord Python et le serveur Node écrivent tous deux dans la même
base `ipv4_prices.db` à la racine du projet :

- Le **mode WAL** (`PRAGMA journal_mode=WAL` — journalisation par fichier de
  write-ahead log) + `busy_timeout=5000` permettent aux deux programmes
  d'écrire simultanément sans erreur « database is locked ». Faites-les
  tourner des semaines durant — les lignes des deux écrivains
  (`writer='python'` / `writer='node'`) arrivent dans la même table et sont
  affichées ensemble dans l'historique.
- Chaque snapshot est une seule transaction atomique : une écriture interrompue
  est automatiquement annulée.
- Pendant l'exécution de l'un des programmes, vous pouvez voir les fichiers
  `ipv4_prices.db-wal` / `ipv4_prices.db-shm` — c'est normal ; ils disparaissent
  après une sortie propre. Le mode WAL ne fonctionne pas sur les partages
  réseau (NFS/SMB) : gardez le projet sur un disque local.
- Le fichier de base **n'est pas** versionné dans le dépôt (voir
  `.gitignore`) ; il est créé automatiquement au premier lancement.

## CORS (variante GitHub Pages)

Le navigateur sur GitHub Pages interroge l'API de prix directement. Cela
fonctionne parce que l'API renvoie `access-control-allow-origin: *` — vérifié
le **2026-09-20** avec :

```bash
# PRICE_API_URL : l'adresse de l'API de prix
curl -sS -D - -o /dev/null -H "Origin: https://<username>.github.io" \
  "<PRICE_API_URL>"
```

Si l'API supprime un jour cet en-tête, la page affiche un bandeau
d'avertissement. Solution de repli : définir un proxy CORS public en lecture
seule dans la console du navigateur :

```js
localStorage.setItem("ipv4agg.proxy", "https://corsproxy.io/?");
// clear: localStorage.removeItem("ipv4agg.proxy")
```

Limites : un tiers voit les URL des requêtes, des limites de débit
s'appliquent, les réponses peuvent être mises en cache. La variante Node
locale n'a jamais besoin de proxy.

## Structure du projet

```
ipv4_aggregator/
├── app.py            # Python dashboard (Streamlit) — variant 1
├── i18n.py           # UI strings, 6 languages (Python side)
├── data_sources.py   # chargeur des prix en direct + market purchase prices
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

## Dépannage

| Problème | Solution |
|---|---|
| `database is locked` | Attendez 5 s — les écrivains réessaient automatiquement (busy_timeout). Si cela persiste, ne placez pas le projet sur un partage réseau. |
| `node:sqlite` absent | Votre Node < 22.5 — mettez Node à niveau. |
| Graphiques vides sur GitHub Pages, bandeau d'avertissement affiché | Problème de CORS ou de réseau — voir la section CORS ci-dessus. |
| Graphiques remplacés par du texte brut | Le CDN de Chart.js était inaccessible ; les graphiques reviennent dès qu'il redevient joignable. |
| Historique vide | Les données apparaissent après plusieurs actualisations réussies (ou laissez `server.js` tourner quelques minutes). |

## Sources de données

- **Location (en direct)** : API publique de marché — plans
  CAPACITY_ONLY et CONTINUITY_PRODUCTION, /24…/16, USD.
- **Achat** : instantanés manuels du marché (rapports IPv4Center /
  IPv4.Global) par région RIR, dans `data_sources.py`.

## Licence

MIT — voir `package.json`. Les données appartiennent à leurs fournisseurs
respectives.
