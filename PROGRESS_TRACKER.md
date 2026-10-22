# BP Tab Platform Development — Progress Tracker

This document tracks execution status across all architectural, algorithmic, and interface development phases. Update this file as each task is implemented, tested, and verified.

**Status Legend:**
- `[ ]` Not Started
- `[/]` In Progress
- `[x]` Completed & Verified
- `[-]` Blocked / Awaiting Input

---

## ⚠️ AGENT EXECUTION POLICY: ZERO-ASSUMPTION RULE
Autonomous coding agents reading this tracker MUST adhere to these operational constraints:
1. **Never make speculative assumptions.** If an endpoint contract, column constraint, UI behavior, or edge case is ambiguous, **stop execution immediately and ask the user directly for clarification**.
2. **Never guess defaults.** If an environment variable, package version, or tie-breaker resolution is missing or unspecified, halt and request explicit instruction.
3. **Strict phase boundaries.** Implement only the tasks listed within the active phase. Do not add speculative features or skip ahead.
4. **Mandatory verification.** Mark a task `[x]` only after running and passing the explicit verification checks outlined in the *Verification Notes*.

---

## Phase 1: Workspace & PostgreSQL Database Foundation
- [x] **Task 1.1:** Initialize monorepo directory layout (`backend/`, `frontend/`, root configuration, `.gitignore`).
- [x] **Task 1.2:** Configure Node.js backend workspace with `express`, `pg`, `cors`, `dotenv`, and developer tooling (`nodemon`).
- [x] **Task 1.3:** Bootstrap frontend workspace using Vite (`react`), Tailwind CSS, `lucide-react`, and `react-router-dom`.
- [x] **Task 1.4:** Write PostgreSQL relational schema (`schema.sql`) covering the 5 core tables (`teams`, `judges`, `rounds`, `matches`, `match_participants`) with strict composite unique constraints.
- [x] **Task 1.5:** Implement automated database truncation reset (`reset.js`) and realistic demo seed script (`seed.js`) generating 8 teams and 3 chair judges.

*Verification Notes:*
> All Phase 1 verification steps executed and passed:
> 1. `npm run db:migrate` -> Successfully executed `schema.sql` against Neon PostgreSQL; created tables `teams`, `judges`, `rounds`, `matches`, `match_participants` with composite unique constraints (`uq_round_judge`, `uq_match_bench`, `uq_match_team`, `uq_match_rank`).
> 2. `npm run db:seed` -> Successfully seeded 8 university teams and 3 chair judges.
> 3. Neon DB query output: `Teams: 8 Judges: 3` verified via inline Node pg query.
> 4. `npm run db:reset` -> Cleanly executed `TRUNCATE TABLE teams, judges, rounds, matches, match_participants RESTART IDENTITY CASCADE;` returning `Teams: 0 Judges: 0`.
> 5. `npm run db:seed` -> Re-seeded test data (`Teams: 8 Judges: 3`) ready for Phase 2.
> 6. `npm run build` (frontend) -> Vite production build compiled cleanly with 0 JSX/CSS errors (`dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`).

---

## Phase 2: Core Admin CRUD APIs & Swing Balancer
- [ ] **Task 2.1:** Implement Express application bootstrap with CORS headers, JSON body parsing, and centralized error-handling middleware.
- [ ] **Task 2.2:** Build complete RESTful CRUD endpoints for `Teams` (`/api/teams`) with dynamic calculations for rounds played.
- [ ] **Task 2.3:** Build complete RESTful CRUD endpoints for `Judges` (`/api/judges`) including 4-digit PIN assignment and active status toggles.
- [ ] **Task 2.4:** Implement Rule of 4 Swing Balancer (`POST /api/teams/swing`) computing $(4 - (N \pmod 4)) \pmod 4$ to inject dummy swing teams automatically.
- [ ] **Task 2.5:** Connect admin maintenance routes (`POST /api/admin/seed`, `POST /api/admin/reset`) to backend database utility scripts.

