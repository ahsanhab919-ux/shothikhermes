/**
 * Server-side Convex transport for the book-service.
 *
 * Calls the internal `bookService:*` queries and mutations over the Convex
 * admin HTTP API using CONVEX_DEPLOY_KEY, following the same pattern as
 * `lib/convex-server.ts`. Kept as a thin, mockable seam so `book-service.ts`
 * stays storage-agnostic and its unit tests can stub the transport.
 */

const VALID_QUERY_PATHS = new Set([
  "bookService:listBooks",
  "bookService:getBook",
  "bookService:getAcceptedChapters",
  "bookService:listChapterAttempts",
]);

const VALID_MUTATION_PATHS = new Set([
  "bookService:createBook",
  "bookService:claimBookForRun",
  "bookService:resetBookToDraft",
  "bookService:saveChapterRecord",
  "bookService:recordChapterAttempt",
  "bookService:setBookStatus",
]);

async function callConvex(
  endpoint: "query" | "mutation",
  functionPath: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");

  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) {
    throw new Error("CONVEX_DEPLOY_KEY not configured — required for book-service");
  }

  const res = await fetch(`${url}/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    body: JSON.stringify({ path: functionPath, args }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Convex ${endpoint} failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (data.status === "error") {
    throw new Error(data.errorMessage ?? `Convex ${endpoint} error`);
  }
  return data.value;
}

export async function runBookQuery<T = unknown>(
  functionPath: string,
  args: Record<string, unknown>
): Promise<T> {
  if (!VALID_QUERY_PATHS.has(functionPath)) {
    throw new Error(`Unknown book-service query path: ${functionPath}`);
  }
  return callConvex("query", functionPath, args) as Promise<T>;
}

export async function runBookMutation<T = unknown>(
  functionPath: string,
  args: Record<string, unknown>
): Promise<T> {
  if (!VALID_MUTATION_PATHS.has(functionPath)) {
    throw new Error(`Unknown book-service mutation path: ${functionPath}`);
  }
  return callConvex("mutation", functionPath, args) as Promise<T>;
}
