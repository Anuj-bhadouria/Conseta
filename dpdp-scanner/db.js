const { Pool } = require('pg');

const pool = new Pool({
  user: 'dpdp_user',
  password: 'aj',   // move to .env before committing/sharing code
  host: 'localhost',
  port: 5432,
  database: 'dpdp_scanner'
});

module.exports = pool;
