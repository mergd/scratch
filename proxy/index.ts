export interface Env {
  WEBHOOKS: KVNamespace;
  REGISTRATION_LIMIT: RateLimit;
  DELIVERY_LIMIT: RateLimit;
}

const KEY_PREFIX = 'discord-webhook:';
const MAX_BODY_BYTES = 256 * 1024;
const DISCORD_HOSTS = new Set([
  'discord.com',
  'discordapp.com',
  'canary.discord.com',
  'ptb.discord.com',
]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

type RegisteredTarget = { url: string; discord: boolean };

function isPrivateAddress(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  // Do not accept IP-literal IPv6 targets. It avoids IPv4-mapped and private
  // IPv6 bypasses; ordinary public hostnames may still resolve to IPv6.
  if (host.includes(':') || host === 'localhost' || host.endsWith('.localhost')) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = ipv4.slice(1).map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function parseTargetUrl(value: unknown): RegisteredTarget | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' || url.username || url.password || isPrivateAddress(url.hostname)
    ) return null;
    url.hash = '';
    return {
      url: url.toString(),
      discord: DISCORD_HOSTS.has(url.hostname) && /^\/api\/webhooks\/\d+\/[^/]+$/.test(url.pathname),
    };
  } catch {
    return null;
  }
}

function isId(value: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
}

function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

function discordMessage(payload: Record<string, unknown>): Record<string, unknown> {
  const event = typeof payload.event === 'string' ? payload.event : 'feedback';
  const description = typeof payload.output === 'string' ? payload.output
    : typeof payload.markdown === 'string' ? payload.markdown
      : JSON.stringify(payload);
  return {
    content: 'New Scratch feedback',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: `Scratch: ${truncate(event, 200)}`,
      description: truncate(description, 4_096),
      timestamp: new Date().toISOString(),
    }],
  };
}

async function register(request: Request, env: Env): Promise<Response> {
  const limited = await env.REGISTRATION_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' });
  if (!limited.success) return json({ error: 'Too many registrations' }, 429);
  const body = await readJsonObject(request);
  const target = parseTargetUrl(body?.webhookUrl);
  if (!target) return json({ error: 'webhookUrl must be a public HTTPS URL' }, 400);
  const id = crypto.randomUUID();
  await env.WEBHOOKS.put(`${KEY_PREFIX}${id}`, JSON.stringify(target));
  return json({ endpoint: new URL(`/v1/${id}`, request.url).toString() }, 201);
}

async function forward(request: Request, env: Env, id: string): Promise<Response> {
  if (!isId(id)) return json({ error: 'Not found' }, 404);
  const limited = await env.DELIVERY_LIMIT.limit({ key: `${request.headers.get('CF-Connecting-IP') ?? 'unknown'}:${id}` });
  if (!limited.success) return json({ error: 'Too many requests' }, 429);
  const body = await readJsonObject(request);
  if (!body) return json({ error: 'Expected a JSON object smaller than 256 KB' }, 400);
  const stored = await env.WEBHOOKS.get<RegisteredTarget>(`${KEY_PREFIX}${id}`, 'json');
  if (!stored) return json({ error: 'Not found' }, 404);
  try {
    const response = await fetch(stored.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stored.discord ? discordMessage(body) : body),
      redirect: 'manual',
    });
    if (!response.ok) return json({ error: 'Webhook delivery failed' }, 502);
  } catch {
    return json({ error: 'Webhook delivery failed' }, 502);
  }
  return json({ ok: true }, 202);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return corsResponse();
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/v1/register') return register(request, env);
    const match = url.pathname.match(/^\/v1\/([^/]+)$/);
    if (request.method === 'POST' && match) return forward(request, env, match[1]);
    return json({ error: 'Not found' }, 404);
  },
};
