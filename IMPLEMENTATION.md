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
- [x] **Task 2.1:** Implement Express application bootstrap with CORS headers, JSON body parsing, and centralized error-handling middleware.
- [x] **Task 2.2:** Build complete RESTful CRUD endpoints for `Teams` (`/api/teams`) with dynamic calculations for rounds played.
- [x] **Task 2.3:** Build complete RESTful CRUD endpoints for `Judges` (`/api/judges`) including 4-digit PIN assignment and active status toggles.
- [x] **Task 2.4:** Implement Rule of 4 Swing Balancer (`POST /api/teams/swing`) computing $(4 - (N \pmod 4)) \pmod 4$ to inject dummy swing teams automatically.
- [x] **Task 2.5:** Connect admin maintenance routes (`POST /api/admin/seed`, `POST /api/admin/reset`) to backend database utility scripts.

*Verification Notes:*
> All Phase 2 verification steps executed and passed:
> 1. Express bootstrap verified on port 5000 with CORS and centralized error handling (`{ error: err.message }`).
> 2. Admin maintenance endpoints verified:
>    - `POST /api/admin/reset` -> `{"message":"Database reset completed successfully. All 5 tables truncated."}`
>    - `POST /api/admin/seed` -> `{"message":"Database seeded successfully","teams":8,"judges":3}`
> 3. Team creation verified:
>    - `POST /api/teams` -> `{"team_id":9,"team_name":"Peradeniya A","institution":"University of Peradeniya","speaker_1_name":"Sahan","speaker_2_name":"Kavindu","is_swing":false}` (HTTP 201)
> 4. Swing Balancer verified:
>    - `POST /api/teams/swing` (with 9 teams) -> injected 3 swing teams (`Swing Team A`, `Swing Team B`, `Swing Team C`) with `is_swing = true`, bringing count to 12 (divisible by 4).
>    - `POST /api/teams/swing` (with 12 teams) -> `{"message":"Team count is already divisible by 4","added":0}` (HTTP 200).
> 5. Judges CRUD and active toggle verified:
>    - `POST /api/judges` -> `{"judge_id":4,"judge_name":"Dinesh Kumar","institution":"Faculty of Law","username":"dinesh_k","pin":"4321","is_active":true}` (HTTP 201)
>    - `GET /api/judges` -> lists all judges with active status.
>    - `PUT /api/judges/4` -> successfully toggles `is_active: false` and `is_active: true` (HTTP 200).
> 6. Validation and error handling verified:
>    - Duplicate team name returns HTTP 400: `{"error":"Team name already exists"}`
>    - Duplicate judge username returns HTTP 400: `{"error":"Judge username already exists"}`
>    - Incomplete request payloads return HTTP 400 with clean descriptive messages.
>    - Non-existent IDs on PUT/DELETE return clean HTTP 404.

---

## Phase 3: British Parliamentary Pairing Engine (Backend)
- [x] **Task 3.1:** Implement pre-draw constraint validator in `pairingService.js` verifying $N > 0$, $N \pmod 4 === 0$, and available chair judges $\ge N / 4$.
- [x] **Task 3.2:** Build Round 1 Random Draw engine using Fisher-Yates array shuffling and initial bench assignment (`OG`, `OO`, `CG`, `CO`).
- [x] **Task 3.3:** Build Round 2+ Swiss Power-Pairing engine ordering teams by cumulative team points ($\text{primary}$) and cumulative speaker scores ($\text{secondary tie-breaker}$).
- [x] **Task 3.4:** Implement bracket pull-up resolver and bench equity allocator to balance Government/Opposition and Opening/Closing appearances across rounds.
- [x] **Task 3.5:** Encapsulate round, match, and participant creation inside an atomic PostgreSQL transaction (`BEGIN ... COMMIT`) exposed at `POST /api/rounds/generate`.

*Verification Notes:*
> All Phase 3 verification steps executed and passed:
> 1. Pre-draw validator (`pairingService.validatePreDraw`) enforces team count divisibility by 4, judge availability ($J \ge N / 4$), and sequential round completion.
> 2. Round 1 draw (`POST /api/rounds/generate`) cleanly generated 2 rooms with 4 distinct benches (`OG`, `OO`, `CG`, `CO`) across 8 seeded teams and assigned unique active chair judges.
> 3. Database verification confirmed 2 matches in `matches` and exactly 8 participants in `match_participants` (2 OG, 2 OO, 2 CG, 2 CO).
> 4. Uncompleted round check verified: attempting to generate Round 2 while Round 1 ballots were unsubmitted returned HTTP 400 with `{"error":"Cannot generate round: Previous round has pending ballots"}`.
> 5. Swiss Power-Pairing & Bench Equity verified: with Round 1 submitted, Round 2 correctly grouped top-point teams into Room 1 (pulling up top second-place teams) and lower-point teams into Room 2, assigning benches to eliminate duplicate bench positions.
> 6. Cascade deletion verified: `DELETE /api/rounds/2` cleanly removed the round along with its cascading matches and participants.
> 7. `GET /api/rounds` returns full nested round data including room matches, judges, and teams.

