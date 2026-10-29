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
- [x] **Task 7.1:** Build admin authentication shell (`/admin`) guarded by master credentials (`ADMIN_USER`, `ADMIN_PASS`).
- [x] **Task 7.2:** Build **Team Manager** panel with registration forms, team tables, delete actions, Rule of 4 banner, and one-click `"Add Swing Teams"` button.
- [x] **Task 7.3:** Build **Judge Manager** panel with adjudicator registration, PIN visibility toggle, and active/inactive toggles.
- [x] **Task 7.4:** Build **Round & Draw Manager** panel with motion entry, pairing execution triggers, room matrix, and administrative ballot overrides.
- [x] **Task 7.5:** Integrate `"Seed 8 Sample Teams"` and `"Reset Tournament Data"` quick-demo buttons.
- [x] **Task 7.6:** Execute full automated tournament simulation test (Seed $\rightarrow$ Round 1 $\rightarrow$ Submit Ballots $\rightarrow$ Round 2 Swiss Pairing $\rightarrow$ Standings Verification).

*Verification Notes:*
> All Phase 7 verification steps executed and passed:
> 1. Senate Admin Dashboard (`AdminDashboard.jsx`) implemented at `/admin` guarded by master authentication (`ADMIN_USER=admin`, `ADMIN_PASS=admin123`). Features classical imperial crest banner (*"The High Senate & Tabulation Directorate"*), 4 real-time metric cards (Registered Delegations with swing count badge, Adjudication Pool active counts, Current Active Round state, and Ballot Completion progress bar), and classical 4-tab navigation.
> 2. Roster Management & Rule-of-4 Swing Balancer (`RosterPanel.jsx`): Table with search filtering, team registration modal (`POST /api/teams`), team deletion (`DELETE /api/teams/:id`), adjudicator registration (`POST /api/judges`), PIN reveal/mask toggle, and active status switch (`PUT /api/judges/:id`). Prominent gold *"Invoke Rule of 4 Balancer"* (`POST /api/teams/swing`) verified: adding a 9th team triggers the 3-team swing requirement alert; clicking drafts 3 swing teams to restore symmetry to 12.
> 3. Round Generation & Motion Dispatch Console (`RoundControlPanel.jsx`): Auto-incrementing round number selector, Roman parchment motion and info slide inputs, pre-draw validation checklist (divisibility by 4, judge availability, prior unsealed ballots). Atomic draw execution (`POST /api/rounds/generate`), round status switcher (`PATCH /api/rounds/:id` toggling Draft/Published/Completed), and cascade round deletion (`DELETE /api/rounds/:id`).
> 4. Live Room Matrix & Adjudication Monitor (`RoomMatrix.jsx`): Visual grid of chambers across rounds, assigned chair adjudicators, 4 benches with `BenchBadge` tags, real-time ballot status indicators (*"Awaiting Verdict"* vs *"Ballot Sealed"*), embedded score sheet inspection modal, and administrative override links to `/judge/matches/:matchId/ballot`.
> 5. Tournament Maintenance & CSV Standings Export (`MaintenancePanel.jsx`): One-click browser CSV compilation downloading formatted Team Standings and Speaker Leaderboard (`forum_aeterna_standings.csv`). Pristine Sri Lankan circuit reset confirmed via modal executing `POST /api/admin/reset` and `POST /api/admin/seed`.
> 6. Automated integration test (`npm run simulate` running `backend/src/scripts/simulateTournament.js`): Fully simulated complete 2-round tournament lifecycle (Reset & Seed -> Round 1 Draw -> Monotonic LPW Ballots -> Dynamic Standings -> Round 2 Swiss Power-Pairing & Bench Balancing -> Round 2 Ballots -> Final Standings & Speaker Leaderboards) with exit code 0.
> 7. Production build audit (`npm run build` in `frontend/`) compiled cleanly in Vite with 0 errors/warnings (`1655 modules transformed` in 4.56s).

---

