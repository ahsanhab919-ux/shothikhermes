import type { ToolName } from "./ai-gateway";

export class ToolServiceError extends Error {
  status: number;
  tool: ToolName;
  retriable: boolean;
  userMessage: string;
  details?: unknown;
  retryAfterMs?: number;

  constructor(options: {
    message: string;
    status: number;
    tool: ToolName;
    retriable?: boolean;
    userMessage?: string;
    details?: unknown;
    retryAfterMs?: number;
  }) {
    super(options.message);
    this.name = "ToolServiceError";
    this.status = options.status;
    this.tool = options.tool;
    this.retriable = options.retriable ?? false;
    this.userMessage =
      options.userMessage ?? getDefaultUserMessage(options.status);
    this.details = options.details;
    this.retryAfterMs = options.retryAfterMs;
  }
}

export class AuthenticationError extends ToolServiceError {
  constructor(tool: ToolName, details?: unknown) {
    super({
      message: "Authentication required",
      status: 401,
      tool,
      retriable: false,
      userMessage:
        "Please sign in to use this tool.",
      details,
    });
    this.name = "AuthenticationError";
  }
}

export class QuotaExceededError extends ToolServiceError {
  constructor(
    tool: ToolName,
    details?: { resetInMs?: number; limit?: number; tier?: string }
  ) {
    const retryAfterMs = details?.resetInMs;
    const minutes = retryAfterMs
      ? Math.ceil(retryAfterMs / 60000)
      : undefined;

    super({
      message: `Usage limit exceeded for ${tool}`,
      status: 429,
      tool,
      retriable: true,
      userMessage: minutes
        ? `You've reached your usage limit. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}, or upgrade your plan for higher limits.`
        : "You've reached your usage limit. Please upgrade your plan for higher limits.",
      details,
      retryAfterMs,
    });
    this.name = "QuotaExceededError";
  }
}

export class ServiceUnavailableError extends ToolServiceError {
  constructor(tool: ToolName, details?: unknown) {
    super({
      message: `${tool} service temporarily unavailable`,
      status: 503,
      tool,
      retriable: true,
      userMessage:
        "This service is temporarily unavailable. Please try again in a few moments.",
      details,
      retryAfterMs: 15000,
    });
    this.name = "ServiceUnavailableError";
  }
}

export class TimeoutError extends ToolServiceError {
  constructor(tool: ToolName, timeoutMs?: number) {
    super({
      message: `${tool} request timed out after ${timeoutMs ?? 0}ms`,
      status: 408,
      tool,
      retriable: true,
      userMessage:
        "The request took too long. Please try again with shorter text, or try again later.",
      retryAfterMs: 5000,
    });
    this.name = "TimeoutError";
  }
}

export class InputValidationError extends ToolServiceError {
  constructor(tool: ToolName, message: string) {
    super({
      message,
      status: 400,
      tool,
      retriable: false,
      userMessage: message,
    });
    this.name = "InputValidationError";
  }
}

export class PaymentRequiredError extends ToolServiceError {
  constructor(tool: ToolName, details?: unknown) {
    super({
      message: "Insufficient credits",
      status: 402,
      tool,
      retriable: false,
      userMessage:
        "Insufficient credits. Please upgrade your plan to continue using this tool.",
      details,
    });
    this.name = "PaymentRequiredError";
  }
}

function getDefaultUserMessage(status: number): string {
  switch (true) {
    case status === 400:
      return "Invalid input. Please check your text and try again.";
    case status === 401:
      return "Please sign in to use this tool.";
    case status === 402:
      return "Insufficient credits. Please upgrade your plan.";
    case status === 403:
      return "You don't have permission to use this feature.";
    case status === 408:
      return "The request took too long. Please try again.";
    case status === 429:
      return "Too many requests. Please wait a moment and try again.";
    case status >= 500 && status < 600:
      return "Something went wrong on our end. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

export function normalizeError(
  error: unknown,
  tool: ToolName
): ToolServiceError {
  if (error instanceof ToolServiceError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new ToolServiceError({
        message: "Request was cancelled",
        status: 0,
        tool,
        retriable: false,
        userMessage: "Request was cancelled.",
      });
    }

    const status = "status" in error ? (error as any).status : 500;
    const retriable = status >= 500 || status === 408 || status === 429;

    return new ToolServiceError({
      message: error.message,
      status,
      tool,
      retriable,
      details: "details" in error ? (error as any).details : undefined,
    });
  }

  return new ToolServiceError({
    message: String(error),
    status: 500,
    tool,
    retriable: true,
  });
}

export interface ErrorDisplayInfo {
  title: string;
  message: string;
  canRetry: boolean;
  retryAfterMs?: number;
  showUpgrade: boolean;
}

export function getErrorDisplayInfo(error: ToolServiceError): ErrorDisplayInfo {
  return {
    title: getErrorTitle(error),
    message: error.userMessage,
    canRetry: error.retriable,
    retryAfterMs: error.retryAfterMs,
    showUpgrade: error.status === 402 || error.status === 429,
  };
}

function getErrorTitle(error: ToolServiceError): string {
  switch (error.name) {
    case "AuthenticationError":
      return "Sign In Required";
    case "QuotaExceededError":
      return "Usage Limit Reached";
    case "ServiceUnavailableError":
      return "Service Unavailable";
    case "TimeoutError":
      return "Request Timed Out";
    case "InputValidationError":
      return "Invalid Input";
    case "PaymentRequiredError":
      return "Upgrade Required";
    default:
      return "Error";
  }
}
