# Chat Plan Tier Matrix

## Purpose

This document translates the chat execution policy into a practical packaging
model for Shothik.

It does not lock final commercial pricing.

It defines:

- recommended plan shapes
- which execution lanes each plan can access
- example quota envelopes
- margin guardrails
- upgrade and downgrade behavior

## Related Documents

- `docs/CHAT_COST_EFFICIENT_SYSTEM_ARCHITECTURE.md`
- `docs/CHAT_EXECUTION_POLICY_AND_COST_MODEL.md`
- `docs/PRD.md`
- `docs/PRD_REPO_ALIGNMENT.md`

## Packaging Thesis

The product should not price "messages" alone.

It should package a mix of:

- reasoning access
- tool access
- execution access
- interactive terminal access
- artifact throughput

The key business rule is:

- sell Lane 2 as the mainstream premium value
- sell Lane 3 as the advanced or specialist value

This keeps the product powerful without making every user expensive.

## Recommended Plans

### 1. Free

Positioning:

- strong everyday AI workspace chat
- enough to experience the product
- not enough to turn the product into a high-cost execution backend

Best for:

- first-time users
- students exploring basic use
- casual Q&A and lightweight research

### 2. Pro

Positioning:

- serious artifact and execution-capable workspace
- main plan for power knowledge workers

Best for:

- students doing repeated academic workflows
- researchers
- professionals needing bounded code or document execution

### 3. Dev / Power

Positioning:

- high-control execution workspace
- developer and technical operator plan

Best for:

- coding-heavy users
- debugging workflows
- terminal-driven or sandbox-heavy use

### 4. Team / Enterprise

Positioning:

- governed multi-user workspace
- org quotas, policy controls, billing clarity

Best for:

- schools
- research groups
- startups
- internal teams

## Lane Access Matrix

| Plan | Lane 0 Cheap Chat | Lane 1 Tool Chat | Lane 2 Sandbox | Lane 3 Live Terminal | Lane 4 Browser-Local |
| --- | --- | --- | --- | --- | --- |
| Free | full | bounded | off or tiny trial | off | optional experimental |
| Pro | full | strong | metered | add-on or off | optional |
| Dev / Power | full | strong | high quota | on with limits | optional |
| Team / Enterprise | full | strong | configurable | configurable | optional |

## Example Quota Envelopes

These are not final pricing promises. They are starting envelopes for product
and infra planning.

### Free

- Lane 0 messages/day: `50-150`
- Lane 1 tool calls/day: `5-20`
- Lane 2 sandbox runs/day: `0-3`
- Lane 2 sandbox runtime/day: `0-120 seconds`
- Lane 3 terminal: `not available`
- frontier reasoning: `very limited or off`

Design intent:

- enough to feel useful
- not enough to create sustained compute abuse

### Pro

- Lane 0 messages/day: `200-1000`
- Lane 1 tool calls/day: `40-150`
- Lane 2 sandbox runs/day: `10-40`
- Lane 2 sandbox runtime/day: `15-60 minutes total`
- Lane 3 terminal: `off by default or small paid add-on`
- frontier reasoning: `bounded`

Design intent:

- this should be the mainstream paid plan
- enough execution to make Shothik meaningfully better than plain chat

### Dev / Power

- Lane 0 messages/day: `500-2000`
- Lane 1 tool calls/day: `100-400`
- Lane 2 sandbox runs/day: `25-100`
- Lane 2 sandbox runtime/day: `60-240 minutes total`
- Lane 3 terminal: `15-120 minutes total`, or low concurrent-session caps
- frontier reasoning: `higher but still governed`

Design intent:

- strong technical workflow support
- explicit execution-heavy packaging

### Team / Enterprise

- org-level pooled quotas
- role-based lane access
- org sandbox budget
- org terminal budget
- optional private deployment or dedicated execution nodes

Design intent:

- policy flexibility matters more than simple per-user caps

## Recommended Upgrade Path

### Free -> Pro

