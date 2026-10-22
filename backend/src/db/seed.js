const { pool } = require('./index');

const TEAMS = [
  {
    team_name: 'Oxford Union A',
    institution: 'University of Oxford',
    speaker_1_name: 'Julian Vance',
    speaker_2_name: 'Eleanor Wright',
    is_swing: false
  },
  {
    team_name: 'Cambridge Union A',
    institution: 'University of Cambridge',
    speaker_1_name: 'Arthur Pendelton',
    speaker_2_name: 'Beatrice Thorne',
    is_swing: false
  },
  {
    team_name: 'Harvard Speech A',
    institution: 'Harvard University',
    speaker_1_name: 'Samuel Sterling',
    speaker_2_name: 'Clara Montgomery',
    is_swing: false
  },
  {
    team_name: 'Yale Debate A',
    institution: 'Yale University',
    speaker_1_name: 'Lucas Davenport',
    speaker_2_name: 'Genevieve Hayes',
    is_swing: false
  },
  {
    team_name: 'LSE Debate Society A',
    institution: 'London School of Economics',
    speaker_1_name: 'Noah Al-Mansoor',
    speaker_2_name: 'Sophia Laurent',
    is_swing: false
  },
  {
    team_name: 'Sydney Union A',
    institution: 'University of Sydney',
    speaker_1_name: 'Lachlan Murdoch',
    speaker_2_name: 'Matilda Higgins',
    is_swing: false
  },
  {
    team_name: 'Trinity Hist A',
    institution: 'Trinity College Dublin',
    speaker_1_name: "Ciaran O'Connor",
    speaker_2_name: 'Maeve Gallagher',
    is_swing: false
  },
  {
    team_name: 'Hart House A',
    institution: 'University of Toronto',
    speaker_1_name: 'Alexander Chen',
    speaker_2_name: 'Olivia St. Claire',
    is_swing: false
  }
];

const JUDGES = [
  {
    judge_name: 'Dr. Alistair Finch',
    institution: 'University of Oxford',
    username: 'judge_finch',
    pin: '1234',
    is_active: true
  },
  {
    judge_name: 'Elena Rostova',
    institution: 'Harvard University',
    username: 'judge_rostova',
    pin: '5678',
    is_active: true
  },
  {
    judge_name: 'Marcus Aurelius Vance',
    institution: 'Trinity College Dublin',
    username: 'judge_vance',
    pin: '9012',
    is_active: true
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database with initial sample data...');
    await client.query('BEGIN');

    await client.query('TRUNCATE TABLE teams, judges, rounds, matches, match_participants RESTART IDENTITY CASCADE;');

    for (const team of TEAMS) {
      await client.query(
        `INSERT INTO teams (team_name, institution, speaker_1_name, speaker_2_name, is_swing)
         VALUES ($1, $2, $3, $4, $5)`,
        [team.team_name, team.institution, team.speaker_1_name, team.speaker_2_name, team.is_swing]
      );
    }

    for (const judge of JUDGES) {
      await client.query(
        `INSERT INTO judges (judge_name, institution, username, pin, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [judge.judge_name, judge.institution, judge.username, judge.pin, judge.is_active]
      );
    }

    await client.query('COMMIT');
    console.log(`Successfully seeded ${TEAMS.length} teams and ${JUDGES.length} judges.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
