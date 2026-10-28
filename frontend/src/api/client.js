import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Global response interceptor for unified data extraction & error handling
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Standings
  getTeamStandings: () => client.get('/standings/teams'),
  getSpeakerStandings: () => client.get('/standings/speakers'),

  // Rounds & Draws
  getRounds: () => client.get('/rounds'),
  getRoundById: (roundId) => client.get(`/rounds/${roundId}`),

  // Matches & Ballots
  getMatchById: (matchId) => client.get(`/matches/${matchId}`),
  submitBallot: (matchId, ballot) => client.put(`/matches/${matchId}/ballot`, ballot),
  reassignMatchJudge: (matchId, judgeId) =>
    client.patch(`/matches/${matchId}/adjudicator`, { judge_id: judgeId }),

  // Judge Authentication & Assigned Matches
  loginJudge: (credentials) => client.post('/judges/login', credentials),
  getJudgeMatches: (judgeId) => client.get(`/judges/${judgeId}/matches`),

  // Teams
  getTeams: () => client.get('/teams'),
  getTeamById: (id) => client.get(`/teams/${id}`),
  getTeamStats: (id) => client.get(`/teams/${id}/stats`),
  createTeam: (team) => client.post('/teams', team),
  updateTeam: (id, team) => client.put(`/teams/${id}`, team),
  deleteTeam: (id) => client.delete(`/teams/${id}`),
  addSwingTeams: () => client.post('/teams/swing'),

  // Judges
  getJudges: () => client.get('/judges'),
  createJudge: (judge) => client.post('/judges', judge),
  updateJudge: (id, judge) => client.put(`/judges/${id}`, judge),
  deleteJudge: (id) => client.delete(`/judges/${id}`),

  // Rounds & Draw Administration
  getAdminRounds: () => client.get('/admin/rounds'),
  generateRound: (data) => client.post('/rounds/generate', data),
  updateRound: (id, data) => client.patch(`/rounds/${id}`, data),
  deleteRound: (id) => client.delete(`/rounds/${id}`),

  // Admin Authentication & Maintenance
  loginAdmin: (credentials) => client.post('/admin/login', credentials),
  seedDatabase: () => client.post('/admin/seed'),
  resetDatabase: () => client.post('/admin/reset'),
};

export default client;
