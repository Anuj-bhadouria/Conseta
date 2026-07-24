'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanForm() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Scan failed');
      } else {
        setUrl('');
        setEmail('');
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="example.com"
        value={url}
        onChange={e => setUrl(e.target.value)}
        required
        style={{ padding: '8px', flex: 1 }}
      />
      <input
        type="email"
        placeholder="client email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ padding: '8px', flex: 1 }}
      />
      <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Scanning… (may take ~30s)' : 'Run Scan'}
      </button>
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </form>
  );
}
