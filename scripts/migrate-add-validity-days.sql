-- 添加 validity_days 字段以支持相对过期时间（日卡/月卡）
-- 执行时间：根据需要在数据库中执行此脚本

BEGIN;

-- 1. 添加 validity_days 字段
-- NULL: 使用 expires_at 的绝对过期时间（或永久有效）
-- 数字: 激活后的有效天数（如 1=日卡, 30=月卡）
ALTER TABLE activation_codes 
ADD COLUMN IF NOT EXISTS validity_days INTEGER NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'activation_codes_validity_days_check'
    ) THEN
        ALTER TABLE activation_codes
            ADD CONSTRAINT activation_codes_validity_days_check
            CHECK (validity_days IS NULL OR validity_days > 0);
    END IF;
END $$;

-- 2. 添加注释说明
COMMENT ON COLUMN activation_codes.validity_days IS '激活后的有效天数：NULL=使用expires_at绝对时间，1=日卡，30=月卡';

-- 3. 为新字段创建索引（可选，用于查询优化）
CREATE INDEX IF NOT EXISTS idx_activation_codes_validity_days ON activation_codes(validity_days);

-- 迁移完成
-- 现有数据的 validity_days 为 NULL，将继续使用 expires_at 的绝对过期逻辑
-- 新生成的日卡/月卡将使用 validity_days 字段

COMMIT;
