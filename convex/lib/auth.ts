export async function requireAdmin(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Admin access denied: authentication required");

  const adminRecord = await ctx.db
    .query("admins")
    .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
    .first();

  if (adminRecord) return identity.subject;

  if (identity.email) {
    const envAdmins = process.env.ADMIN_EMAILS?.split(",").map((e: string) => e.trim()) ?? [];
    if (envAdmins.includes(identity.email)) return identity.subject;

    const emailRecord = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email))
      .first();
    if (emailRecord) return identity.subject;
  }

  throw new Error("Admin access denied: insufficient privileges");
}
