-- activation-core 数据库初始化基线脚本
--
-- 说明：
-- 1. 新部署优先使用 Drizzle migration（pnpm run db:migrate）
-- 2. 本文件仅作为与当前 Drizzle baseline 对齐的 SQL 基线副本
-- 3. 不再包含触发器、RLS、视图、函数等数据库侧业务逻辑
-- 4. 业务约束、统计聚合、更新时间维护统一下沉到应用层实现

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_unique
    ON admin_users(username);

CREATE TABLE IF NOT EXISTS activation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unused',
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    used_by_device_id VARCHAR(255) NULL,
    validity_days INTEGER NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT activation_codes_status_check CHECK (status IN ('unused', 'used')),
    CONSTRAINT activation_codes_validity_days_check CHECK (validity_days IS NULL OR validity_days > 0)
);

CREATE INDEX IF NOT EXISTS idx_activation_codes_code
    ON activation_codes(code);
CREATE UNIQUE INDEX IF NOT EXISTS activation_codes_code_unique_idx
    ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_status
    ON activation_codes(status);
CREATE INDEX IF NOT EXISTS idx_activation_codes_expires_at
    ON activation_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_device_id
    ON activation_codes(used_by_device_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_created_at
    ON activation_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_validity_days
    ON activation_codes(validity_days);

CREATE TABLE IF NOT EXISTS admin_login_guards (
    guard_key VARCHAR(128) PRIMARY KEY,
    guard_type VARCHAR(20) NOT NULL,
    failed_count INTEGER NOT NULL DEFAULT 0,
    first_failed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_failed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT admin_login_guards_guard_type_check CHECK (guard_type IN ('username', 'ip')),
    CONSTRAINT admin_login_guards_failed_count_check CHECK (failed_count >= 0),
    CONSTRAINT admin_login_guards_locked_until_check CHECK (
        locked_until IS NULL OR locked_until >= first_failed_at
    )
);

CREATE INDEX IF NOT EXISTS idx_admin_login_guards_type
    ON admin_login_guards(guard_type);
CREATE INDEX IF NOT EXISTS idx_admin_login_guards_locked_until
    ON admin_login_guards(locked_until);

COMMENT ON COLUMN activation_codes.validity_days IS
    '激活后的有效天数：NULL=使用 expires_at 绝对时间，正整数=从激活时刻开始计算的有效期';