Upgrade trigger:

- user repeatedly hits tool or sandbox limits
- user wants artifact-grade execution
- user wants larger context and better models

Messaging:

- "Unlock execution and artifact workflows"
- "Get metered sandbox runs for documents, code, and CLI tasks"

### Pro -> Dev / Power

Upgrade trigger:

- user asks for terminal sessions
- user consistently consumes sandbox quotas
- user has coding/debugging-heavy behavior

Messaging:

- "Unlock developer mode and higher execution quotas"
- "Add interactive terminal sessions and larger runtime budgets"

### Team / Enterprise

Upgrade trigger:

- audit requirements
- shared workspaces
- centralized billing
- role-based execution controls

Messaging:

- "Give your team governed execution and shared workspace operations"

## Margin Guardrails

These are not finance-grade formulas, but they are strong operating rules.

### Guardrail 1

Free plan must stay overwhelmingly in Lane 0 and Lane 1.

If Free users spend sustained time in Lane 2, the plan will become unhealthy.

### Guardrail 2

Pro should monetize Lane 2, not Lane 3.

Lane 2 is the most valuable general-purpose premium feature because it is:

- broadly useful
- easier to isolate
- easier to meter
- cheaper than live terminals

### Guardrail 3

Lane 3 must be explicit.

Live terminal should be:

- premium
- time-bounded
- role-gated
- observable in billing and analytics

### Guardrail 4

Frontier cloud reasoning should never become the default premium value.

It should be:

- bounded
- selectively invoked
- escalated only when needed

Otherwise the product becomes model-cost-led instead of value-led.

## Unit Economics Heuristics

The system should be monitored with a few simple heuristics:

### Healthy pattern

- most runs resolve in Lane 0
- a meaningful but bounded number escalate to Lane 1
- Lane 2 is high-value and monetized
- Lane 3 usage is rare but premium

### Warning pattern

- Free users repeatedly reaching Lane 2
- Pro users using terminal as if it were unlimited
- too many frontier-model turns for low-revenue plans
- high sandbox time with low artifact completion

### Critical pattern

- lane escalation happens by default rather than by need
- live terminal becomes a substitute for all execution
- plan pricing is flatter than infrastructure cost curves

## Artifact Packaging Opportunity

A strong way to improve economics is to package outcomes, not just raw compute.

Examples:

- chat to deck
- chat to notes
- chat to structured document
- chat to code patch
- chat to research brief

This works because users perceive value in the artifact, not in the number of
CPU seconds consumed.

## Recommended Defaults

If Shothik had to launch a first practical packaging model, I would recommend:

### Free

- excellent Lane 0
- bounded Lane 1
- no real terminal
- little or no Lane 2 except trial

### Pro

- strong Lane 0
- strong Lane 1
- meaningful Lane 2 quotas
- terminal sold separately or reserved for a higher tier

### Dev / Power

- high Lane 2 quotas
- bounded Lane 3 terminal
- explicit execution-first positioning

This is the cleanest path for cost control.

## Product Language Recommendation

Avoid explaining infrastructure directly in pricing pages.

Prefer user-facing language like:

- AI chat
- research tools
- action mode
- execution minutes
- developer mode
- private local mode

Under the hood, these map to the lanes.

## Most Important Product Decision

The highest-leverage packaging decision is:

- whether Lane 2 sandbox is included in Pro by default
- and whether Lane 3 terminal is reserved for Dev / Power

My recommendation:

- **yes** to Lane 2 in Pro
- **no** to Lane 3 in Pro by default

That gives the product a strong premium step-up without turning the mainstream
paid plan into an expensive always-on terminal service.

## Final Recommendation

The most cost-efficient scalable packaging model is:

- Free = great chat, light tools
- Pro = serious workspace with metered sandbox execution
- Dev / Power = execution-heavy plan with terminal access
- Enterprise = policy-governed org deployment

That structure matches the actual cost curves of the architecture better than
message-only or flat "all features for all paid users" pricing.
