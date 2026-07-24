const pool = require('../../../lib/db');

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.domain,
        c.email,
        s.id AS scan_id,
        s.scanned_at,
        COUNT(v.id) FILTER (WHERE v.severity = 'fail') AS fail_count,
        COUNT(v.id) FILTER (WHERE v.severity = 'flag') AS flag_count,
        COUNT(v.id) FILTER (WHERE v.severity = 'pass') AS pass_count
      FROM clients c
      LEFT JOIN LATERAL (
        SELECT * FROM scans WHERE client_id = c.id ORDER BY scanned_at DESC LIMIT 1
      ) s ON true
      LEFT JOIN violations v ON v.scan_id = s.id
      GROUP BY c.id, c.domain, c.email, s.id, s.scanned_at
      ORDER BY s.scanned_at DESC NULLS LAST
    `);

    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
