# Chat Research, Retrieval, And Recommendation Stack

## Purpose

This document recommends how Shothik should combine:

- Firecrawl
- Crawl4AI
- Scrapling
- SearXNG
- Typesense
- Vespa
- Phoenix (`xai-org/x-algorithm/phoenix`)

The goal is not to choose a single "best" tool.

The goal is to build an enterprise-grade chat experience where:

- open-web discovery is strong
- targeted crawling and extraction are reliable
- internal/private retrieval is fast and relevant
- intent-aware targeted query routing exists before retrieval
- RAG is grounded in the right corpus for the turn
- graph retrieval can support relationships, lineage, and multi-hop reasoning
- the user experience feels personalized, proactive, and alive

## Executive Recommendation

Do **not** force one tool to do every job.

Shothik should split the stack into four layers:

1. **Open-web discovery**
2. **Targeted crawl and extraction**
3. **Private/product retrieval**
4. **Ranking and recommendation**

Under Hermes, these layers should be preceded by an explicit:

5. **Intent-aware retrieval policy**

Recommended near-term stack:

- **Hermes intent router** for targeted query planning
- **SearXNG** for open-web discovery
- **Firecrawl** as the primary crawl/extract API
- **PostgreSQL + pgvector** for durable semantic retrieval
- **Typesense** for fast product and workspace search UX
- **Hermes** as the orchestrator and ranking brain

Recommended later additions:

- **Crawl4AI** for self-hosted, lower-cost, custom crawling pipelines
- **Scrapling** for hard anti-bot or adaptive-selector scraping cases
- **Vespa** for elite large-scale hybrid retrieval, ranking, and recommendation
- **Knowledge graph layer** for relationship-heavy reasoning and provenance

Recommended conceptual inspiration:

- **Phoenix** as the ranking architecture pattern, not as a drop-in product

## Why This Split Is Better

These tools solve different problems.

Treating them as substitutes for one another creates bad architecture.

### Discovery is not crawling

SearXNG finds candidate URLs.

### Intent routing is not search

Hermes should decide what kind of search the turn needs before calling search.

### Crawling is not retrieval

Firecrawl, Crawl4AI, and Scrapling fetch and structure content.

### Retrieval is not recommendation

Typesense, pgvector, and later Vespa help retrieve and rank content.

### RAG is not a single database

RAG should query different corpora depending on intent, not dump everything
into one undifferentiated vector index.

### Knowledge graph is not a replacement for RAG

Graph retrieval helps with relationships, lineage, entities, and multi-hop
reasoning. It should complement semantic retrieval, not replace it.

### Recommendation is not orchestration

Hermes decides which source, retrieval path, and execution strategy should be
used for a given chat turn.

## Retrieval Policy Layer

Before Shothik performs search or retrieval, Hermes should classify the turn.

That classification should decide:

- what the user is trying to do
- which corpus should be searched first
- whether the query needs keyword search, semantic retrieval, graph traversal,
  or blended retrieval
- whether the answer should come from private workspace data, public web data,
  or both

This is the difference between:

- generic search

and:

- intent-aware targeted query search

### Recommended retrieval intents

At minimum, Hermes should detect these classes:

1. **Known-item lookup**
   - "find that PDF"
   - "open the presentation about X"
   - use keyword and metadata search first

2. **Workspace knowledge lookup**
   - "what did we decide last week?"
   - "summarize the current project direction"
   - use private semantic retrieval first

3. **Open-web research**
   - "research competitors"
   - "find the latest docs"
   - use SearXNG first, then crawl/extract

4. **Entity and relationship reasoning**
   - "which author cites this paper repeatedly?"
   - "how does this concept connect to that prior document?"
   - use graph retrieval or blended graph + semantic retrieval

5. **Recommendation / proactive surfacing**
   - "what should I read next?"
   - "what artifact is most relevant now?"
   - use ranking and recommendation logic across multiple candidate sources

6. **Action-grounded retrieval**
   - "prepare a report from the latest sources"
   - "generate slides from the most relevant documents"
   - use blended retrieval with artifact-aware ranking

### Query planning rule

Hermes should rewrite the user query into a retrieval plan, not just forward
the raw prompt to a search tool.

That plan should contain:

- intent type
- preferred sources
- retrieval mode
- freshness requirements
- trust/authority weighting
- personalization scope
- cost budget

## Where Intent-Aware Targeted Query Search Fits

Recommended role:

- **Hermes-owned retrieval planning layer**

Implementation guidance:

