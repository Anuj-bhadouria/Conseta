import Link from 'next/link';

async function getClients() {
  const res = await fetch('http://localhost:3000/api/clients', { cache: 'no-store' });
  return res.json();
}

export default async function Home() {
  const clients = await getClients();

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>DPDP Compliance Dashboard</h1>

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
