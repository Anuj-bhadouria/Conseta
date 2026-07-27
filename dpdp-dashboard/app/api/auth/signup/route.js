import pool from '../../../../lib/db';
import { hashPassword, signToken } from '../../../../lib/auth';

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  try {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const res = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
      [email, passwordHash]
    );
    const user = res.rows[0];

    const token = signToken({ userId: user.id, email: user.email });

    const response = Response.json({ ok: true, email: user.email });
    response.headers.set(
      'Set-Cookie',
      `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
    );
    return response;
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