## Post-Phase 7: Full Repo Audit & Single Source of Truth (SSOT) Consolidation
- [x] **Task 8.1:** Full codebase audit eliminating hardcoded strings, magic numbers (e.g., score bounds `50`/`100`, team points `3/2/1/0`), and duplicate validation routines.
- [x] **Task 8.2:** Backend SSOT consolidation (`backend/src/config/tabRules.js`) centralizing score boundaries, ranking points, bench definitions, and status enums.
- [x] **Task 8.3:** Frontend SSOT consolidation (`frontend/src/config/tabRules.js`) ensuring identical mathematical definitions and bench color styling palettes match backend logic.
- [x] **Task 8.4:** Documentation & evaluation deliverables: comprehensive `README.md`, API endpoint documentation, and step-by-step viva presentation script.

*Verification Notes:*
> All ranking constants (`RANK_POINTS: {1: 3, 2: 2, 3: 1, 4: 0}`), speaker score boundaries (`50–100`), bench identifiers (`OG, OO, CG, CO`), and status enums (`Draft, Published, Completed`) centralized in backend and frontend SSOT modules (`tabRules.js`). Root workspace unified with root `package.json` concurrently executing backend and frontend dev servers. Clean production build verified with exit code 0.
> 
> Security & Integrity Hardening (Zero-Assumption Protocol):
> 1. Public Credential Sanitization: Completely removed all demo credential chips, toolbars, and pre-filled hints from `JudgeLogin.jsx` and `AdminDashboard.jsx`.
> 2. Input Masking: Enforced `type="password"`, `inputMode="numeric"`, `maxLength={4}`, and `autoComplete="current-password"` for judge PIN authentication and judge creation modals.
> 3. Elimination of "Director Mode": Completely purged the client-side `directorPreview` toggle and button from `DrawsBoard.jsx`. Public viewers cannot access draft fixtures or confidential motions.
> 4. Backend Draft Protection: Hardened `GET /api/rounds` to strictly sanitize draft rounds (`motion_text: null, info_slide: null, matches: []`). Introduced dedicated `GET /api/admin/rounds` for authorized tournament directors.

---

## Interactive Team Dossier Modal (Quick Stats Pop-up)
- [x] **Task 9.1:** Build `GET /api/teams/:id/stats` endpoint in `teamController.js` and `teamRoutes.js` aggregating core profile, live tournament metrics (`total_points`, `total_speaks`, `current_rank`), individual speaker breakdowns (totals, averages to 2 decimals, rounds spoken), and chronological round trajectory.
- [x] **Task 9.2:** Implement `TeamDossierModal.jsx` adhering strictly to Renaissance design tokens (`Cormorant Garamond`, `Cinzel`, parchment background, Corinthian gold borders, Roman rank badges, speaker roster cards, and round history table).
- [x] **Task 9.3:** Integrate clickable team name triggers with dotted hover underlines and gold transitions into `TeamStandings.jsx`, `DrawsBoard.jsx`, and `RoomMatrix.jsx`.
- [x] **Task 9.4:** Support keyboard `Escape` dismissal, backdrop click dismissal, responsive layouts, and loading shimmer/skeletons.

*Verification Notes:*
> 1. Backend Endpoint `GET /api/teams/:id/stats` verified:
>    - Querying team 1 (`Ruhuna A`) returns HTTP 200 with complete JSON contract: core profile, cumulative points, cumulative speaks, overall tournament rank (`#7`), speaker breakdowns (`Wishwa Fernando`: avg 73.5, `Kavindu Sahan`: avg 72.5), and round history array (R1 in Room 1 as CO with 4th/0pts, R2 in Room 2 as CG with 3rd/1pt).
>    - Teams without submitted rounds return zeroed metrics and empty round history (`[]`) gracefully without throwing errors.
>    - Querying non-existent team returns HTTP 404 (`{"error":"Team not found"}`).
> 2. Frontend Integration & Styling verified:
>    - `TeamStandings.jsx`: Team names are styled buttons with cursor pointer, dotted gold underline hover effects, opening `TeamDossierModal` on click.
>    - `DrawsBoard.jsx`: Team names in all 4 BP room benches (`OG`, `OO`, `CG`, `CO`) are clickable triggers opening `TeamDossierModal`.
>    - `RoomMatrix.jsx`: Admin chamber grid and sealed score sheet inspect modal allow immediate inspection of team dossiers.
>    - Modal accessibility: Closes cleanly via `Escape` key listener, backdrop click, or the classical '✕' close button.
> 3. Frontend Production Build verified:
>    - `npm run build` executed and passed with code 0 in 3.27s (1656 modules transformed, 0 syntax/JSX errors).