---

## Phase 4: Ballot Engine, LPW Validation & Dynamic Standings
- [x] **Task 4.1:** Build `validationService.js` enforcing unique ranks $[1, 2, 3, 4]$, valid speaker score boundaries ($50\text{--}100$), and automatic point mapping ($1\text{st} \rightarrow 3, 2\text{nd} \rightarrow 2, 3\text{rd} \rightarrow 1, 4\text{th} \rightarrow 0$).
- [x] **Task 4.2:** Implement strict server-side **Low-Point Win (LPW)** guardrail rejecting any ballot where $\text{Rank}_A < \text{Rank}_B$ but $\text{Speaks}_A \le \text{Speaks}_B$.
- [x] **Task 4.3:** Build atomic ballot submission controller (`PUT /api/matches/:matchId/ballot`) updating participant scores and setting `matches.is_submitted = true`.
- [x] **Task 4.4:** Write dynamic SQL query for team standings (`GET /api/standings/teams`) calculating points, speaker scores, rounds played, and bench history arrays without storing static totals on `teams`.
- [x] **Task 4.5:** Write dynamic SQL query for individual speaker leaderboard (`GET /api/standings/speakers`) flattening Speaker 1 and Speaker 2 scores across submitted matches.

*Verification Notes:*
> All Phase 4 verification steps executed and passed:
> 1. Ballot validation service (`validationService.js`) enforces strictly unique rank permutations `[1, 2, 3, 4]`, validates speaker score boundaries (`50–100`), maps ranks to points ($1\text{st}\rightarrow 3, 2\text{nd}\rightarrow 2, 3\text{rd}\rightarrow 1, 4\text{th}\rightarrow 0$), and validates team participant presence.
> 2. Strict LPW guardrail verified: Submitting a ballot where Rank 1 scored 140 speaks and Rank 2 scored 150 speaks returned HTTP 400 with `{"error":"Low-Point Win Error: Team ranked 1 has lower or equal speaker points than team ranked 2."}`. Tied speaker points also correctly trigger rejection.
> 3. Atomic ballot submission (`PUT /api/matches/:matchId/ballot`) executed within an ACID PostgreSQL transaction (`BEGIN ... COMMIT`). Verified participants, cleared ranks transiently to prevent unique constraint (`uq_match_rank`) collisions, updated points and scores, and set `matches.is_submitted = true` returning HTTP 200 with `{"message":"Ballot submitted successfully","match_id":1}`.
> 4. Dynamic team standings (`GET /api/standings/teams`) verified: Returns live computed `total_points`, `total_speaks`, `rounds_played`, and `bench_history` array ordered strictly by `total_points DESC, total_speaks DESC, team_name ASC`. Unsubmitted teams correctly show 0 points and empty bench arrays (`[]`) with zero reliance on static total columns on `teams`.
> 5. Dynamic speaker standings (`GET /api/standings/speakers`) verified: Flattens `speaker_1` and `speaker_2` scores across submitted matches, computing `rounds_spoken`, `total_speaker_score`, and `average_score` (rounded to 2 decimal places), ordered strictly by `total_speaker_score DESC, average_score DESC, speaker_name ASC`.
> 6. Swiss Power-Pairing integration verified: Generating Round 2 while Round 1 had pending ballots was blocked with HTTP 400 (`"Cannot generate round: Previous round has pending ballots"`). Once both Match 1 and Match 2 ballots were submitted, Round 2 generated cleanly, grouping top teams into Room 1 with pull-ups and allocating benches according to bench equity.
> 7. Dynamic ballot update verified: Modifying a completed Round 1 ballot dynamically updated team standings and speaker leaderboards instantaneously with zero math drift.

---

## Phase 5: Frontend Shell & Public Tournament Hub
- [x] **Task 5.1:** Set up Axios API client with base URL configuration and global error handling.
- [x] **Task 5.2:** Build responsive `Navbar` and color-coded `BenchBadge` components (`OG` Blue, `OO` Red, `CG` Amber, `CO` Green).
- [x] **Task 5.3:** Implement **Team Leaderboard Tab** displaying ranks, institutions, dynamic points, total speaks, and historical bench tags.
- [x] **Task 5.4:** Implement **Speaker Tab** displaying individual debater ranks, average speaker scores, and raw totals.
- [x] **Task 5.5:** Implement **Current Draw & Motion Archive Tabs** displaying room allocations, assigned judges, and live ballot status indicators (`Pending` vs `Confirmed`).

