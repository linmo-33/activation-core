import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type DbTransaction = Parameters<typeof db.transaction>[0] extends (
  tx: infer T
) => Promise<any>
  ? T
  : never;

export const CURRENT_TIMESTAMP_SQL = sql`CURRENT_TIMESTAMP`;

export function toNumber(value: unknown): number {
  return Number(value ?? 0);
}
