# 📡 IPv4 Price Aggregator

Monitoramento dos preços de blocos IPv4: **preços de locação em tempo real**
de uma API pública de mercado e **preços de compra de
mercado** por região de RIR, com histórico, gráficos e interface em 6 idiomas
(incluindo português do Brasil, inglês, ucraniano, russo, alemão e francês).

Três variantes do programa compartilham **um único banco de dados SQLite** —
execute qualquer combinação delas, o histórico se acumula em um só lugar:

| Variante | Stack | O que faz | Salva os dados? |
|---|---|---|---|
| **1. Dashboard Python** | Python + Streamlit | Dashboard completo: tabelas em tempo real, compra por região, gráficos de histórico | Sim → SQLite |
| **2. Web local (Node.js)** | Node ≥ 22.5, zero dependências npm | Coleta a cada 5 min **em segundo plano** (sem precisar de navegador) + mesma interface web | Sim → SQLite |
| **3. GitHub Pages** | HTML/JS estático, hospedagem gratuita | Monitoramento apenas de sessão: valores + gráficos somente enquanto a página está aberta | Não |

🌐 Idiomas da interface: o dashboard Python tem um seletor de idioma na barra
lateral; as variantes web têm um no cabeçalho. A escolha é lembrada.

---

> ✅ **Status (2026-09-21):** verificado e publicado no GitHub Pages — <https://michael-vt.github.io/ipv4_aggregator/>

## Language / Мова / Язык

[English](README.md) · [Українська](README.UA.md) · [Русский](README.RU.md) · [Português](README.PT.md) · [Deutsch](README.DE.md) · [Français](README.FR.md)

---

## 1. Dashboard Python (Streamlit)

### Requisitos
- Python ≥ 3.10

### Instalação e execução
```bash
cd ipv4_aggregator
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```
Abra http://localhost:8501. O dashboard tem quatro abas: preços de locação em
tempo real (API de mercado), preços de compra por região, histórico e gráficos, e
sobre.

- **Auto-refresh** (atualização automática, caixa de seleção na barra
  lateral) renderiza novamente a aba de tempo real a cada 5 minutos; cada
  atualização bem-sucedida é salva no SQLite.
- O botão **Refresh now** (atualizar agora) força uma nova coleta.
- Os filtros de região e de tamanho de bloco afetam as tabelas e os gráficos.

### Encerramento
Basta `Ctrl+C` no terminal. Cada snapshot (captura de estado) é gravado no
SQLite imediatamente após uma coleta bem-sucedida, então nada é perdido; as
conexões são fechadas e nenhum arquivo WAL é deixado para trás.

## 2. Variante web local (Node.js)

### Requisitos
- **Node.js ≥ 22.5** (para o módulo embutido `node:sqlite`). Verifique com:
  `node --version`. Não é necessário `npm install` — há **zero
  dependências**.

### Execução
```bash
node server.js
# or: npm start
```
Abra **http://localhost:8787**.

O que ela faz:
- Imediatamente ao iniciar e depois a cada **5 minutos** coleta os preços de
  locação da API de mercado e grava um snapshot no `ipv4_prices.db` compartilhado
  (as linhas são marcadas com `writer='node'`). O navegador **não** precisa
  estar aberto — a coleta roda em segundo plano.
- Serve a interface web a partir de `docs/` (a mesma página da variante
  GitHub Pages, mas no modo "servidor local", com o histórico completo do
  banco de dados).
- API JSON:
  - `GET /api/config` → modo, versão, intervalo, última atualização;
  - `GET /api/history?block=/24&days=7&limit=2000` → linhas de histórico;
  - `GET /api/quotes` → coleta recente de todos os 9 blocos feita no servidor.

### Configuração (variáveis de ambiente)
| Variável | Padrão | Significado |
|---|---|---|
| `PORT` | `8787` | Porta HTTP |
| `LARUS_LOCATION` | `US` | Localidade da API passada para a API de preços (`US`, `EU`) |

### Encerramento
`Ctrl+C` ou `kill <pid>` (SIGTERM): o temporizador de coleta para, o servidor
HTTP é fechado, o banco de dados é fechado com um checkpoint do WAL e o
código de saída é 0. Pressionar `Ctrl+C` duas vezes é seguro. Um kill no meio
de uma gravação não corrompe o banco de dados — o SQLite desfaz a transação
na próxima abertura.

