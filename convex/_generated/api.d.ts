/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as agent_notifications from "../agent_notifications.js";
import type * as auditEvents from "../auditEvents.js";
import type * as billing from "../billing.js";
import type * as bookService from "../bookService.js";
import type * as books from "../books.js";
import type * as channels from "../channels.js";
import type * as conversations from "../conversations.js";
import type * as credits from "../credits.js";
import type * as earnings from "../earnings.js";
import type * as forums from "../forums.js";
import type * as http from "../http.js";
import type * as isbn from "../isbn.js";
import type * as latex from "../latex.js";
import type * as lib_auth from "../lib/auth.js";
import type * as llmUsage from "../llmUsage.js";
import type * as marketplace from "../marketplace.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as payouts from "../payouts.js";
import type * as projects from "../projects.js";
import type * as publishing from "../publishing.js";
import type * as reputation from "../reputation.js";
import type * as reviewerFund from "../reviewerFund.js";
import type * as secondMePersistence from "../secondMePersistence.js";
import type * as subscriptions from "../subscriptions.js";
import type * as twin from "../twin.js";
import type * as twin_lifecycle_transitions from "../twin_lifecycle_transitions.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";
import type * as writing from "../writing.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  agent_notifications: typeof agent_notifications;
  auditEvents: typeof auditEvents;
  billing: typeof billing;
  bookService: typeof bookService;
  books: typeof books;
  channels: typeof channels;
  conversations: typeof conversations;
  credits: typeof credits;
  earnings: typeof earnings;
  forums: typeof forums;
  http: typeof http;
  isbn: typeof isbn;
  latex: typeof latex;
  "lib/auth": typeof lib_auth;
  llmUsage: typeof llmUsage;
  marketplace: typeof marketplace;
  messages: typeof messages;
  notifications: typeof notifications;
  payouts: typeof payouts;
  projects: typeof projects;
  publishing: typeof publishing;
  reputation: typeof reputation;
  reviewerFund: typeof reviewerFund;
  secondMePersistence: typeof secondMePersistence;
  subscriptions: typeof subscriptions;
  twin: typeof twin;
  twin_lifecycle_transitions: typeof twin_lifecycle_transitions;
  users: typeof users;
  votes: typeof votes;
  writing: typeof writing;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