---

## Phase 10: Adjudicator Profile Management & "Noctis" Renaissance Dark Mode
- [x] **Task 10.1:** Implement `PUT /api/judges/:id` in `judgeController.js` and `judgeRoutes.js` with full validation (non-empty strings, alphanumeric username uniqueness with `409 Conflict`, exactly 4-digit numeric PIN, boolean active status, and sanitized response omitting raw PIN).
- [x] **Task 10.2:** Build `EditJudgeModal.jsx` component with parchment/obsidian container, double Corinthian stone borders, Roman gold header, masked 4-digit PIN with click-to-reveal toggle, and active status switch.
- [x] **Task 10.3:** Integrate "Edit" action buttons beside each adjudicator in `RosterPanel.jsx`, updating table state immediately on save.
- [x] **Task 10.4:** Implement persistent, system-wide "Noctis" Dark Mode via `ThemeContext.jsx` (`forum_aeterna_theme` in `localStorage`, system `prefers-color-scheme` fallback, dynamic `.dark` class on `document.documentElement`).
- [x] **Task 10.5:** Integrate Roman solar/lunar theme toggle buttons (*Sol* sun medallion for Lux mode vs *Luna* crescent moon emblem for Noctis mode) into `Navbar.jsx` on desktop and mobile.
- [x] **Task 10.6:** Configure Tailwind `darkMode: 'class'`, dark CSS variables in `index.css`, and dark mode bench badge color palettes in `BenchBadge.jsx`.

*Verification Notes:*
> 1. Adjudicator Update API (`PUT /api/judges/:id`) verified:
>    - Valid update: `PUT /api/judges/1` with new name, institution, username `dinesh_f`, and PIN `9999` returns HTTP 200 with sanitized profile (zero raw PIN leakage in JSON).
>    - Authentication verification: `POST /api/judges/login` with new PIN `9999` returns HTTP 200; login with old PIN `1234` returns HTTP 401.
>    - Duplicate username conflict: updating judge 2 to `dinesh_f` returns HTTP 409 (`{"error":"Username already allocated to another adjudicator"}`).
>    - Validation error checks: invalid PIN length returns HTTP 400 (`"PIN must be exactly 4 numeric digits"`), invalid username chars returns HTTP 400, non-existent ID returns HTTP 404, invalid ID returns HTTP 400.
>    - Active status toggle: `{ is_active: false }` and `{ is_active: true }` continue to work cleanly.
> 2. Frontend Adjudicator Edit Modal verified:
>    - `EditJudgeModal.jsx` opens from `RosterPanel.jsx` "Edit" button pre-populated with current judge data.
>    - Client-side validation blocks blank fields or non-4-digit PINs with clear alerts.
>    - Password input with reveal/mask toggle button allows inspection of PIN.
>    - Submitting updates table dynamically via `onRefresh()`.
> 3. "Noctis" Renaissance Dark Mode verified:
>    - Theme toggle button in navigation header switches seamlessly between Lux (light parchment) and Noctis (obsidian / charred vellum).
>    - Theme state persists across page refreshes via `localStorage.getItem('forum_aeterna_theme')`.
>    - Semantic tokens and dark bench palettes verified across Public Standings, Draws Board, Team Dossier Modal, Judge Portal, and Senate Admin.
> 4. Production Build verified:
>    - `npm run build` executed and passed with code 0 in 4.20s (1658 modules transformed, 0 syntax/JSX errors).

---

## Phase 11: Design System Consolidation (Classical Renaissance Parchment Reversion)
- [x] **Task 11.1:** Purge theme state and navigation toggle:
  - Removed solar/lunar icons (*Sol* / *Luna*) and theme toggle buttons from `Navbar.jsx` on desktop and mobile.
  - Deleted `ThemeContext.jsx` and decoupled all theme context hooks.
  - Removed `<ThemeProvider>` wrapping from `App.jsx`.
  - Added DOM and `localStorage` sanitization on application mount to guarantee `document.documentElement` never retains the `.dark` class and `forum_aeterna_theme` is removed from `localStorage`.
