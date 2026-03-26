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
  console.error("缺少 DATABASE_URL，无法执行导出");
  process.exit(1);
}

function getTimestampLabel() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ];

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`;
}

function resolveOutputPath() {
  const argPath = process.argv[2];
  if (argPath) {
    const resolvedPath = path.resolve(argPath);
    const outputDir = path.dirname(resolvedPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return resolvedPath;
  }

  const exportDir = path.resolve("exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  return path.join(exportDir, `activation-core-export-${getTimestampLabel()}.json`);
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  });

  try {
    console.log("开始导出关键表数据...");

    const [adminUsersResult, activationCodesResult] = await Promise.all([
      pool.query(`
        SELECT id, username, password_hash, created_at, updated_at
        FROM admin_users
        ORDER BY id ASC
      `),
      pool.query(`
        SELECT id, code, status, expires_at, used_at, used_by_device_id, validity_days, created_at, updated_at
        FROM activation_codes
        ORDER BY id ASC
      `),
    ]);

    const payload = {
      version: 1,
      exported_at: new Date().toISOString(),
      admin_users: adminUsersResult.rows,
      activation_codes: activationCodesResult.rows,
    };

    const outputPath = resolveOutputPath();
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");

    console.log("导出完成");
    console.log(`输出文件: ${outputPath}`);
    console.log(`admin_users: ${payload.admin_users.length}`);
    console.log(`activation_codes: ${payload.activation_codes.length}`);
  } catch (error) {
    console.error("导出失败:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("导出脚本异常退出:", error);
  process.exit(1);
});
