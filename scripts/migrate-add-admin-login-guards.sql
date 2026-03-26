-- 管理员登录保护表迁移脚本
-- 用于给已部署系统补充登录失败计数、限流和锁定能力

BEGIN;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = 'pg_catalog'
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS admin_login_guards (
    guard_key VARCHAR(128) PRIMARY KEY,
    guard_type VARCHAR(20) NOT NULL CHECK (guard_type IN ('username', 'ip')),
    failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
    first_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_until TIMESTAMP WITH TIME ZONE NULL CHECK (locked_until IS NULL OR locked_until >= first_failed_at),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_login_guards_type
ON admin_login_guards(guard_type);

CREATE INDEX IF NOT EXISTS idx_admin_login_guards_locked_until
ON admin_login_guards(locked_until);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_admin_login_guards_updated_at'
    ) THEN
        CREATE TRIGGER update_admin_login_guards_updated_at
            BEFORE UPDATE ON admin_login_guards
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

ALTER TABLE admin_login_guards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'admin_login_guards'
          AND policyname = 'Enable all operations for admin_login_guards'
    ) THEN
        CREATE POLICY "Enable all operations for admin_login_guards" ON admin_login_guards
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

COMMIT;
