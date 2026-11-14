const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function subscribe(request, env) {
  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  // Honeypot: real people never see this field. Pretend it worked.
  if (form.get('website')) return json({ ok: true });

  const email = String(form.get('email') || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return json({ ok: false, error: 'invalid_email' }, 400);

  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: String(form.get('cf-turnstile-response') || ''),
      remoteip: request.headers.get('cf-connecting-ip') || '',
    }),
  }).then(r => r.json());
  if (!verify.success) return json({ ok: false, error: 'challenge_failed' }, 403);

  await env.DB.prepare(
    'INSERT OR IGNORE INTO subscribers (email, source, country, referer) VALUES (?, ?, ?, ?)'
  ).bind(
    email,
    String(form.get('tag') || '').slice(0, 64),
    request.cf?.country || null,
    String(form.get('ref') || '').slice(0, 500) || null,
  ).run();

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/subscribe') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
      return subscribe(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
