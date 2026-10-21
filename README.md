# British Parliamentary (BP) Debate Tabulation System

## 1. Project Overview & Agent Directives
This repository contains a full-stack **British Parliamentary (BP) Debate Tabulation System** built with the **PERN Stack** (PostgreSQL, Express.js, React, Node.js). 

### Core Architectural Constraints for AI Agents
1. **Single-Tournament Scope:** This system manages a **single active tournament**. Do **NOT** implement multi-tenancy, a `tournaments` table, or `tournament_id` foreign keys.
2. **Single Source of Truth for Standings:** Do **NOT** store static `total_points` or `total_speaker_scores` columns on the `teams` table. All team standings, speaker leaderboards, and Swiss pairing brackets must be dynamically calculated via SQL aggregations (`SUM`, `COUNT`, `GROUP BY`) from completed rows in `match_participants`.
3. **Rule of 4 Enforcement:** Every British Parliamentary match requires strictly **4 teams** assigned to the 4 benches:
   - `OG` (Opening Government)
   - `OO` (Opening Opposition)
   - `CG` (Closing Government)
   - `CO` (Closing Opposition)
4. **Demo Readiness:** Include a one-click **"Seed Sample Tournament (8 Teams, 3 Judges)"** action and a **"Reset Tournament Data"** action in the Admin Dashboard to allow rapid demonstration and grading.

---

## 2. Tech Stack & Tooling
- **Frontend:** React (Vite), Tailwind CSS, React Router v6, Lucide React (icons), Axios / Fetch API.
- **Backend:** Node.js, Express.js, CORS, Dotenv.
- **Database:** PostgreSQL (interfaced via Prisma ORM or `pg` connection pool with transactional support).
- **Authentication:** Lightweight session/JWT or simple credential verification:
  - **Public / Debaters:** Unauthenticated read-only access (`/`).
  - **Judges:** Login via `username` and 4-digit `pin` (`/judge`).
  - **Admin:** Single master login configured via environment variables (`ADMIN_USER`, `ADMIN_PASS`) (`/admin`).

---

## 3. Monorepo Directory Structure
Agents must maintain the following workspace layout:

```text
bp-tab-system/
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                # Express app entry point
│       ├── db/                     # PostgreSQL connection / Prisma client & seed logic
│       ├── routes/                 # REST API route definitions
│       ├── controllers/            # Request handlers for CRUD & Tabulation
│       └── services/
│           └── pairingService.js   # Round 1 Random & Round 2+ Swiss Power-Pairing logic
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/                    # API client wrapper
        ├── components/             # Shared UI components (Navbar, Badges, Modals)
        └── pages/
            ├── PublicHub.jsx       # Standings, Speaker Tab, Current Draw, Motions
            ├── JudgePortal.jsx     # Judge PIN Login & E-Ballot Form with validation
            └── AdminDashboard.jsx  # CRUD for Teams/Judges/Rounds, Draw Generator, Demo Reset
```

---

## 4. Relational Database Schema (PostgreSQL)

The database consists of **5 core relational tables**.

### 4.1 `teams`
Stores registered debate teams and their two speakers.
- `team_id` (SERIAL PRIMARY KEY)
- `team_name` (VARCHAR, UNIQUE, NOT NULL)
- `institution` (VARCHAR, NOT NULL)
- `speaker_1_name` (VARCHAR, NOT NULL)
- `speaker_2_name` (VARCHAR, NOT NULL)
- `is_swing` (BOOLEAN, DEFAULT `false`) — Marks dummy/swing teams used to pad team counts to a multiple of 4.
- `created_at` (TIMESTAMP, DEFAULT `NOW()`)

### 4.2 `judges`
Stores adjudicators who chair rooms and submit ballots.
- `judge_id` (SERIAL PRIMARY KEY)
- `judge_name` (VARCHAR, NOT NULL)
- `institution` (VARCHAR, NOT NULL)
- `username` (VARCHAR, UNIQUE, NOT NULL)
- `pin` (VARCHAR(10), NOT NULL) — Simple PIN/password for Judge Portal login.
- `is_active` (BOOLEAN, DEFAULT `true`)

