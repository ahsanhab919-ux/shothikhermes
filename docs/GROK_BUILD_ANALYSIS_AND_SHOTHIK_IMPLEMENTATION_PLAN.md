# Grok-Build Analysis and Shothik Implementation Plan

## Executive Summary

This document analyzes SpaceXAI's Grok-Build architecture as a reference for transforming Shothik's `/agents/chat` path into a Hermes-backed AI workspace. The analysis identifies key architectural patterns from grok-build that can solve Shothik's current orchestration fragmentation while preserving the existing UI shell and product surfaces.

**Primary Finding**: Grok-build demonstrates a mature agent-workspace architecture with modular boundaries, session persistence, tool protocols, and background task management that directly addresses Shothik's need to move from frontend-embedded AI logic to backend-owned orchestration.

**Recommendation**: Adopt grok-build's modular agent architecture, session-based workspace model, and structured tool registry while adapting to Shothik's artifact-first workflow requirements and web-based deployment constraints.

## Reference Architecture Analysis: Grok-Build

### Architecture Overview

Grok-build is structured as a Rust-based terminal AI agent with the following key components:

```text
Grok TUI (xai-grok-pager)
        ↓
Agent System (xai-grok-agent)
        ↓
Workflow Engine (xai-workflow)
        ↓
Workspace Management (xai-grok-workspace) 
        ↓
Tool Registry & Bridge (xai-grok-tools)
        ↓
Session & Activity Tracking
```

### Key Architectural Patterns

#### 1. Modular Agent System

**Pattern**: Agents are defined declaratively with YAML frontmatter + Markdown, built via AgentBuilder, and executed through a standardized Agent interface.

**Core Components**:
- `AgentDefinition`: YAML-based agent configuration
- `AgentBuilder`: Constructs agents from definitions + session context  
- `Agent`: Immutable agent instance with tools, prompts, and policies
- `ToolBridge`: Session-scoped tool registry and state management

**Shothik Adaptation**:
- Replace direct model calls in `/api/chat` with Agent-based orchestration
- Create Shothik agent definitions for chat, slides, sheets, writing workflows
- Implement ToolBridge for InsForge backend integration

#### 2. Session-Based Workspace Architecture

**Pattern**: Persistent workspace sessions with activity tracking, lifecycle management, and cross-session state.

**Core Components**:
- `WorkspaceSession`: Durable session with file system, VCS, and tool state
- `ActivityTracker`: Per-session tool call and background task monitoring
- `WorkspaceHandle`: Session lifecycle and coordination
- `SessionActivity`: Metrics, idle detection, and graceful shutdown

**Shothik Adaptation**:
- Map to Shothik's run/artifact model where WorkspaceSession ≈ Run
- Use ActivityTracker patterns for real-time progress in slides/sheets generation
- Adapt session persistence to PostgreSQL + InsForge storage

#### 3. Tool Protocol and Registry

**Pattern**: Standardized tool definitions, invocation protocols, and lifecycle management.

**Core Components**:
- `ToolDefinition`: Declarative tool interface specification
- `ToolRegistry`: Dynamic tool discovery and validation
- Tool lifecycle hooks and permission management
- MCP (Model Context Protocol) integration for external tools

**Shothik Adaptation**:
- Define Shothik tool interfaces: slides-generator, sheet-analyzer, research-agent, etc.
- Replace fragmented service calls with unified tool invocation
- Integrate existing InsForge capabilities as native tools

#### 4. Workflow Engine and State Management

**Pattern**: Structured workflow execution with journaling, replay, and pause/resume capabilities.

**Core Components**:
- `WorkflowEngine`: Multi-step workflow orchestration with Rhai scripting
- `Journal`: Persistent workflow state with replay capability
- `WorkflowHostRequest`: Async communication between workflow and host
- Budget management and cancellation token support

**Shothik Adaptation**:
- Implement slide generation as multi-phase workflow (plan → generate → format → persist)
- Add checkpoint/resume for long-running workflows
- Use workflow patterns for chat → workspace handoff

#### 5. Background Task and Progress Management

**Pattern**: Sophisticated background task tracking with progress reporting and graceful lifecycle management.

**Core Components**:
- Background task registration and monitoring
- Activity-based idle detection and resource management
- Structured progress reporting and notification system
- Graceful shutdown with pending work preservation

