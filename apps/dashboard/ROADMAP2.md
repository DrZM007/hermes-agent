# HERMES//HUB — expansion roadmap (all-in-one build-out)

Companion to `ROADMAP.md`. This document covers the next major expansion:
deeper **crypto** data + analysis, live **sports**, richer **news**, and the
structural pieces that turn the board into a true all-in-one console with
detailed drill-down windows.

Same rules as always:
- **Zero-dependency stdlib server**, **zero-build vanilla ES-module frontend**,
  optional `anthropic` SDK only. No frameworks/bundlers.
- Every upstream is a **free, no-key API**, proxied through `server.py` (so the
  browser never fights CORS and no secret ever reaches the client).
- Every data widget ships a **sample fixture** in `sample_data.json` so offline
  mode and the e2e suite work without network.
- Ship standard unchanged: full unit suite green **+ 3 consecutive green e2e**.

Effort key: **S** < ½ day · **M** ~1 day · **L** multi-day.

### Build status (updated as items ship)
- ✅ **§0.1 chart helper** · ✅ **§0.2 detail/expand framework** — shipped.
- ✅ **§1.1 coin detail drawer** · ✅ **§1.2 indicators** · ✅ **§1.3 portfolio**
  · ✅ **§1.4 global bar + Fear & Greed** · ✅ **§1.5 trending** — shipped.
- ✅ **§2.1 live sports scores** — shipped (NBA/NFL/MLB/NHL/EPL/MLS).
- ✅ **§3.5 gaming** — news topic + Epic free games / Steam deals widget — shipped.
- ✅ **§3.6 tech-ranked + §3.7 socials hub** — HN/Lobsters/Reddit — shipped.
- ✅ **§4.1 stocks / indices / FX** — Stooq watchlist + chart — shipped.
- ✅ **§0.4 dashboard pages/tabs** — Main / Markets / Feeds / Sports, migration-safe.
- ✅ **§2.2 standings** (scores detail) · ✅ **§3.1 Google News follow-a-search**
  · ✅ **§3.2 richer reader** (image/byline/reading time) · ✅ **§4.2 at-a-glance
  hero** — shipped.
- ✅ **§5 intel widgets (first batch)** — world clock, seismic monitor (USGS),
  currency converter (Frankfurter) — shipped on a new "Intel" page.
- ✅ **§1.7 universal converter** — coin↔fiat↔coin on the Intel page (reuses
  cached crypto USD prices + USD-based fiat rates, no new upstream) — shipped.
- ✅ **§1.6 smarter crypto alerts** — the market trigger now also does absolute
  price crossings (`BTC > 100000`) and RSI(14) thresholds (`ETH RSI < 30`),
  taught to the create_automation tool schema and the local command parser —
  shipped.
- ✅ **§3.3 topic detail window** — ⤢ on the news widget opens a large view
  grouped by source with an in-place search, plus a "Search all topics" toggle
  backed by server-side `/api/news?all=1` cross-topic aggregation — shipped.
- ✅ **§2.3 follow teams** — ☆ follow-stars on any board, a "★ Teams" tab with
  each team's recent/next fixtures + team news, and an add-to-calendar button
  that writes upcoming games into the calendar store — shipped.
- ✅ **§3.4 podcast player + source mute/pin** — the podcast widget (subscribe
  by RSS, inline HTML5 player) shipped earlier; now the news widget gains
  per-source 🔇 mute and 📌 pin (synced state, filtered/sorted client-side)
  with an unmute bar — shipped.
- ✅ **§0.3 data-source registry** — `SOURCES` table + `Api.fetch_source()`
  collapse the try-live→cache→sample boilerplate; ten endpoints refactored onto
  it and the convention documented in JARVIS.md — shipped.
- ✅ **§5 air quality + pollen** — Open-Meteo Air Quality API (no key): US AQI
  with a colour-coded category band, six pollutants, and a pollen breakdown,
  sharing the weather widget's saved locations — shipped on the Intel page.
- ✅ **§5 space weather** — NOAA SWPC (no key): planetary K-index with its
  geomagnetic-storm band, 24h peak, aurora outlook, and a Kp history bar
  chart — shipped on the Intel page.
- ⬜ Still remaining from the original list:
  §5 widgets (weather alerts, flights, RSS-reader folders).

---

## 0. Shared infrastructure (build these first — everything leans on them)

