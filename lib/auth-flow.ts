export type AuthIntent =
  | "continue"
  | "writing_studio"
  | "research"
  | "assignment"
  | "twin";

export type LoginFlowVariant = "contextual" | "streamlined";

export interface AuthFlowState {
  intent: AuthIntent;
  redirectTo?: string | null;
  source?: "login" | "register" | "protected_route";
  variant?: LoginFlowVariant;
  timestamp: number;
}

export interface RouteSuggestion {
  key: string;
  title: string;
  description: string;
  href: string;
}

export interface AuthRoutingDecision {
  route: string;
  reason:
    | "redirect_override"
    | "intent_override"
    | "recent_project"
    | "account_type"
    | "role"
    | "default";
  suggestions: RouteSuggestion[];
}

export interface RecentProjectLike {
  _id?: string;
  id?: string;
  title?: string;
  type?: "book" | "research" | "assignment";
  lastEditedAt?: number;
}

export interface AuthRoutingUser {
  role?: string | null;
  accountType?: string | null;
}

const AUTH_FLOW_STORAGE_KEY = "shothik_auth_flow_state";
const LOGIN_FLOW_VARIANT_KEY = "shothik_login_flow_variant";

const DEFAULT_SUGGESTIONS: RouteSuggestion[] = [
  {
    key: "writing_studio",
    title: "Open Writing Studio",
    description: "Start with the main workspace and project hub.",
    href: "/writing-studio",
  },
  {
    key: "research",
    title: "Start a research paper",
    description: "Open Writing Studio in research mode with guided planning.",
    href: "/writing-studio?intent=research",
  },
  {
    key: "assignment",
    title: "Start an assignment",
    description: "Open Writing Studio in assignment mode with structured guidance.",
    href: "/writing-studio?intent=assignment",
  },
  {
    key: "twin",
    title: "Open Twin",
    description: "Continue with your Twin writing assistant and training tasks.",
    href: "/twin",
  },
];

export function normalizeAuthIntent(value: string | null | undefined): AuthIntent {
  switch (value) {
    case "writing_studio":
    case "research":
    case "assignment":
    case "twin":
      return value;
    default:
      return "continue";
  }
}

export function isSafeInternalPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.includes("://"));
}

export function getLoginFlowVariant(): LoginFlowVariant {
  if (typeof window === "undefined") return "contextual";
  const stored = window.localStorage.getItem(LOGIN_FLOW_VARIANT_KEY);
  if (stored === "contextual" || stored === "streamlined") return stored;

  const variant: LoginFlowVariant = Math.random() < 0.5 ? "contextual" : "streamlined";
  window.localStorage.setItem(LOGIN_FLOW_VARIANT_KEY, variant);
  return variant;
}

export function saveAuthFlowState(state: Omit<AuthFlowState, "timestamp">) {
  if (typeof window === "undefined") return;
  const nextState: AuthFlowState = {
    ...state,
    timestamp: Date.now(),
  };
  window.localStorage.setItem(AUTH_FLOW_STORAGE_KEY, JSON.stringify(nextState));
}

export function getAuthFlowState(): AuthFlowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_FLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthFlowState;
    if (!parsed?.intent) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuthFlowState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
}

export function getMostRecentProject(projects: RecentProjectLike[]): RecentProjectLike | null {
  if (!projects.length) return null;
  return [...projects].sort((a, b) => (b.lastEditedAt || 0) - (a.lastEditedAt || 0))[0];
}

export function getRecentProjects(projects: RecentProjectLike[], limit = 3): RecentProjectLike[] {
  return [...projects]
    .sort((a, b) => (b.lastEditedAt || 0) - (a.lastEditedAt || 0))
    .slice(0, limit);
}

function getProjectRoute(project: RecentProjectLike) {
  const recentId = project._id || project.id;
  return recentId ? `/writing-studio?projectId=${recentId}` : "/writing-studio?projects=1";
}