**Shothik Adaptation**:
- Apply to slide/sheet generation progress tracking
- Implement structured events for frontend progress rendering
- Add background artifact processing and export workflows

## Current Shothik Architecture Assessment

### Strengths to Preserve

1. **Comprehensive UI Foundation**: Robust Next.js shell with design system, auth, navigation
2. **Multi-Surface Product**: Writing, books, community, Twin, slides, sheets, research, marketplace
3. **InsForge Integration**: Backend-as-a-Service with database, auth, storage, payments
4. **Chat Persistence**: Already functional conversation/message persistence

### Critical Gaps Addressed by Grok-Build Patterns

1. **Orchestration Fragmentation**: AI logic scattered across routes, services, and components
2. **Inconsistent Progress Tracking**: Different streaming contracts per feature
3. **No Durable Runs**: Missing session/workflow persistence and resumption
4. **Limited Tool Integration**: No unified tool registry or invocation protocol
5. **Frontend-Heavy Logic**: Business logic embedded in UI components

### Migration Alignment

| Shothik Current | Grok-Build Pattern | Target Integration |
|---|---|---|
| Route handlers with AI calls | Agent + ToolBridge | Backend-owned orchestration |
| Feature-specific SSE streams | ActivityTracker + Events | Unified progress events |
| Message persistence only | WorkspaceSession + Journal | Run + Artifact persistence |
| Direct service calls | ToolRegistry + Definitions | Structured tool invocation |
| UI-embedded workflows | WorkflowEngine + Phases | Multi-step backend workflows |

## Shothik Implementation Strategy

### Phase 1: Agent Foundation (Weeks 1-3)

**Objective**: Establish grok-build-inspired agent architecture within Shothik's deployment boundary.

**Key Tasks**:

1. **Create Hermes Agent Module**
   - Implement `AgentDefinition` type for Shothik agents (chat, slides, sheets)
   - Build `AgentBuilder` with InsForge backend integration
   - Create `Agent` interface compatible with existing route handlers

2. **Establish Tool Registry**
   - Define `ToolDefinition` schema for Shothik capabilities
   - Implement `ToolBridge` for InsForge database/storage/AI gateway
   - Create initial tool definitions: chat-completion, slide-generator, sheet-analyzer

3. **Session Architecture**
   - Implement `RunSession` (Shothik equivalent of WorkspaceSession)
   - Add PostgreSQL tables: `runs`, `run_events`, `run_sessions`
   - Create session lifecycle management with ActivityTracker patterns

**Deliverables**:
- `/lib/hermes/agents/` - Agent system implementation
- `/lib/hermes/tools/` - Tool registry and definitions
- `/lib/hermes/sessions/` - Session management
- Migration of `/api/chat` to use Agent + ToolBridge

### Phase 2: Workflow Engine (Weeks 4-6)

**Objective**: Implement structured workflows for slide generation and sheet analysis.

**Key Tasks**:

1. **Workflow Infrastructure**
   - Adapt grok-build's WorkflowEngine for Shothik's artifact-first model
   - Implement workflow journaling with PostgreSQL persistence
   - Add workflow pause/resume for long-running tasks

2. **Slide Generation Workflow**
   - Decompose slide generation into phases: plan → generate → format → persist
   - Replace current slide service calls with workflow execution
   - Implement structured progress events and artifact checkpointing

3. **Sheet Analysis Workflow**
   - Migrate sheet workflows from separate services to unified engine
   - Add multi-step analysis capabilities with intermediate artifacts

**Deliverables**:
- `/lib/hermes/workflows/` - Workflow engine implementation
- Slide generation workflow with progress tracking
- Sheet analysis workflow integration
- Artifact persistence with version management

### Phase 3: Workspace Integration (Weeks 7-9)

**Objective**: Enable seamless chat → workspace handoff with persistent context.

**Key Tasks**:

1. **Workspace Handoff**
   - Implement chat → slides → workspace navigation flow
   - Preserve context and conversation state across transitions
   - Add workspace resume from persistent run state

2. **Event System**
   - Implement structured event streaming based on ActivityTracker patterns
   - Unify progress rendering across all artifact types
   - Add real-time collaboration events for workspace sharing

3. **Background Processing**
   - Add background artifact processing and export capabilities
   - Implement graceful shutdown with pending work preservation
   - Add resource management and idle detection

**Deliverables**:
- Unified workspace navigation and context preservation
- Real-time progress tracking across all surfaces
- Background processing infrastructure
- Export and sharing workflows

