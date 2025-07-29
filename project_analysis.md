# **激活码核心系统设计文档 (v3.0)**



## 1. 项目概述



### 1.1. 项目简介

本文档旨在设计一个基础的激活码管理与验证系统。系统为管理员提供一个后台，用于生成和管理激活码；并为客户端应用提供一个API接口，用于验证激活码的有效性。



### 1.2. 核心功能

- **管理员**:
  - 安全登录后台系统。
  - 批量生成激活码。
  - 查看所有激活码及其状态（未使用、已使用、已过期）。
  - 手动**重置**一个已使用的激活码，使其可以被再次使用。
- **客户端**:
  - 通过唯一的API接口，提交激活码和设备ID进行验证。
  - 一个激活码只能绑定一台设备。



### 1.3. 技术架构



- **框架**: Next.js (App Router)
- **部署**: Vercel平台 (Serverless)
- **数据库**: Supabase (仅作为PostgreSQL数据库使用)
- **UI组件库**:Shadcn/UI 
- **认证**: 自建JWT认证流程



## 2. 技术栈



| 类别             | 技术/服务             |
| ---------------- | --------------------- |
| **核心框架**     | Next.js               |
| **开发语言**     | TypeScript            |
| **部署平台**     | Vercel                |
| **数据库服务**   | Supabase (PostgreSQL) |
| **数据库客户端** | `node-postgres` (pg)  |
| **密码加密**     | `bcrypt.js`           |
| **会话管理**     | `jsonwebtoken`        |

## 3. 数据库设计



数据库将在Supabase项目中通过SQL编辑器创建。



### 3.1. `admin_users` (管理员表)



用于存储管理员的登录凭证。 | 字段名 | 类型 | 约束/备注 | | :--- | :--- | :--- | | `id` | `SERIAL` | 主键, 自增 | | `username` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | | `password_hash` | `VARCHAR(255)` | `NOT NULL` - bcrypt哈希后的密码 |



### 3.2. `activation_codes` (激活码表)



采用最简化的字段集。 | 字段名 | 类型 | 约束/备注 | | :--- | :--- | :--- | | `id` | `SERIAL` | 主键, 自增 | | `code` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` - 激活码字符串 | | `status` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'unused'` - (unused, used) | | `expires_at` | `TIMESTAMP WITH TIME ZONE` | `NULL` - 激活码必须在此日期前激活，NULL为永不过期 | | `used_at` | `TIMESTAMP WITH TIME ZONE` | `NULL` - 激活时间 | | `used_by_device_id` | `VARCHAR(255)` | `NULL` - 绑定的设备唯一ID | | `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` |



## 4. 功能实现



### 4.1. 数据库连接 (`lib/db.ts`)



采用`node-postgres` (pg)库直连Supabase数据库。通过创建中央连接池管理模块，在Serverless环境中复用连接，保证性能。

TypeScript

```
// lib/db.ts
import { Pool } from 'pg';

// ... 此处为标准的、用于在Serverless环境中缓存连接池的代码 ...

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
};

// ... 实现开发与生产环境的连接池创建逻辑 ...

export default db; // 导出db实例供全局使用
```



### 4.2. 管理员认证流程



采用自建的、基于JWT的认证体系。

1. **登录页 (`app/admin/login/page.tsx`)**: 提供一个表单供管理员输入用户名和密码。
2. **登录API (`app/api/admin/login/route.ts`)**:
   - 接收POST请求。
   - 使用`db`实例查询`admin_users`表。
   - 使用`bcrypt.compare()`校验密码。
   - 成功后，使用`jsonwebtoken.sign()`生成JWT，并将其设置到`httpOnly` Cookie中。
3. **路由守卫 (`middleware.ts`)**:
   - 保护所有`/admin/**`路径。
   - 验证请求Cookie中的JWT是否有效，无效则重定向到登录页。



### 4.3. 激活码管理 (核心)



- **生成激活码**:

  - 在后台页面提供一个页面，输入需要生成的数量和可选的过期时间。

- **查看激活码**:

  - 主列表页 (`app/admin/codes/page.tsx`) 是一个服务端组件。
  - 直接在组件内`await db.query()`来获取激活码列表，并以表格形式展示。
  - 表格中应清晰展示`code`, `status`, `used_by_device_id`, `expires_at`等信息。

- **重置激活码**:

  - 在列表中每个状态为`used`的激活码旁，设置一个“重置”按钮。

  - 该按钮绑定一个**Server Action**，接收`code_id`作为参数。

  - Action执行以下SQL语句，并将激活码恢复至未使用状态：

    SQL

    ```
    UPDATE activation_codes
    SET status = 'unused', used_by_device_id = NULL, used_at = NULL
    WHERE id = $1;
    ```

  - Action执行后调用`revalidatePath`刷新列表。



### 4.4. 客户端激活 API



- **API端点**: `app/api/client/activate/route.ts`

- **请求方法**: `POST`

- **请求体 (JSON)**:

  JSON

  ```
  {
    "code": "XXXX-XXXX-XXXX-XXXX",
    "device_id": "UNIQUE-DEVICE-IDENTIFIER"
  }
  ```

- **核心验证逻辑**:

  1. 根据`code`查询数据库。如果码不存在，返回错误。
  2. 检查`status`是否为`unused`。如果不是，返回“已被使用”错误。
  3. 检查`expires_at`是否已过期（如果`expires_at`不为NULL）。如果过期，返回错误。
  4. 验证通过，执行`UPDATE`语句，将`status`设为`used`，并记录`used_by_device_id`和`used_at`。
  5. 返回成功响应。



## 5. 安全性考量



- **密码存储**: 管理员密码必须使用`bcrypt`加盐哈希。
- **数据传输**: Vercel平台强制HTTPS，保障传输安全。
- **凭证管理**: `DATABASE_URL`和`JWT_SECRET`等敏感信息必须存储在Vercel的环境变量中。
- **SQL注入**: 所有数据库查询必须使用`pg`库的参数化查询功能，严防SQL注入。



## 6. 部署

项目代码托管于Git仓库（如GitHub）。将该仓库与Vercel项目关联后，任何推送到主分支的操作都将触发Vercel的自动化构建和部署流程，实现无缝的持续集成/持续部署（CI/CD）。