### 0.1 SVG chart helper (`public/js/chart.js`) — **M**
**Problem.** Charting is ad-hoc: the weather widget hand-rolls an SVG curve, the
markets widget hand-rolls sparklines. Crypto TA, stocks and detail windows all
need real charts. We need one primitive, not five.

**Design.** A dependency-free SVG chart module exposing pure functions that
return DOM via the existing `h()` helper (no canvas, no libs):
- `lineChart(series, opts)` — one or more series, optional area fill, axes,
  gridlines, min/max labels, last-value dot. `series = [{points:[{x,y}], color}]`.
- `candleChart(candles, opts)` — OHLC candlesticks (`[{t,o,h,l,c}]`) with wicks,
  up/down colors from theme tokens (`--delta-up/--delta-down`), optional
  overlay lines (moving averages, Bollinger bands).
- `sparkline(values, opts)` — the tiny inline form (markets rows keep using it).
- Shared: responsive `viewBox`, `preserveAspectRatio`, theme-token colors,
  `overflow-x:auto` wrapper for wide charts, reduced-motion safe.

**Files.** New `public/js/chart.js`; refactor `widgets/weather.js` and
`widgets/markets.js` to consume it (keeps their look, removes duplication).

**Tests.** e2e: weather + markets still render their charts (existing checks
cover this); a new check asserts a `<path>`/`<rect>` count > 0 for a rendered
candle chart in the crypto detail window (§1.1).

**Risks.** Keep the API tiny; resist feature creep. No animation beyond CSS.

### 0.2 Detail / expand-to-window framework (`public/js/detail.js`) — **M**
**Problem.** Your "more detailed windows" ask. Widget cards are necessarily
compact; users want to pop any widget to a large view with the full dataset.

**Design.** A generic overlay (reusing the `viewer.js` backdrop pattern) opened
by a **⤢ button added to `widget-controls`** in `main.js`. A widget opts in by
exporting an optional `detail(body, ctx)` renderer alongside `render`. When
present, the ⤢ button calls `openDetail(spec, ctx)` which mounts `detail()` in a
large modal (`role="dialog"`, Esc/backdrop close, focus trap). Widgets without a
`detail()` simply don't show the button.
- The modal gets more vertical space and can call heavier endpoints (e.g. crypto
  1Y chart, full standings) that the compact card omits.
- Reuses `ctx` (api/store/setBadge) so detail views share data plumbing.

**Files.** New `public/js/detail.js`; `main.js` (⤢ control + wiring); CSS
(`.detail-backdrop/.detail-pop`, mirroring `.viewer-*`).

**Tests.** e2e: open a widget's detail modal, assert it mounts and Esc closes it.

**Risks.** One modal system only — don't fork per widget. Guard against opening
two at once.

### 0.3 Data-source registry + sample-fixture convention — **S**
**Problem.** Each new upstream currently repeats the try-live→cache→sample dance
by hand. With ~15 new sources coming, formalize it.

**Design.** A small declarative table in `server.py`:
`SOURCES = {name: {ttl, live: fn, sample: fn}}` and a single
`Api.fetch_source(name, **params)` that wraps `_cached`. New endpoints become a
one-line route + a `live_*`/`sample_*` pair. Document the rule: **no widget
merges without a `sample_data.json` fixture** (so offline + e2e pass).

**Files.** `server.py` (registry + helper); `sample_data.json` (grows per
feature); a short note in `JARVIS.md`.

**Tests.** Existing `_cached` tests cover the mechanism; each feature adds its
own sample-path unit test.

### 0.4 Multiple dashboard pages/tabs — **M** (do once the board gets crowded)
**Problem.** One board can't hold crypto + sports + news + intel without
becoming a wall. Pages/tabs (“Markets”, “Sports”, “Intel”, “Personal”) solve it.

**Design.** `store.state.pages = [{id, name, layout}]` + `activePage`; migrate the
current single `layout` into one default page (backward-compatible migration in
`store.js`). Topbar gains a compact page-tab strip; the grid renders the active
page's layout; the widget gallery adds to the active page. Sync unchanged (pages
travel inside the synced state blob).

**Files.** `store.js` (shape + migration), `main.js` (page tabs + grid render),
CSS. Command palette gains "Switch to <page>".

**Tests.** Unit: migration wraps a legacy layout into `pages[0]`. e2e: create a
page, add a widget to it, switch pages, reload — layout persists per page.

**Risks.** Migration must be idempotent and never drop an existing layout.

