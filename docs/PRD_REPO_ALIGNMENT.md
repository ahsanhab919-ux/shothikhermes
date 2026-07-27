# PRD To Repository Alignment

## Purpose

This document maps the Shothik AI Workspace PRD to the current `shothik-web` repository so product planning is grounded in actual code, persistence, and runtime behavior.

It answers four questions:

1. Which product surfaces already exist in the repo?
2. Which surfaces have real persistence and backend contracts?
3. Which surfaces are partially implemented or rely on fragile service boundaries?
4. Which PRD assumptions should be treated as migration goals rather than current reality?

## Executive Read

The repository is already a broad product platform, not a prototype shell.

What is clearly real today:

- writing tools
- book writing and publishing
- community/forums
- Twin
- slides
- sheets
- research
- AI detector
- plagiarism checker
- marketplace

What exists today mostly as embedded capability rather than a distinct product surface:

- citation generation
- code execution

What the repo does well already:

- multiple end-user surfaces are routed and rendered in production-facing pages
- there is meaningful persistence in Convex for books, projects, conversations, Twin, community, marketplace, billing, and publishing
- chat persistence already has a stronger contract than several other AI workflows

What remains fragmented:

- slide workflows rely on separate external slide-service contracts
- sheet workflows rely on separate stream/history models
- event vocabularies differ by feature
- artifact persistence is inconsistent across product surfaces
- there is no single run/artifact contract spanning the full workspace

## Alignment Matrix

| Product Surface | Repo Evidence | Current State | PRD Implication |
| --- | --- | --- | --- |
| Writing tools | `app/(primary-layout)/writing-studio/page.jsx`, `components/writing-studio/*`, `components/tools/writing-studio/*`, `convex/projects.ts`, `convex/writing.ts`, `convex/schema.ts` (`projects`, `projectVersions`, `versions`, `writingAutosaves`) | Strong, productized | This is already a major workspace domain and should be treated as a first-class artifact domain, not a later add-on |
| Book write to publish | `app/api/book/*`, `app/api/books/*`, `app/api/publish/*`, `convex/books.ts`, `convex/publishing.ts`, `convex/schema.ts` (`books`, `chapters`, `chapterAttempts`, `distributionRecords`, `payouts`, `authorTaxInfo`) | Strong, productized, with real workflow state | The PRD should model this as a fully material workflow with runs, checkpoints, versions, export, and publishing states |
| Community | `app/(primary-layout)/community/page.tsx`, `app/(primary-layout)/community/[forumId]/page.tsx`, `convex/forums.ts`, `convex/channels.ts`, `convex/reputation.ts`, `convex/schema.ts` (`forums`, `forum_posts`, `forum_chat`, `forum_reactions`, `forum_reservations`) | Strong, productized social domain | Community is not just a side feature. It is a persistent network surface that should integrate with artifacts and Twin actions |
| Twin | `app/(primary-layout)/twin/page.tsx`, `app/api/twin/*`, `convex/twin.ts`, `convex/secondMe.ts`, `convex/schema.ts` (`twins`, `twin_tasks`, `twin_knowledge`, `twin_activity_log`, approvals and transfer tables) | Strong, productized agent domain | Twin should be modeled as an agent/platform subsystem, not merely another artifact type |
| Slides | `app/(primary-layout)/slide-generation/page.tsx`, `app/(slide-layout)/slides/page.jsx`, `components/presentation/*`, `services/slide-generation.ts`, `services/presentation/*` | Real user-facing product, but orchestration is fragmented | Slides are the right launch slice because they expose the contract problem clearly and already have visible progress UX |
| Sheets | `components/sheet/*`, `services/sheetService.js`, `services/sheetAiStreamService.js`, `app/api/sheet/*` | Real surface, but backend contract is inconsistent and partly legacy | Sheets should be in the unified run model early, likely right after slides |
| Deep research | `app/(primary-layout)/research/page.jsx`, `components/research/*`, `components/tools/research/*`, `app/api/research/chat/*` | Real product surface with chat/history patterns | Research should be treated as an artifact-producing workflow, not only as chat |
| AI detector | `app/(primary-layout)/ai-detector/page.tsx`, `app/api/ai-detector/check/route.ts`, `app/api/tools/ai-detector/route.ts`, `services/ai-detector.service.ts` | Real tool surface with route/service implementation | AI detector can become a report artifact domain under the artifact engine |
| Plagiarism checker | `app/(primary-layout)/plagiarism-checker/page.jsx`, `app/api/tools/plagiarism/*`, `components/plagiarism/*`, `services/plagiarismService.ts` | Real tool surface with report-style outputs | Plagiarism is already artifact-like and fits the run/report/version model well |
| Citation generator | `services/citationDetector.ts`, `lib/citation-lookup.js`, `lib/reference-list.ts`, extensive writing-studio citation UI | Strong capability, but not a clearly separate top-level product route | In the PRD this is better framed as a capability inside writing, research, and plagiarism rather than a standalone workspace surface unless product wants a dedicated route |
| Code execution | No dedicated top-level route or standalone domain module found; related execution exists in Twin tasks, agent workflows, and MCP/client integrations | Weak as a standalone product surface; present more as a capability | The PRD should distinguish code execution capability from a fully productized code workspace unless a new surface is planned |
| Marketplace | `app/(primary-layout)/marketplace/page.tsx`, `app/(primary-layout)/books/[bookId]/page.tsx`, `convex/marketplace.ts`, `convex/books.ts`, `convex/schema.ts` (`contentPurchases`, `starBalances`, `starTransactions`) | Strong, productized commercial domain | Marketplace is a real business surface and must be preserved in the architecture, even if it is not part of the launch artifact slice |