### 4.3 `rounds`
Tracks tournament rounds and motions.
- `round_id` (SERIAL PRIMARY KEY)
- `round_number` (INTEGER, UNIQUE, NOT NULL) — Sequential (`1, 2, 3...`).
- `motion_text` (TEXT, NOT NULL)
- `info_slide` (TEXT, NULLABLE)
- `status` (VARCHAR, NOT NULL, DEFAULT `'Draft'`) — Allowed values: `'Draft'`, `'Published'`, `'Completed'`.

### 4.4 `matches` (Rooms)
Represents an individual debate room within a round.
- `match_id` (SERIAL PRIMARY KEY)
- `round_id` (INTEGER, FOREIGN KEY -> `rounds.round_id` ON DELETE CASCADE)
- `room_name` (VARCHAR, NOT NULL) — e.g., `"Room 101"`, `"Main Hall"`.
- `judge_id` (INTEGER, FOREIGN KEY -> `judges.judge_id` ON DELETE SET NULL)
- `is_submitted` (BOOLEAN, DEFAULT `false`) — `true` once the judge submits the ballot.
- **Constraint:** `UNIQUE (round_id, judge_id)` — A judge cannot chair two rooms in the same round.

### 4.5 `match_participants` (Junction & Scoring Table)
Links 4 teams to each match and stores their bench position, final rank, points, and speaker scores.
- `participant_id` (SERIAL PRIMARY KEY)
- `match_id` (INTEGER, FOREIGN KEY -> `matches.match_id` ON DELETE CASCADE)
- `team_id` (INTEGER, FOREIGN KEY -> `teams.team_id` ON DELETE CASCADE)
- `bench_position` (VARCHAR(2), NOT NULL) — Must be `'OG'`, `'OO'`, `'CG'`, or `'CO'`.
- `rank` (INTEGER, NULLABLE) — `1`, `2`, `3`, or `4` (NULL until ballot is submitted).
- `points` (INTEGER, NULLABLE) — `3` (for 1st), `2` (for 2nd), `1` (for 3rd), `0` (for 4th).
- `speaker_1_score` (INTEGER, NULLABLE) — Range `50` to `100` (standard BP scale `65–85`).
- `speaker_2_score` (INTEGER, NULLABLE) — Range `50` to `100` (standard BP scale `65–85`).
- **Constraints:**
  - `UNIQUE (match_id, bench_position)` — Exactly one team per bench in a room.
  - `UNIQUE (match_id, team_id)` — A team cannot appear twice in the same match.
  - `UNIQUE (match_id, rank)` — No ties allowed in a BP room (ranks 1, 2, 3, 4 must be unique per match once submitted).

---

## 5. Core Business Logic & Algorithms

### 5.1 Pre-Draw Validation & Swing Team Auto-Balancer
Before generating a draw for any round:
1. Count all rows in `teams` ($N$).
2. Check if $N > 0$ and $N \pmod 4 === 0$.
3. If $N \pmod 4 \neq 0$, block draw generation and return the exact number of needed teams ($4 - (N \pmod 4)$). Provide an Admin endpoint (`POST /api/teams/swing`) that automatically creates the required number of Swing Teams (`Swing Team A`, `Swing Team B`, etc. with `is_swing = true`) so the draw can proceed.
4. Check that the count of active judges (`is_active = true`) is at least $N / 4$.

### 5.2 Round 1 Pairing (Random Draw)
1. Fetch all registered teams.
2. Randomly shuffle the teams array (Fisher-Yates shuffle).
3. Slice into chunks of 4 teams per room.
4. Assign benches (`OG`, `OO`, `CG`, `CO`) in order within each chunk and assign one active judge per room.
5. Insert `rounds`, `matches`, and `match_participants` inside a single PostgreSQL transaction.

### 5.3 Round 2+ Pairing (Swiss Power-Pairing)
1. **Prerequisite Check:** Verify that all matches in the previous round (`round_number - 1`) have `is_submitted = true`. If any ballot is pending, block draw generation.
2. **Standings Aggregation:** Query all teams ordered by:
   - **Primary Sort:** `COALESCE(SUM(mp.points), 0) DESC` (Cumulative Team Points)
   - **Secondary Sort (Tie-Breaker):** `COALESCE(SUM(mp.speaker_1_score + mp.speaker_2_score), 0) DESC` (Cumulative Speaker Scores)
