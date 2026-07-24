const pool = require('../../../../lib/db');

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const client = await pool.query(`SELECT * FROM clients WHERE id = $1`, [id]);
    if (client.rows.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const scan = await pool.query(
      `SELECT * FROM scans WHERE client_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
      [id]
    );

    if (scan.rows.length === 0) {
      return Response.json({ client: client.rows[0], scan: null, violations: [] });
    }

    const violations = await pool.query(
      `SELECT * FROM violations WHERE scan_id = $1 ORDER BY
        CASE severity WHEN 'fail' THEN 1 WHEN 'flag' THEN 2 ELSE 3 END`,
      [scan.rows[0].id]
    );

    return Response.json({
      client: client.rows[0],
      scan: scan.rows[0],
      violations: violations.rows
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