## Domain-By-Domain Notes

## 1. Writing Tools

The repository already contains a substantial writing workspace with:

- project dashboard
- editor surfaces
- autosave behavior
- project typing for `book`, `research`, and `assignment`
- version history
- citation-aware writing flows
- export-related capabilities

Evidence:

- `app/(primary-layout)/writing-studio/page.jsx`
- `components/writing-studio/*`
- `components/tools/writing-studio/*`
- `convex/schema.ts` tables for `projects`, `projectVersions`, `versions`, `writingAutosaves`

PRD interpretation:

Writing is already an artifact-centered domain. The future architecture should normalize it under the same run/artifact model as slides and sheets rather than inventing a separate writing-specific contract.

## 2. Book Write To Publish

The book domain is more mature than a simple document tool. It includes:

- book creation and retrieval routes
- asynchronous authoring runs
- chapter generation attempts
- export and validation routes
- publishing and distribution state
- tax, payout, and marketplace linkage

Evidence:

- `app/api/book/[id]/run/route.ts`
- `app/api/book/[id]/status/route.ts`
- `app/api/book/[id]/export/route.ts`
- `app/api/books/export/*`
- `app/api/publish/*`
- `convex/schema.ts` book, chapter, payout, distribution, and earnings tables

PRD interpretation:

This is already a workflow engine candidate. It should be a major reference when designing runs, checkpoints, long-running execution, and failure recovery.

## 3. Community

Community is implemented as a persistent forum system with:

- forum creation
- posts
- chat
- reactions
- reservations
- publication states
- channel organization

Evidence:

- `app/(primary-layout)/community/*`
- `convex/forums.ts`
- `convex/channels.ts`
- `convex/schema.ts` forum tables

PRD interpretation:

Community should remain visible in the target architecture as a durable interaction surface connected to artifacts and Twin. It should not be reduced to “marketing” or “engagement garnish.”

## 4. Twin

Twin is a serious subsystem with:

- registration and claim flows
- lifecycle and verification
- tasks
- knowledge
- permissions
- transfers
- activity logs
- forum and book interactions