- Hermes classifies the turn first
- Hermes routes to:
  - Typesense for exact/metadata/known-item search
  - pgvector for semantic workspace retrieval
  - SearXNG for open-web discovery
  - graph retrieval for relationship-heavy questions
  - blended retrieval when the question crosses boundaries

What this prevents:

- using web search for private workspace questions
- using vector search when exact metadata lookup is better
- retrieving irrelevant corpora just because they are indexed

Decision:

- **Adopt now as part of Hermes routing**

## Where RAG Fits

Recommended role:

- **Grounded answer generation over targeted corpora**

Shothik should not treat RAG as one global index.

It should maintain multiple retrieval domains:

- workspace documents
- artifacts and runs
- conversation/session memory
- extracted web research
- product/help/docs knowledge
- user-level preferences and profile memory

Recommended RAG pattern:

1. Hermes identifies intent
2. Hermes selects one or more corpora
3. Retrieval runs in the correct mode:
   - keyword
   - semantic
   - hybrid
   - graph-assisted
4. evidence is ranked and filtered
5. final grounded response is generated

Recommended current implementation:

- **PostgreSQL + pgvector** as the main semantic layer
- **Typesense** for exact and user-facing search
- **SearXNG + Firecrawl** for open-web RAG source acquisition
- **Hermes** to enforce corpus-aware retrieval policy

Recommended later implementation:

- **Vespa** when hybrid retrieval and ranking become core differentiators

Decision:

- **Adopt now, but as multi-corpus targeted RAG**

## Where Knowledge Graph Fits

Recommended role:

- **Relationship and provenance retrieval layer**

Knowledge graph is most valuable when Shothik needs to answer:

- how two concepts are connected
- who influenced what
- where a claim came from
- how entities relate across documents, runs, and artifacts
- what changed across time or versions

Best use cases in Shothik:

- citation lineage
- concept mapping across research notes
- artifact dependency graphs
- people/project/entity relationship reasoning
- document intelligence and structured semantic objects

What the graph should model:

- entities
- concepts
- documents
- artifacts
- citations
- authors
- claims
- evidence links
- version and provenance relationships

What the graph should **not** try to do first:

- replace full-text search
- replace vector retrieval
- become the only memory system

Recommended timing:

- build graph-ready contracts now
- defer full graph infra until relationship-heavy workflows justify it

Likely long-term fit:

- graph-backed retrieval beside pgvector and Typesense
- Hermes chooses graph traversal when the intent is relational or lineage-heavy

Decision:

- **Adapt later, but design for it now**

## Tool-By-Tool Recommendation

## 1. Firecrawl

Recommended role:

- **Primary crawl and extraction service**

Why:

- API-first and language-agnostic
- directly useful for agent workflows
- strong fit for turning URLs and sites into LLM-ready content
- easier to integrate from multiple services than a Python-only library

Best use cases in Shothik:

- user asks chat to research a topic on the open web
- user shares a URL and wants it summarized or converted into structured notes
- research pipeline needs clean markdown or extracted JSON from a page or site
- fast ingestion for artifact creation

Strengths:

- fast path to production
- good fit for Hermes tools and agent-accessible APIs
- easier cross-language integration

Weaknesses:

- less infrastructure control than a fully self-hosted Python-native crawler
- can become more expensive at scale than a custom self-hosted pipeline

Decision:

- **Adopt now**

## 2. Crawl4AI

Recommended role:

- **Secondary self-hosted crawler for custom and cost-sensitive pipelines**

Why:

- open source
- Python-native
- flexible for custom extraction logic
- better fit when Shothik wants to own more of the crawling stack

Best use cases in Shothik:

- scheduled research ingestion for known domains
- custom extraction pipelines tightly coupled to Python processing
- lower-cost self-hosted crawl jobs where the team accepts operational overhead

Strengths:

- strong control and transparency
- good for custom pipelines
- attractive long-run economics for predictable crawling loads

Weaknesses:

- more operational burden
- less natural for non-Python services
- slower path to immediate multi-service adoption than Firecrawl

Decision:

- **Add later**

## 3. Scrapling

Recommended role:

- **Specialized fallback crawler for hard scraping cases**

Why:

- adaptive selectors
- stealthier fetchers
- Scrapy-like crawling primitives
- useful when sites are brittle, dynamic, or hostile

Best use cases in Shothik:

- high-DOM-drift sites
- anti-bot-heavy targets
- hard extraction paths where Firecrawl and Crawl4AI become unreliable

Strengths:

- adaptive scraping
- strong Python scraping ergonomics
- useful specialized fallback

