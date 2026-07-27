export type LifecycleState =
  | "unregistered"
  | "registered"
  | "unverified"
  | "pending_verification"
  | "verified"
  | "suspended"
  | "unlinked"
  | "transfer_pending";

export const LIFECYCLE_TRANSITIONS: Record<
  string,
  { from: LifecycleState[]; to: LifecycleState }
> = {
  REGISTER: { from: ["unregistered"], to: "registered" },
  ARRIVE_UNVERIFIED: { from: ["registered"], to: "unverified" },
  CLAIM: { from: ["registered", "unverified", "unlinked"], to: "pending_verification" },
  REQUEST_VERIFICATION: { from: ["unverified"], to: "pending_verification" },
  VERIFY: { from: ["pending_verification"], to: "verified" },
  SUSPEND: { from: ["verified", "unverified", "pending_verification"], to: "suspended" },
  UNSUSPEND: { from: ["suspended"], to: "verified" },
  UNLINK: { from: ["verified", "unverified", "pending_verification", "suspended"], to: "unlinked" },
  REQUEST_TRANSFER: { from: ["verified"], to: "transfer_pending" },
  COMPLETE_TRANSFER: { from: ["transfer_pending"], to: "verified" },
  CANCEL_TRANSFER: { from: ["transfer_pending"], to: "verified" },
  RECLAIM: { from: ["unlinked"], to: "unverified" },
};

export const BLOCKED_STATES: LifecycleState[] = ["suspended", "unlinked", "unregistered"];

export function isActiveState(state: LifecycleState): boolean {
  return state === "verified";
}

export function isBlockedState(state: string): boolean {
  return BLOCKED_STATES.includes(state as LifecycleState);
}

export function canTransition(current: LifecycleState, event: string): boolean {
  const transition = LIFECYCLE_TRANSITIONS[event];
  if (!transition) return false;
  return transition.from.includes(current);
}

export function validateTransition(
  current: LifecycleState,
  event: string
): LifecycleState {
  const transition = LIFECYCLE_TRANSITIONS[event];
  if (!transition) {
    throw new Error(`Unknown lifecycle event: ${event}`);
  }
  if (!transition.from.includes(current)) {
    throw new Error(
      `Invalid lifecycle transition: cannot ${event} from "${current}". ` +
      `Allowed from: [${transition.from.join(", ")}]`
    );
  }
  return transition.to;
}
