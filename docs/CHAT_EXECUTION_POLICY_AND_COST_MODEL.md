# Chat Execution Policy And Cost Model

## Purpose

This document makes the cost-efficient chat architecture operational.

`docs/CHAT_COST_EFFICIENT_SYSTEM_ARCHITECTURE.md` defines the execution lanes.

This document defines:

- how Hermes chooses a lane
- what each lane is allowed to do
- how quotas and pricing tiers should shape access
- how to keep unit economics under control while still delivering a premium
  AI workspace experience

## Related Documents

- `docs/CHAT_COST_EFFICIENT_SYSTEM_ARCHITECTURE.md`
- `docs/PRD.md`
- `docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md`
- `docs/CHAT_HERMES_MIGRATION_ANALYSIS.md`
- `docs/adr/ADR-001-run-artifact-event-contract.md`

## Policy Thesis

The chat runtime should not route turns by defaulting to the most powerful
available infrastructure.

It should route turns by:

1. user intent
2. required capability
3. safety policy
4. privacy policy
5. latency budget
6. cost budget

The key product rule is:

`use the cheapest lane that can reliably satisfy the turn`

## Lane Summary

| Lane | Name | Primary Use | Relative Cost | Default Access |
| --- | --- | --- | --- | --- |
| 0 | Cheap chat | answer, summarize, clarify, simple retrieval | lowest | all users |
| 1 | Tool chat | search, browse, citations, structured lookup | low-moderate | all users with quotas |
| 2 | Ephemeral sandbox | code, shell, conversion, build/test, execution | moderate-high | paid or quota-gated |
| 3 | Live terminal | interactive dev/debug/admin sessions | highest | premium/dev/role-gated |
| 4 | Browser-local | private/offline/local-only mode | server-cheap | opt-in experimental |

## Turn Classification Inputs

Each turn should be classified with a lightweight policy object before model
or tool execution:

```ts
type ChatExecutionIntent = {
  intentClass:
    | "answer"
    | "retrieve"
    | "tool"
    | "execute"
    | "interactive_terminal";
  complexity: "low" | "medium" | "high";
  privacyMode: "normal" | "sensitive" | "local_only";
  latencyBudget: "realtime" | "interactive" | "background";
  artifactExpectation: "none" | "possible" | "expected";
  requiresNetwork: boolean;
  requiresFilesystem: boolean;
  requiresShell: boolean;
  requiresLongLivedSession: boolean;
};
```

This object is a routing aid, not the final source of truth. Hermes still
owns the final execution decision.

## Lane Decision Matrix

### Route to Lane 0 when

- the turn is normal chat or explanation
- retrieval can answer without tools or shell
- model-only reasoning is enough
- no artifact-producing execution is required
- latency must stay low

Examples:

- explain a concept
- rewrite this paragraph
- summarize a page or conversation
- answer from cached context

### Route to Lane 1 when

- the turn needs evidence or external information
- the turn needs browsing, citations, or document lookup
- the turn may create a lightweight artifact but not through shell/code
- the user asked for research, compare, verify, or source-backed output

Examples:

- find recent sources
- compare these two papers
- cite this claim
- browse and extract structured facts

### Route to Lane 2 when

- the turn explicitly needs command execution
- the user asks to run code, build, test, install, lint, convert, scrape via CLI
- the agent needs a filesystem and shell
- execution can be bounded to a short-lived environment

Examples:

- run this Python script
- install a package and test the build
- convert a document via CLI tool
- debug a failing command sequence

### Route to Lane 3 when

- the user needs an interactive terminal, not just execution results
- the workflow needs a persistent tty session
- the user is in dev mode or admin mode
- collaborative or supervised live terminal control is required

Examples:

- open a terminal beside chat
- let me interactively debug this environment
- collaborate on a shell session in real time

### Route to Lane 4 when

- privacy/local-only mode is explicitly selected
- the task is small enough to run in-browser
- offline or near-zero cloud dependency is desired
- a degraded but private experience is acceptable

Examples:

- local-only code experiment
- offline educational shell demo
- browser-local summarization or toy workflow

## Hard Routing Rules

### Never route to Lane 3 if

- Lane 2 can satisfy the task
- the user did not ask for interactivity
- the account or role does not permit terminal access
- there is no reason to keep a server-side session alive

### Never route to frontier cloud models first if

- a cheaper local or mid-tier model can likely satisfy the turn
- the turn is retrieval-dominant rather than reasoning-dominant
- the result can be produced through tools with a small synthesis step

### Never allow Lane 2 or Lane 3 if

- the account has exhausted execution quota
- the request violates safety policy
- the request needs elevated permissions not available in the product tier

## Plan-Based Access Model

The exact pricing is a business decision, but the infrastructure policy should
assume multiple service levels.

### Free

Capabilities:

- Lane 0
- limited Lane 1
- no Lane 3
- Lane 2 only as a tightly limited trial, or disabled entirely

Policy:

- cheaper models only
- strict daily message and tool quotas
- no persistent terminal allocation
- short context windows if needed for cost control

### Pro

Capabilities:

- Lane 0
- Lane 1
- bounded Lane 2
- no default Lane 3, unless sold as add-on

Policy:

- larger quotas
- access to better model tiers
- bounded sandbox minutes per day or month
- artifact-producing execution enabled

### Power / Dev

Capabilities:

- Lane 0
- Lane 1
- Lane 2 with materially higher quotas
- Lane 3 available with policy guardrails