Weaknesses:

- should not become the default ingestion path for the whole product
- adds another crawler style and another operational mental model

Decision:

- **Use selectively, not as the default**

## 4. SearXNG

Recommended role:

- **Open-web metasearch gateway**

Why:

- aggregates multiple search services
- privacy-friendly
- self-hostable
- useful for research and discovery inside chat

Best use cases in Shothik:

- user asks "research this topic"
- user wants broad open-web discovery before deep crawl/extract
- retrieval policy needs multiple source candidates before content acquisition
- intent router needs open-web candidate generation, not final ranking

Strengths:

- good discovery layer
- avoids dependency on a single search provider
- useful for research-oriented chat

Weaknesses:

- not a full internal retrieval engine
- not a replacement for product search
- not a recommendation engine

Decision:

- **Adopt now**

## 5. Typesense

Recommended role:

- **Fast product and workspace search UX**

Why:

- excellent for typo-tolerant search
- low-friction developer experience
- strong for in-app search, autocomplete, and interactive UX

Best use cases in Shothik:

- search chat history
- search artifacts, templates, notes, skills, commands, and workspaces
- command palette and instant workspace search
- user-facing app search that needs to feel fast
- known-item and metadata-heavy lookup in targeted retrieval plans

Strengths:

- easy to deploy and reason about
- strong UX layer for search-as-you-type
- cheaper and simpler than jumping directly to a heavyweight search platform

Weaknesses:

- not the deepest ranking engine
- not ideal as the final large-scale recommendation system
- not the best end-state for complex hybrid retrieval and ranking

Decision:

- **Adopt now**

## 6. Vespa

Recommended role:

- **Advanced large-scale hybrid retrieval, ranking, and recommendation engine**

Why:

- unifies vector, text, structured filtering, ranking, and model-aware serving
- designed for search and recommendation together
- appropriate when relevance and personalization become first-class platform
  differentiators

Best use cases in Shothik:

- advanced personalized retrieval
- hybrid search over large corpora
- real-time recommendation and relevance ranking
- enterprise-grade agent retrieval where quality matters more than simplicity
- future graph-adjacent or multi-signal ranking where many candidate sources
  must be blended in one engine

Strengths:

- strongest long-term option in this list for search + recommendation
- better end-state than Typesense for large-scale ranking and personalization
- relevant if Shothik wants a truly elite retrieval layer later

Weaknesses:

- heavier to operate
- more complex than Shothik currently needs
- wrong first move if core chat and ingestion paths are not yet mature

Decision:

- **Adopt later, only after chat and ingestion stabilize**

## 7. Phoenix

Recommended role:

- **Architectural pattern for ranking and recommendation**

Why:

- Phoenix separates candidate generation from ranking
- the overall `x-algorithm` system uses a mixer/orchestrator and multiple
  candidate sources
- this is directly useful for Shothik chat ranking and proactive surfacing

What to borrow:

- multi-source candidate generation
- query hydration before ranking
- blending and filtering before final selection
- dedicated ranking stage rather than naive "take the first search result"
- recommendation as a first-class layer after retrieval, not a UI afterthought

What not to do:

- do not attempt to transplant the X feed system into Shothik literally
- do not confuse social-feed ranking with enterprise chat orchestration

Decision:

- **Use as inspiration, not as a direct dependency**

## Recommended Architecture For Shothik

```text
User Turn
   |
   v
Hermes Orchestrator
   |
   +--> Intent-aware retrieval planning
   |       - route by query intent
   |       - choose source domains
   |       - choose keyword / semantic / graph / hybrid mode
   |
   +--> Open-web discovery
   |       - SearXNG
   |
   +--> Crawl / extract
   |       - Firecrawl (primary)
   |       - Crawl4AI (secondary)
   |       - Scrapling (fallback)
   |
   +--> Internal retrieval
   |       - PostgreSQL + pgvector
   |       - Typesense
   |       - graph-ready document and artifact relations
   |
   +--> Advanced ranking / recommendation
           - Hermes mixer now
           - Vespa later
           - Phoenix-inspired ranking logic
```

## How Each Layer Should Work

## Layer 1: Open-Web Discovery

Use:

- **SearXNG**

Flow:

- user asks a research or discovery question
- Hermes calls SearXNG to gather candidate links
- Hermes filters candidates by intent, freshness, authority, and topic fit

Why:

- lets Shothik discover before it crawls

## Layer 0: Intent-Aware Retrieval Planning

Use:

- **Hermes retrieval planner**

Flow:

