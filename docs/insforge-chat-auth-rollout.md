# Native InsForge Chat Auth Rollout

## Scope

This rollout covers the coordinated release of native InsForge-authenticated
chat runtime and the follow-up migration that makes `auth_user_id` the
canonical chat owner.

## Coordinated Order

1. Open and review the PR from `feat/insforge-chat-history-slice-clean`
2. Obtain required code-owner approval
3. Deploy the updated application code
4. Apply the new migration:
   - `20260714014616_adopt-native-chat-auth-ownership.sql`
5. Run post-migration verification queries

## Preflight Status

- Repo branch pushed: `feat/insforge-chat-history-slice-clean`
- Merged into personal `origin/main` via commit: `ee1fc7b`
- Latest migration committed: `20260714014616_adopt-native-chat-auth-ownership.sql`
- Validation already passed locally:
  - `eslint`
  - `tsc --noEmit`
  - `vitest` (31 passing tests)
  - `next build` with production placeholder envs

## Live Database Preflight

- Backup created successfully:
  - file: `20260714_020104.sql.gz`
- Current remote migration state:
  - `20260713104922_chat-history-base.sql`
  - `20260713184106_chat-history-userid-text.sql`
- Current data shape before migration:
  - `chat_conversations`: 1 row, 0 UUID-like `user_id` values, 1 deleted row
  - `chat_messages`: 1 row, 0 UUID-like `user_id` values
  - orphan or mismatched message ownership rows: `0`

## Why The Order Matters

The currently deployed code still expects the pre-cutover schema. Applying the
new migration first would rename live columns and change RLS ownership checks
before the updated app code is serving traffic.

## Deployment Checks

- Confirm deployment target and environment variables
- Verify native InsForge auth env values are present
- Confirm health checks after deployment
- Smoke-test:
  - sign in
  - sign up
  - open chat conversation list
  - fetch conversation detail
  - fetch message history
  - delete a message

## Local Production Smoke

- `GET /api/health`: `ok`
- `GET /api/health?deep=true`: `unhealthy` in local-only validation, caused by
  intentionally missing backend/microservice/JWT production dependencies rather
  than the chat auth slice itself

## Post-Migration Verification Queries

```sql
select count(*) as conversations_total,
       count(*) filter (where auth_user_id is null) as conversations_missing_auth_user
from public.chat_conversations;

select count(*) as messages_total,
       count(*) filter (where auth_user_id is null) as messages_missing_auth_user
from public.chat_messages;

select count(*) as mismatched_message_owner_rows
from public.chat_messages m
join public.chat_conversations c on c.id = m.conversation_id
where m.auth_user_id is distinct from c.auth_user_id;
```

## Known External Blockers

- GitHub PR creation cannot be completed from this machine until GitHub auth is
  available in `gh` or the browser session.
- Remote deployment through the available MCP path is blocked because the
  Vercel integration is missing an authentication token.
- Because remote app deployment is still blocked, the live InsForge database
  migration has not been applied yet to avoid breaking the currently deployed
  app against the pre-cutover schema.
