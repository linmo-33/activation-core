-- 激活码管理系统数据库初始化脚本（简化版本）
-- 在 Supabase 项目的 SQL 编辑器中执行此脚本

-- 设置数据库时区为亚洲/上海时区
SET timezone = 'Asia/Shanghai';

-- 创建管理员用户表
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建激活码表（简化版本）
CREATE TABLE IF NOT EXISTS activation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,  -- 20位字母数字激活码
    status VARCHAR(20) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    used_by_device_id VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_status ON activation_codes(status);
CREATE INDEX IF NOT EXISTS idx_activation_codes_expires_at ON activation_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_device_id ON activation_codes(used_by_device_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_created_at ON activation_codes(created_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表添加更新时间触发器
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activation_codes_updated_at 
    BEFORE UPDATE ON activation_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认管理员账户（密码: admin123）
-- 使用 bcrypt 哈希，saltRounds = 10
-- ⚠️ 重要：部署到生产环境后请立即修改默认密码！
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$4n.KlGeI9XuRAjJ8mJ2ivuQ2CSekGAeLv5.nj1ydNZwWz23MF8Peq')
ON CONFLICT (username) DO UPDATE SET password_hash = '$2b$10$4n.KlGeI9XuRAjJ8mJ2ivuQ2CSekGAeLv5.nj1ydNZwWz23MF8Peq';

-- 生成新密码哈希的方法：
-- 运行: node scripts/hash-password.js your-new-password

-- 创建简单的统计视图
CREATE OR REPLACE VIEW activation_codes_stats AS
SELECT
    COUNT(*) as total_codes,
    COUNT(CASE WHEN status = 'unused' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) THEN 1 END) as unused_codes,
    COUNT(CASE WHEN status = 'used' THEN 1 END) as used_codes,
    COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_codes
FROM activation_codes;

-- 验证时区设置
SELECT
    'Database initialization completed successfully!' as message,
    CURRENT_SETTING('timezone') as current_timezone,
    CURRENT_TIMESTAMP as current_time;