- [x] **Task 11.2:** Roll back Tailwind configuration and global CSS:
  - Removed `darkMode: 'class'` from `tailwind.config.js`.
  - Removed `.dark` CSS variable block and dark scrollbars from `index.css`.
  - Consolidated `:root` and `body` to original Renaissance parchment foundation tokens (`#FDFBF7`, `#F8FAFC`, `#B59A57`, `#1A242F`, `Cinzel`, `Cormorant Garamond`, `Plus Jakarta Sans`).
- [x] **Task 11.3:** Purge all `dark:` utility classes across all components and modals:
  - `EditJudgeModal.jsx`: Completely preserved all adjudicator edit capabilities, validation, PIN masking, and update events while restoring authentic warm parchment background, gold border, and dark labels.
  - `TeamDossierModal.jsx`: Reverted round trajectory table and container to classical parchment styling.
  - `BenchBadge.jsx`: Reverted all 4 BP benches (`OG`, `OO`, `CG`, `CO`) to classical parchment crest colorways.
  - `AdminDashboard.jsx`, `RosterPanel.jsx`, `RoundControlPanel.jsx`, `RoomMatrix.jsx`, and `Navbar.jsx`: Completely purged all `dark:*` prefixes and fallback overrides.
- [x] **Task 11.4:** Verification and build validation:
  - Grep search verified 0 occurrences of `dark:` across the entire `frontend/src/` directory.
  - Production build (`npm run build`) passed with exit code 0 (1657 modules transformed).
  - Backend adjudicator edit API (`PUT /api/judges/:id`) verified functioning with 200 OK.
  - **STRICT GIT LOCKOUT:** Zero git commands executed; all changes left unstaged in workspace for manual inspection.

---

## Phase 12: Team Dossier Edit Suite (Delegation Amendments & Roster Management)
- [x] **Task 12.1:** Backend Team Update & Retrieval APIs (`PUT /api/teams/:id`, `GET /api/teams/:id`):
  - Implemented `PUT /api/teams/:id` in `teamController.js` and `teamRoutes.js`:
    - Validates required non-empty fields: `name` (or `team_name`), `institution`, `speaker_1_name`, `speaker_2_name`, and boolean `is_swing`.
    - Enforces delegation name uniqueness across the tournament pool, returning `409 Conflict` with `"A delegation with this name is already registered"`.
    - Returns `200 OK` on success with `{ message: "Delegation dossier updated successfully", team: { id, team_id, name, team_name, institution, speaker_1_name, speaker_2_name, is_swing } }`.
    - Returns `404 Not Found` if the team ID does not exist in the database.
  - Implemented `GET /api/teams/:id` returning core team attributes, debater names, swing status, and completed rounds count.
- [x] **Task 12.2:** Frontend Team Edit Modal (`EditTeamModal.jsx`):
  - Created `EditTeamModal.jsx` in `frontend/src/components/admin/` adhering strictly to Renaissance design tokens:
    - Warm parchment surface (`bg-canvas-parchment`), antique gold border (`border-gold-deep`), and golden hairline accent.
    - Laurel award crest header: *"Amend Delegation Dossier"* under the *Senate Tabulation Directorate*.
    - Inputs for Team Name, Institution, Speaker 1 Full Name, Speaker 2 Full Name, and Roman toggle card for Swing status.
    - Client-side validation preventing blank submissions, inline error alert banner for 409 collisions, and clean keyboard/backdrop dismissals.
- [x] **Task 12.3:** Admin Roster Integration (`RosterPanel.jsx` & `client.js`):
  - Added `getTeamById` to `frontend/src/api/client.js`.
  - Added Edit Delegation action button (`<Edit2 className="w-3.5 h-3.5" />`) to each team row in the Senate Teams table beside the delete action.
  - Linked row click to `EditTeamModal` with selected team state.
  - Upon successful revision, triggers live table refresh and elegant classical toast notification: *"Delegation records for [Team Name] officially amended."*
