-- 激活码管理系统数据库初始化脚本

-- 创建管理员用户表
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建激活码表
CREATE TABLE IF NOT EXISTS activation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,  -- 20位字母数字激活码
    status VARCHAR(20) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    used_by_device_id VARCHAR(255) NULL,
    validity_days INTEGER NULL CHECK (validity_days IS NULL OR validity_days > 0),  -- 激活后的有效天数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理员登录保护表
-- 用于登录失败计数、限流和锁定控制
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

-- 为 validity_days 字段添加注释
COMMENT ON COLUMN activation_codes.validity_days IS '激活后的有效天数：NULL=使用expires_at绝对时间，1=日卡，30=月卡';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_status ON activation_codes(status);
CREATE INDEX IF NOT EXISTS idx_activation_codes_expires_at ON activation_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_device_id ON activation_codes(used_by_device_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_created_at ON activation_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_validity_days ON activation_codes(validity_days);
CREATE INDEX IF NOT EXISTS idx_admin_login_guards_type ON admin_login_guards(guard_type);
CREATE INDEX IF NOT EXISTS idx_admin_login_guards_locked_until ON admin_login_guards(locked_until);

-- 创建更新时间触发器函数
-- 使用 SECURITY DEFINER 和安全的 search_path 防止 search_path 劫持攻击
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

-- 为表添加更新时间触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_users_updated_at'
    ) THEN
        CREATE TRIGGER update_admin_users_updated_at
            BEFORE UPDATE ON admin_users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_activation_codes_updated_at'
    ) THEN
        CREATE TRIGGER update_activation_codes_updated_at
            BEFORE UPDATE ON activation_codes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_login_guards_updated_at'
    ) THEN
        CREATE TRIGGER update_admin_login_guards_updated_at
            BEFORE UPDATE ON admin_login_guards
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 管理员账号初始化说明
-- 不再在数据库脚本中写入默认管理员，避免默认密码带来的安全风险
-- 初始化数据库后，请首次访问 /admin/setup 完成管理员账号创建
-- 系统只允许创建一个管理员账号，已初始化的系统不会展示 setup 页面

-- ================================
-- 安全配置
-- ================================

-- 启用行级安全策略 (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_guards ENABLE ROW LEVEL SECURITY;

-- 为各表创建 RLS 策略
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Enable all operations for admin_users'
    ) THEN
        CREATE POLICY "Enable all operations for admin_users" ON admin_users
            FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'activation_codes' AND policyname = 'Enable all operations for activation_codes'
    ) THEN
        CREATE POLICY "Enable all operations for activation_codes" ON activation_codes
            FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_login_guards' AND policyname = 'Enable all operations for admin_login_guards'
    ) THEN
        CREATE POLICY "Enable all operations for admin_login_guards" ON admin_login_guards
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ================================
-- 修复 SECURITY DEFINER 视图问题
-- ================================

-- 强制删除现有的统计视图（包括可能的 SECURITY DEFINER 属性）
DROP VIEW IF EXISTS public.activation_codes_stats CASCADE;

-- 重新创建统计视图，明确指定 SECURITY INVOKER（PostgreSQL 15+ 标准语法）
-- 使用 WITH (security_invoker = true) 确保视图使用调用者权限，符合 Supabase 安全要求
CREATE VIEW public.activation_codes_stats 
WITH (security_invoker = true) AS
SELECT
    COUNT(*) as total_codes,
    COUNT(CASE WHEN status = 'unused' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) THEN 1 END) as unused_codes,
    COUNT(CASE WHEN status = 'used' THEN 1 END) as used_codes,
    COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_codes
FROM activation_codes;

-- 数据库初始化完成
