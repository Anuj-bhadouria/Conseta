import pool from '../../../lib/db';
import { scanSite } from '../../../lib/scanner';
import { checkRules } from '../../../lib/ruleEngine';
import { getCurrentUser } from '../../../lib/auth';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { url, email } = await request.json();

  if (!url) {
    return Response.json({ error: 'URL is required' }, { status: 400 });
  }

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  const domain = fullUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  let scan;
  try {
    scan = await scanSite(fullUrl);
  } catch (err) {
    return Response.json({ error: `Scan failed: ${err.message}` }, { status: 500 });
  }

  const violations = checkRules(scan);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const clientKey = 'client_' + Math.random().toString(36).slice(2, 10);
    const clientRes = await client.query(
      `INSERT INTO clients (domain, email, client_key, user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (domain, user_id) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [domain, email || 'unknown@example.com', clientKey, user.userId]
    );
    const clientId = clientRes.rows[0].id;

    const scanRes = await client.query(
      `INSERT INTO scans (client_id, raw_result) VALUES ($1, $2) RETURNING id`,
      [clientId, JSON.stringify(scan)]
    );
    const scanId = scanRes.rows[0].id;

    for (const v of violations) {
      await client.query(
        `INSERT INTO violations (scan_id, rule, severity, detail) VALUES ($1, $2, $3, $4)`,
        [scanId, v.rule, v.severity, v.detail]
      );
    }

    await client.query('COMMIT');
    return Response.json({ clientId, scanId, violations });
  } catch (err) {
    await client.query('ROLLBACK');
    return Response.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
