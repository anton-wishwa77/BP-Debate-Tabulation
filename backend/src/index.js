const express = require('express');
const cors = require('cors');
require('dotenv').config();

const teamRoutes = require('./routes/teamRoutes');
const judgeRoutes = require('./routes/judgeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const roundRoutes = require('./routes/roundRoutes');
const matchRoutes = require('./routes/matchRoutes');
const standingsRoutes = require('./routes/standingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/teams', teamRoutes);
app.use('/api/judges', judgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/standings', standingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized error-handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
