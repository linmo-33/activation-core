#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const processModule = require("node:process");
const { Pool } = require("pg");

if (fs.existsSync(".env.local")) {
  processModule.loadEnvFile(".env.local");
} else if (fs.existsSync(".env")) {
  processModule.loadEnvFile(".env");
}

if (!process.env.DATABASE_URL) {
  console.error("缺少 DATABASE_URL，无法执行导入");
  process.exit(1);
}

function getInputPath() {
  const argPath = process.argv[2];
  if (!argPath) {
    console.error("请提供导入文件路径，例如: pnpm run db:import -- exports/activation-core-export.json");
    process.exit(1);
  }

  const inputPath = path.resolve(argPath);
  if (!fs.existsSync(inputPath)) {
    console.error(`导入文件不存在: ${inputPath}`);
    process.exit(1);
  }

  return inputPath;
}

function parsePayload(inputPath) {
  const raw = fs.readFileSync(inputPath, "utf8");
  const payload = JSON.parse(raw);

  if (payload.version !== 1) {
    throw new Error(`不支持的数据版本: ${payload.version}`);
  }

  if (!Array.isArray(payload.admin_users) || !Array.isArray(payload.activation_codes)) {
    throw new Error("导入文件结构无效，缺少关键表数据");
  }

  return payload;
}

async function resetSequence(client, tableName, idColumn = "id") {
  await client.query(
    `
      SELECT setval(
        pg_get_serial_sequence($1, $2),
        COALESCE((SELECT MAX(${idColumn}) FROM ${tableName}), 1),
        (SELECT COUNT(*) > 0 FROM ${tableName})
      )
    `,
    [tableName, idColumn]
  );
}

async function main() {
  const inputPath = getInputPath();
  const payload = parsePayload(inputPath);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  });

  const client = await pool.connect();

  try {
    console.log("开始导入关键表数据...");
    console.log(`输入文件: ${inputPath}`);

    await client.query("BEGIN");

    for (const row of payload.admin_users) {
      await client.query(
        `
          INSERT INTO admin_users (id, username, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE
          SET username = EXCLUDED.username,
              password_hash = EXCLUDED.password_hash,
              created_at = EXCLUDED.created_at,
              updated_at = EXCLUDED.updated_at
        `,
        [row.id, row.username, row.password_hash, row.created_at, row.updated_at]
      );
    }

    for (const row of payload.activation_codes) {
      await client.query(
        `
          INSERT INTO activation_codes (
            id,
            code,
            status,
            expires_at,
            used_at,
            used_by_device_id,
            validity_days,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE
          SET code = EXCLUDED.code,
              status = EXCLUDED.status,
              expires_at = EXCLUDED.expires_at,
              used_at = EXCLUDED.used_at,
              used_by_device_id = EXCLUDED.used_by_device_id,
              validity_days = EXCLUDED.validity_days,
              created_at = EXCLUDED.created_at,
              updated_at = EXCLUDED.updated_at
        `,
        [
          row.id,
          row.code,
          row.status,
          row.expires_at,
          row.used_at,
          row.used_by_device_id,
          row.validity_days,
          row.created_at,
          row.updated_at,
        ]
      );
    }

    await resetSequence(client, "admin_users");
    await resetSequence(client, "activation_codes");

    await client.query("COMMIT");

    console.log("导入完成");
    console.log(`admin_users: ${payload.admin_users.length}`);
    console.log(`activation_codes: ${payload.activation_codes.length}`);
    console.log("admin_login_guards 不在导入范围内，将在新系统中重新累积");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("导入失败:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("导入脚本异常退出:", error);
  process.exit(1);
});
