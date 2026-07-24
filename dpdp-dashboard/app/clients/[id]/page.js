import Link from 'next/link';

async function getClientData(id) {
  const res = await fetch(`http://localhost:3000/api/clients/${id}`, { cache: 'no-store' });
  return res.json();
}

const severityColor = { fail: 'red', flag: 'orange', pass: 'green' };

export default async function ClientDetail({ params }) {
  const { id } = await params;
  const data = await getClientData(id);

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
        </>
      ) : (
        <p>No scans yet for this client.</p>
      )}
    </main>
  );
}
