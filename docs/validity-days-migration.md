# 激活码有效期升级说明

## 📋 更新内容

本次更新添加了 `validity_days` 字段，支持**相对过期时间**（从激活时刻计算有效期），同时保持向后兼容。

## 🎯 新功能

### 有效期类型

1. **♾️ 永久**
   - `validity_days = NULL` 且 `expires_at = NULL`
   - 激活码永不过期

2. **📅 日卡**
   - `validity_days = 1`
   - 激活后 24 小时有效
   - 激活时动态计算 `expires_at`

3. **📆 月卡**
   - `validity_days = 30`
   - 激活后 30 天有效
   - 激活时动态计算 `expires_at`

4. **⏰ 指定时间**
   - `validity_days = NULL` 且 `expires_at = 具体时间`
   - 在指定时间点过期（无论是否激活）

## 🔄 数据库迁移

### 执行迁移脚本

```bash
# 在 PostgreSQL 中执行
psql -U your_username -d your_database -f scripts/migrate-add-validity-days.sql
```

或在 Supabase SQL 编辑器中执行 `scripts/migrate-add-validity-days.sql` 的内容。

### 迁移内容

```sql
-- 添加 validity_days 字段
ALTER TABLE activation_codes 
ADD COLUMN IF NOT EXISTS validity_days INTEGER NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_activation_codes_validity_days 
ON activation_codes(validity_days);
```

## ✅ 向后兼容

- **现有数据**：`validity_days` 默认为 `NULL`，继续使用 `expires_at` 的绝对过期逻辑
- **现有功能**：所有现有激活码正常工作，不受影响
- **新功能**：新生成的日卡/月卡使用相对过期逻辑

## 📊 激活逻辑

### 生成时

```typescript
// 日卡
{ code: "XXX", expires_at: null, validity_days: 1 }

// 月卡
{ code: "XXX", expires_at: null, validity_days: 30 }

// 指定时间
{ code: "XXX", expires_at: "2024-12-31T23:59:59Z", validity_days: null }

// 永久
{ code: "XXX", expires_at: null, validity_days: null }
```

### 激活时

```typescript
if (validity_days !== null) {
  // 相对过期：激活时计算过期时间
  expires_at = 激活时间 + validity_days * 24小时
} else {
  // 绝对过期：使用原有的 expires_at
  // 或永久有效（expires_at = null）
}
```

## 🎨 UI 变化

### 生成页面

- 新增"有效期类型"选择器
- 清晰说明每种类型的含义
- 日卡/月卡显示"激活后计时"提示

### 列表页面

- 新增"有效期类型"列
- 显示徽章：📅 日卡、📆 月卡、⏰ 指定时间、♾️ 永久
- 未激活的日卡/月卡显示"激活后X天"

## 🧪 测试建议

1. **生成测试**
   - 生成日卡、月卡、指定时间、永久激活码
   - 验证数据库字段正确

2. **激活测试**
   - 激活日卡，验证过期时间 = 激活时间 + 24小时
   - 激活月卡，验证过期时间 = 激活时间 + 30天
   - 激活指定时间码，验证使用原有过期时间

3. **验证测试**
   - 验证未过期的激活码可以正常使用
   - 验证过期的激活码被拒绝

## 📝 注意事项

1. **数据库迁移**：必须先执行迁移脚本，再部署新代码
2. **现有激活码**：不受影响，继续使用原有逻辑
3. **日志输出**：激活时会显示有效期信息（如有）
4. **扩展性**：可以轻松添加周卡（7天）、季卡（90天）、年卡（365天）

## 🚀 部署步骤

1. 备份数据库
2. 执行迁移脚本 `scripts/migrate-add-validity-days.sql`
3. 验证字段添加成功
4. 部署新代码
5. 测试新功能

## 💡 未来扩展

可以轻松添加更多卡类型：

```typescript
// 周卡
{ validity_days: 7 }

// 季卡
{ validity_days: 90 }

// 年卡
{ validity_days: 365 }

// 自定义天数
{ validity_days: 任意数字 }
```