3. **Bracket Slicing & Pull-Ups:** Slice the sorted list into groups of 4 from top to bottom.
   - In brackets with an exact multiple of 4 teams at the same point level, teams face others with identical points (e.g., all Round 1 `2nd place` teams with `2 points` meet each other).
   - If a point bracket does not have a multiple of 4, slicing the sorted list naturally "pulls up" the highest-speaking team(s) from the adjacent lower bracket to complete the room of 4.
4. **Bench Allocation (Bench Equity):** Within each group of 4 teams, assign `OG`, `OO`, `CG`, and `CO`. Prefer assigning teams to bench positions they have sat in the fewest times in previous rounds (or shuffle randomly if equal).

### 5.4 E-Ballot Validation Rules (No Low-Point Wins)
When a Judge (or Admin) submits a ballot for a match (`PUT /api/matches/:matchId/ballot`):
1. **Rank Uniqueness:** The 4 teams must be assigned distinct ranks `[1, 2, 3, 4]`.
2. **Automatic Points Mapping:**
   - `rank = 1` $\rightarrow$ `points = 3`
   - `rank = 2` $\rightarrow$ `points = 2`
   - `rank = 3` $\rightarrow$ `points = 1`
   - `rank = 4` $\rightarrow$ `points = 0`
3. **Speaker Score Bounds:** Every speaker score must be an integer between `50` and `100`.
4. **No Low-Point Win Guardrail:** Define each team's room total as `team_speak_total = speaker_1_score + speaker_2_score`.
   - For any two teams in the same room, if `Team A` has a better (lower number) `rank` than `Team B` (e.g., Rank 1 vs Rank 2), then `Team A`'s `team_speak_total` **MUST be strictly greater than** (`>`) `Team B`'s `team_speak_total` (i.e., `Rank 1 Total > Rank 2 Total > Rank 3 Total > Rank 4 Total`).
   - Reject the ballot both on the frontend UI and backend controller if this rule is violated.

---

## 6. REST API Endpoints & CRUD Matrix

### Teams CRUD
- `GET /api/teams` — List all teams with dynamically aggregated `total_points`, `total_speaks`, `matches_played`, and `bench_history`.
- `POST /api/teams` — Register a new team (`team_name`, `institution`, `speaker_1_name`, `speaker_2_name`).
- `POST /api/teams/swing` — Auto-generate missing Swing Teams so total teams $\pmod 4 === 0$.
- `PUT /api/teams/:id` — Update team details or speaker names.
- `DELETE /api/teams/:id` — Delete a team (allowed before Round 1 is generated, or cascades cleanly).

### Judges CRUD
- `GET /api/judges` — List all judges and their active status.
- `POST /api/judges` — Create a judge (`judge_name`, `institution`, `username`, `pin`).
- `PUT /api/judges/:id` — Update judge details, PIN, or `is_active` toggle.
- `DELETE /api/judges/:id` — Remove a judge.

### Rounds & Draw Generation CRUD
- `GET /api/rounds` — Fetch all rounds, their motions, completion status, and nested matches/rooms with participant details.
- `POST /api/rounds/generate` — Create a new round (`round_number`, `motion_text`, `info_slide`) and automatically run the Round 1 (Random) or Round 2+ (Swiss Power-Pairing) algorithm to populate `matches` and `match_participants`.
- `PATCH /api/rounds/:id` — Update a round's `motion_text`, `info_slide`, or `status` (`Draft` / `Published` / `Completed`).
- `DELETE /api/rounds/:id` — Delete a round and cascade-delete its matches and results (used to re-draw an unstarted round).

### Matches & E-Ballots
- `POST /api/judge/login` — Authenticate a judge via `username` and `pin`; return judge profile and their currently assigned match for the active round.
- `PUT /api/matches/:matchId/judge` — Admin endpoint to reassign a judge or rename a room.
- `PUT /api/matches/:matchId/ballot` — Submit or update the 4 teams' ranks and speaker scores inside an ACID transaction; sets `matches.is_submitted = true`.