Policy:

- terminal minutes or concurrent session limits
- stronger audit and replay retention
- explicit execution budget warnings

### Enterprise / Team

Capabilities:

- all lanes
- configurable org-level controls
- sandbox and terminal policies by role

Policy:

- team quotas
- cost center reporting
- compliance policy overlays
- network and package allowlists by workspace or org

## Quota Model

Quotas should be tracked in Hermes at run level, not only in the edge layer.

Suggested counters:

- `messages_per_day`
- `tool_calls_per_day`
- `sandbox_runs_per_day`
- `sandbox_runtime_seconds_per_day`
- `terminal_minutes_per_day`
- `frontier_model_tokens_per_day`

Suggested run-level fields:

```ts
type ExecutionBudget = {
  lane: 0 | 1 | 2 | 3 | 4;
  maxToolCalls: number;
  maxRuntimeSeconds: number;
  maxModelTier: "cheap" | "standard" | "advanced" | "frontier";
  networkPolicy: "none" | "restricted" | "standard";
  filesystemPolicy: "none" | "ephemeral" | "persistent";
  sandboxAllowed: boolean;
  terminalAllowed: boolean;
};
```

## Downgrade Strategy

When a user exceeds quota or policy budget, Hermes should degrade gracefully.

### Preferred downgrade order

1. frontier model -> advanced model
2. advanced model -> standard model
3. Lane 2 -> Lane 1 if execution is not strictly required
4. Lane 3 -> Lane 2 if interactivity is not strictly required
5. Lane 1 -> Lane 0 if cached/retrieval-lite answer is acceptable

### User-facing downgrade copy should say

- what happened
- what still can be done
- what feature needs a higher plan or renewed quota

The system should not fail silently or merely show low-level infra errors.

## Cost-Sensitive Prompts and Routing Patterns

Hermes should proactively steer costly intent toward cheaper alternatives when
the user has not explicitly requested the expensive path.

Examples:

- if the user asks "can you check this code?" -> start with static review, not sandbox
- if the user asks "find recent papers on X" -> use tool chat, not frontier reasoning first
- if the user asks "open terminal" -> confirm interactive need and enforce plan policy
- if the user asks "run this" with a short code snippet -> use ephemeral sandbox, not a live terminal

## Latency Policy

Not all lanes have the same acceptable latency.

### Realtime

- expected for Lane 0
- first token should appear very quickly

### Interactive

- expected for Lane 1 and bounded Lane 2
- user can wait if progress is visible

### Background

- acceptable for longer sandbox workflows and future artifact jobs
- requires run timeline, resumability, and notifications

This means product UX must match lane behavior.

Do not pretend a background task is a realtime conversation turn.

## Safety And Abuse Controls

### Lane 2 sandbox controls

- per-run CPU and memory caps
- hard execution timeout
- ephemeral filesystem by default
- package install allow/deny rules
- restricted outbound network policy where possible
- log every command and terminal state transition into run history

### Lane 3 live terminal controls

- role or plan gating
- inactivity timeout
- max concurrent sessions
- no default root privileges
- session transcript retention for auditability

### Lane 4 browser-local controls

- clearly label capability limits
- do not promise full Ubuntu compatibility
- degrade to local-only best effort

## Recommended Product Packaging

The product should expose user-facing modes, not infrastructure labels.

Recommended modes:

- `Ask`
- `Research`
- `Act`
- `Dev Mode`
- `Private Local`

Behind the scenes:

- `Ask` prefers Lane 0
- `Research` prefers Lane 1
- `Act` prefers Lane 1, then Lane 2
- `Dev Mode` may use Lane 2 or Lane 3
- `Private Local` prefers Lane 4

This gives the user a clean mental model while keeping infra decisions inside
Hermes.

## Operational Metrics

To know if the system is economically healthy, track:

- lane distribution by day
- average cost per completed run
- average sandbox runtime per successful artifact
- percentage of turns escalated from cheap lanes to expensive lanes
- percentage of terminal sessions that could have been sandbox runs
- downgrade frequency by plan tier
- failure rate by lane

Red flags:

- Lane 2 or 3 usage creeping up without corresponding revenue
- too many frontier-model turns for non-premium plans
- high sandbox runtime with low artifact completion
- terminal sessions used as a substitute for normal chat

## Shothik-Specific Recommendation

For the current repo and roadmap:

1. Finish stabilizing Hermes-backed chat in Lane 0
2. Add stronger tool routing and evidence-backed responses in Lane 1
3. Make Lane 2 ephemeral sandbox the first execution-grade expansion
4. Delay Lane 3 live terminal until the execution budget, run timeline, and
   monetization controls are already working
5. Treat Lane 4 as a strategic differentiator, not a dependency

## Most Important Decision

The biggest business and systems decision is not whether terminals are cool.

It is whether Shothik is willing to make:

- ephemeral sandbox a broadly available premium capability
- live terminal a narrowly available premium or role-gated capability

That split is the cleanest way to stay powerful without destroying margins.

## Final Recommendation

The recommended operating model is:

- all users get excellent Lane 0 chat
- most users get bounded Lane 1 tools
- paid users get metered Lane 2 execution
- only advanced users get Lane 3 terminals
- selected users get Lane 4 local/private mode

That is the cost-efficient, scalable path for building a serious chat system
without making the product hostage to expensive always-on infrastructure.