*Verification Notes:*
> All endpoints respond with appropriate HTTP status codes (200, 201, 400, 404). Testing swing balancer with 1, 5, 6, or 7 teams brings the total to a multiple of 4 ($N \pmod 4 === 0$) with `is_swing = true`. Unique team names and judge usernames are strictly validated at the controller level with clear error payloads.

---

## Phase 3: British Parliamentary Pairing Engine (Backend)
- [ ] **Task 3.1:** Implement pre-draw constraint validator in `pairingService.js` verifying $N > 0$, $N \pmod 4 === 0$, and available chair judges $\ge N / 4$.
- [ ] **Task 3.2:** Build Round 1 Random Draw engine using Fisher-Yates array shuffling and initial bench assignment (`OG`, `OO`, `CG`, `CO`).
- [ ] **Task 3.3:** Build Round 2+ Swiss Power-Pairing engine ordering teams by cumulative team points ($\text{primary}$) and cumulative speaker scores ($\text{secondary tie-breaker}$).
- [ ] **Task 3.4:** Implement bracket pull-up resolver and bench equity allocator to balance Government/Opposition and Opening/Closing appearances across rounds.
- [ ] **Task 3.5:** Encapsulate round, match, and participant creation inside an atomic PostgreSQL transaction (`BEGIN ... COMMIT`) exposed at `POST /api/rounds/generate`.

*Verification Notes:*
> Generating Round 1 cleanly assigns 8 teams across 2 rooms with 4 distinct benches and 1 chair judge per room. Attempting Round 2 generation before all Round 1 ballots are confirmed throws HTTP 400. Slicing ordered teams into rooms of 4 naturally pulls up the highest-speaking 2nd-place teams into Room 1 to compete against the two 1st-place teams. All database records persist atomically with zero partial draws on failure.

---

## Phase 4: Ballot Engine, LPW Validation & Dynamic Standings
- [ ] **Task 4.1:** Build `validationService.js` enforcing unique ranks $[1, 2, 3, 4]$, valid speaker score boundaries ($50\text{--}100$), and automatic point mapping ($1\text{st} \rightarrow 3, 2\text{nd} \rightarrow 2, 3\text{rd} \rightarrow 1, 4\text{th} \rightarrow 0$).
- [ ] **Task 4.2:** Implement strict server-side **Low-Point Win (LPW)** guardrail rejecting any ballot where $\text{Rank}_A < \text{Rank}_B$ but $\text{Speaks}_A \le \text{Speaks}_B$.
- [ ] **Task 4.3:** Build atomic ballot submission controller (`PUT /api/matches/:matchId/ballot`) updating participant scores and setting `matches.is_submitted = true`.
- [ ] **Task 4.4:** Write dynamic SQL query for team standings (`GET /api/standings/teams`) calculating points, speaker scores, rounds played, and bench history arrays without storing static totals on `teams`.
- [ ] **Task 4.5:** Write dynamic SQL query for individual speaker leaderboard (`GET /api/standings/speakers`) flattening Speaker 1 and Speaker 2 scores across submitted matches.

*Verification Notes:*
> Submitting an LPW ballot (e.g., Rank 1 has 140 speaks, Rank 2 has 150 speaks) returns HTTP 400 with an explicit rejection message. Valid ballots commit cleanly in a single transaction. Modifying a completed Round 1 ballot dynamically updates Round 1 standings, team points, and Round 2 Swiss brackets with zero data desynchronization or math drift.

---

## Phase 5: Frontend Shell & Public Tournament Hub
- [ ] **Task 5.1:** Set up Axios API client with base URL configuration and global error handling.
- [ ] **Task 5.2:** Build responsive `Navbar` and color-coded `BenchBadge` components (`OG` Blue, `OO` Red, `CG` Amber, `CO` Green).
- [ ] **Task 5.3:** Implement **Team Leaderboard Tab** displaying ranks, institutions, dynamic points, total speaks, and historical bench tags.
- [ ] **Task 5.4:** Implement **Speaker Tab** displaying individual debater ranks, average speaker scores, and raw totals.
- [ ] **Task 5.5:** Implement **Current Draw & Motion Archive Tabs** displaying room allocations, assigned judges, and live ballot status indicators (`Pending` vs `Confirmed`).

