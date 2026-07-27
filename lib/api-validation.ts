import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// Global registry for our endpoints
export const registry = new OpenAPIRegistry();

// Extends Zod with OpenAPI methods
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export { z }; // Re-export extended zod

// Enterprise API Configuration
export interface RouteConfig {
  requireAuth?: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  requireIdempotencyKey?: boolean;
}

interface RouteDefinition<
  TBody extends z.ZodTypeAny | undefined,
  TQuery extends z.ZodTypeAny | undefined,
  TParams extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny | undefined
> {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  config?: RouteConfig;
  schemas?: {
    body?: TBody;
    query?: TQuery;
    params?: TParams;
    response?: TResponse;
  };
  handler: (ctx: {
    req: NextRequest;
    requestId: string;
    body: TBody extends z.ZodTypeAny ? z.infer<TBody> : undefined;
    query: TQuery extends z.ZodTypeAny ? z.infer<TQuery> : undefined;
    params: TParams extends z.ZodTypeAny ? z.infer<TParams> : undefined;
  }) => Promise<NextResponse | Response> | NextResponse | Response;
}

/**
 * Structured Enterprise Logger
 */
const logger = {
  info: (msg: string, meta: Record<string, any> = {}) => {
    console.info(JSON.stringify({ level: "INFO", timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  error: (msg: string, meta: Record<string, any> = {}) => {
    console.error(JSON.stringify({ level: "ERROR", timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  warn: (msg: string, meta: Record<string, any> = {}) => {
    console.warn(JSON.stringify({ level: "WARN", timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
};

/**
 * Basic in-memory rate limiter (For production, replace with Redis)
 */
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, config: { requests: number; windowMs: number }): boolean {
  const now = Date.now();
  let record = rateLimitCache.get(ip);
  
  if (!record || record.resetAt < now) {
    record = { count: 1, resetAt: now + config.windowMs };
    rateLimitCache.set(ip, record);
    return true;
  }
  
  if (record.count >= config.requests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Enterprise Route Wrapper
 * 1. Registers the route to OpenAPI registry
 * 2. Provides runtime validation for body, query, and params
 * 3. Handles Authentication & Rate Limiting
 * 4. Provides Structured Logging & Request IDs
 * 5. Handles errors consistently
 */
export function defineRoute<
  TBody extends z.ZodTypeAny | undefined,
  TQuery extends z.ZodTypeAny | undefined,
  TParams extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny | undefined
>(def: RouteDefinition<TBody, TQuery, TParams, TResponse>) {
  // 1. Register OpenAPI spec
  const requestBody = def.schemas?.body
    ? {
        content: {
          "application/json": { schema: def.schemas.body },
        },
      }
    : undefined;

  const parameters: any[] = [];
  if (def.schemas?.query) {
    const shape = (def.schemas.query as any).shape || {};
    for (const [key, schema] of Object.entries(shape)) {
      parameters.push({
        in: "query",
        name: key,
        schema: schema as z.ZodTypeAny,
      });
    }
  }
  if (def.schemas?.params) {
    const shape = (def.schemas.params as any).shape || {};
    for (const [key, schema] of Object.entries(shape)) {
      parameters.push({
        in: "path",
        name: key,
        schema: schema as z.ZodTypeAny,
        required: true,
      });
    }
  }
  if (def.config?.requireIdempotencyKey) {
    parameters.push({
      in: "header",
      name: "Idempotency-Key",
      schema: z.string().openapi({ description: "Unique key for safe retries" }),
      required: true,
    });
  }

  const responses = def.schemas?.response
    ? {
        200: {
          description: "Successful response",
          content: { "application/json": { schema: def.schemas.response } },
        },
      }
    : {
        200: { description: "Successful response" },
      };

  registry.registerPath({
    method: def.method,
    path: def.path.replace(/\[(.*?)\]/g, "{$1}"), // Next.js [param] -> OpenAPI {param}
    summary: def.summary,
    description: def.description,
    tags: def.tags,
    security: def.config?.requireAuth ? [{ bearerAuth: [] }] : [],
    request: {
      body: requestBody,
      params: def.schemas?.params as any,
      query: def.schemas?.query as any,
      headers: def.config?.requireIdempotencyKey ? z.object({ "idempotency-key": z.string() }) as any : undefined,
    },
    responses: {
      ...responses,
      400: { description: "Validation Error" },
      401: { description: "Unauthorized" },
      429: { description: "Too Many Requests" },
      500: { description: "Internal Server Error" },
    },
  });

  // 2. Return Next.js Route Handler
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> | Record<string, string> } | any
  ) => {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    logger.info(`Incoming request`, { method: req.method, path: req.nextUrl.pathname, requestId, ip });

    try {
      // Rate Limiting
      if (def.config?.rateLimit) {
        const isAllowed = checkRateLimit(ip, def.config.rateLimit);
        if (!isAllowed) {
          logger.warn("Rate limit exceeded", { ip, requestId });
          return NextResponse.json(
            { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" } },
            { status: 429, headers: { "Retry-After": "60" } }
          );
        }
      }

      // Authentication (Placeholder for real auth check)
      if (def.config?.requireAuth) {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          logger.warn("Unauthorized request", { ip, requestId });
          return NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Missing or invalid authentication token" } },
            { status: 401 }
          );
        }
        // TODO: Validate JWT via Convex or custom logic
      }

      // Idempotency
      if (def.config?.requireIdempotencyKey) {
        const idempotencyKey = req.headers.get("idempotency-key");
        if (!idempotencyKey) {
          return NextResponse.json(
            { error: { code: "MISSING_IDEMPOTENCY_KEY", message: "Idempotency-Key header is required" } },
            { status: 400 }
          );
        }
      }

      // Validation
      let parsedBody = undefined;
      if (def.schemas?.body) {
        const rawBody = await req.json().catch(() => ({}));
        parsedBody = def.schemas.body.parse(rawBody);
      }

      let parsedQuery = undefined;
      if (def.schemas?.query) {
        const url = new URL(req.url);
        const searchParams = Object.fromEntries(url.searchParams.entries());
        parsedQuery = def.schemas.query.parse(searchParams);
      }

      let parsedParams = undefined;
      if (def.schemas?.params && context.params) {
        const p = await context.params;
        parsedParams = def.schemas.params.parse(p);
      }

      // Execute handler
      const response = await def.handler({
        req,
        requestId,
        body: parsedBody,
        query: parsedQuery,
        params: parsedParams,
      });

      const duration = Math.round(performance.now() - startTime);
      logger.info(`Request completed`, { method: req.method, path: req.nextUrl.pathname, requestId, duration, status: response.status });
      
      // Add standard headers
      response.headers.set("X-Request-Id", requestId);
      return response;

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      if (error instanceof z.ZodError) {
        logger.warn(`Validation failed`, { requestId, path: req.nextUrl.pathname, issues: error.issues });
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request data",
              details: error.issues,
            },
          },
          { status: 400 }
        );
      }

      logger.error(`Unhandled API Error`, { requestId, path: req.nextUrl.pathname, error: (error as Error).message, stack: (error as Error).stack, duration });
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
            requestId,
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Generate full OpenAPI Spec JSON
 */
export function generateOpenApiSpec() {
  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Shothik AI Enterprise API",
      description: "Automated typed OpenAPI specs for Shothik AI with full security and governance.",
    },
    servers: [{ url: "/api" }],
  });
}
