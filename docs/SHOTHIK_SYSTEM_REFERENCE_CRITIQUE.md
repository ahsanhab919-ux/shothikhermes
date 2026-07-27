# Shothik System Reference Critique

## Purpose

This document evaluates the proposed "Shothik Work — System Design Reference"
against the current Shothik architecture direction.

This is intentionally critical.

The question is not:

- "Is this architecture impressive?"

The real question is:

- "Which parts should Shothik actually adopt now, which parts should be
  staged later, and which parts are currently overbuilt or misaligned?"

## Related Documents

- `docs/CHAT_COST_EFFICIENT_SYSTEM_ARCHITECTURE.md`
- `docs/CHAT_EXECUTION_POLICY_AND_COST_MODEL.md`
- `docs/CHAT_PLAN_TIER_MATRIX.md`
- `docs/CHAT_DEPLOYMENT_TOPOLOGY_AND_ROLLOUT.md`
- `docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md`
- `docs/PRD.md`

## Executive Judgment

The reference architecture is strong in ambition and contains several good
decisions.

However, taken literally, it is too large and too operationally heavy for
Shothik's current stage.

The biggest honest issue is this:

- it mixes a good target-state system design
- with several day-1 infra choices that would overcomplicate delivery

For Shothik, the right move is:

- adopt the high-value structural choices
- delay the expensive and coordination-heavy platform pieces
- keep Hermes as a modular monolith first

## Overall Verdict

### Adopt now

- Cloudflare edge protection and routing
- PostgreSQL + pgvector as the core durable store
- Redis for ephemeral state, quotas, session support, and streaming support
- R2/object storage for blobs and exports
- 3-lane or 3-tier inference strategy in principle
- ephemeral sandbox as the first execution-grade feature
- human approval before sensitive publish-like actions
- Kafka or event bus concepts for important async workflows, but not necessarily
  a huge event-first platform on day 1

### Adapt later

- browser-local WebGPU inference
- mobile app-specific offline execution flows
- Elasticsearch + CDC search architecture
- Graphiti + Mnemis + graph DB memory stack
- gRPC between services
- Kubernetes HPA and service mesh
- full observability stack at the proposed scale

### Reject for now

- microservices-first decomposition
- Istio early
- TigerGraph or Neo4j as a near-term requirement
- Kafka-everywhere as an immediate platform dependency
- a live terminal as a first execution product
- assuming high-end WebGPU/local model availability for mainstream users

## Decision-by-Decision Critique

## 01. Client Tier

### Browser / WebGPU / WebLLM

Verdict:

- **Adopt as opportunistic enhancement, not as a baseline**

What is good:

- local inference can reduce cost
- IndexedDB model cache is sensible
- browser-local latency for some tasks is attractive

What is not honest enough in the reference:

- requiring `navigator.gpu + >=6GB RAM` is not a realistic mainstream baseline
  for many BD/IN users
- a local 7B-class experience is still device-fragile and not dependable enough
  to anchor the core product

Shothik decision:

- keep browser-local inference optional
- do not make it part of the core product promise

### Mobile App

Verdict:

- **Good direction, but not core to the current architecture decision**

What is good:

- React Native single codebase is reasonable
- SSE + push strategy is practical
- biometric auth is product-sensible

What is overstated:

- offline shell queues as Kafka events is too implementation-specific too early

Shothik decision:

- mobile should consume the same Hermes execution policies
- but mobile-specific transport details are phase-later concerns

### PWA

Verdict:

- **Adopt**

What is good:

- background sync
- shell caching
- offline draft state in IndexedDB

Shothik decision:

- this is a high-value, low-regret investment

### Offline Shell

Verdict:

- **Adapt heavily**

What is good:

- offline command intent queueing is a useful idea
- capturing behavioral signals for future agent assistance is interesting

What is weak:

- "flush to PostgreSQL as behavioral_events on reconnect" may create a lot of
  noisy data without clear product value
