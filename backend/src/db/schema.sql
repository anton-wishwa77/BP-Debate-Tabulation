-- British Parliamentary Debate Tabulation System (Forum Aeterna)
-- Core Relational Schema

CREATE TABLE IF NOT EXISTS teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255) NOT NULL,
    speaker_1_name VARCHAR(255) NOT NULL,
    speaker_2_name VARCHAR(255) NOT NULL,
    is_swing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS judges (
    judge_id SERIAL PRIMARY KEY,
    judge_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    pin VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rounds (
    round_id SERIAL PRIMARY KEY,
    round_number INTEGER UNIQUE NOT NULL,
    motion_text TEXT NOT NULL,
    info_slide TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Completed'))
);

CREATE TABLE IF NOT EXISTS matches (
    match_id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(round_id) ON DELETE CASCADE,
    room_name VARCHAR(255) NOT NULL,
    judge_id INTEGER REFERENCES judges(judge_id) ON DELETE SET NULL,
    is_submitted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_round_judge UNIQUE (round_id, judge_id)
);

CREATE TABLE IF NOT EXISTS match_participants (
    participant_id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    bench_position VARCHAR(2) NOT NULL CHECK (bench_position IN ('OG', 'OO', 'CG', 'CO')),
    rank INTEGER CHECK (rank IS NULL OR rank IN (1, 2, 3, 4)),
    points INTEGER CHECK (points IS NULL OR points IN (0, 1, 2, 3)),
    speaker_1_score INTEGER CHECK (speaker_1_score IS NULL OR (speaker_1_score >= 50 AND speaker_1_score <= 100)),
    speaker_2_score INTEGER CHECK (speaker_2_score IS NULL OR (speaker_2_score >= 50 AND speaker_2_score <= 100)),
    CONSTRAINT uq_match_bench UNIQUE (match_id, bench_position),
    CONSTRAINT uq_match_team UNIQUE (match_id, team_id),
    CONSTRAINT uq_match_rank UNIQUE (match_id, rank)
);