- [x] **Task 12.4:** Verification and cross-component consistency:
  - Verified terminal `curl` tests:
    - `GET /api/teams/1` -> `200 OK` with full delegation object.
    - Empty payload update -> `400 Bad Request` with `{ error: "All fields are required: name, institution, speaker_1_name, speaker_2_name" }`.
    - Valid update -> `200 OK` with updated team metadata.
    - Duplicate name collision -> `409 Conflict` with `{ error: "A delegation with this name is already registered" }`.
  - Verified cross-component consistency: `/standings` leaderboard and `TeamDossierModal` reflect amended team and debater identities while preserving match histories, speaker scores, and cumulative points.
  - Verified production build (`npm run build`) passed with exit code 0 (1658 modules transformed).
  - **STRICT GIT LOCKOUT:** Zero git commands executed; all files left unstaged for manual review.

---

## Phase 13: Parliamentary Terminology & UI Copy Sanitization
- [x] **Task 13.1:** Standings Header & Empty State Copy Sanitization:
  - Updated `PublicStandingsHub.jsx` header subtitle:
    - Replaced `"Deliberations and standings computed dynamically under British Parliamentary rules with strict Low-Point Win prohibitions."` with `"Deliberations and standings computed dynamically under official British Parliamentary adjudication standards."`
  - Updated `TeamStandings.jsx` empty state copy:
    - Replaced `"Standings will dynamically calculate here as soon as chairs submit validated ballots without Low-Point Wins."` with `"Standings will dynamically calculate here as soon as chairs submit validated ballots adhering to official adjudication standards."`
- [x] **Task 13.2:** System Tagline & Footer Copy Sanitization:
  - Updated `Layout.jsx` classical footer tagline:
    - Replaced `"British Parliamentary Tabulation Engine adhering to strict Rule of 4 &amp; LPW prohibitions."` with `"British Parliamentary Tabulation Engine adhering to official WUDC rules and 4-bench chamber structures."`
- [x] **Task 13.3:** Adjudication & Warning Banner Copy Sanitization:
  - Rephrased `BallotForm.jsx` real-time warning message cleanly to: `"Senate Adjudication Warning: A higher ranked team cannot hold equal or fewer speaker points than a lower ranked team."`
  - Updated `BallotForm.jsx` warning card header to `"Senate Adjudication Warning • Parliamentary Adjudication Standards"` and submit barrier copy to `"All scoring constraints, rank permutations, and adjudication standards must pass before submission."`
  - Updated `RoomMatrix.jsx` submission verification label to `"Official British Parliamentary adjudication standards verified at submission."`
  - Sanitized placeholder text in `JudgePortalPlaceholder.jsx` to authentic parliamentary convention copy.
- [x] **Task 13.4:** Mathematical Logic & Validation Integrity Preservation:
  - Preserved 100% of underlying mathematical validation logic, rank checks, score boundary enforcements, and ballot guardrails across backend and frontend.
  - Verified with automated node validation tests confirming rejection of ballots violating speaker point hierarchy while approving valid monotonic ballots.
  - Production build (`npm --prefix frontend run build`) passed with exit code 0 (1658 modules transformed).
  - **STRICT GIT LOCKOUT:** Zero git commands executed; all modified files left unstaged in workspace for manual inspection.

---

## Phase 14: Authentic Tournament Rounds & Match History Seeder
- [x] **Task 14.1:** Tournament Seeder Script (`backend/src/scripts/seedTournamentRounds.js`):
  - Created standalone seeder script establishing 3 authentic rounds of British Parliamentary debate across 8 Sri Lankan universities and 3 chair adjudicators:
    - **Round 1 (Completed):** Motion on higher education mobility; sealed ballots across Chamber of Cicero (`dinesh_f`) and Chamber of Seneca (`sanjeewa_s`).
    - **Round 2 (Completed):** Motion on autonomous lethal weapons; power-paired top bracket (`kavindi_h`) and bottom bracket (`dinesh_f`) with sealed ballots.
    - **Round 3 (Published):** Motion on central bank digital currencies (CBDCs); published chamber allocations for live adjudication (Chamber of Cicero: `sanjeewa_s`, Chamber of Seneca: `kavindi_h`).
