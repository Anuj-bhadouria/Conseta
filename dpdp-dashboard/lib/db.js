const { Pool } = require('pg');

const pool = new Pool({
  user: 'dpdp_user',
  password: 'aj',   // move to .env.local before sharing/committing
  host: 'localhost',
  port: 5432,
  database: 'dpdp_scanner'
});

module.exports = pool;