### Standings & Demo Utilities
- `GET /api/standings/teams` — Public team leaderboard sorted by `total_points DESC`, `total_speaks DESC`, `first_places DESC`.
- `GET /api/standings/speakers` — Individual speaker leaderboard flattening `speaker_1` and `speaker_2` scores across all submitted matches, sorted by `total_speaker_score DESC`.
- `POST /api/admin/seed` — Clears existing data and populates 8 realistic university debate teams and 3 judges for instant testing.
- `POST /api/admin/reset` — Truncates all tables (`RESTART IDENTITY CASCADE`) to reset the tournament cleanly.

---

## 7. Frontend User Interfaces

### 7.1 Public Hub (`/`) — Team Members & Spectators
No login required. Includes 4 clean navigation tabs:
1. **Live Team Leaderboard:** Displays Rank, Team Name, Institution, Rounds Played, Bench History badges (`OG`, `OO`, `CG`, `CO`), Cumulative Points, and Cumulative Speaker Marks.
2. **Individual Speaker Tab:** Ranks all individual debaters by total and average speaker points.
3. **Current Draw & Rooms:** Shows the active round's motion, info slide, room allocations (`OG`, `OO`, `CG`, `CO`), assigned Chair Judge, and ballot status badge (`In Progress` vs `Result Confirmed`).
4. **Match Results History:** Expandable cards showing completed round results, ranks (`1st–4th`), and individual speaker breakdowns.

### 7.2 Judge Portal (`/judge`) — Adjudicators
1. **Login View:** Simple card accepting `Username` and `PIN`.
2. **Assigned Room E-Ballot:**
   - Displays Round Number, Room Name, Motion Text, and the 4 assigned teams in their respective benches (`OG`, `OO`, `CG`, `CO`).
   - Provides inputs for each speaker's score (`50–100`) and a Rank selector (`1st`, `2nd`, `3rd`, `4th`) per team.
   - Live client-side calculator displays each team's combined speaker points and highlights any **Low-Point Win** or **Duplicate Rank** errors before allowing submission.

### 7.3 Tab Director Dashboard (`/admin`) — Tournament Admin
Protected by simple Admin login. Includes:
1. **Quick Demo Toolbar:** `"Seed 8 Sample Teams & Judges"` button and `"Reset Entire Tournament"` button.
2. **Teams Manager (CRUD):** Form to add teams, table to edit/delete teams, and a live banner showing whether `Team Count % 4 === 0` with an `"Add Swing Team(s)"` one-click fix button.
3. **Judges Manager (CRUD):** Add/edit/remove judges and view their login PINs.
4. **Round & Draw Generator (CRUD):** Input motion text and click `"Generate Round Draw"`. Allows toggling round visibility (`Draft` $\rightarrow$ `Published`), editing submitted ballots (Admin Override), or deleting a round.

---

## 8. Step-by-Step Implementation Plan for Antigravity Agents

When executing this project in Google Antigravity, follow these sequential milestones:

- **Phase 1 — Database & Backend Scaffolding:**
  Initialize `backend/`, configure PostgreSQL schema/migrations for the 5 tables, and verify constraints (`UNIQUE` bench and rank constraints).
- **Phase 2 — Core CRUD & Seed Endpoints:**
  Implement Teams CRUD, Judges CRUD, Swing Team generator, and the `/api/admin/seed` and `/api/admin/reset` endpoints.
- **Phase 3 — Pairing Engine & Ballot Transaction Logic:**
  Implement `pairingService.js` (Round 1 Random + Round 2+ Swiss Power-Pairing), ballot submission with Low-Point Win validation, and SQL aggregation queries for Team & Speaker standings.
- **Phase 4 — React Frontend & Role Views:**
  Initialize `frontend/` with Vite + Tailwind CSS. Build the Public Hub (`/`), Judge Portal (`/judge`), and Admin Dashboard (`/admin`) connected to the Express API.
- **Phase 5 — End-to-End Verification:**
  Seed 8 sample teams, generate Round 1, submit both room ballots via the Judge Portal, generate Round 2, and verify that the two `1st place` and highest `2nd place` teams are power-paired into the top room.