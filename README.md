# 🏏 FLAME — IPL Fantasy League & Match Simulation Engine

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**FLAME (IPL Fantasy League Architect & Simulation Engine)** is a comprehensive, production-grade TATA IPL Fantasy simulator and strategy suite. Build your dream squad, draft through live auctions, manage your team on an authentic Dream11-style cricket pitch, schedule strategic transfers across 70 league matches, and simulate ball-by-ball T20 encounters with deep probabilistic match engines.

---

## 🌟 Key Features

### 📅 Season Schedule & Transfer Optimizer (70 Matches)
- **Interactive Matchday Browser:** Browse all 70 fixtures across 14 Matchdays with filters for any of the 10 IPL franchises (CSK, MI, RCB, KKR, SRH, RR, DC, PBKS, GT, LSG).
- **Squad Match Detection:** Instantly highlights which players from your active XI are in action for any given match.
- **Venue & Pitch Intelligence:** Surface breakdown for each fixture (Flat Tracks, Dry Turners, Green Seam, Balanced) to tailor team selections.
- **Franchise Fixture Matrix:** A visual cross-season grid showing multi-match runways, home (`vs`) and away (`@`) stretches for all 10 teams.
- **Transfer Minimization Engine:** Calculates your transfer burn rate against your 100-transfer seasonal budget. Includes 5-matchday coverage forecasts, pinpointing rounds where you can safely **HOLD (0 transfers used)** vs. when tactical swaps are needed.

### 🏟️ Dream11 Interactive Pitch Manager
- **Dynamic Cricket Pitch Board:** Visualize your XI in traditional 1-4-3-3 or custom T20 tactical formations across Wicketkeepers (WK), Batters (BAT), All-rounders (AR), and Bowlers (BOWL).
- **Captain (2x) & Vice-Captain (1.5x) Selectors:** Rapid toggles with instant multiplier feedback.
- **Live Role & Overseas Validation:** Enforces official tournament squad composition rules (e.g. 1-8 WK, 1-8 BAT, 1-8 AR, 1-8 BOWL, max 4 overseas players, min 3 franchises).
- **Player Chemistry & Role Badges:** Real-time feedback on your team's tactical balance.

### 🔄 IPL Auction & Draft System
- **Real-Time Bidding Engine:** Live competitive auction simulation against 9 franchise AI bots.
- **Budget Management:** 100 Crore purse tracking, RTM (Right to Match) cards, and squad slot constraints.
- **Preset Squad Quick-Start:** Jump straight in with realistic franchise squads or start with an open draft.

### ⚡ Deep Probabilistic Match Simulator
- **Ball-by-Ball & Over-by-Over Simulation:** Models player quality, role traits (Power Hitter, Death Specialist, Express Pacer, Mystery Spinner), venue pitch conditions, match phases (Powerplay, Middle, Death), and target chase pressure.
- **Authentic IPL Fantasy Scoring:**
  - **Batting:** Runs, boundaries (4s & 6s), milestone bonuses (30s, 50s, centuries), strike rate multipliers, and duck penalties.
  - **Bowling:** Wickets, maidens, economy rate modifiers, LBW/Bowled bonus, 3/4/5-wicket haul bonuses.
  - **Fielding:** Catches, stumpings, run-outs (direct & indirect), and multi-catch bonuses.
- **Detailed Ball-by-Ball Scorecards:** Full batting and bowling tables with fall of wickets, extras, and player of the match honors.

### 🚀 Official Booster Hub
- **Free Hit:** Make unlimited transfers for a single matchday without spending your season transfer quota.
- **Triple Captain (3x):** Boost your Captain to 3x points for a high-leverage round.
- **Power Bowler / Power Batter:** Boost all bowlers or batters on your roster.
- **Super Over / Double Matchday Enhancers:** Built-in booster cooldowns and activations.

