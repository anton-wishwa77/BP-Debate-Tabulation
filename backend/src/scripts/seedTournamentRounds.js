/**
 * Tournament Rounds & Historical Match Seeder
 * Forum Aeterna - British Parliamentary Debate Tabulation System
 * 
 * Populates authentic 3-round tournament history:
 * - Round 1 (Completed): Motion on higher education with sealed ballots
 * - Round 2 (Completed): Motion on autonomous lethal weapons with power-paired brackets
 * - Round 3 (Published): Motion on CBDCs with active draw ready for live adjudication
 */

const { pool } = require('../db');
const seed = require('../db/seed');

async function seedTournamentRounds({ closePool = false } = {}) {
  const client = await pool.connect();
  try {
    console.log('🏛️  [FORUM AETERNA] Populating Realistic Multi-Round Tournament History...');
    await client.query('BEGIN');

    // 1. Verify or initialize basic teams & judges
    const teamsCheck = await client.query('SELECT team_id, team_name FROM teams ORDER BY team_id ASC');
    const judgesCheck = await client.query('SELECT judge_id, username, judge_name FROM judges ORDER BY judge_id ASC');

    let teamsMap = {};
    let judgesMap = {};

    if (teamsCheck.rows.length < 8 || judgesCheck.rows.length < 3) {
      console.log('  ⚠️ Registry has fewer than 8 teams or 3 judges. Initializing foundational circuit data...');
      await client.query('COMMIT');
      await seed({ closePool: false });
      await client.query('BEGIN');

      const refreshedTeams = await client.query('SELECT team_id, team_name FROM teams');
      const refreshedJudges = await client.query('SELECT judge_id, username FROM judges');
      refreshedTeams.rows.forEach((t) => { teamsMap[t.team_name] = t.team_id; });
      refreshedJudges.rows.forEach((j) => { judgesMap[j.username] = j.judge_id; });
    } else {
      teamsCheck.rows.forEach((t) => { teamsMap[t.team_name] = t.team_id; });
      judgesCheck.rows.forEach((j) => { judgesMap[j.username] = j.judge_id; });
    }

    // 2. Clear existing rounds data (cascades to matches and match_participants)
    console.log('  🧹 Clearing previous rounds and chambers...');
    await client.query('TRUNCATE TABLE rounds RESTART IDENTITY CASCADE;');

    // ----------------------------------------------------
    // 3. Round 1 — Status: 'Completed'
    // ----------------------------------------------------
    console.log('  📜 Seeding Round 1 (Completed: Higher Education Mobility)...');
    const r1Res = await client.query(
      `INSERT INTO rounds (round_number, motion_text, info_slide, status)
       VALUES ($1, $2, $3, $4) RETURNING round_id`,
      [
        1,
        'THR the narrative that higher education is the primary vehicle for socio-economic mobility.',
        '',
        'Completed'
      ]
    );
    const r1Id = r1Res.rows[0].round_id;

    // Room 101: Chamber of Cicero
    const r1m1Res = await client.query(
      `INSERT INTO matches (round_id, room_name, judge_id, is_submitted)
       VALUES ($1, $2, $3, $4) RETURNING match_id`,
      [r1Id, 'Room 101: Chamber of Cicero', judgesMap['dinesh_f'], true]
    );
    const r1m1Id = r1m1Res.rows[0].match_id;

    const r1m1Participants = [
      { bench: 'OG', team: 'Colombo A', rank: 1, points: 3, s1: 79, s2: 80 },
      { bench: 'CG', team: 'Ruhuna A', rank: 2, points: 2, s1: 77, s2: 78 },
      { bench: 'OO', team: 'Moratuwa A', rank: 3, points: 1, s1: 75, s2: 76 },
      { bench: 'CO', team: 'Kelaniya A', rank: 4, points: 0, s1: 73, s2: 74 }
    ];
    for (const p of r1m1Participants) {
      await client.query(
        `INSERT INTO match_participants (match_id, team_id, bench_position, rank, points, speaker_1_score, speaker_2_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [r1m1Id, teamsMap[p.team], p.bench, p.rank, p.points, p.s1, p.s2]
      );
    }

    // Room 102: Chamber of Seneca
    const r1m2Res = await client.query(
      `INSERT INTO matches (round_id, room_name, judge_id, is_submitted)
       VALUES ($1, $2, $3, $4) RETURNING match_id`,
      [r1Id, 'Room 102: Chamber of Seneca', judgesMap['sanjeewa_s'], true]
    );
    const r1m2Id = r1m2Res.rows[0].match_id;

    const r1m2Participants = [
      { bench: 'CO', team: 'Law College A', rank: 1, points: 3, s1: 81, s2: 79 },
      { bench: 'OG', team: "J'pura A", rank: 2, points: 2, s1: 77, s2: 77 },
      { bench: 'CG', team: 'Peradeniya A', rank: 3, points: 1, s1: 75, s2: 74 },
      { bench: 'OO', team: 'KDU A', rank: 4, points: 0, s1: 73, s2: 73 }
    ];
    for (const p of r1m2Participants) {
      await client.query(
        `INSERT INTO match_participants (match_id, team_id, bench_position, rank, points, speaker_1_score, speaker_2_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [r1m2Id, teamsMap[p.team], p.bench, p.rank, p.points, p.s1, p.s2]
      );
    }

    // ----------------------------------------------------
    // 4. Round 2 — Status: 'Completed'
    // ----------------------------------------------------
    console.log('  📜 Seeding Round 2 (Completed: Autonomous Lethal Weapons)...');
    const r2Res = await client.query(
      `INSERT INTO rounds (round_number, motion_text, info_slide, status)
       VALUES ($1, $2, $3, $4) RETURNING round_id`,
      [
        2,
        'THW ban the development and military deployment of autonomous lethal weapons systems.',
        'For the purpose of this debate, autonomous lethal weapons systems refer to systems that can select and engage targets without human intervention.',
        'Completed'
      ]
    );
    const r2Id = r2Res.rows[0].round_id;

    // Room 101: Chamber of Cicero (Top Bracket - 3/2 Pts Teams)
    const r2m1Res = await client.query(
      `INSERT INTO matches (round_id, room_name, judge_id, is_submitted)
       VALUES ($1, $2, $3, $4) RETURNING match_id`,
      [r2Id, 'Room 101: Chamber of Cicero', judgesMap['kavindi_h'], true]
    );
    const r2m1Id = r2m1Res.rows[0].match_id;

    const r2m1Participants = [
      { bench: 'OG', team: 'Law College A', rank: 1, points: 3, s1: 80, s2: 81 },
      { bench: 'OO', team: 'Colombo A', rank: 2, points: 2, s1: 78, s2: 79 },
      { bench: 'CO', team: 'Ruhuna A', rank: 3, points: 1, s1: 76, s2: 77 },
      { bench: 'CG', team: "J'pura A", rank: 4, points: 0, s1: 74, s2: 75 }
    ];
    for (const p of r2m1Participants) {
      await client.query(
        `INSERT INTO match_participants (match_id, team_id, bench_position, rank, points, speaker_1_score, speaker_2_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [r2m1Id, teamsMap[p.team], p.bench, p.rank, p.points, p.s1, p.s2]
      );
    }

    // Room 102: Chamber of Seneca (Bottom Bracket - 1/0 Pts Teams)
    const r2m2Res = await client.query(
      `INSERT INTO matches (round_id, room_name, judge_id, is_submitted)
       VALUES ($1, $2, $3, $4) RETURNING match_id`,
      [r2Id, 'Room 102: Chamber of Seneca', judgesMap['dinesh_f'], true]
    );
    const r2m2Id = r2m2Res.rows[0].match_id;

    const r2m2Participants = [
      { bench: 'OO', team: 'Moratuwa A', rank: 1, points: 3, s1: 79, s2: 79 },
      { bench: 'CG', team: 'Peradeniya A', rank: 2, points: 2, s1: 76, s2: 76 },
      { bench: 'OG', team: 'Kelaniya A', rank: 3, points: 1, s1: 75, s2: 74 },
      { bench: 'CO', team: 'KDU A', rank: 4, points: 0, s1: 73, s2: 73 }
    ];
    for (const p of r2m2Participants) {
      await client.query(
        `INSERT INTO match_participants (match_id, team_id, bench_position, rank, points, speaker_1_score, speaker_2_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [r2m2Id, teamsMap[p.team], p.bench, p.rank, p.points, p.s1, p.s2]
      );
    }

    // ----------------------------------------------------
    // 5. Round 3 — Status: 'Published'
    // ----------------------------------------------------
    console.log('  📜 Seeding Round 3 (Published: Central Bank Digital Currencies)...');
    const r3Res = await client.query(
      `INSERT INTO rounds (round_number, motion_text, info_slide, status)
       VALUES ($1, $2, $3, $4) RETURNING round_id`,
      [
        3,
        'THBT central banks should replace physical currency with central bank digital currencies (CBDCs) and abolish cash.',
        '',
        'Published'
      ]
    );
    const r3Id = r3Res.rows[0].round_id;

    // Room 101: Chamber of Cicero
    const r3m1Res = await client.query(
      `INSERT INTO matches (round_id, room_name, judge_id, is_submitted)
       VALUES ($1, $2, $3, $4) RETURNING match_id`,
      [r3Id, 'Room 101: Chamber of Cicero', judgesMap['sanjeewa_s'], false]
    );
    const r3m1Id = r3m1Res.rows[0].match_id;

    const r3m1Participants = [
      { bench: 'OG', team: 'Law College A' },
      { bench: 'OO', team: 'Moratuwa A' },
      { bench: 'CG', team: 'Colombo A' },
      { bench: 'CO', team: 'Peradeniya A' }
    ];
    for (const p of r3m1Participants) {
      await client.query(
        `INSERT INTO match_participants (match_id, team_id, bench_position, rank, points, speaker_1_score, speaker_2_score)
         VALUES ($1, $2, $3, NULL, NULL, NULL, NULL)`,
        [r3m1Id, teamsMap[p.team], p.bench]
      );
    }

    // Room 102: Chamber of Seneca
    const r3m2Res = await client.query(
      `INSERT INTO matches (round_id, room_name, judge_id, is_submitted)
       VALUES ($1, $2, $3, $4) RETURNING match_id`,
      [r3Id, 'Room 102: Chamber of Seneca', judgesMap['kavindi_h'], false]
    );
    const r3m2Id = r3m2Res.rows[0].match_id;

    const r3m2Participants = [
      { bench: 'OG', team: 'Ruhuna A' },
      { bench: 'OO', team: "J'pura A" },
      { bench: 'CG', team: 'Kelaniya A' },
      { bench: 'CO', team: 'KDU A' }
    ];
    for (const p of r3m2Participants) {
      await client.query(
        `INSERT INTO match_participants (match_id, team_id, bench_position, rank, points, speaker_1_score, speaker_2_score)
         VALUES ($1, $2, $3, NULL, NULL, NULL, NULL)`,
        [r3m2Id, teamsMap[p.team], p.bench]
      );
    }

    await client.query('COMMIT');
    console.log('✅ [FORUM AETERNA] Multi-Round Tournament History Successfully Seeded!');

    // Print summary table of standings
    const standingsQuery = await client.query(
      `SELECT 
        t.team_name,
        COUNT(m.match_id)::int AS rounds_played,
        COALESCE(SUM(mp.points), 0)::int AS total_points,
        COALESCE(SUM(mp.speaker_1_score + mp.speaker_2_score), 0)::int AS total_speaks
       FROM teams t
       LEFT JOIN (
         match_participants mp
         JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = TRUE
       ) ON t.team_id = mp.team_id
       GROUP BY t.team_id, t.team_name
       ORDER BY total_points DESC, total_speaks DESC, t.team_name ASC`
    );

    console.log('\n📊 Live Standings Table:');
    console.log('------------------------------------------------------------');
    console.log('Rank | Team Name        | Rounds | Points | Total Speaks');
    console.log('------------------------------------------------------------');
    standingsQuery.rows.forEach((row, idx) => {
      console.log(
        `${String(idx + 1).padStart(4)} | ${row.team_name.padEnd(16)} | ${String(row.rounds_played).padStart(6)} | ${String(row.total_points).padStart(6)} | ${String(row.total_speaks).padStart(12)}`
      );
    });
    console.log('------------------------------------------------------------\n');

    return {
      success: true,
      rounds: 3,
      teams: Object.keys(teamsMap).length
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding tournament rounds failed:', err);
    if (closePool) process.exitCode = 1;
    throw err;
  } finally {
    client.release();
    if (closePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seedTournamentRounds({ closePool: true }).catch(() => process.exit(1));
}

module.exports = seedTournamentRounds;
