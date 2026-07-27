'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Login failed');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <main style={{ maxWidth: '360px', margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px' }}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p style={{ marginTop: '1rem' }}>
        No account? <Link href="/signup">Sign up</Link>
      </p>
    </main>
  );
}
