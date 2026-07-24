const fs = require('fs');
const pool = require('./db');

async function loadIntoDb(domain, email) {
  const scan = JSON.parse(fs.readFileSync('scan-output.json', 'utf-8'));
  const violations = JSON.parse(fs.readFileSync('violations.json', 'utf-8'));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // upsert client — reuse if domain already exists
    const clientKey = 'client_' + Math.random().toString(36).slice(2, 10);
    const clientRes = await client.query(
      `INSERT INTO clients (domain, email, client_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (domain) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [domain, email, clientKey]
    );
    const clientId = clientRes.rows[0].id;

    // insert scan
    const scanRes = await client.query(
      `INSERT INTO scans (client_id, raw_result) VALUES ($1, $2) RETURNING id`,
      [clientId, JSON.stringify(scan)]
    );
    const scanId = scanRes.rows[0].id;

    // insert violations
    for (const v of violations) {
      await client.query(
        `INSERT INTO violations (scan_id, rule, severity, detail) VALUES ($1, $2, $3, $4)`,
        [scanId, v.rule, v.severity, v.detail]
      );
    }

    await client.query('COMMIT');
    console.log(`Loaded scan for ${domain} — client_id: ${clientId}, scan_id: ${scanId}, ${violations.length} violations inserted.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Load failed, rolled back:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

loadIntoDb('organicindia.com', 'test@example.com');
