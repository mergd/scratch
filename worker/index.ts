export interface Env {
  ASSETS: Fetcher;
  FEEDBACK: KVNamespace;
}

const FEEDBACK_KEY = 'last-payload';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const raw = await env.FEEDBACK.get(FEEDBACK_KEY);
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    }
    return json({ payload });
  }

  if (request.method === 'POST') {
    try {
      const text = await request.text();
      const parsed = text ? JSON.parse(text) : null;
      await env.FEEDBACK.put(FEEDBACK_KEY, JSON.stringify(parsed));
      return json({ ok: true });
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/feedback') {
      return handleFeedback(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
