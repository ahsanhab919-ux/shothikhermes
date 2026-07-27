import { AbilityBuilder, PureAbility, createMongoAbility } from "@casl/ability";

export const ALL_SKILLS = [
  "book:write",
  "book:publish",
  "forum:create",
  "forum:post",
  "community:preview",
] as const;

export type TwinSkill = (typeof ALL_SKILLS)[number];

export interface TwinPermissionConfig {
  allowedSkills: string[];
  blockedSkills: string[];
  approvalRequiredActions: string[];
  lifecycleState: string;
}

type AppAbility = PureAbility<[string, string]>;

export function buildTwinAbility(config: TwinPermissionConfig): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const activeStates = ["registered", "unverified", "pending_verification", "verified"];
  const isActive = activeStates.includes(config.lifecycleState);

  if (isActive) {
    can("read", "Twin");
    can("read", "TwinActivity");
    can("read", "TwinApproval");
    can("read", "TwinTask");
    can("update", "Twin");
    can("train", "Twin");
    can("heartbeat", "Twin");
    can("manage", "TwinPermission");
    can("manage", "TwinApproval");
    can("create", "TwinTask");
    can("revokeKey", "Twin");
  }

  if (config.lifecycleState === "registered" || config.lifecycleState === "unverified") {
    can("claim", "Twin");
    can("requestVerification", "Twin");
    can("verify", "Twin");
    can("read", "all");
  }

  if (config.lifecycleState === "pending_verification") {
    can("verify", "Twin");
    can("read", "all");
  }

  if (config.lifecycleState === "verified") {
    can("transfer", "Twin");
    can("unlink", "Twin");

    for (const skill of config.allowedSkills) {
      const [subject, action] = skill.split(":");
      if (subject && action) {
        can(action, subject);
      }
    }

    for (const skill of config.blockedSkills) {
      const [subject, action] = skill.split(":");
      if (subject && action) {
        cannot(action, subject);
      }
    }
  }

  return build();
}

export function requiresApproval(
  action: string,
  approvalRequiredActions: string[]
): boolean {
  return approvalRequiredActions.includes(action);
}

export function getDefaultPermissions(): {
  allowedSkills: string[];
  blockedSkills: string[];
  approvalRequiredActions: string[];
} {
  return {
    allowedSkills: [...ALL_SKILLS],
    blockedSkills: [],
    approvalRequiredActions: ["book:publish"],
  };
}