- "Second Me reads these for autonomous tasks" is a very strong claim and can
  become creepy, operationally noisy, or legally sensitive if not handled very
  carefully

Shothik decision:

- keep offline action queueing
- be much more conservative about keystroke/behavior capture
- do not build "behavioral exhaust ingestion" before clear consent and value

## 02. CDN & Edge

### Cloudflare CDN / R2 / WAF / Workers

Verdict:

- **Adopt**

This aligns strongly with the Shothik direction.

What is good:

- Cloudflare for ingress and protection is right
- R2 is strong for blob-heavy workloads
- Workers for request shaping and edge auth is aligned

What to keep in check:

- do not let Workers become the real orchestrator

Shothik decision:

- yes to Cloudflare
- yes to Workers
- yes to R2
- keep Hermes as the brain

## 03. Security Perimeter

### Rate Limiting / IP Filters / Bot Detection / CORS / CSRF

Verdict:

- **Mostly adopt**

What is good:

- Redis-backed rate limiting
- layered bot/fraud defense
- clear CORS/CSRF posture
- per-tier quotas

What to be careful about:

- country allowlists can create needless friction if too rigid
- aggressive IP logic can punish legitimate VPN or diaspora traffic

Shothik decision:

- adopt the layered model
- avoid hard geopolitical restrictions unless abuse data justifies them

## 04. API Gateway

### JWT / Gateway / Circuit Breaker / TLS

Verdict:

- **Adopt in spirit**

What is good:

- RS256 access/refresh separation is good
- circuit breaker thinking is healthy
- versioned API paths are fine

What is overbuilt:

- Kong / Envoy / transcoding / Socket cluster language is more detailed than
  Shothik needs at this stage

Shothik decision:

- keep auth and gateway policy strong
- do not jump to heavyweight gateway complexity before product traffic forces it

## 05. Load Balancer & Orchestration

### ALB / Nginx / K8s HPA / Istio

Verdict:

- **Mostly defer**

What is good:

- health checks
- autoscaling ideas
- zero-trust service-to-service communication as a target state

What is not right yet:

- Kubernetes + Istio + full mesh is too much for the current stage
- this clashes with the modular monolith guidance already established for Hermes

Shothik decision:

- use Dockerized deployment and sane health checks first
- only move toward K8s and service mesh when scale and team complexity justify it

## 06. Microservices Layer

### Auth / User / Session / Subscription

Verdict:

- **Adopt the domain concepts, not the microservice count**

What is good:

- these are correct business capabilities
- quotas and subscriptions belong close to execution policy

What is overbuilt:

- turning each one into an isolated service too early

Shothik decision:

- model them as Hermes or backend modules first
- extract later if evidence supports it

### Twin / Second Me / Writing Tools

Verdict:

- **Adopt selectively**

What is strong:

- inbound agent versus outbound agent distinction is useful
- writing tools as separable capabilities is sensible

What needs caution:

- "Second Me" autonomy expands risk and trust burden significantly
- do not combine autonomy, earnings, publication, and implicit behavioral
  ingestion too early

Shothik decision:

- prioritize assisted workflows before autonomous economic actors

### Writing Studio

Verdict:

- **Mostly adopt**

What is strong:

- TipTap
- Y.js for collaboration
- KaTeX
- layout-aware doc intake

This fits the broader Shothik direction well.

## 07. Event Bus — Kafka

Verdict:

- **Adapt later**

What is good:

- replayable eventing for payment, notification, and artifact workflows is good
- DLQ discipline is healthy

What is too much right now:

- making Kafka the immediate center of everything

Shothik decision:

- use async eventing patterns where needed
- introduce Kafka when async load and cross-service event volume actually justify it
- do not force Kafka as a prerequisite for the whole product

## 08. Data Tier

### PostgreSQL 16 + pgvector + RLS

Verdict:

- **Strong adopt**

This is one of the best parts of the reference.

Why:

- it fits the SQL-first recommendation
- pgvector avoids premature vector sprawl
- RLS is a strong isolation boundary

