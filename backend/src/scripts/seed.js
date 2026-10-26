// Proxy script forwarding to backend/src/db/seed.js
const seed = require('../db/seed');

if (require.main === module) {
  seed({ closePool: true }).catch(() => process.exit(1));
}

module.exports = seed;