*Verification Notes:*
> All Phase 5 verification steps executed and passed:
> 1. API client (`frontend/src/api/client.js`) configured with Axios instance targeting `http://localhost:5000/api` (via `VITE_API_BASE_URL`), global error interceptors, and typed endpoint methods.
> 2. Classical Roman layout and navigation shell (`Layout.jsx`, `Navbar.jsx`) implemented with Corinthian border styling, grand serif headers (`Cormorant Garamond`), Roman numeral / label typography (`Cinzel`), and distinct classical crest buttons for Judge Portal and Senate Admin.
> 3. Responsive `BenchBadge` component (`BenchBadge.jsx`) created implementing the exact Renaissance color mapping from `design_philosophy.md`: OG (Lapis Blue), OO (Rust Crimson), CG (Indigo Navy), and CO (Earthy Sienna).
> 4. Team Standings view (`TeamStandings.jsx`) renders live dynamic team leaderboard from `GET /api/standings/teams` featuring Roman numeral ranks, team institutions, swing flags, rounds played, Roman gold team point badges, cumulative speaks, and chronological bench history pills. Loading skeletons and empty states handled cleanly.
> 5. Speaker Leaderboard view (`SpeakerStandings.jsx`) renders debaters from `GET /api/standings/speakers` sorted by total speaks and 2-decimal rounded average scores with seamless sub-tab toggle on `PublicStandingsHub.jsx`.
> 6. Draws & Motions board (`DrawsBoard.jsx`) renders round tabs with status badges (`Draft`, `Published`, `Completed`), grand motion announcement card with info slide callout, privacy guard hiding unreleased draft pairings, and responsive multi-column room fixture cards with chair adjudicators, bench slots, and live ballot confirmation badges (`Result Confirmed` vs `Ballot Pending`).
> 7. Production build (`npm run build`) compiles cleanly in Vite with 0 JSX, CSS, or Tailwind warnings (`1649 modules transformed`, 21.6 kB CSS, 263.3 kB JS). Vite dev server is running live on `http://localhost:5173`.

---

## Phase 6: Adjudicator Portal & Interactive Digital Ballot
- [x] **Task 6.1:** Build lightweight judge authentication endpoint (`POST /api/judge/login`) and frontend login view using `username` and 4-digit `PIN`.
- [x] **Task 6.2:** Build `JudgePortal.jsx` fetching and scoping the active session strictly to the judge's currently assigned room.
- [x] **Task 6.3:** Build interactive 4-bench `BallotForm.jsx` showing the debate motion, room name, team names, and speaker input fields.
- [x] **Task 6.4:** Implement real-time client-side score calculator computing team speaker totals as numbers are typed.
- [x] **Task 6.5:** Implement real-time client-side LPW detector displaying immediate visual warnings and disabling the submit button until all scoring constraints pass.

*Verification Notes:*
> All Phase 6 verification steps executed and passed:
> 1. Sri Lankan university debating circuit seed migration verified: `POST /api/admin/reset` followed by `POST /api/admin/seed` cleanly seeded 8 authentic Sri Lankan university teams (Ruhuna A, Moratuwa A, Colombo A, Peradeniya A, Law College A, J'pura A, Kelaniya A, KDU A) with authentic debater names, plus 3 active chair judges (Dinesh Fernando, Sanjeewa Senanayake, Kavindi Herath).
> 2. Judge PIN authentication verified: `POST /api/judges/login` returned HTTP 401 with `{"error":"Invalid credentials or inactive adjudicator status"}` for invalid PIN (`dinesh_f` / `0000`), and HTTP 200 with judge profile for valid credentials (`dinesh_f` / `1234`).
> 3. Judge session scoping verified: `GET /api/judges/:judgeId/matches` returns only fixtures assigned to that adjudicator, mapped with debate motion, round number, and 4 participating benches (`OG`, `OO`, `CG`, `CO`).
> 4. Interactive E-Ballot form (`BallotForm.jsx`) features 4-bench card layout with color-coded `BenchBadge` components, rank selector (1st–4th) with automatic team points mapping ($1\text{st}\rightarrow 3, 2\text{nd}\rightarrow 2, 3\text{rd}\rightarrow 1, 4\text{th}\rightarrow 0$), and debater score inputs (range 50–100) with dynamic live sum.
> 5. Real-time client-side Low-Point Win (LPW) detector and rank uniqueness validator verified: Entering duplicate ranks or giving a higher-ranked team fewer or equal speaks than a lower-ranked team immediately triggers the Classical warning banner (*"Senate Adjudication Warning: Low-Point Win detected..."*) and disables the submit button. Monotonic valid scores clear the alert.
> 6. Atomic ballot submission and sealed state verified: Submitting valid scores commits via `PUT /api/matches/:matchId/ballot` returning HTTP 200 (`{"message":"Ballot submitted successfully","match_id":1}`), locks the form into a decree confirmed state with the Classical seal graphic, and dynamically updates live team standings and speaker leaderboards on the Public Hub.
> 7. Production build (`npm run build`) compiled cleanly in Vite with 0 JSX, CSS, or Tailwind warnings in 2.90s.

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