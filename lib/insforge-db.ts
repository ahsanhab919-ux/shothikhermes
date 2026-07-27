import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __shothikInsforgePool: Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      return "postgres://postgres:postgres@localhost:5432/shothik_test";
    }
    throw new Error("DATABASE_URL is not configured for InsForge Postgres access");
  }
  return databaseUrl;
}

function createPool() {
  return new Pool({
    connectionString: getDatabaseUrl(),
    max: 10,
  });
}

export const insforgePool =
  globalThis.__shothikInsforgePool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__shothikInsforgePool = insforgePool;
}

export async function insforgeQuery<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return insforgePool.query<T>(text, params);
}

export async function withInsforgeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
) {
  const client = await insforgePool.connect();
  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
