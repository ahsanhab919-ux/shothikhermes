import { describe, expect, it } from "vitest";

import * as users from "../users";
import * as notifications from "../notifications";
import * as billing from "../billing";
import * as conversations from "../conversations";
import * as messages from "../messages";

function exportedNames(mod: Record<string, unknown>) {
  return Object.keys(mod).filter((k) => !k.startsWith("__"));
}

describe("convex module surface", () => {
  it("exports expected users functions", () => {
    const names = exportedNames(users);
    for (const expected of [
      "getUserPreferences",
      "updateUserLocale",
      "getUserById",
      "getUserByEmail",
      "updateUserStripeCustomerId",
    ]) {
      expect(names).toContain(expected);
      expect(typeof (users as any)[expected]).toBe("function");
    }
  });

  it("exports expected notifications functions", () => {
    const names = exportedNames(notifications);
    for (const expected of [
      "createNotification",
      "createPublicNotification",
      "getUnread",
      "markRead",
      "markAllRead",
    ]) {
      expect(names).toContain(expected);
      expect(typeof (notifications as any)[expected]).toBe("function");
    }
  });

  it("exports expected billing functions", () => {
    const names = exportedNames(billing);
    for (const expected of [
      "getUserByStripeCustomerId",
      "getSubscriptionPlanByPriceId",
      "getUserCredits",
      "initializeUserCredits",
      "spendCredits",
      "addCredits",
      "getSubscriptionPlans",
      "getUserSubscription",
      "createSubscription",
      "updateSubscriptionStatus",
      "getTransactionHistory",
      "recordUsageMetric",
      "storeWebhookEvent",
      "markWebhookProcessed",
      "adminAdjustCredits",
    ]) {
      expect(names).toContain(expected);
      expect(typeof (billing as any)[expected]).toBe("function");
    }
  });

  it("exports expected conversations functions", () => {
    const names = exportedNames(conversations);
    for (const expected of [
      "createConversation",
      "listConversations",
      "getConversation",
      "renameConversation",
      "pinConversation",
      "archiveConversation",
      "softDeleteConversation",
      "searchConversations",
      "touchConversation",
    ]) {
      expect(names).toContain(expected);
      expect(typeof (conversations as any)[expected]).toBe("function");
    }
  });

  it("exports expected messages functions", () => {
    const names = exportedNames(messages);
    for (const expected of [
      "listMessages",
      "appendUserMessage",
      "appendAssistantPlaceholder",
      "appendUserMessageInternal",
      "appendAssistantPlaceholderInternal",
      "appendAssistantChunkInternal",
      "completeAssistantMessageInternal",
      "stopAssistantMessageInternal",
      "failAssistantMessageInternal",
      "deleteMessage",
    ]) {
      expect(names).toContain(expected);
      expect(typeof (messages as any)[expected]).toBe("function");
    }
  });
});
