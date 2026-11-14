import { EmailMessage } from "cloudflare:email";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function subscribe(request, env, ctx) {
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

  const result = await env.DB.prepare(
    'INSERT OR IGNORE INTO subscribers (email, source, country, referer) VALUES (?, ?, ?, ?)'
  ).bind(
    email,
    String(form.get('tag') || '').slice(0, 64),
    request.cf?.country || null,
    String(form.get('ref') || '').slice(0, 500) || null,
  ).run();

  if (result.meta.changes > 0) ctx.waitUntil(notify(env, email, request.cf?.country, String(form.get('ref') || '')));

  return json({ ok: true });
}

async function notify(env, email, country, ref) {
  const from = 'waitlist@timglas.app';
  const to = 'necantarelli@gmail.com';
  const body = [`New Timglas waitlist signup: ${email}`, `Country: ${country || 'unknown'}`, `Source: ${ref || 'direct'}`].join('\n');
  const raw = [
    `From: Timglas waitlist <${from}>`,
    `To: ${to}`,
    `Subject: New waitlist signup: ${email}`,
    `Message-ID: <${crypto.randomUUID()}@timglas.app>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');
  try { await env.NOTIFY.send(new EmailMessage(from, to, raw)); } catch (e) { console.error('notify failed', e); }
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/subscribe') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
      return subscribe(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};
