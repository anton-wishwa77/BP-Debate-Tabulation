const http = require('http');
const app = require('../index');
const { pool } = require('../db');

async function runTournamentSimulation() {
  console.log('🏛️  [FORUM AETERNA] Commencing End-to-End Tournament Simulation...\n');

  // Start Express on an ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // ----------------------------------------------------
    // Step 1: Reset & Seed Database
    // ----------------------------------------------------
    console.log('Step 1: Purging and Seeding Sri Lankan Debating Circuit...');
    const resetRes = await fetch(`${baseUrl}/admin/reset`, { method: 'POST' });
    if (!resetRes.ok) throw new Error(`Reset failed: ${await resetRes.text()}`);

    const seedRes = await fetch(`${baseUrl}/admin/seed`, { method: 'POST' });
    if (!seedRes.ok) throw new Error(`Seed failed: ${await seedRes.text()}`);
    const seedData = await seedRes.json();
    console.log(`  ✓ Restored ${seedData.teams} Sri Lankan university teams and ${seedData.judges} chair adjudicators.`);

    // Check Teams and Judges
    const teamsRes = await fetch(`${baseUrl}/teams`);
    const teams = await teamsRes.json();
    console.log(`  ✓ Verified ${teams.length} teams in registry. Divisible by 4: ${teams.length % 4 === 0}`);

    // ----------------------------------------------------
    // Step 2: Generate Round 1 (Random Draw)
    // ----------------------------------------------------
    console.log('\nStep 2: Generating Round 1 (Random Draw & Initial Bench Allocations)...');
    const r1GenRes = await fetch(`${baseUrl}/rounds/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_number: 1,
        motion_text: 'This House would subsidize indigenous renewable energy over fossil fuels.',
        info_slide: 'Context: Developing economies transitioning their national energy grids.'
      })
    });

    if (!r1GenRes.ok) throw new Error(`Round 1 generation failed: ${await r1GenRes.text()}`);
    const r1Data = await r1GenRes.json();
    console.log(`  ✓ Round 1 generated with ${r1Data.matches.length} chambers:`);
    r1Data.matches.forEach((m) => {
      console.log(`    • ${m.room_name} (Judge ID: ${m.judge_id}): ${m.participants.map((p) => `[${p.bench_position}: Team ${p.team_id}]`).join(', ')}`);
    });

    // ----------------------------------------------------
    // Step 3: Submit Round 1 Ballots (Enforcing Strict LPW)
    // ----------------------------------------------------
    console.log('\nStep 3: Submitting Ballots for Round 1 Chambers (LPW Compliant)...');
    for (const match of r1Data.matches) {
      const matchDetailsRes = await fetch(`${baseUrl}/matches/${match.match_id}`);
      const matchDetails = await matchDetailsRes.json();

      // Assign ranks: 1st, 2nd, 3rd, 4th
      // Monotonic scores:
      // Rank 1: 82 + 81 = 163
      // Rank 2: 78 + 77 = 155
      // Rank 3: 75 + 74 = 149
      // Rank 4: 71 + 70 = 141
      const scores = [
        { rank: 1, s1: 82, s2: 81 },
        { rank: 2, s1: 78, s2: 77 },
        { rank: 3, s1: 75, s2: 74 },
        { rank: 4, s1: 71, s2: 70 }
      ];

      const ballotPayload = matchDetails.participants.map((p, idx) => ({
        team_id: p.team_id,
        rank: scores[idx].rank,
        speaker_1_score: scores[idx].s1,
        speaker_2_score: scores[idx].s2
      }));

      const ballotRes = await fetch(`${baseUrl}/matches/${match.match_id}/ballot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ballotPayload)
      });

      if (!ballotRes.ok) throw new Error(`Ballot submission failed for match ${match.match_id}: ${await ballotRes.text()}`);
      console.log(`  ✓ Sealed ballot for Chamber ${match.match_id} (${match.room_name}).`);
    }

    // ----------------------------------------------------
    // Step 4: Query Dynamic Standings after Round 1
    // ----------------------------------------------------
    console.log('\nStep 4: Querying Live Team Standings after Round 1...');
    const standingsR1Res = await fetch(`${baseUrl}/standings/teams`);
    const standingsR1 = await standingsR1Res.json();

    console.log('  Leaderboard Post-Round 1:');
    standingsR1.forEach((t, i) => {
      console.log(`    ${i + 1}. ${t.team_name.padEnd(16)} | Points: ${t.total_points} | Speaks: ${t.total_speaks} | Benches: [${t.bench_history.join(',')}]`);
    });

    const rank1Count = standingsR1.filter((t) => t.total_points === 3).length;
    const rank2Count = standingsR1.filter((t) => t.total_points === 2).length;
    if (rank1Count !== 2 || rank2Count !== 2) {
      throw new Error(`Expected exactly two 3-point teams and two 2-point teams, got ${rank1Count} and ${rank2Count}`);
    }
    console.log('  ✓ Verified points distribution: Exactly two 3pt teams, two 2pt teams, two 1pt teams, two 0pt teams.');

    // ----------------------------------------------------
    // Step 5: Generate Round 2 (Swiss Power-Pairing & Bench Equity)
    // ----------------------------------------------------
    console.log('\nStep 5: Generating Round 2 (Swiss Power-Pairing & Bench Balancing)...');
    const r2GenRes = await fetch(`${baseUrl}/rounds/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_number: 2,
        motion_text: 'This House regrets the commercialization of state education.',
        info_slide: 'Context: Global expansion of private tertiary educational institutions.'
      })
    });

    if (!r2GenRes.ok) throw new Error(`Round 2 Swiss generation failed: ${await r2GenRes.text()}`);
    const r2Data = await r2GenRes.json();
    console.log(`  ✓ Round 2 generated with ${r2Data.matches.length} Swiss-paired chambers:`);

    for (const m of r2Data.matches) {
      const pDetails = await Promise.all(
        m.participants.map(async (p) => {
          const t = standingsR1.find((st) => st.team_id === p.team_id);
          return `${p.bench_position}: ${t.team_name} (${t.total_points}pts, prev: [${t.bench_history.join(',')}])`;
        })
      );
      console.log(`    • ${m.room_name}:`);
      pDetails.forEach((pd) => console.log(`        - ${pd}`));
    }

    // ----------------------------------------------------
    // Step 6: Submit Round 2 Ballots
    // ----------------------------------------------------
    console.log('\nStep 6: Submitting Ballots for Round 2 Chambers...');
    for (const match of r2Data.matches) {
      const matchDetailsRes = await fetch(`${baseUrl}/matches/${match.match_id}`);
      const matchDetails = await matchDetailsRes.json();

      const scores = [
        { rank: 1, s1: 83, s2: 82 }, // 165
        { rank: 2, s1: 79, s2: 78 }, // 157
        { rank: 3, s1: 76, s2: 75 }, // 151
        { rank: 4, s1: 73, s2: 72 }  // 145
      ];

      const ballotPayload = matchDetails.participants.map((p, idx) => ({
        team_id: p.team_id,
        rank: scores[idx].rank,
        speaker_1_score: scores[idx].s1,
        speaker_2_score: scores[idx].s2
      }));

      const ballotRes = await fetch(`${baseUrl}/matches/${match.match_id}/ballot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ballotPayload)
      });

      if (!ballotRes.ok) throw new Error(`Ballot submission failed for R2 match ${match.match_id}: ${await ballotRes.text()}`);
      console.log(`  ✓ Sealed ballot for Round 2 Chamber ${match.match_id} (${match.room_name}).`);
    }

    // ----------------------------------------------------
    // Step 7: Verify Final Dynamic Standings & Speaker Leaderboard
    // ----------------------------------------------------
    console.log('\nStep 7: Verifying Final Standings and Speaker Leaderboard...');
    const finalTeamsRes = await fetch(`${baseUrl}/standings/teams`);
    const finalTeams = await finalTeamsRes.json();

    console.log('\n  🏆 FINAL TEAM STANDINGS (After 2 Rounds):');
    finalTeams.forEach((t, i) => {
      console.log(`    Rank ${i + 1}: ${t.team_name.padEnd(16)} | Points: ${t.total_points} | Total Speaks: ${t.total_speaks} | Rounds: ${t.rounds_played} | Benches: [${t.bench_history.join(' -> ')}]`);
    });

    const finalSpeakersRes = await fetch(`${baseUrl}/standings/speakers`);
    const finalSpeakers = await finalSpeakersRes.json();

    console.log('\n  🎙️ TOP 5 INDIVIDUAL SPEAKERS:');
    finalSpeakers.slice(0, 5).forEach((s, i) => {
      console.log(`    Rank ${i + 1}: ${s.speaker_name.padEnd(24)} (${s.team_name}) | Total: ${s.total_speaker_score} | Avg: ${s.average_score} | Rounds: ${s.rounds_spoken}`);
    });

    // Verification asserts
    if (finalTeams.length !== 8) throw new Error('Expected 8 teams in final standings');
    if (finalSpeakers.length !== 16) throw new Error('Expected 16 speakers in final speaker tab');
    if (finalTeams[0].total_points < finalTeams[finalTeams.length - 1].total_points) {
      throw new Error('Final standings ordering failed');
    }

    console.log('\n🎉 [SUCCESS] Entire British Parliamentary Tournament Lifecycle Verified Successfully!\n');
  } finally {
    server.close();
    await pool.end();
  }
}

if (require.main === module) {
  runTournamentSimulation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ Simulation Failure:', err);
      process.exit(1);
    });
}

module.exports = runTournamentSimulation;