---

## 1. Crypto suite (priority #1)

All on the **CoinGecko free API** (`api.coingecko.com/api/v3`, no key) already in
use, plus **alternative.me** Fear & Greed (no key). Free tier is rate-limited
(~10–30 calls/min), so **cache aggressively** (the existing `TTLCache` + longer
TTLs) and batch. Every endpoint gets a `sample_data.json` fixture.

### 1.1 Coin detail drawer (via §0.2) — **M**
**Problem.** The markets row shows price/24h/spark only. Users want the full
picture per coin.

**Design.** Clicking a market row (or a ⤢ on the widget) opens a detail window:
- Header: name, symbol, rank, logo, current price, 24h change.
- Stat grid: market cap, 24h volume, circulating/total/max supply, ATH/ATL with
  % from each and dates, 1h/24h/7d/30d/1y changes.
- **Range-selectable chart** (1D/7D/30D/90D/1Y) via `candleChart`/`lineChart`.

**Data.**
- `/coins/{id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
- `/coins/{id}/market_chart?vs_currency=usd&days={1|7|30|90|365}` → `prices`,
  `market_caps`, `total_volumes` arrays.
- `/coins/{id}/ohlc?vs_currency=usd&days={1|7|14|30|90|180|365}` → `[t,o,h,l,c]`.

**Files.** `server.py` (`live_coin_detail`, `live_coin_chart`, `sample_*`, routes
`/api/crypto/coin`, `/api/crypto/chart`); `widgets/markets.js` (detail renderer);
`chart.js`; `api.js`; CSS.

**Build steps.** (1) server detail+chart endpoints w/ cache + sample; (2) chart
helper candlestick path; (3) detail renderer wired to the ⤢/row click; (4)
range switcher re-fetches chart only (no full reload — mirrors the worldstate
flash fix).

**Tests.** Unit: coin-detail normalizer maps CoinGecko JSON → our shape; chart
downsampling. e2e: open detail (sample data), assert stat grid + a chart path,
switch range without a full re-render.

**Risks.** Rate limits → 30–60s TTLs on chart/detail; show "sample" badge on
fallback like every other widget.

### 1.2 Technical-analysis indicators — **M**
**Problem.** "More detailed analysis" — raw price isn't analysis.

**Design.** Compute indicators **server-side in pure Python** from OHLC closes
and expose them with the chart so the detail window can overlay them and show a
signal panel:
- **RSI(14)**, **SMA(20/50)**, **EMA(12/26)**, **MACD(12,26,9)** (line/signal/
  histogram), **Bollinger(20, 2σ)**, rolling **24h/7d high-low**.
- A compact "read": e.g. `RSI 72 — overbought`, `price above SMA50 (bullish)`,
  `MACD crossed up`. Deterministic, transparent, labeled *informational, not
  financial advice* (mirrors the worldstate disclaimer).

**Data.** Derived from §1.1's OHLC/market_chart — no new upstream.

**Files.** New `indicators.py` (pure functions, unit-tested against known
vectors); `server.py` (attach indicators to the chart response);
`widgets/markets.js` detail (overlay + signal panel).

**Build steps.** (1) `indicators.py` with each function + docstring math; (2)
unit tests vs hand-computed vectors; (3) attach to `/api/crypto/chart`; (4)
overlay MA/Bollinger on the candle chart; (5) signal panel.

**Tests.** Unit: RSI/SMA/EMA/MACD/Bollinger against fixed input arrays (exact
values). e2e: indicators panel renders in the detail window.

**Risks.** Indicator correctness — cover with exact-value unit tests. Never imply
advice.

### 1.3 Portfolio / holdings tracker — **M**
**Problem.** Turn the watchlist into a net-worth view.

**Design.** Per-coin holdings `{id, amount, costBasis?}` in **synced state**
(private, never server-persisted beyond the sync blob). Compute total value,
total P/L (if cost basis set), per-coin value, and an **allocation donut**.
Add/edit via a small form in the markets detail window. A "portfolio value"
number can also feed the At-a-Glance hero (§3.x / §5).

**Files.** `store.js` (`markets.holdings`), `widgets/markets.js` (holdings UI +
donut via `chart.js`), reuses `/api/crypto` prices.

**Tests.** Unit (JS via e2e): add a holding → total value reflects sample price;
persists to state. e2e: allocation donut renders.

**Risks.** Purely local math; no custody, no keys — safe. Label clearly it's a
manual tracker.

### 1.4 Global market bar + Fear & Greed — **S**
**Design.** A slim header inside the markets widget: total market cap, **BTC
dominance**, 24h volume, 24h market-cap change, and a **Fear & Greed gauge**.

**Data.** `/global`; `https://api.alternative.me/fng/?limit=1` (value 0–100 +
`value_classification`), no key.