### 📊 League Standings & Playoffs Architecture
- **Dynamic IPL Points Table:** Live Net Run Rate (NRR), Wins, Losses, Points, and Head-to-Head calculations.
- **IPL Playoff Structure:** Automated qualification into Qualifier 1, Eliminator, Qualifier 2, and the Grand Final.
- **Season Leaderboard:** Track your fantasy rank against rival franchise managers.
- **Multi-Year Season System & Trophy Cabinet:** When the championship final wraps up, celebrate with podium accolades (Orange Cap, Purple Cap, MVP), archive your legacy into the Trophy Cabinet, and advance the calendar to start a brand-new year (e.g. IPL 2027) with 100 fresh transfers, restored boosters, and a brand-new 11 player draft!

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Animation:** Motion (Framer Motion)
- **Bundler & Server:** Vite 6, Express, TSX
- **Cricket Simulation Engine:** Custom deterministic & stochastic T20 match engine with pitch condition biases and official IPL fantasy scoring matrices.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/flame-ipl-fantasy.git
   cd flame-ipl-fantasy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000` to start managing your franchise!

---

## 📋 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the full-stack development server with Vite middleware on port 3000 |
| `npm run build` | Builds the optimized production bundle with Vite |
| `npm run start` | Runs the production Express server |
| `npm run lint` | Type-checks code using the TypeScript compiler (`tsc --noEmit`) |
| `npm run clean` | Cleans previous build artifacts |

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── SchedulePlannerView.tsx   # 70-match schedule, franchise matrix & transfer planner
│   │   ├── Dream11PitchManager.tsx   # Visual cricket pitch XI selector & formation editor
│   │   ├── MatchCenter.tsx           # Matchday fixture manager & live simulation controls
│   │   ├── TransfersHub.tsx          # Transfer market, budget tracking & replacement hub
│   │   ├── StandingsView.tsx         # Points table with real-time NRR calculations
│   │   ├── PlayoffsView.tsx          # IPL Playoff bracket (Q1, Eliminator, Q2, Final)
│   │   ├── PlayerStatsView.tsx       # Tournament top run-scorers & wicket-takers (Orange/Purple cap)
│   │   ├── AuctionRoomModal.tsx      # Interactive live player auction modal
│   │   ├── BoosterHubModal.tsx       # Fantasy chip/booster activations (Triple Captain, Free Hit, etc.)
│   │   ├── SeasonEndModal.tsx        # Championship ceremony, season recap, Orange/Purple Caps & New Year launcher
│   │   ├── NewSeasonModal.tsx        # Advance year (e.g. IPL 2026 -> IPL 2027) & draft new team configuration
│   │   ├── SeasonArchiveModal.tsx    # Franchise Trophy Cabinet & past season archives
│   │   └── ...
│   ├── engine/
│   │   ├── simulator.ts              # Ball-by-ball T20 match simulation engine
│   │   ├── scoring.ts                # Official IPL fantasy scoring system
│   │   └── fixtures.ts               # Round-robin schedule generator & playoff advancement
│   ├── context/
│   │   └── GameContext.tsx           # Tournament state, transfers, fixtures, squads & simulation dispatchers
│   ├── data/
│   │   ├── players.ts                # Comprehensive IPL player database with ratings & skill archetypes
│   │   └── iplTeams.ts               # 10 Official IPL franchises with home venues and colors
│   ├── types/
│   │   └── fantasy.ts                # Complete TypeScript definitions for fantasy & cricket models
│   ├── App.tsx                       # Main application shell and tab routing
│   └── index.css                     # Tailwind CSS v4 entry point
├── server.ts                         # Express server with Vite middleware integration
├── package.json                      # Dependencies and scripts
└── tsconfig.json                     # TypeScript configuration
```

---

## 🎯 Fantasy Strategy Tips for FLAME

1. **The 3-Match Runway:** Before spending a transfer on any player, check the **Schedule & Planner** tab. Confirm that their franchise plays at least 2 games over the next 3 matchdays.
2. **Anchor Core:** Keep 5–6 elite players (e.g. Virat Kohli, Jasprit Bumrah, Heinrich Klaasen, Sunil Narine) as permanent anchors. Avoid churn transfers on top-tier staples.
3. **Exploit Pitch Reports:** Bring in specialist spinners for matches at Chepauk (MA Chidambaram) and power hitters for high-altitude venues like Bengaluru (Chinnaswamy).
4. **Preserve Boosters for Blanks & Doubles:** Save your **Free Hit** booster for matchdays where multiple core players are off, letting you reset your XI for free without consuming transfer credits.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
