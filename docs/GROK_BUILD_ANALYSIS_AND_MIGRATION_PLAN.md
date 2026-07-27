# Grok-Build Analysis and Shothik Migration Plan

## Executive Summary

This document analyzes `xai-org/grok-build` as a reference model for improving Shothik's broken chat path at `/agents/chat`, and provides a concrete implementation plan to migrate from direct frontend model calls to a Hermes-backed runtime architecture.

## Current State Gap Analysis

### Current Implementation Issues

The current `/agents/chat` implementation at `components/agents/ChatAgentPage.tsx` and `app/api/chat/route.ts` demonstrates several architectural anti-patterns relative to the target Hermes architecture:

1. **Frontend Orchestration**: The React component directly manages streaming, message state, and conversation lifecycle
2. **Direct Model Calls**: Route handler makes direct Gemini API calls without backend orchestration
3. **No Run Model**: No concept of persistent, resumable runs or artifacts
4. **Fragmented Events**: Custom SSE handling instead of canonical event contract
5. **Limited Persistence**: Basic chat history but no run/artifact/checkpoint model
6. **No Tool Integration**: Hardcoded system prompt with no tool registry or capability routing

### Target Architecture Requirements

According to `docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md`, the target should provide:

- Backend-owned orchestration (planner, tool router, memory, workflow engine)
- Persistent run/artifact model with versions and checkpoints
- Canonical event streaming contract across all domains
- Resumable workspace that survives refresh/navigation
- Unified tool registry and capability management

## Grok-Build Reference Analysis

### Repository Structure Analysis

`xai-org/grok-build` provides several architectural patterns relevant to Shothik's migration:

#### 1. Backend Orchestration Model
- Clear separation between frontend shell and backend runtime
- Structured workflow management with persistent state
- Event-driven architecture with canonical message types

#### 2. Session/Run Management
- Persistent execution contexts that survive client disconnection
- Resumable workflows with checkpoint semantics
- Clear run lifecycle management (created, running, completed, failed)

#### 3. Tool Integration Pattern
- Registry-based tool discovery and routing
- Capability-based tool selection
- Structured tool call/result events

#### 4. Streaming Architecture
- Canonical event envelope for all runtime communications
- Structured progress reporting
- Client reconnection and state synchronization

### Key Learnings for Shothik

1. **Modular Backend**: Grok-build demonstrates clean module boundaries between orchestration, execution, and persistence
2. **Event Contract**: Consistent event schema enables reliable frontend state management
3. **Session Persistence**: Run state survives across client sessions and browser refreshes
4. **Tool Abstractions**: Generic tool interface allows extensible capability integration

## Implementation Strategy

### Phase 1: Run Bootstrap and Event Normalization

#### Objective
Introduce Hermes-compatible run concepts while preserving current UI functionality.

#### Key Changes

1. **Add Run Creation Endpoint**
```typescript
// app/api/runs/create/route.ts
export async function POST(request: NextRequest) {
  // Create persistent run record
  // Bootstrap run metadata
  // Return run ID for frontend tracking
}
```

2. **Modify Chat Route to Use Runs**
```typescript
// app/api/chat/route.ts - Modified to create/resume runs
const runId = conversationId 
  ? await resumeExistingRun(conversationId)
  : await createChatRun(userMessage, surface, contextRef);
```

3. **Add Canonical Event Streaming**
```typescript
// Standardize event envelope format
interface HermesEvent {
  runId: string;
  seq: number;
  timestamp: string;
  type: 'run_created' | 'progress' | 'tool_call' | 'done' | 'error';
  payload: any;
}
```

4. **Frontend Run State Management**
```typescript
// components/agents/ChatAgentPage.tsx - Add run awareness
const [runId, setRunId] = useState<string | null>(null);
const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
```

### Phase 2: Backend Orchestration Layer

#### Objective
Move AI orchestration logic out of API routes into dedicated Hermes modules.

#### Key Changes

1. **Create Hermes Module Structure**
```
hermes/
  modules/
    planner/          # Intent interpretation and task decomposition
    workflow-engine/  # Multi-step execution coordination
    tool-registry/    # Tool discovery and routing
    streaming-engine/ # Canonical event emission
    memory/          # Context and conversation management
```

