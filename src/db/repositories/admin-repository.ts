import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { CURRENT_TIMESTAMP_SQL } from "./_shared";

export interface AdminUserRecord {
  id: number;
  username: string;
  password_hash: string;
}

export interface AdminUserPasswordRecord extends AdminUserRecord {
  created_at: Date;
  updated_at: Date;
}

export async function findAdminByUsername(username: string): Promise<AdminUserRecord | null> {
  const result = await db
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
      password_hash: adminUsers.passwordHash,
    })
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);

  return result[0] ?? null;
}

export async function hasAnyAdminUser(): Promise<boolean> {
  const result = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(adminUsers);

  return Number(result[0]?.count ?? 0) > 0;
}

export async function createInitialAdminUser(
  username: string,
  passwordHash: string
): Promise<AdminUserRecord> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`LOCK TABLE admin_users IN ACCESS EXCLUSIVE MODE`);

    const existingAdmins = await tx
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .limit(1);

    if (existingAdmins.length > 0) {
      throw new Error("ADMIN_ALREADY_INITIALIZED");
    }

    const inserted = await tx
      .insert(adminUsers)
      .values({
        username,
        passwordHash,
      })
      .returning({
        id: adminUsers.id,
        username: adminUsers.username,
        password_hash: adminUsers.passwordHash,
      });

    return inserted[0];
  });
}

export async function findAdminPasswordById(adminId: number): Promise<AdminUserPasswordRecord | null> {
  const result = await db
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
      password_hash: adminUsers.passwordHash,
      created_at: adminUsers.createdAt,
      updated_at: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, adminId))
    .limit(1);

  return result[0] ?? null;
}

export async function updateAdminPasswordById(
  adminId: number,
  passwordHash: string
): Promise<boolean> {
  const updated = await db
    .update(adminUsers)
    .set({
      passwordHash,
      updatedAt: CURRENT_TIMESTAMP_SQL,
    })
    .where(eq(adminUsers.id, adminId))
    .returning({ id: adminUsers.id });

  return updated.length > 0;
}
