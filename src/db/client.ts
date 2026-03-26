import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const drizzlePoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  max: 5,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
};

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(drizzlePoolConfig);
  }

  return pool;
}

export const dbPool = getPool();
export const db = drizzle(dbPool);