*Verification Notes:*
> Responsive view tested on mobile and desktop viewports. Public views load without authentication. Zero broken links or missing state errors on initial load with empty or populated databases. Dynamic data updates cleanly when new ballots are submitted on the backend.

---

## Phase 6: Adjudicator Portal & Interactive Digital Ballot
- [ ] **Task 6.1:** Build lightweight judge authentication endpoint (`POST /api/judge/login`) and frontend login view using `username` and 4-digit `PIN`.
- [ ] **Task 6.2:** Build `JudgePortal.jsx` fetching and scoping the active session strictly to the judge's currently assigned room.
- [ ] **Task 6.3:** Build interactive 4-bench `BallotForm.jsx` showing the debate motion, room name, team names, and speaker input fields.
- [ ] **Task 6.4:** Implement real-time client-side score calculator computing team speaker totals as numbers are typed.
- [ ] **Task 6.5:** Implement real-time client-side LPW detector displaying immediate visual warnings and disabling the submit button until all scoring constraints pass.

*Verification Notes:*
> Invalid credentials return an authentication error. Logged-in judge only sees their assigned room for the active round. Entering duplicate ranks or an LPW immediately flags the UI with high-contrast red warning banners and disables the submit button. Successful submission transitions UI to a confirmed result state with live update reflected in the database.

---

## Phase 7: Admin Dashboard, Round Progression & End-to-End Simulation
- [ ] **Task 7.1:** Build admin authentication shell (`/admin`) guarded by master credentials (`ADMIN_USER`, `ADMIN_PASS`).
- [ ] **Task 7.2:** Build **Team Manager** panel with registration forms, team tables, delete actions, Rule of 4 banner, and one-click `"Add Swing Teams"` button.
- [ ] **Task 7.3:** Build **Judge Manager** panel with adjudicator registration, PIN visibility toggle, and active/inactive toggles.
- [ ] **Task 7.4:** Build **Round & Draw Manager** panel with motion entry, pairing execution triggers, room matrix, and administrative ballot overrides.
- [ ] **Task 7.5:** Integrate `"Seed 8 Sample Teams"` and `"Reset Tournament Data"` quick-demo buttons.
- [ ] **Task 7.6:** Execute full automated tournament simulation test (Seed $\rightarrow$ Round 1 $\rightarrow$ Submit Ballots $\rightarrow$ Round 2 Swiss Pairing $\rightarrow$ Standings Verification).

*Verification Notes:*
> Complete tournament workflow executes end-to-end within 90 seconds during a live evaluation demo. Master password protects admin routes. Admins can override submitted scores and delete unstarted rounds. `npm run build` passes with 0 errors across frontend and backend workspaces.

---

## Post-Phase 7: Full Repo Audit & Single Source of Truth (SSOT) Consolidation
- [ ] **Task 8.1:** Full codebase audit eliminating hardcoded strings, magic numbers (e.g., score bounds `50`/`100`, team points `3/2/1/0`), and duplicate validation routines.
- [ ] **Task 8.2:** Backend SSOT consolidation (`backend/src/config/tabRules.js`) centralizing score boundaries, ranking points, bench definitions, and status enums.
- [ ] **Task 8.3:** Frontend SSOT consolidation (`frontend/src/config/tabRules.js`) ensuring identical mathematical definitions and bench color styling palettes match backend logic.
- [ ] **Task 8.4:** Documentation & evaluation deliverables: comprehensive `README.md`, API endpoint documentation, and step-by-step viva presentation script.

*Verification Notes:*
> Zero duplicated scoring logic across repositories. All ranking constants, bench positions, and validation rules reference the centralized SSOT modules. Clean production builds and clear documentation ready for academic evaluation.
