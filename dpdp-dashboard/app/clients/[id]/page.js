import Link from 'next/link';
import ReportButton from '../../ReportButton';
import pool from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';

async function getClientData(id, userId) {
  const clientRes = await pool.query(`SELECT * FROM clients WHERE id = $1 AND user_id = $2`, [id, userId]);
  if (clientRes.rows.length === 0) {
    return { error: 'Client not found' };
  }

  const scanRes = await pool.query(
    `SELECT * FROM scans WHERE client_id = $1 ORDER BY scanned_at DESC LIMIT 1`,
    [id]
  );

  if (scanRes.rows.length === 0) {
    return { client: clientRes.rows[0], scan: null, violations: [] };
  }

  const violationsRes = await pool.query(
    `SELECT * FROM violations WHERE scan_id = $1 ORDER BY
      CASE severity WHEN 'fail' THEN 1 WHEN 'flag' THEN 2 ELSE 3 END`,
    [scanRes.rows[0].id]
  );

  return {
    client: clientRes.rows[0],
    scan: scanRes.rows[0],
    violations: violationsRes.rows
  };
}

const severityColor = { fail: 'red', flag: 'orange', pass: 'green' };

export default async function ClientDetail({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const data = await getClientData(id, user.userId);

  if (data.error) {
    return <main style={{ padding: '2rem' }}>{data.error}</main>;
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <Link href="/">← Back to all clients</Link>
      <h1>{data.client.domain}</h1>
      <p>Email: {data.client.email}</p>

      {data.scan ? (
        <>
          <p>Last scanned: {new Date(data.scan.scanned_at).toLocaleString()}</p>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '8px' }}>Rule</th>
                <th style={{ padding: '8px' }}>Severity</th>
                <th style={{ padding: '8px' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.violations.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{v.rule}</td>
                  <td style={{ padding: '8px', color: severityColor[v.severity], fontWeight: 'bold' }}>
                    {v.severity.toUpperCase()}
                  </td>
                  <td style={{ padding: '8px' }}>{v.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReportButton clientId={id} />
        </>
      ) : (
        <p>No scans yet for this client.</p>
      )}
    </main>
  );
}