- [x] **Task 14.2:** Tournament Integrity & LPW Invariant Enforcement:
  - Enforced 4-bench chamber rule (`OG`, `OO`, `CG`, `CO`) across every room.
  - Strictly mapped ranks to BP points ($1\text{st} \rightarrow 3, 2\text{nd} \rightarrow 2, 3\text{rd} \rightarrow 1, 4\text{th} \rightarrow 0$).
  - Calibrated speaker marks to realistic WUDC ranges ($73\text{--}82$) guaranteeing strictly monotonic speaks with respect to rank.
- [x] **Task 14.3:** Package Script Integration & Database Execution:
  - Added `"seed:tournament": "node src/scripts/seedTournamentRounds.js"` to `backend/package.json`.
  - Executed script cleanly populating database records across `rounds`, `matches`, and `match_participants`.
- [x] **Task 14.4:** Backend & Leaderboard Verification:
  - `GET /api/rounds`: Confirmed 3 rounds returned with correct statuses (`Completed`, `Completed`, `Published`).
  - `GET /api/standings/teams`: Verified realistic dynamic standings: Law College A (6 pts, 321 speaks), Colombo A (5 pts, 316 speaks), Moratuwa A (4 pts, 309 speaks), Ruhuna A (3 pts, 308 speaks), Peradeniya A (3 pts, 301 speaks), J'pura A (2 pts, 303 speaks), Kelaniya A (1 pt, 296 speaks), KDU A (0 pts, 292 speaks).
  - `GET /api/standings/speakers`: Verified individual speaker tab led by Tariq Hamza (161 pts, 80.5 avg) and Fathima Rizwan (160 pts, 80.0 avg).
  - Adjudicator Authentication: Verified login and dashboard for `sanjeewa_s` (PIN `4321`) with assigned Round 3 match ready for live balloting.
  - **STRICT GIT LOCKOUT:** Zero git commands executed; all modified and newly created files left unstaged for manual review.

---

## Phase 15: Chamber Adjudicator Allocation & Double-Booking Protection Suite
- [x] **Task 15.1:** Backend Allocation & Conflict Prevention API (`PATCH /api/matches/:id/adjudicator`):
  - Implemented `reassignAdjudicator` in `backend/src/controllers/matchController.js` and registered in `matchRoutes.js`.
  - Supports vacating chairs (`judge_id: null`), allocating active judges, and swapping adjudicators.
  - Enforced Ballot Lockout Guard: Rejects reassignments on sealed ballots (`is_submitted = true`) with `400 Bad Request` (`"Cannot reassign adjudicator: Official ballot has already been sealed for this chamber"`).
  - Enforced Double-Booking Check: Rejects adjudicator double-booking within the same round with `409 Conflict` (`"Conflict: [Judge Name] is already presiding over [Room Name] in this round."`).
- [x] **Task 15.2:** Frontend Adjudicator Allocation Modal (`ReassignJudgeModal.jsx`):
  - Created Renaissance modal in `frontend/src/components/admin/ReassignJudgeModal.jsx` styled with warm parchment background, antique gold borders, and golden hairline accents.
  - Displays chamber details (Chamber Name, Round number, Current Chair) and full judge selector.
  - Disables conflicted adjudicators with explicit tag: `"[Judge Name] (Assigned: [Room Name])"`.
  - Handles `Escape` key, backdrop dismissal, inline 409 conflict alerts, and clean submission state.
- [x] **Task 15.3:** Senate Admin Integration (`RoomMatrix.jsx` & `AdminDashboard.jsx`):
  - Updated room cards in `RoomMatrix.jsx` to render current judge or *"Unassigned Chair"* parchment badge.
  - Added classical **Amend Chair** action button (`<Gavel />`).
  - Added sealed wax lock indicator (`<Lock />` / *"Chair Finalized"*) disabling reassignment on sealed matches.
  - Immediate local state updates on allocation or vacating with classical toast notification (*"Adjudicator allocation sealed for [Room Name]."*).
- [x] **Task 15.4:** Verification & Integration Testing:
  - Verified terminal tests: vacating chair returns 200 OK, assigning judge returns 200 OK, assigning conflicted judge returns 409 Conflict, and assigning to sealed match returns 400 Bad Request.
  - Production build (`npm --prefix frontend run build`) passed with exit code 0 (1659 modules transformed).
  - **STRICT GIT LOCKOUT:** Zero git commands executed; all modified and newly created files left unstaged for manual review.