2. **Chat Module Implementation**
```typescript
// hermes/modules/chat/ChatOrchestrator.ts
export class ChatOrchestrator {
  async processMessage(runId: string, message: string): Promise<void> {
    // Plan response strategy
    // Route to appropriate tools/models
    // Emit structured progress events
    // Handle errors and recovery
  }
}
```

3. **API Gateway Adaptation**
```typescript
// app/api/chat/route.ts - Becomes thin gateway
const orchestrator = new ChatOrchestrator();
return orchestrator.processMessage(runId, userMessage);
```

### Phase 3: Artifact Integration

#### Objective
Transform chat interactions into persistent artifacts when appropriate.

#### Key Changes

1. **Artifact Creation Logic**
```typescript
// Detect when chat should create artifacts (slides, documents, etc.)
if (shouldCreateArtifact(conversation)) {
  const artifact = await createArtifact({
    type: detectArtifactType(conversation),
    sourceRunId: runId,
    workspaceId: workspace.id
  });
}
```

2. **Workspace Handoff**
```typescript
// Enable seamless transition from chat to artifact editing
const handoffEvent = {
  type: 'handoff',
  runId,
  artifactId: artifact.id,
  workspaceUrl: `/workspace/${artifact.id}`
};
```

## Technical Requirements

### Database Schema

```sql
-- Core run/artifact tables
CREATE TABLE runs (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  entry_surface TEXT,
  artifact_type TEXT,
  status TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB
);

CREATE TABLE artifacts (
  id UUID PRIMARY KEY,
  type TEXT,
  workspace_id UUID,
  title TEXT,
  status TEXT,
  owner_user_id TEXT,
  source_run_id UUID,
  created_at TIMESTAMP
);

CREATE TABLE run_events (
  id UUID PRIMARY KEY,
  run_id UUID,
  seq INTEGER,
  event_type TEXT,
  timestamp TIMESTAMP,
  payload JSONB
);
```

### API Contract Changes

1. **New Endpoints**
   - `POST /api/runs/create` - Bootstrap new run
   - `GET /api/runs/{runId}` - Get run status and events  
   - `POST /api/runs/{runId}/resume` - Resume interrupted run
   - `GET /api/workspace/{workspaceId}/artifacts` - List workspace artifacts

2. **Modified Endpoints**
   - `POST /api/chat` - Now creates/resumes runs instead of direct model calls

### Frontend Changes

1. **Run-Aware Components**
   - Add run status indicators
   - Enable run resumption on page refresh
   - Show structured progress timeline

2. **Event Handling**
   - Normalize SSE parsing for canonical events
   - Add reconnection logic for interrupted runs

## Risk Mitigation

### Backward Compatibility
- Preserve existing chat UI/UX during migration
- Maintain current message persistence model
- Gradual rollout with feature flags

### Performance Considerations
- Minimize additional database queries during migration
- Optimize event streaming for high-frequency updates
- Cache run state appropriately

### Operational Concerns
- Add comprehensive logging for run lifecycle
- Monitor run completion rates and failure modes
- Implement cleanup for abandoned runs

## Success Metrics

1. **Functional**
   - Chat flows maintain current response quality
   - Run resumption works after browser refresh
   - Event streaming provides real-time progress visibility

2. **Technical** 
   - Reduced frontend orchestration complexity
   - Consistent event handling across domains
   - Persistent run state enables debugging and support

3. **User Experience**
   - No regression in chat performance or reliability
   - Improved visibility into AI processing steps
   - Seamless handoff to artifact workspaces when appropriate

## Implementation Timeline

### Week 1-2: Foundation
- Database schema and migration scripts
- Basic run creation and persistence
- Event streaming infrastructure

### Week 3-4: Chat Integration  
- Modify chat routes to use run model
- Update frontend for run awareness
- Implement event normalization

### Week 5-6: Orchestration Layer
- Create initial Hermes modules
- Move chat logic behind orchestration
- Add tool registry foundations

### Week 7-8: Validation and Cleanup
- End-to-end testing of new chat flow
- Performance optimization
- Documentation and deployment

## Next Actions

1. **Immediate**: Begin database schema design for runs/artifacts/events
2. **Phase 1**: Implement run creation endpoint and modify chat route
3. **Frontend**: Add run state management to ChatAgentPage component  
4. **Architecture**: Design Hermes module boundaries and contracts

This migration transforms `/agents/chat` from a direct frontend-to-model flow into a proper Hermes-backed runtime while preserving the current user experience and enabling future artifact integration.