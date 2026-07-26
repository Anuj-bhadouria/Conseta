import { createHash } from 'crypto';
import pool from '../../../lib/db';

export async function POST(request) {
  const { client_key, choice } = await request.json();

  if (!client_key || !choice) {
    return Response.json({ error: 'client_key and choice are required' }, { status: 400 });
  }
  if (!['accept', 'reject', 'partial'].includes(choice)) {
    return Response.json({ error: 'choice must be accept, reject, or partial' }, { status: 400 });
  }

  try {
    const clientRes = await pool.query(`SELECT id FROM clients WHERE client_key = $1`, [client_key]);
    if (clientRes.rows.length === 0) {
      return Response.json({ error: 'Unknown client_key' }, { status: 404 });
    }
    const clientId = clientRes.rows[0].id;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');

    await pool.query(
      `INSERT INTO consent_logs (client_id, choice, ip_hash) VALUES ($1, $2, $3)`,
      [clientId, choice, ipHash]
    );

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