### Phase 4: Tool Ecosystem (Weeks 10-12)

**Objective**: Expand tool ecosystem and integrate remaining Shothik surfaces.

**Key Tasks**:

1. **Extended Tool Set**
   - Integrate research, AI detector, plagiarism checker as tools
   - Add writing assistance and citation generation tools
   - Implement Twin integration as specialized agent type

2. **Community and Marketplace Integration**
   - Connect artifact sharing with community forums
   - Implement marketplace publishing workflows
   - Add collaboration features for shared artifacts

3. **Performance and Optimization**
   - Optimize workflow execution performance
   - Add caching and memoization for common patterns
   - Implement horizontal scaling preparation

**Deliverables**:
- Complete tool ecosystem covering all Shothik surfaces
- Community and marketplace integration
- Performance optimization and scaling preparation

## Technical Architecture

### Target System Architecture

```text
Shothik Web UI (Existing)
        ↓
API Gateway (Enhanced)
        ↓
Hermes Agent System
    ├── Agent Registry
    ├── Tool Bridge
    ├── Workflow Engine
    ├── Session Manager
    └── Event Streaming
        ↓
InsForge Backend + PostgreSQL
        ↓
Tools & External Services
    ├── AI Gateway (Gemini, OpenAI, etc.)
    ├── Research APIs
    ├── Export Services
    └── Storage & CDN
```

### Key Technical Decisions

#### 1. Deployment Strategy
- **Modular Monolith**: Start with Hermes as modules within Shothik deployment
- **Gradual Extraction**: Extract services only after contracts stabilize
- **Database Integration**: Use existing PostgreSQL + InsForge storage

#### 2. Event Architecture
- **Structured Events**: Adopt grok-build's activity tracking patterns
- **SSE Streaming**: Enhance existing SSE with structured event types
- **Progress Tracking**: Unified progress rendering across all surfaces

#### 3. Session Management
- **Run-Based Sessions**: Map grok-build WorkspaceSession to Shothik Run model
- **Persistent State**: Journal-based state persistence and replay
- **Context Preservation**: Maintain conversation context across workspace transitions

#### 4. Tool Protocol
- **Declarative Definitions**: YAML-based tool configuration like grok-build
- **InsForge Integration**: Native integration with existing backend capabilities
- **External Tool Support**: MCP-compatible protocol for future extensions

## Risk Assessment and Mitigation

### High-Risk Areas

1. **Performance Impact**: Adding orchestration layer overhead
   - *Mitigation*: Gradual rollout, performance monitoring, caching strategies

2. **State Migration**: Existing conversation/artifact data compatibility
   - *Mitigation*: Backwards-compatible schema changes, data migration scripts

3. **UI Disruption**: Changes to existing user workflows
   - *Mitigation*: Preserve existing UI, feature flags for gradual rollout

### Medium-Risk Areas

1. **Tool Integration Complexity**: Unifying disparate service contracts
   - *Mitigation*: Adapter patterns, incremental tool migration

2. **Workflow Reliability**: Ensuring robust error handling and recovery
   - *Mitigation*: Extensive testing, circuit breakers, graceful degradation

## Success Metrics

### Technical Metrics
- **Workflow Success Rate**: >95% completion rate for slide/sheet generation
- **Performance**: <2s additional latency for agent orchestration overhead
- **Reliability**: <1% error rate for background workflows
- **Resume Success**: >99% successful workflow resume after interruption

### Product Metrics
- **User Engagement**: Increased time in workspace after chat handoff
- **Artifact Creation**: Higher completion rate for generated artifacts
- **User Satisfaction**: Improved progress visibility and error recovery experience

## Conclusion

Grok-build provides a mature reference architecture for transforming Shothik from feature-specific orchestration to a unified agent-workspace platform. The modular agent system, session-based architecture, and structured workflow engine directly address Shothik's orchestration fragmentation while preserving the existing product shell.

The phased implementation approach ensures gradual migration with minimal disruption to existing users while establishing the foundation for long-term platform evolution. The integration with InsForge backend and preservation of Shothik's comprehensive product surface area ensures this transformation enhances rather than replaces the current platform capabilities.

**Next Steps**: Proceed with Phase 1 implementation starting with the agent foundation and initial tool registry, followed by incremental migration of existing workflows to the new orchestration architecture.