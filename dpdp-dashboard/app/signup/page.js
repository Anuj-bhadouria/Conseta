'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Signup failed');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <main style={{ maxWidth: '360px', margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Sign up</h1>
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
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px' }}>
          {loading ? 'Signing up…' : 'Sign up'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
