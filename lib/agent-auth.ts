import crypto from "crypto";

const AGENT_KEY_PREFIX = "shothik_agent_";

export function generateAgentApiKey(): { key: string; prefix: string; hash: string } {
  const id = crypto.randomBytes(8).toString("hex");
  const secret = crypto.randomBytes(24).toString("base64url");
  const key = `${AGENT_KEY_PREFIX}${id}_${secret}`;
  const prefix = key.slice(0, 22);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

export function hashAgentKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function isAgentKey(key: string): boolean {
  return key.startsWith(AGENT_KEY_PREFIX);
}

export interface AgentAuthContext {
  agentId: string;
  masterId: string;
  agentName: string;
  type: "agent";
}

const PII_PATTERNS = [
  /\b[\w.-]+@[\w.-]+\.\w{2,}\b/,
  /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/,
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b[4-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
];

export function containsPII(text: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizePII(text: string): string {
  let result = text;
  result = result.replace(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, "[EMAIL REDACTED]");
  result = result.replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, "[SSN REDACTED]");
  result = result.replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE REDACTED]");
  return result;
}