**Files.** `server.py` (`live_global`, `sample_global`, route `/api/crypto/global`);
`widgets/markets.js`; small gauge in `chart.js`.

**Tests.** Unit: global normalizer; F&G parse. e2e: bar renders with a numeric
dominance %.

### 1.5 Trending + top movers — **S**
**Design.** A "Trending" strip (`/search/trending`) and biggest 24h gainers/
losers derived from the existing `/coins/markets` pull (sort by `change24h`).
One click adds a coin to the watchlist.

**Files.** `server.py` (`/api/crypto/trending`); `widgets/markets.js`.

**Tests.** Unit: trending normalizer. e2e: trending strip renders; click adds to
watchlist.

### 1.6 Smarter crypto alerts — **S**
**Design.** Extend the existing automations `market` trigger (currently ±% over
24h) with: **absolute price crossing** (`BTC > 100000`) and **RSI threshold**
(`ETH RSI < 30`). Reuses the automations engine, kill switch, and notifications.
Teach the local command parser + `create_automation` tool the new forms.

**Files.** `automations.py` (trigger eval), `assistant.py` (tool schema + local
parser), `widgets/markets.js` (quick "alert me" affordance in detail).

**Tests.** Unit: price-cross + RSI trigger fire/når-not on sample data. e2e: create
a price-cross alert via the agent, tick, assert a notification.

### 1.7 Converter — **S**
**Design.** A coin↔fiat↔coin calculator in the markets detail window using cached
prices. No new upstream.

---

## 2. Sports suite (priority #2)

Primary source: **ESPN's public JSON** (`site.api.espn.com`, no key) — broad
coverage, live scores, standings. It's undocumented, so wrap **defensively**
(timeouts, try/except per call, sample fallback). Optional enrichment:
**TheSportsDB** (`/api/v1/json/3/…`, free test key `3`) for logos/metadata.

### 2.1 Live scores widget (`widgets/scores.js`) — **M**
**Problem.** Sports is just an RSS topic today; no scores.

**Design.** A new widget with **per-league tabs** (NFL, NBA, MLB, NHL, EPL, and a
few configurable). Each tab lists today's games: teams, scores, status
(scheduled/in-progress with clock/quarter/finished), start time in local tz.
Auto-refreshes on a short interval while games are live.

**Data.** `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard`
- football/nfl, basketball/nba, baseball/mlb, hockey/nhl,
  soccer/eng.1 (EPL), soccer/usa.1 (MLS), soccer/uefa.champions, etc.
- Normalize `events[].competitions[0].competitors[]` → `{home, away, score,
  status, clock, startTime}`.

**Files.** `server.py` (`live_scores(league)`, `sample_scores`, `/api/scores`);
new `widgets/scores.js`; register in `main.js` WIDGETS + gallery;
`sample_data.json` fixture; CSS.

**Build steps.** (1) server scoreboard normalizer + sample; (2) widget with
league tabs (local re-render, no refetch on tab switch beyond first load —
mirror the news pattern); (3) live-status styling + short refresh while live.

**Tests.** Unit: ESPN scoreboard → normalized shape (from a saved fixture). e2e:
widget renders games from sample, tab switch works, live game shows a status
chip.

**Risks.** Unofficial API may change shape → defensive parsing + sample fallback;
never let one league's failure sink the widget (per-tab try/except).

### 2.2 Standings / league tables (via §0.2 detail) — **M**
**Design.** The scores widget's detail window shows the **full standings** for the
active league (W-L, pts, GD, form).

**Data.** `https://site.api.espn.com/apis/v2/sports/{sport}/{league}/standings`
(or the `standings` link inside the scoreboard payload).

**Files.** `server.py` (`/api/standings`), `widgets/scores.js` detail.

**Tests.** Unit: standings normalizer. e2e: standings table renders in detail.

### 2.3 Follow teams + fixtures → calendar — **M**
**Design.** Pick favorite teams (stored in synced state) → a "My Teams" tab with
their recent/next games and a **team-specific news feed** (Google News query
per team, §3.1). "Add to calendar" on a fixture writes a calendar event
(reuses the tasks/calendar store), so upcoming games show on the calendar and in
the At-a-Glance hero.

