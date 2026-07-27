import { createMachine, type StateValue } from "xstate";
import {
  LIFECYCLE_TRANSITIONS,
  BLOCKED_STATES,
  validateTransition,
  canTransition as sharedCanTransition,
  isActiveState as sharedIsActiveState,
  type LifecycleState,
} from "@/convex/twin_lifecycle_transitions";

export { LIFECYCLE_TRANSITIONS, validateTransition };
export type TwinLifecycleState = LifecycleState;

export const TWIN_LIFECYCLE_STATES = [
  "unregistered",
  "registered",
  "unverified",
  "pending_verification",
  "verified",
  "suspended",
  "unlinked",
  "transfer_pending",
] as const;

type MachineStates = Record<string, { on?: Record<string, string> }>;

function buildStatesFromTransitions(): MachineStates {
  const states: MachineStates = {};
  for (const s of TWIN_LIFECYCLE_STATES) {
    states[s] = { on: {} };
  }
  for (const [event, { from, to }] of Object.entries(LIFECYCLE_TRANSITIONS)) {
    for (const fromState of from) {
      if (states[fromState]) {
        states[fromState].on![event] = to;
      }
    }
  }
  return states;
}

export const twinLifecycleMachine = createMachine({
  id: "twinLifecycle",
  initial: "unregistered",
  states: buildStatesFromTransitions(),
});

function resolveAndTransition(currentState: TwinLifecycleState, event: string): StateValue {
  const stateConfig = twinLifecycleMachine.config.states?.[currentState];
  if (!stateConfig) return currentState;
  const transitions = stateConfig.on;
  if (!transitions || !(event in transitions)) return currentState;
  const target = transitions[event];
  if (typeof target === "string") return target;
  return currentState;
}

export function canTransition(
  currentState: TwinLifecycleState,
  event: string
): boolean {
  return sharedCanTransition(currentState, event);
}

export function getNextState(
  currentState: TwinLifecycleState,
  event: string
): TwinLifecycleState | null {
  const nextValue = resolveAndTransition(currentState, event);
  if (nextValue === currentState) return null;
  return nextValue as TwinLifecycleState;
}

export function isFullAccessState(state: TwinLifecycleState): boolean {
  return sharedIsActiveState(state);
}

export function isReadOnlyState(state: TwinLifecycleState): boolean {
  return state === "registered" || state === "unverified" || state === "pending_verification";
}

export function canPerformActions(state: TwinLifecycleState): boolean {
  return isFullAccessState(state);
}

export const CONTENT_WORKFLOW_STATES = [
  "draft",
  "agent_generated",
  "pending_master_review",
  "approved",
  "published",
  "community_preview_posted",
] as const;

export type ContentWorkflowState = (typeof CONTENT_WORKFLOW_STATES)[number];

export const contentWorkflowMachine = createMachine({
  id: "contentWorkflow",
  initial: "draft",
  states: {
    draft: {
      on: {
        GENERATE: "agent_generated",
      },
    },
    agent_generated: {
      on: {
        SUBMIT_FOR_REVIEW: "pending_master_review",
      },
    },
    pending_master_review: {
      on: {
        APPROVE: "approved",
        REJECT: "draft",
      },
    },
    approved: {
      on: {
        PUBLISH: "published",
      },
    },
    published: {
      on: {
        POST_PREVIEW: "community_preview_posted",
      },
    },
    community_preview_posted: {},
  },
});

function resolveAndTransitionContent(currentState: ContentWorkflowState, event: string): StateValue {
  const stateConfig = contentWorkflowMachine.config.states?.[currentState];
  if (!stateConfig) return currentState;
  const transitions = stateConfig.on;
  if (!transitions || !(event in transitions)) return currentState;
  const target = transitions[event];
  if (typeof target === "string") return target;
  return currentState;
}

export function canContentTransition(
  currentState: ContentWorkflowState,
  event: string
): boolean {
  const nextValue = resolveAndTransitionContent(currentState, event);
  return nextValue !== currentState;
}

export function getNextContentState(
  currentState: ContentWorkflowState,
  event: string
): ContentWorkflowState | null {
  const nextValue = resolveAndTransitionContent(currentState, event);
  if (nextValue === currentState) return null;
  return nextValue as ContentWorkflowState;
}