Evidence:

- `app/(primary-layout)/twin/page.tsx`
- `app/api/twin/*`
- `convex/twin.ts`
- `convex/schema.ts` Twin tables

PRD interpretation:

Twin belongs in the backend orchestration story, but as an agent-control and identity system, not as a simple artifact type. It likely needs integration with the run model while remaining its own domain.

## 5. Slides

Slides are clearly productized at the UI layer and expose the repo’s orchestration fragmentation:

- dedicated generation page
- dedicated slide layout pages
- preview and editing UI
- SSE progress handling
- external slide-service dependency

Evidence:

- `app/(primary-layout)/slide-generation/page.tsx`
- `app/(slide-layout)/slides/page.jsx`
- `components/presentation/*`
- `services/slide-generation.ts`
- `services/presentation/PresentationOrchestrator.js`
- `services/presentation/PresentationSSEService.js`

PRD interpretation:

Slides are the right launch slice for unifying visible execution, artifact persistence, and handoff from chat into a workspace.

## 6. Sheets

Sheets are real, but the contract is currently split between:

- frontend stateful chat UI
- separate sheet stream service
- separate session/history route
- separate persistence models

Evidence:

- `components/sheet/*`
- `services/sheetService.js`
- `services/sheetAiStreamService.js`
- `app/api/sheet/chat/get_my_chats/route.ts`
- `app/api/sheet/session/[chatId]/history/route.ts`

PRD interpretation:

Sheets should be one of the first domains migrated into the unified run/event contract after slides.

## 7. Deep Research

Research already has:

- dedicated route
- dedicated UI system
- research chat history routes
- references-aware rendering

Evidence:

- `app/(primary-layout)/research/page.jsx`
- `components/research/*`
- `components/tools/research/*`
- `app/api/research/chat/*`

PRD interpretation:

Research should evolve from a streamed answer surface into a durable research artifact model with source bundles, notes, outputs, and resumable runs.

## 8. AI Detector

AI detector is implemented as a proper tool surface with:

- dedicated route
- API routes
- service adapter
- history and section operations in the service layer

Evidence:

- `app/(primary-layout)/ai-detector/page.tsx`
- `app/api/ai-detector/check/route.ts`
- `app/api/tools/ai-detector/route.ts`
- `services/ai-detector.service.ts`

PRD interpretation:

This domain fits naturally into a persistent report artifact model.

## 9. Plagiarism Checker

Plagiarism is also a real product domain, not just an API wrapper:

- dedicated route
- multiple analyze flows
- source-search sessions
- citation verification
- report UI

Evidence:

- `app/(primary-layout)/plagiarism-checker/page.jsx`
- `app/api/tools/plagiarism/*`
- `components/plagiarism/*`
- `services/plagiarismService.ts`

PRD interpretation:

Plagiarism outputs should likely become durable report artifacts with versions, source attachments, and review states.

## 10. Citation Generator

Citation functionality is widespread, but mostly embedded inside writing and plagiarism flows:

- citation detection
- citation lookup
- reference list generation
- citation panels in writing studio
- citation verification inside plagiarism

Evidence:

- `services/citationDetector.ts`
- `lib/citation-lookup.js`
- `lib/reference-list.ts`
- `components/tools/writing-studio/components/CitationSuggestionPanel.jsx`
- `components/plagiarism/CitationAnalysisPanel.tsx`

PRD interpretation:

Today this is better described as a cross-cutting capability rather than a clearly separate top-level product surface. If product wants it standalone, that would be a forward-looking expansion, not a current repo truth.

## 11. Code Execution

I did not find a dedicated top-level code execution workspace, route family, or persistence domain. What does exist:

- execution semantics inside Twin tasks
- agent/task execution code
- MCP and tool-client integrations
- some browser/agent style execution patterns

Evidence:

