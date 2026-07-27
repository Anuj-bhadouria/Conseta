export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.set(
    'Set-Cookie',
    `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
  return response;
}
