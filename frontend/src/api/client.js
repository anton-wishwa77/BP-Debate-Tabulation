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

  // Matches
  getMatchById: (matchId) => client.get(`/matches/${matchId}`),

  // Teams & Judges (read-only for public hub)
  getTeams: () => client.get('/teams'),
  getJudges: () => client.get('/judges'),
};

export default client;