**Data.** ESPN team schedule
`/apis/site/v2/sports/{sport}/{league}/teams/{team}/schedule`; Google News RSS
for team news.

**Files.** `store.js` (`sports.teams`), `widgets/scores.js`, calendar overlay
already supports task/event dots.

**Tests.** e2e: follow a team, its games show; add a fixture to the calendar →
appears on the calendar widget.

---

## 3. News suite (priority #3)

### 3.1 Follow any query (Google News RSS) — **S→M**
**Problem.** Topics are curated feed lists; users want to follow *anything*.

**Design.** Let a custom topic be a **saved search**: the feed URL is
`https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en`, which
your existing `parse_feed` already handles (it's plain RSS). Extend the
sources/feeds UI so "Add topic" offers **"Follow a search…"** (stores the query,
builds the URL). Powers team news (§2.3) and any keyword ("Fed decision",
"$NVDA", a person).

**Files.** `server.py` `FeedConfig` (allow a `query` source type → URL builder),
`widgets/news.js` + `sources.js` (the "follow a search" form).

**Tests.** Unit: query → Google News RSS URL; parse a sample Google News feed.
e2e: create a search topic, its tab renders items.

**Risks.** Google News RSS is stable but rate-limited; cache per the existing
NEWS_TTL.

### 3.2 Richer reader (images, byline, reading time, related) — **M**
**Design.** Extend the reader extractor to also capture **`og:image`, byline
(`<meta name=author>` / rel=author), published time, and reading-time** (word
count ÷ 200). Show a hero image + meta header in the viewer. **Related stories**:
from the same topic, rank by keyword overlap with the article title (reuse the
worldstate `_keyword_hits` engine).

**Files.** `server.py` `_ArticleExtractor` (capture `<meta>`/`<img>`), `reader`
response shape; `viewer.js` (hero + meta + related list).

**Tests.** Unit: extractor pulls og:image/author/time from a sample HTML blob.
e2e: reader shows meta header; related list present.

**Risks.** Keep the SSRF guard on all reader fetches (already in place); images
are rendered by URL only (no proxying needed), `referrerpolicy=no-referrer`.

### 3.3 Topic detail window + cross-topic search — **S**
**Design.** ⤢ on the news widget opens a **large topic view**: more items,
grouped by source, with thumbnails. Extend the search box I added to optionally
**search across all topics** (a toggle) by querying each configured topic and
merging (server-side, cached).

**Files.** `widgets/news.js` detail; `server.py` optional `/api/news?all=1`
aggregation.

**Tests.** e2e: detail window lists more items; cross-topic search returns hits
from ≥2 topics.

### 3.4 Source controls + podcast player — **S each**
**Design.**
- **Source mute/pin** within a topic (stored in state); muted sources filtered
  client-side.
- **Podcast widget**: RSS `<enclosure type="audio/*">` → a small HTML5 `<audio>`
  player with episode list; subscribe by feed URL (reuses FeedConfig plumbing).

**Files.** `widgets/news.js` (mute/pin), new `widgets/podcasts.js`,
`server.py` (enclosure parsing in `parse_feed`).

**Tests.** Unit: enclosure parsed from a sample podcast feed. e2e: podcast widget
lists episodes; mute hides a source.

### 3.5 Gaming news + game data — **S (news) / M (data)** 
**Problem.** No gaming coverage today; you want it first-class.

**Design (news).** Add **gaming** as a default news topic — it's just a curated
RSS list in `NEWS_SOURCES`, so it inherits the whole news pipeline (tabs, search,
reader, summarize, save-for-later) for free. Proposed default feeds (all RSS):
IGN (`feeds.ign.com/ign/games-all`), Polygon (`polygon.com/rss/index.xml`),
Eurogamer (`eurogamer.net/feed`), PC Gamer (`pcgamer.com/rss/`), Kotaku
(`kotaku.com/rss`), Rock Paper Shotgun (`rockpapershotgun.com/feed`), GameSpot
(`gamespot.com/feeds/news/`).

**Design (game data — optional widget `widgets/gaming.js`).** A gaming panel with
free, no-key sources:
- **Free games this week** — Epic Games Store promotions
  (`store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US`),
  no key; shows current + upcoming free titles with end dates.
- **Deals / specials + new releases** — Steam store API (no key):
  `store.steampowered.com/api/featuredcategories/` (specials, new/top sellers)
  and `…/api/appdetails?appids={id}` for cover art, price, discount.
- Optional "release calendar": upcoming releases → add to the calendar (reuses
  the calendar/event store, like sports fixtures in §2.3).

**Files.** `server.py` (`NEWS_SOURCES["gaming"]`; `live_free_games`,
`live_steam_specials` + samples; routes `/api/gaming/free`, `/api/gaming/deals`);
optional new `widgets/gaming.js`; `sample_data.json` fixtures; register widget.

**Build steps.** (1) add the gaming topic (news-only ship, tiny); (2) Epic +
Steam normalizers with samples; (3) gaming widget (free-games strip + deals
grid); (4) optional release→calendar hand-off.

**Tests.** Unit: Epic/Steam JSON → normalized shape from saved fixtures;
gaming topic resolves feeds. e2e: gaming news tab renders; gaming widget shows
free-games + deals from sample data.

**Risks.** Steam/Epic payloads are large and occasionally reshape → defensive
parsing, cache 10–30 min, sample fallback. Steam `appdetails` is per-app and
rate-limited → batch/cache and only fetch on demand (detail window).

### 3.6 Tech news, deepened — **S** 
**Problem.** Tech exists as an RSS topic; power users want the ranked, discussion-
aware view.

**Design.** A tech panel (or an enrichment of the tech topic) using free no-key
developer sources:
- **Hacker News** official Firebase API (no key):
  `hacker-news.firebaseio.com/v0/topstories.json` + `…/item/{id}.json` → title,
  points, comment count, URL; rank by points, link to the discussion.
- **Lobsters** (`lobste.rs/hottest.json`, no key) as a second ranked feed.
- Optional **GitHub trending** (RSS mirror or the search API's public results) for
  "what repos are hot today."

**Files.** `server.py` (`live_hackernews`, `live_lobsters` + samples, routes
`/api/tech/hn`, `/api/tech/lobsters`); either fold into `widgets/news.js` as a
"ranked" view or a small `widgets/tech.js`.

**Tests.** Unit: HN/Lobsters normalizers from fixtures. e2e: ranked tech list
renders with points + comment counts.

**Risks.** HN API needs N item fetches for the top list → fetch top ~30 ids then
batch item calls with the existing thread pool + cache (mirrors `live_news`).

### 3.7 Socials hub (`widgets/socials.js`) — **M** 
**Problem.** You want socials in one place, no accounts/keys required.

**Design.** A unified **read-only** social feed with per-network tabs, each on a
free unauthenticated endpoint. The user configures which sources/handles to
follow (stored in synced state):
- **Reddit** — `reddit.com/r/{sub}/hot.json?limit=25` (send a User-Agent);
  multiple subreddits, merged + sorted.
- **Hacker News** — reuses §3.6 (`topstories` + `item`).
- **Lobsters** — `lobste.rs/hottest.json`.
- **Mastodon** — any instance's public timeline,
  `https://{instance}/api/v1/timelines/public?limit=20` (no auth for public);
  user adds instances they like.
- **Bluesky** — public unauthenticated reads via
  `public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor={handle}` (public
  posts, no login) for followed handles.

Each item normalizes to `{network, author, text, url, score?, comments?, time}`
and renders uniformly (network badge, author, snippet, engagement, "open"). Items
open in the in-app viewer. All fetches go through the SSRF-safe proxy pattern;
Mastodon/Bluesky handles/instances are validated (http(s), host allowlist-ish
sanity) before fetch.

**Files.** `server.py` (`live_reddit`, `live_mastodon`, `live_bluesky` + samples,
routes under `/api/social/*`); new `widgets/socials.js`; `store.js`
(`socials.sources`); `sources.js`-style config panel; `sample_data.json`;
register widget.

**Build steps.** (1) per-network normalizers + samples; (2) config (add subreddit
/ Mastodon instance / Bluesky handle); (3) merged, tabbed widget; (4) detail
window (§0.2) for a larger multi-column feed.

**Tests.** Unit: each network's JSON → normalized item (from fixtures); handle/
instance validation rejects junk. e2e: socials widget renders sample items across
≥2 networks; add-source flow works.

**Risks.** Reddit rate-limits anonymous JSON and requires a descriptive
User-Agent (we already set one) → cache 5–10 min, degrade to sample on 429.
Mastodon/Bluesky endpoints vary by instance → per-source try/except so one bad
instance never sinks the widget. Read-only only — no posting, no auth, no keys.

---

## 4. Markets beyond crypto — stocks / indices / forex

### 4.1 Equities + indices + FX widget (`widgets/stocks.js`) — **M**
**Problem.** "All-in-one" markets ≠ crypto-only.

**Design.** A watchlist of **stocks, indices and FX pairs** mirroring the crypto
widget: price, day change %, mini chart; detail window (via §0.2) with a
range-selectable history chart and the §1.2 indicators (they're
instrument-agnostic).

**Data.** **Stooq** (no key):
- Quote: `https://stooq.com/q/l/?s={symbol}&f=sd2t2ohlcv&h&e=csv`
- History: `https://stooq.com/q/d/l/?s={symbol}&i=d` (daily CSV) for charts.
- Symbols: `^spx` (S&P 500), `^ndq`, `^dji`, `aapl.us`, `msft.us`, `eurusd`,
  `gbpusd`, `btcusd` (crossover). Parse with the stdlib `csv` module.

**Files.** `server.py` (`live_stocks`, `live_stock_history`, samples, routes
`/api/stocks`, `/api/stocks/history`); new `widgets/stocks.js`; `chart.js`;
`indicators.py` (shared); `sample_data.json`; register widget.

**Build steps.** (1) Stooq CSV quote+history normalizers + sample; (2) widget
(clone crypto patterns); (3) detail window + shared indicators.

**Tests.** Unit: Stooq CSV → normalized quote/history; handles the "N/D" (no
data) rows Stooq returns off-hours. e2e: widget renders sample rows; detail chart.

**Risks.** Stooq rate-limits/occasionally returns `N/D` off-market — normalize
gracefully, cache 60s, sample fallback.

### 4.2 At-a-Glance "Command" hero (`widgets/glance.js`) — **M**
**Design.** One hero widget = your morning brief at a glance: next calendar
event, top open task (by priority/due from §2.4-tasks), current weather, the
biggest market mover (crypto+stocks), the top headline, and the world index.
Pulls from existing endpoints + state; no new upstream. A "compile briefing"
button hands off to the agent briefing.

**Files.** new `widgets/glance.js` (composes existing `ctx.api` calls + store).

**Tests.** e2e: hero shows a weather temp, a task, an event and a headline from
sample data.

---

## 5. Intel & utility widgets (the "everything" layer)

Each is a small widget on a free/no-key source with a sample fixture. These fit
the intelligence-agency aesthetic and round out "access to everything."

| Widget | Source (no key) | Notes | Effort |
|---|---|---|---|
| **World clock** | none (local `Intl`) | multi-timezone strip | S |
| **Currency converter** | `api.frankfurter.app/latest` (ECB) | live FX, no key | S |
| **Air quality + pollen** | Open-Meteo air-quality API | already used for AQI; add pollen/PM2.5 hourly | S |
| **Severe-weather alerts** | `api.weather.gov/alerts/active?point=` | US only, needs UA (we set one) | S |
| **Earthquakes** | USGS `…summary/2.5_day.geojson` | GeoJSON list + map dots | S |
| **Space weather** | NOAA SWPC `services.swpc.noaa.gov/products/…` | Kp index, aurora | S |
| **Flights overhead** | OpenSky `/api/states/all?bbox` | anonymous, rate-limited | M |
| **Socials hub** | Reddit/HN/Lobsters/Mastodon/Bluesky | see §3.7 — read-only, no keys | M |
| **Gaming** | Epic + Steam store APIs | see §3.5 — free games, deals, releases | M |
| **RSS reader (folders)** | existing FeedConfig | a full feed-reader mode w/ folders + unread | M |
| **Economic calendar** | *needs source research* | Fed/CPI/earnings dates; candidate: an ICS or scrape | M |
| **Countdown / events** | none (local) | pinned countdowns | S |

Each follows the same recipe: `live_*` + `sample_*` + route + widget + fixture +
unit test (normalizer) + e2e (renders sample). I'll spec any of these to full
depth on request; they're intentionally uniform.

---

## 6. Cross-cutting refinements

- **Per-widget settings** (refresh cadence, sources, default range) — a small
  gear per widget writing to `store.state.widgetPrefs[type]`; `ctx.every` reads
  the override. **S–M.**
- **Compact/density mode** — a global toggle tightening paddings/font-size for
  power users. **S.**
- **Richer automations** — alert types from §1.6 generalized (any numeric metric
  crossing), plus a digest action ("send me a markets+sports digest at 8am").
  **M.**
- **Web Push** (from `ROADMAP.md` 1.1) — still pending your stdlib-crypto vs.
  optional-dep decision. **M.**
- **Global search everywhere** — extend the ⌘-K palette to also search news,
  coins, teams (not just local data). **S–M.**
- **Print/share a briefing** — render the At-a-Glance + briefing to a clean
  printable view. **S.**

---

## 7. Recommended sequencing

1. **§0.1 chart helper + §0.2 detail framework + §0.3 registry** — the
   foundation the rest reuses. (Do these first; nothing else is efficient
   without them.)
2. **§1 Crypto suite** — detail drawer → indicators → global/F&G/trending →
   portfolio → smarter alerts. (Your #1.)
3. **§2 Sports** — live scores → standings → follow teams. (Your #2.)
4. **§3 News** — Google News queries → richer reader → topic detail, plus the
   **gaming** and **tech-ranked** topics (§3.5–3.6, small RSS/API adds) and the
   **Socials hub** (§3.7). (Your #3 + tech/gaming/socials.)
5. **§4 Stocks/FX + At-a-Glance hero**, then **§0.4 dashboard pages** to hold the
   now-large board.
6. **§5 intel/utility widgets** and **§6 refinements**, picked off as desired.

Every step is stdlib-only, no-key, offline-capable, and lands with unit + e2e
coverage before it's called done — same bar as everything shipped so far.

---

## Appendix — API quick reference (all no-key)

| Domain | Base | Endpoints |
|---|---|---|
| Crypto | `api.coingecko.com/api/v3` | `/coins/markets`, `/coins/{id}`, `/coins/{id}/market_chart`, `/coins/{id}/ohlc`, `/global`, `/search/trending` |
| Fear & Greed | `api.alternative.me` | `/fng/?limit=1` |
| Sports | `site.api.espn.com` | `/apis/site/v2/sports/{sport}/{league}/scoreboard`, `/apis/v2/sports/{sport}/{league}/standings`, `…/teams/{team}/schedule` |
| Sports meta | `thesportsdb.com` | `/api/v1/json/3/…` (test key 3) |
| News search | `news.google.com` | `/rss/search?q=…`, `/rss/headlines/section/topic/{TOPIC}` |
| Gaming (news) | RSS | IGN `feeds.ign.com/ign/games-all`, Polygon, Eurogamer, PC Gamer, Kotaku, RPS, GameSpot |
| Gaming (free) | `store-site-backend-static.ak.epicgames.com` | `/freeGamesPromotions?locale=en-US` |
| Gaming (deals) | `store.steampowered.com` | `/api/featuredcategories/`, `/api/appdetails?appids=` |
| Tech (ranked) | `hacker-news.firebaseio.com` | `/v0/topstories.json`, `/v0/item/{id}.json` |
| Tech (ranked) | `lobste.rs` | `/hottest.json` |
| Social | `reddit.com` | `/r/{sub}/hot.json?limit=…` (send User-Agent) |
| Social | Mastodon instance | `/api/v1/timelines/public?limit=…` (public, no auth) |
| Social | `public.api.bsky.app` | `/xrpc/app.bsky.feed.getAuthorFeed?actor={handle}` (public) |
| Stocks/FX | `stooq.com` | `/q/l/?s={sym}&f=sd2t2ohlcv&e=csv`, `/q/d/l/?s={sym}&i=d` |
| FX | `api.frankfurter.app` | `/latest?from=USD&to=EUR` |
| Weather alerts | `api.weather.gov` | `/alerts/active?point={lat},{lon}` (US) |
| Air/pollen | `air-quality-api.open-meteo.com` | `/v1/air-quality?…&hourly=pm2_5,…,birch_pollen,…` |
| Earthquakes | `earthquake.usgs.gov` | `/earthquakes/feed/v1.0/summary/2.5_day.geojson` |
| Space weather | `services.swpc.noaa.gov` | `/products/noaa-planetary-k-index.json` |
| Flights | `opensky-network.org` | `/api/states/all?lamin=&lomin=&lamax=&lomax=` |

*All are proxied through `server.py`, cached with per-endpoint TTLs, and backed
by a `sample_data.json` fixture so the dashboard stays fully usable offline.*