- `app/api/twin/tasks/execute/route.ts`
- `lib/twin/task-executor.ts`
- `lib/services/MCPClient.ts`
- `lib/mcp/*`

PRD interpretation:

Code execution should currently be framed as a platform capability, not as a proven standalone workspace surface. If a coding workspace is planned, it is still an architecture target rather than a repo-established product.

## 12. Marketplace

Marketplace is clearly implemented as a commercial surface:

- marketplace browse page
- book detail and purchase flow
- credit pricing
- content purchases
- seller earnings views

Evidence:

- `app/(primary-layout)/marketplace/page.tsx`
- `app/(primary-layout)/books/[bookId]/page.tsx`
- `convex/marketplace.ts`
- `convex/books.ts`
- `components/credits/MyLibrarySection.tsx`
- `components/credits/ContentSalesCard.tsx`

PRD interpretation:

Marketplace is a real product pillar and should remain in scope for architecture preservation, even if it is outside the initial orchestration migration slice.

## Cross-Cutting Repository Findings

## 1. Persistence Is Mixed

The repo uses multiple persistence patterns:

- Convex for many core domains
- Postgres-backed chat persistence in `lib/chat/server.ts`
- Mongoose models in some sheet-related paths
- external service state for slide/sheet generation

PRD implication:

The unified run/artifact model must account for a mixed migration path. It cannot assume a single source of truth on day one.

## 2. Chat Is Ahead Of Other AI Flows

Chat already has:

- persisted conversations
- persisted messages
- streaming response handling
- surface-aware conversation context

Evidence:

- `app/api/chat/route.ts`
- `lib/chat/server.ts`

PRD implication:

Chat can act as the bootstrap surface for the future run model.

## 3. Slides And Sheets Expose The Biggest Contract Gap

Slides and sheets both stream progress, but not through one shared contract.

Evidence:

- `services/slide-generation.ts`
- `services/presentation/*`
- `services/sheetAiStreamService.js`
- `components/sheet/SheetChatArea.jsx`

PRD implication:

These are the right early migration targets.

## 4. Versions Exist, But Not Uniformly

Version-like behavior already exists in some domains:

- writing projects have version tables
- slides have local edit/version concepts
- books have chapter attempts and content-state progression

PRD implication:

The future artifact engine should consolidate and standardize version semantics rather than starting from zero.

## Recommended PRD Adjustments

## Product Boundary

The PRD should continue to represent the full platform boundary:

- writing tools
- book write to publish
- community
- Twin
- slides
- sheets
- deep research
- AI detector
- plagiarism checker
- marketplace

But it should frame these with clearer categorization:

### Artifact-First Domains

- writing tools
- books/publishing
- slides
- sheets
- research
- AI detector
- plagiarism checker

### Agent/Platform Domains

- chat
- Twin
- code execution capability
- tool registry
- memory and workflow execution

### Network/Commercial Domains

- community
- marketplace
- payments and credits

## Wording Correction For Citation And Code Execution

Current repo truth suggests:

- citation generation is a strong embedded capability, but not clearly a standalone top-level route
- code execution is a platform capability, but not clearly a dedicated end-user workspace yet

So the PRD should avoid overstating them as already productized standalone surfaces unless that is an intentional future-state decision.

## Migration Priority Recommendation

Based on the repo, the most practical migration order is:

1. `chat -> slides`
2. `sheets`
3. `writing tools + research`
4. `AI detector + plagiarism reports`
5. `books/publishing`
6. `community/Twin integration over shared artifacts`
7. `marketplace integration over artifact identity`

This order preserves the launch slice while respecting what is already structurally mature in the codebase.

## Bottom Line

The repo already supports the vision direction, but unevenly.

- The platform breadth is real.
- The persistence foundations are real.
- The business surfaces are real.
- The orchestration model is not yet unified.

So the PRD should be read as an evolution plan for an already substantial platform, not a greenfield design for a future product.
