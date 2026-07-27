# Scalable Chat Load Assets

These scripts validate the approved scalable-chat ops surfaces without pulling
in external load-test tooling.

## Package scripts

- `pnpm ops:chat:smoke`
- `pnpm ops:chat:load`
- `pnpm ops:chat:stress`
- `pnpm ops:chat:metrics`

## Defaults

- `smoke` targets `GET /api/health`
- `load` and `stress` target `POST /api/chat` when auth headers are provided
- without auth material, `load` and `stress` fall back to `GET /api/health`

## Useful environment variables

- `LOAD_BASE_URL=http://localhost:3000`
- `LOAD_CHAT_SCENARIO=chat|health|health-metrics|hermes-sessions|hermes-runs`
- `LOAD_AUTH_COOKIE=insforge_session=...`
- `LOAD_BEARER_TOKEN=...`
- `LOAD_HEADERS_JSON={"x-tenant":"staging"}`
- `LOAD_ADMIN_KEY=...`
- `LOAD_REQUEST_BODY={"messages":[...]}`
- `LOAD_CONCURRENCY=12`
- `LOAD_DURATION_SECONDS=90`
- `LOAD_MAX_REQUESTS=250`
- `LOAD_ASSERT_MAX_P95_MS=2500`
- `LOAD_ASSERT_MAX_ERROR_RATE=0.03`
- `LOAD_ASSERT_MAX_RATE_LIMIT_RATE=0.10`

## Example

```bash
LOAD_BASE_URL=http://localhost:3000 \
LOAD_AUTH_COOKIE="insforge_session=..." \
LOAD_ASSERT_MAX_P95_MS=2500 \
LOAD_ASSERT_MAX_ERROR_RATE=0.05 \
pnpm ops:chat:load
```

## What the summary includes

- total request count
- success/error/rate-limit rate
- p50/p95/p99 latency
- per-status distribution
- top transport or HTTP errors
