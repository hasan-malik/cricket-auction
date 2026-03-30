# Cricket Auction — CLAUDE.md

PSL Season 11 auction simulator. Solo mode (user vs 5 AI franchises). Built for Hasan's Google internship portfolio.

**Live:** https://hasan-malik.github.io/cricket-auction/
**Repo:** hasan-malik/cricket-auction (GitHub Pages auto-deploys on push to `main`)

---

## Dev Commands

```bash
npm run dev          # Vite dev server → http://localhost:5173
node server/index.js # Gemini proxy → http://localhost:3001
npm run build        # Production build (outputs to dist/)
npm run lint         # ESLint
```

Backend needs a `.env` with `GEMINI_API_KEY`. Without it, the proxy gracefully falls back to rule-based AI — the game works fully offline.

---

## Git Workflow

- Push directly to `main` — GitHub Actions auto-deploys to Pages on every push
- Make **many small, logical commits** — split by file or sub-feature, never batch everything into one
- **Never** add `Co-Authored-By: Claude` to commits
- Run all git/curl commands yourself — never ask Hasan to run them
- GitHub token is in Claude's memory (not stored here)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 8, JSX (not TSX) |
| Styling | Tailwind CSS v4 (Vite plugin — no `tailwind.config.js`) |
| Animation | Framer Motion 12 |
| Routing | React Router v7 |
| Backend | Express 5 proxy (`server/index.js`) |
| AI | Gemini 1.5 Flash via proxy; fallback: rule-based (`aiUtils.js`) |
| Deployment | GitHub Pages via Actions |
| Planned | Firebase Firestore (Issue #12, multiplayer — not started) |

---

## Project Structure

```
src/
  App.jsx                      # Router, ThemeProvider, particle background
  pages/
    Home.jsx                   # Franchise picker, mode selector, team naming
    Auction.jsx                # Main game UI — bid controls, panels, modals
    Results.jsx                # Full-mode results (ranked by total rating)
    BlitzResults.jsx           # Blitz/Rapid/Bullet results (value score)
    Players.jsx                # Player browser with filters + watchlist
  hooks/
    useAuction.js              # Core game state — useReducer, timer, AI turns
    useWatchlist.js            # localStorage watchlist
  components/
    auction/
      PlayerCard.jsx           # Current player up for bid
      TeamPanel.jsx            # User squad: budget bar, clickable squad modal
      AIPanel.jsx              # 5 AI franchises, collapsible dropdown
      BidTimer.jsx             # Circular countdown (green→amber→red)
    players/
      FilterBar.jsx            # Search, category, role, nationality filters
      PlayerBrowserCard.jsx    # Player card with watchlist star
    layout/
      Navbar.jsx               # Nav + theme toggle
  contexts/
    ThemeContext.jsx           # Dark/light — persisted in localStorage (ca-theme)
  utils/
    aiUtils.js                 # Rule-based AI: getAIBid(), getDynamicIncrement(), scoring
  services/
    geminiService.js           # Proxy fetch to server/index.js (4s timeout, null on fail)
  data/
    players.json               # 279 PSL Season 11 players with Cricsheet stats
    franchises.json            # 6 PSL franchises: id, name, colors, logo emoji
    auctionConfig.json         # Full-mode rules: budget, squad size, bid tiers, timer
    blitzConfig.json           # Fast-mode rules: budgets, squad caps, player counts
server/
  index.js                     # Express proxy: POST /api/bid → Gemini or rule fallback
```

---

## Game Modes

| Mode | Players | Budget | Squad Cap | Timer | Win Condition |
|------|---------|--------|-----------|-------|---------------|
| Full Auction | 279 | 45 CR | 16–20 | 15s | Highest total rating |
| Bullet | 15 | 8 CR | 3 | 6s | Highest value score |
| Blitz | 30 | 15 CR | 6 | 8s | Highest value score |
| Rapid | 50 | 25 CR | 9 | 10s | Highest value score |

**Value Score formula** (Blitz/Rapid/Bullet):
`Score = Rating − max(0, (SoldPrice / BasePrice − 1) × 10)`
Buying at base price = full rating. Overpaying 2× base = −10 penalty.

---

## Auction Rules (Full Mode)

- **Budget:** 45 CR per franchise
- **Squad size:** 16–20 players, 5–7 overseas
- **Category order:** Platinum → Diamond → Gold → Silver → Emerging
- **Base prices:** Platinum 4.2 CR · Diamond 2.2 CR · Gold 1.1 CR · Silver/Emerging 0.6 CR
- **Bid increment tiers:**
  - Current bid < 1.1 CR → +0.025
  - Current bid < 2.2 CR → +0.050
  - Current bid < 4.2 CR → +0.100
  - Current bid ≥ 4.2 CR → +0.150
- **Timer:** 15s per bid; auto-advances to next player on expiry

---

## AI System

5 AI franchises, each with a personality that drives max-bid multipliers:

| Personality | Franchises | Max bid |
|-------------|-----------|---------|
| Aggressive | Islamabad United, Peshawar Zalmi | 2.5× base |
| Balanced | Lahore Qalandars, Quetta Gladiators | 1.8× base |
| Value | Karachi Kings, Multan Sultans | 1.3× base |

AI targets are pre-calculated at auction start based on player stats + role need. Mid-auction, AI also considers squad size urgency and remaining budget. Gemini LLM is optional — the game works fine on rule-based fallback.

---

## Data Models

**Player:**
```js
{ id, name, role, nationality, bowlingStyle, category, basePrice, rating,
  stats: { pslMatches, runs, battingAvg, strikeRate, highScore,
           wickets, economy, bowlingAvg } }
```
- `role`: `'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper'`
- `nationality`: `'Pakistani' | 'International'`
- `category`: `'platinum' | 'diamond' | 'gold' | 'silver' | 'emerging'`

**Franchise (franchises.json):**
```js
{ id, name, shortName, city, primaryColor, secondaryColor, logo }
```

**Auction state (useAuction reducer):**
```js
{ mode, blitzSize, config, phase, currentPlayer, queue, currentBid, bidder,
  timer, paused, user: { id, name, franchise, budget, squad[] },
  aiTeams: { [franchiseId]: { budget, squad, targets, personality } } }
```
- `phase`: `'bidding' | 'sold' | 'unsold' | 'done'`
- `bidder`: `'user' | franchiseId | null`

---

## Design System

- **Background:** `#0f1117` (dark), surface opacity 0.07, borders 0.12
- **Accent blue:** `#4f8ef7`
- **Glass cards:** `backdrop-blur` + low-opacity bg + subtle border
- **Animations:** Framer Motion throughout — all major state transitions are animated
- **Cursor:** Custom cricket bat SVG (`src/index.css`)
- **Particle layer:** 10 floating cricket emoji icons, low opacity drift (`cricket-float` class)
- **Perspective hover:** Applied to glass cards (CSS `perspective` + `rotateX/Y` on hover)
- **Theme:** Dark/light toggled via `ThemeContext`, stored in `localStorage` key `ca-theme`
- **Watchlist:** Stored in `localStorage` key `ca_watchlist` as JSON array of player IDs

---

## Key Non-Obvious Decisions

- Tailwind v4 uses `@import "tailwindcss"` in CSS — no config file, no `@tailwind` directives
- Vite base path is `/cricket-auction/` — all asset URLs must be relative or use `import.meta.env.BASE_URL`
- The Gemini proxy exists solely to keep the API key server-side; the game fully works without it
- `blitzConfig.json` drives Bullet/Blitz/Rapid — blitzSize (15/30/50) is the key that selects the sub-config. `timerSeconds` is a per-key object `{"15":6,"30":8,"50":10}`, not a flat value
- Players page is browsing-only — it doesn't interact with auction state
- `useAuction.js` is a single large reducer; don't split it without good reason

---

## Planned / Not Yet Started

- **Firebase Firestore** — Issue #12, multiplayer support
- **Gemini API key in production** — Issue #16, currently only works locally with `.env`
- **Custom franchise cursor** — franchise color drives cursor on Home page picker