- user asks a question
- Hermes classifies the intent
- Hermes chooses sources, retrieval mode, and cost budget
- only then does the system call search or retrieval tools

Why:

- this prevents indiscriminate search
- this is where targeted query behavior actually lives

## Layer 2: Crawl And Extraction

Use:

- **Firecrawl** first
- **Crawl4AI** second
- **Scrapling** only when needed

Flow:

- Firecrawl handles mainstream URL-to-content extraction
- Crawl4AI handles custom Python-native or self-hosted pipelines
- Scrapling handles specialized difficult targets

Why:

- one clean default path
- one customizable cost-optimized path
- one specialist fallback

## Layer 3: Private And Product Retrieval

Use:

- **PostgreSQL + pgvector**
- **Typesense**
- **graph-ready relation store now, graph engine later**

Flow:

- pgvector stores semantic recall for documents, artifacts, workspace objects,
  and retrieved web content
- Typesense powers instant user-facing search, autocomplete, filters, and
  workspace exploration

Why:

- pgvector is the durable semantic memory layer
- Typesense is the fast experience layer
- graph relationships should become available for lineage and multi-hop questions

## Layer 4: Ranking And Recommendation

Use:

- **Hermes mixer**
- **Phoenix-inspired ranking pattern**
- **Vespa later**

Flow:

- Hermes gathers candidates from:
  - session memory
  - workspace artifacts
  - user history
  - internal documents
  - web results
  - extracted pages
- Hermes then ranks and blends these sources
- later, Vespa can replace or augment the ranking backbone for complex hybrid
  retrieval and personalization

Why:

- this makes the experience feel alive, relevant, and proactive

## What Makes The Experience Feel "Vibrant"

A vibrant enterprise chat experience does not come from crawling alone.

It comes from:

1. **Good candidate generation**
   - the system sees more than one possible relevant source

2. **Intent-aware query planning**
   - the system looks in the right place before it retrieves

3. **Good ranking**
   - the best source wins, not the most recently indexed one

4. **Cross-source blending**
   - web + private docs + artifact history + user context work together

5. **Memory-aware retrieval**
   - the system knows what the user, workspace, and run already contain

6. **Relationship-aware retrieval**
   - the system can follow citations, dependencies, and entity links when needed

7. **Proactive surfacing**
   - suggest artifacts, sources, and next actions before the user asks perfectly

Phoenix matters here because it reinforces a useful design pattern:

- do not treat ranking as an afterthought

## Recommended Adoption Order

## Phase 1

Adopt:

- Hermes retrieval planner
- SearXNG
- Firecrawl
- PostgreSQL + pgvector
- Typesense
- Hermes ranking/mixing layer

Why:

- fastest path to an enterprise-grade research and retrieval surface

## Phase 2

Add:

- Crawl4AI

Why:

- more custom crawl control
- lower-cost self-hosted pipelines for recurring jobs

## Phase 3

Add:

- Scrapling for specialized targets

Why:

- only if hard targets justify the additional complexity

## Phase 4

Add:

- Vespa
- graph infrastructure if relationship-heavy workflows become core

Why:

- when Shothik needs truly advanced large-scale ranking, hybrid retrieval, and
  recommendation quality

## Final Recommendation

If Shothik wants an enterprise-grade chat experience now, the most pragmatic
stack is:

- **Hermes retrieval planner** for intent-aware targeted query routing
- **SearXNG** for discovery
- **Firecrawl** for ingestion
- **Typesense** for instant product search UX
- **PostgreSQL + pgvector** for semantic retrieval
- **Hermes** as the mixer and decision-maker

Then later:

- **Crawl4AI** for self-hosted custom pipelines
- **Scrapling** for specialist scraping
- **Vespa** for top-tier ranking and recommendation
- **Knowledge graph infrastructure** for relational and provenance-heavy
  retrieval

The single most important design rule is:

- **Hermes decides which layer to use**

None of these tools should become the real product brain.

They are inputs to the chat system.

Hermes remains the orchestrator that turns them into a coherent user
experience.

## Source Notes

The recommendation above is based on:

- Firecrawl official docs: `https://docs.firecrawl.dev/`
- Crawl4AI official docs: `https://docs.crawl4ai.com/`
- SearXNG official docs: `https://docs.searxng.org/`
- Typesense official docs: `https://typesense.org/docs/guide/`
- Vespa official site and use cases: `https://vespa.ai/`
- xAI `x-algorithm` repository and Phoenix overview:
  `https://github.com/xai-org/x-algorithm/`
