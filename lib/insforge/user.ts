export interface AuthenticatedUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  role?: string | null;
  accountType?: string | null;
  authProvider: "insforge" | "legacy";
}

type LooseRecord = Record<string, unknown>;

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getMetadata(user: LooseRecord) {
  const metadata =
    (user.userMetadata as LooseRecord | null | undefined) ??
    (user.user_metadata as LooseRecord | null | undefined) ??
    (user.metadata as LooseRecord | null | undefined) ??
    null;

  return metadata;
}

export function normalizeInsforgeUser(rawUser: unknown): AuthenticatedUser | null {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const user = rawUser as LooseRecord;
  const metadata = getMetadata(user);
  const id = readString(user.id);
  const email = readString(user.email);

  if (!id || !email) {
    return null;
  }

  const name =
    readString(user.name) ??
    readString(metadata?.name) ??
    readString(metadata?.full_name) ??
    email.split("@")[0];

  return {
    _id: id,
    id,
    name,
    email,
    role: readString(metadata?.role),
    accountType: readString(metadata?.accountType) ?? readString(metadata?.account_type),
    authProvider: "insforge",
  };
}

export function normalizeLegacyUser(rawUser: unknown): AuthenticatedUser | null {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const user = rawUser as LooseRecord;
  const id = readString(user._id) ?? readString(user.id);
  const email = readString(user.email);
  const name = readString(user.name) ?? email?.split("@")[0] ?? "User";

  if (!id || !email) {
    return null;
  }

  return {
    _id: id,
    id,
    name,
    email,
    role: readString(user.role),
    accountType: readString(user.accountType) ?? readString(user.account_type),
    authProvider: "legacy",
  };
}
