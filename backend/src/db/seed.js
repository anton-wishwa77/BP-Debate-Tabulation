const { pool } = require('./index');

const TEAMS = [
  {
    team_name: 'Ruhuna A',
    institution: 'University of Ruhuna',
    speaker_1_name: 'Wishwa Fernando',
    speaker_2_name: 'Kavindu Sahan',
    is_swing: false
  },
  {
    team_name: 'Moratuwa A',
    institution: 'University of Moratuwa',
    speaker_1_name: 'Chamara Silva',
    speaker_2_name: 'Dinuka Perera',
    is_swing: false
  },
  {
    team_name: 'Colombo A',
    institution: 'University of Colombo',
    speaker_1_name: 'Anuki Wijesinghe',
    speaker_2_name: 'Senura Senanayake',
    is_swing: false
  },
  {
    team_name: 'Peradeniya A',
    institution: 'University of Peradeniya',
    speaker_1_name: 'Janith Bandara',
    speaker_2_name: 'Nimesh Jayawardena',
    is_swing: false
  },
  {
    team_name: 'Law College A',
    institution: 'Sri Lanka Law College',
    speaker_1_name: 'Tariq Hamza',
    speaker_2_name: 'Fathima Rizwan',
    is_swing: false
  },
  {
    team_name: "J'pura A",
    institution: 'University of Sri Jayewardenepura',
    speaker_1_name: 'Oshada Senaratne',
    speaker_2_name: 'Dulani Gunawardena',
    is_swing: false
  },
  {
    team_name: 'Kelaniya A',
    institution: 'University of Kelaniya',
    speaker_1_name: 'Sachintha Rajapaksha',
    speaker_2_name: 'Minoli Alwis',
    is_swing: false
  },
  {
    team_name: 'KDU A',
    institution: 'General Sir John Kotelawala Defence University',
    speaker_1_name: 'Ravindu Wickramasinghe',
    speaker_2_name: 'Devinda Dias',
    is_swing: false
  }
];

const JUDGES = [
  {
    judge_name: 'Dinesh Fernando',
    institution: 'Faculty of Law, UoC',
    username: 'dinesh_f',
    pin: '1234',
    is_active: true
  },
  {
    judge_name: 'Sanjeewa Senanayake',
    institution: 'Faculty of Engineering, Ruhuna',
    username: 'sanjeewa_s',
    pin: '4321',
    is_active: true
  },
  {
    judge_name: 'Kavindi Herath',
    institution: 'University of Moratuwa',
    username: 'kavindi_h',
    pin: '7890',
    is_active: true
  }
];

async function seed({ closePool = false } = {}) {
  const client = await pool.connect();
  try {
    console.log('Seeding database with Sri Lankan university debate teams and adjudicators...');
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
    console.log(`Successfully seeded ${TEAMS.length} Sri Lankan teams and ${JUDGES.length} chair judges.`);
    return { teams: TEAMS.length, judges: JUDGES.length };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    if (closePool) {
      process.exitCode = 1;
    }
    throw err;
  } finally {
    client.release();
    if (closePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seed({ closePool: true }).catch(() => process.exit(1));
}

module.exports = seed;
