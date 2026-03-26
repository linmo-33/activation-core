import { check, index, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const adminLoginGuards = pgTable(
  "admin_login_guards",
  {
    guardKey: varchar("guard_key", { length: 128 }).primaryKey(),
    guardType: varchar("guard_type", { length: 20 }).notNull(),
    failedCount: integer("failed_count").default(0).notNull(),
    firstFailedAt: timestamp("first_failed_at", { withTimezone: true }).defaultNow().notNull(),
    lastFailedAt: timestamp("last_failed_at", { withTimezone: true }).defaultNow().notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_admin_login_guards_type").on(table.guardType),
    index("idx_admin_login_guards_locked_until").on(table.lockedUntil),
    check("admin_login_guards_guard_type_check", sql`${table.guardType} in ('username', 'ip')`),
    check("admin_login_guards_failed_count_check", sql`${table.failedCount} >= 0`),
    check(
      "admin_login_guards_locked_until_check",
      sql`${table.lockedUntil} is null or ${table.lockedUntil} >= ${table.firstFailedAt}`
    ),
  ]
);
