---
name: discord-webhook-proxy
description: Provision and use the public Scratch Cloudflare Discord webhook proxy without exposing Discord webhook tokens to browser code. Use when adding Discord delivery to Scratch feedback, registering or rotating a Discord webhook, deploying feedbackproxy.yet-to-be.com, or troubleshooting proxy delivery.
---

# Discord webhook proxy

Treat a Discord webhook URL as a secret. Never add it to frontend code, checked-in configuration, issue comments, or command output.

1. Locate `proxy/index.ts` and `proxy/wrangler.toml`; deploy the dedicated Worker at `feedbackproxy.yet-to-be.com` rather than exposing a direct browser-to-Discord integration.
2. Create a dedicated `WEBHOOKS` KV namespace and update its ID in the Worker configuration.
3. Register the Discord URL with `POST /v1/register`. Save only the returned opaque `endpoint` in application configuration.
4. Pass that endpoint to `ScratchFeedback` as `webhookUrl`. Verify delivery with a benign feedback event.

The proxy accepts any public HTTPS target, while rejecting private, loopback, link-local, credential-bearing, and redirected destinations. Send original JSON to generic targets; format only Discord webhook targets and disable `allowed_mentions`. Use the configured Cloudflare Worker rate-limit bindings (10 registrations/IP/minute; 60 deliveries/IP-and-endpoint/minute), choose unique namespace IDs, and add a zone-level WAF ceiling before public launch. Keep upstream failures generic so neither the stored URL nor response leaks to callers.

To rotate or revoke an endpoint, register a new URL, update the app to the new endpoint, and delete the old `discord-webhook:<id>` value from the configured KV namespace.
