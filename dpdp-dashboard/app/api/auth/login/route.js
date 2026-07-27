import pool from '../../../../lib/db';
import { verifyPassword, signToken } from '../../../../lib/auth';

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 });
  }

  try {
    const res = await pool.query(`SELECT id, email, password_hash FROM users WHERE email = $1`, [email]);
    if (res.rows.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = res.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

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
