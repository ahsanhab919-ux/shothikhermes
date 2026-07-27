# Hostinger VPS Deployment Runbook

This runbook targets the Hostinger VPS already inspected in hPanel:

- Host: `srv1808169.hstgr.cloud`
- IPv4: `187.127.125.115`
- Shape observed: `2 vCPU`, about `7.8 GiB` RAM, about `90 GiB` free disk
- Existing Hostinger Docker project: `hermes-agent-sepx`
- Existing compose path on VPS: `/docker/hermes-agent-sepx/docker-compose.yml`

## What We Verified

From the Hostinger web terminal:

- OS: `Ubuntu 24.04.4 LTS`
- Docker is healthy
- Active compose project:

```bash
docker compose ls
```

- Active container:

```bash
docker ps
```

The running workload today is Hostinger's prebuilt Hermes agent image, not this repository.

## Files Added For VPS Rollout

- `docker-compose.hostinger.yml`
- `.env.hostinger.example`

These are intended for a shell-driven deployment on the VPS, not just the hPanel visual editor.

## Before Replacing The Existing Hermes App

1. Keep a backup of the current Hostinger compose project:

```bash
mkdir -p /root/backups/hermes-agent-sepx
cp /docker/hermes-agent-sepx/docker-compose.yml /root/backups/hermes-agent-sepx/docker-compose.yml.bak
```

2. Copy this repository onto the VPS.

Recommended target:

```bash
mkdir -p /opt/shothik-web-mirror-v2
```

3. Create the VPS env file from the example:

```bash
cp .env.hostinger.example .env.hostinger
```

4. Fill `.env.hostinger` with real values from the local secure environment, especially:

- Convex URL + deploy key
- InsForge public keys
- JWT private key
- Stripe keys
- at least one LLM provider key

## Build And Start On The VPS

From the repo directory on the VPS:

```bash
docker compose -f docker-compose.hostinger.yml --env-file .env.hostinger build
docker compose -f docker-compose.hostinger.yml --env-file .env.hostinger up -d
```

## Verify Before Cutover

1. Raw port health check:

```bash
curl http://127.0.0.1:3000/api/health
```

2. Container state:

```bash
docker compose -f docker-compose.hostinger.yml ps
docker compose -f docker-compose.hostinger.yml logs app --tail=200
```

3. Database reachability:

```bash
docker compose -f docker-compose.hostinger.yml exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

## Replace The Existing Hostinger Hermes App

Only do this after the new stack is healthy.

```bash
docker compose -p hermes-agent-sepx -f /docker/hermes-agent-sepx/docker-compose.yml down
```

If the new stack should take over the same public hostname, update the `APP_HOST` value in `.env.hostinger` and redeploy the `app` service so Traefik points at this repository instead of the current Hostinger Hermes image.

## Important Current Blocker

Infrastructure is ready, but the application is not yet fully production-ready:

- the repo has a Dockerfile but did not yet have a VPS compose stack
- the chat runtime still has a known backend blocker around the missing `hermes_workspaces` Postgres relation in the current local flow
- there is no remote git origin yet, so rollout needs either:
  - a repository copy onto the VPS, or
  - an image build/push pipeline

## Recommended Next Execution Order

1. finish the app deployment bundle and env mapping
2. copy the repo to the VPS or create an image publishing path
3. boot the new compose stack beside the current Hermes app
4. validate `/api/health` and authenticated chat
5. remove the old `hermes-agent-sepx` workload after the new stack is healthy
