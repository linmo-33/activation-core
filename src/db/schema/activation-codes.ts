import { check, index, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const activationCodes = pgTable(
  "activation_codes",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).default("unused").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedByDeviceId: varchar("used_by_device_id", { length: 255 }),
    validityDays: integer("validity_days"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_activation_codes_code").on(table.code),
    uniqueIndex("activation_codes_code_unique_idx").on(table.code),
    index("idx_activation_codes_status").on(table.status),
    index("idx_activation_codes_expires_at").on(table.expiresAt),
    index("idx_activation_codes_device_id").on(table.usedByDeviceId),
    index("idx_activation_codes_created_at").on(table.createdAt),
    index("idx_activation_codes_validity_days").on(table.validityDays),
    check("activation_codes_status_check", sql`${table.status} in ('unused', 'used')`),
    check(
      "activation_codes_validity_days_check",
      sql`${table.validityDays} is null or ${table.validityDays} > 0`
    ),
  ]
);