function getTypeLabel(type: RecentProjectLike["type"]) {
  switch (type) {
    case "research":
      return "research paper";
    case "assignment":
      return "assignment";
    default:
      return "book project";
  }
}

function buildSuggestions(recentProjects: RecentProjectLike[], flowState?: AuthFlowState | null): RouteSuggestion[] {
  const recentSuggestions = getRecentProjects(recentProjects).map((project, index) => ({
    key: `recent-${project._id || project.id || index}`,
    title: `Continue ${project.title || getTypeLabel(project.type)}`,
    description: `Return to your recent ${getTypeLabel(project.type)} and keep writing where you left off.`,
    href: getProjectRoute(project),
  }));

  const intentSuggestions =
    flowState?.intent === "research"
      ? DEFAULT_SUGGESTIONS.filter((item) => item.key !== "research")
      : flowState?.intent === "assignment"
      ? DEFAULT_SUGGESTIONS.filter((item) => item.key !== "assignment")
      : DEFAULT_SUGGESTIONS;

  return [...recentSuggestions, ...intentSuggestions];
}

function getRecentProjectByType(projects: RecentProjectLike[], type: RecentProjectLike["type"]) {
  return getRecentProjects(projects, 10).find((project) => project.type === type) || null;
}

export function inferAuthRoutingDecision({
  user,
  explicitRedirect,
  flowState,
  recentProjects = [],
}: {
  user?: AuthRoutingUser | null;
  explicitRedirect?: string | null;
  flowState?: AuthFlowState | null;
  recentProjects?: RecentProjectLike[];
}): AuthRoutingDecision {
  const recentProject = getMostRecentProject(recentProjects);
  const recentResearchProject = getRecentProjectByType(recentProjects, "research");
  const recentAssignmentProject = getRecentProjectByType(recentProjects, "assignment");
  const suggestions = buildSuggestions(recentProjects, flowState);

  if (isSafeInternalPath(explicitRedirect)) {
    return {
      route: explicitRedirect,
      reason: "redirect_override",
      suggestions,
    };
  }

  if (isSafeInternalPath(flowState?.redirectTo)) {
    return {
      route: flowState!.redirectTo!,
      reason: "redirect_override",
      suggestions,
    };
  }

  switch (flowState?.intent) {
    case "research":
      return {
        route: recentResearchProject ? getProjectRoute(recentResearchProject) : "/writing-studio?intent=research",
        reason: recentResearchProject ? "recent_project" : "intent_override",
        suggestions,
      };
    case "assignment":
      return {
        route: recentAssignmentProject ? getProjectRoute(recentAssignmentProject) : "/writing-studio?intent=assignment",
        reason: recentAssignmentProject ? "recent_project" : "intent_override",
        suggestions,
      };
    case "twin":
      return { route: "/twin", reason: "intent_override", suggestions };
    case "writing_studio":
      return { route: "/writing-studio", reason: "intent_override", suggestions };
    default:
      break;
  }

  if (recentProject) {
    const recentId = recentProject._id || recentProject.id;
    if (recentProject.type === "research" && recentId) {
      return {
        route: `/writing-studio?projectId=${recentId}`,
        reason: "recent_project",
        suggestions,
      };
    }
    if (recentProject.type === "assignment" && recentId) {
      return {
        route: `/writing-studio?projectId=${recentId}`,
        reason: "recent_project",
        suggestions,
      };
    }
    if (recentId) {
      return {
        route: `/writing-studio?projectId=${recentId}`,
        reason: "recent_project",
        suggestions,
      };
    }
  }

  const accountType = user?.accountType?.toLowerCase();
  if (accountType === "researcher" || accountType === "academic") {
    return { route: "/writing-studio?intent=research", reason: "account_type", suggestions };
  }

  const role = user?.role?.toLowerCase();
  if (role === "student") {
    return { route: "/writing-studio?intent=assignment", reason: "role", suggestions };
  }

  return {
    route: "/writing-studio",
    reason: "default",
    suggestions,
  };
}
