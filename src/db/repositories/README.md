# Repositories

该目录只负责数据库访问。

当前约定：

- 仅封装 Drizzle 查询、事务与必要的并发锁控制
- 不处理 HTTP 请求与响应
- 不承载页面或路由层的参数校验
- 复杂业务编排放在 `src/server/*`

导入约定：

- 优先通过 `@/db/repositories` 统一入口导入
- 避免在业务层直接深引用单个 repository 文件