Shothik decision:

- yes, this should remain central

### Redis 7

Verdict:

- **Adopt**

Why:

- it already aligns with the current Hermes streaming and quota direction

### Elasticsearch + Debezium CDC

Verdict:

- **Adapt later**

What is good:

- strong search stack for marketplace and documents

What is too much now:

- Debezium + Kafka + ES as a mandatory early stack is heavy

Shothik decision:

- start with simpler search paths
- adopt ES/CDC when search scale and freshness requirements justify it

### Graphiti + Mnemis + Neo4j / TigerGraph

Verdict:

- **Interesting, but too ambitious near-term**

What is good:

- the concept of cross-session consistency and long-horizon reasoning is real

What is not honest enough:

- this stack is very complex operationally
- graph memory sounds strategically powerful, but it is not an early
  requirement for getting Shothik chat, documents, and execution right

Shothik decision:

- defer graph-heavy memory
- use simpler durable memory + artifact history first

## 09. LLM Inference — 3 Tier

### Browser -> Edge GPU -> Cloud fallback

Verdict:

- **Adopt the pattern, not the literal stack**

This is directionally right.

What is strong:

- local first when available
- cheap edge/local inference next
- cloud fallback last

What needs realism:

- not all users will have workable browser GPU
- not all workloads justify edge GPU complexity on day one

Shothik decision:

- yes to 3-tier inference strategy
- keep it policy-driven and opportunistic
- do not hardwire the product around optimistic client hardware assumptions

## 10. Observability & CI/CD

### Prometheus / Grafana / ELK / Sentry / Jaeger / ArgoCD

Verdict:

- **Adopt selectively**

What is good:

- structured logs
- trace correlation
- Sentry
- basic metrics and alerting

What is overbuilt:

- full observability stack all at once
- full GitOps + mesh-grade operational platform too early

Shothik decision:

- start with a slimmer observability baseline
- add more stack depth only as operational pain demands it

## Key Architecture Decisions — Honest Scorecard

### SQL-first with PostgreSQL + pgvector

- **Strong yes**

### Redis TTL on ephemeral state

- **Strong yes**

### gRPC between internal services

- **Later, not now**

### Kafka for all async events

- **No for now; yes selectively later**

### 3-tier LLM strategy

- **Yes in principle**

### pgvector for behavioral memory

- **Yes carefully; avoid creepy data collection**

### Cloudflare R2 for blob storage

- **Yes**

### bKash + Razorpay

- **Yes, strategically strong**

### Row-Level Security in PostgreSQL

- **Strong yes**

### RS256 short access + rotating refresh

- **Yes**

### Istio mTLS between all pods

- **Later**

### Human approval before agent publication

- **Strong yes**

## Best Parts To Steal Immediately

If I had to pick the highest-value near-term imports from this reference:

1. SQL-first durable core with pgvector + RLS
2. Cloudflare + R2 edge/storage posture
3. 3-tier inference as a policy pattern
4. Redis-backed quotas and ephemeral state
5. sandbox-first execution instead of terminal-first execution
6. hard human approval gates for sensitive outbound agent actions

## Biggest Overbuild Risks

These are the parts most likely to slow Shothik down if adopted too literally:

1. microservices-first decomposition
2. Kafka everywhere
3. Kubernetes + Istio + full mesh early
4. graph memory stack too early
5. assuming browser-local inference is broadly reliable
6. terminal-first product thinking

## Final Recommendation

The reference architecture is valuable as a target-state inspiration layer.

It is not the right literal implementation plan for Shothik today.

The honest Shothik version should be:

- Cloudflare edge
- Hermes modular monolith
- PostgreSQL + pgvector + Redis + R2
- local/cheap inference where possible
- sandbox-first execution
- terminal later
- graph-heavy memory later
- microservice extraction only after contracts and load justify it

That is the version that preserves the intelligence of the reference while
avoiding unnecessary operational drag.