## 3. GitHub Pages (monitoramento estático)

A variante estática fica em [`docs/`](docs/) e mostra preços em tempo real +
gráficos **somente enquanto a página está aberta** (um ponto a cada 5
minutos, apenas em memória). Sem servidor, sem banco de dados, hospedagem
gratuita.

### Configuração
1. Envie este repositório para o GitHub.
2. Repositório → **Settings** → **Pages**.
3. **Source**: *Deploy from a branch* → branch `main`, pasta **`/docs`** → Save.
4. Em um minuto o site estará no ar em `https://<username>.github.io/<repo>/`.

Só isso — sem etapa de build, sem workflow do GitHub Actions.

## Armazenamento compartilhado (como os dois escritores coexistem)

Tanto o dashboard Python quanto o servidor Node escrevem no mesmo
`ipv4_prices.db` na raiz do projeto:

- O **modo WAL** (`PRAGMA journal_mode=WAL`, journaling que permite escrita
  concorrente) + `busy_timeout=5000` permitem que os dois programas escrevam
  simultaneamente sem erros de "database is locked". Execute ambos por
  semanas — as linhas dos dois escritores (`writer='python'` /
  `writer='node'`) caem em uma única tabela e são exibidas juntas no
  histórico.
- Cada snapshot é uma única transação atômica: uma gravação interrompida é
  desfeita automaticamente.
- Enquanto qualquer um dos programas estiver em execução, você pode ver os
  arquivos `ipv4_prices.db-wal` / `ipv4_prices.db-shm` — isso é normal; eles
  desaparecem após um encerramento limpo. O modo WAL não funciona em
  compartilhamentos de rede (NFS/SMB): mantenha o projeto em um disco local.
- O arquivo do banco de dados **não** é versionado no repositório (veja o
  `.gitignore`); ele é criado automaticamente na primeira execução.

## CORS (variante GitHub Pages)

O navegador no GitHub Pages busca a API de preços diretamente. Isso funciona
porque a API retorna `access-control-allow-origin: *` — verificado em
**2026-09-20** com:

```bash
curl -sS -D - -o /dev/null -H "Origin: https://<username>.github.io" \
  "<PRICE_API_URL>"
```

onde `PRICE_API_URL` é o endereço da API de preços.

Se a API um dia remover esse cabeçalho, a página exibe um banner de aviso.
Solução alternativa: defina um proxy CORS público somente de leitura no
console do navegador:

```js
localStorage.setItem("ipv4agg.proxy", "https://corsproxy.io/?");
// clear: localStorage.removeItem("ipv4agg.proxy")
```

Ressalvas: um terceiro vê as URLs das requisições, limites de taxa se
aplicam e as respostas podem ficar em cache. A variante Node local nunca
precisa de proxy.

## Estrutura do projeto

```
ipv4_aggregator/
├── app.py            # Python dashboard (Streamlit) — variant 1
├── i18n.py           # UI strings, 6 languages (Python side)
├── data_sources.py   # carregador de preços em tempo real + market purchase prices
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

## Solução de problemas

| Problema | Solução |
|---|---|
| `database is locked` | Aguarde 5 s — os escritores tentam novamente automaticamente (busy_timeout). Se persistir, não coloque o projeto em um compartilhamento de rede. |
| `node:sqlite` ausente | Seu Node é < 22.5 — atualize o Node. |
| Gráficos vazios no GitHub Pages, banner de aviso exibido | Problema de CORS ou de rede — veja a seção CORS acima. |
| Gráficos substituídos por texto simples | O CDN do Chart.js estava inacessível; os gráficos voltam quando ele retornar. |
| Histórico vazio | Os dados aparecem após várias atualizações bem-sucedidas (ou deixe o `server.js` rodar por alguns minutos). |

## Fontes de dados

- **Locação (tempo real)**: API pública de mercado — planos
  CAPACITY_ONLY e CONTINUITY_PRODUCTION, /24…/16, USD.
- **Compra**: snapshots manuais de mercado (relatórios de IPv4Center /
  IPv4.Global) por região de RIR, em `data_sources.py`.

## Licença

MIT — veja `package.json`. Os dados pertencem aos seus respectivos
provedores.
