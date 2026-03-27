# 导出导入迁移说明

该目录承接旧部署迁移到 Drizzle 新架构时的关键表导出、导入和数据结构定义。

当前迁移策略：

- 新部署直接使用 Drizzle migration 初始化数据库
- 已部署系统采用“关键表导出 -> 新库初始化 -> 数据导入”迁移
- 不沿用旧数据库中的触发器、视图、RLS、函数实现

当前关键表范围：

- `admin_users`
- `activation_codes`

说明：

- `admin_login_guards` 默认不迁移
- 登录保护状态在新系统中重新累积
- baseline 结构以 `drizzle/migrations/` 为准
- `scripts/init-db.sql` 仅保留为与 baseline 对齐的 SQL 副本
- 旧架构增量 SQL 脚本已从仓库移除，避免误用
