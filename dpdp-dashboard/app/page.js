import Link from 'next/link';
import ScanForm from './ScanForm';
import LogoutButton from './LogoutButton';
import pool from '../lib/db';
import { getCurrentUser } from '../lib/auth';

async function getClients(userId) {
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
    WHERE c.user_id = $1
    GROUP BY c.id, c.domain, c.email, s.id, s.scanned_at
    ORDER BY s.scanned_at DESC NULLS LAST
  `, [userId]);
  return result.rows;
}

export default async function Home() {
  const user = await getCurrentUser();
  const clients = await getClients(user.userId);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>DPDP Compliance Dashboard</h1>
        <LogoutButton />
      </div>
      <ScanForm />

      {clients.length === 0 && <p>No clients yet.</p>}

      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '8px' }}>Domain</th>
            <th style={{ padding: '8px' }}>Last Scanned</th>
            <th style={{ padding: '8px' }}>Fails</th>
            <th style={{ padding: '8px' }}>Flags</th>
            <th style={{ padding: '8px' }}>Pass</th>
            <th style={{ padding: '8px' }}></th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{c.domain}</td>
              <td style={{ padding: '8px' }}>
                {c.scanned_at ? new Date(c.scanned_at).toLocaleString() : '—'}
              </td>
              <td style={{ padding: '8px', color: 'red' }}>{c.fail_count}</td>
              <td style={{ padding: '8px', color: 'orange' }}>{c.flag_count}</td>
              <td style={{ padding: '8px', color: 'green' }}>{c.pass_count}</td>
              <td style={{ padding: '8px' }}>
                <Link href={`/clients/${c.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
