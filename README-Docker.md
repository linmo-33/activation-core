# Docker 部署指南

快速使用 Docker 部署激活码管理系统。

## 🚀 快速开始（3 步完成部署）

### 1. 获取代码

```bash
git clone <your-repo>
cd activation-core
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env  # 修改JWT_SECRET等配置
```

### 3. 启动服务

```bash
docker-compose up -d
```

访问: http://localhost:3000/admin/login

## ⚙️ 重要配置

编辑 `.env` 文件中的关键配置：

```bash
# 必须修改：JWT密钥（用于登录会话）
JWT_SECRET="your-secure-random-key-here"

# 可选：管理员账户（留空自动生成密码）
ADMIN_USERNAME="admin"
ADMIN_PASSWORD=""

# 可选：IP访问限制（留空允许所有IP）
ADMIN_IP_WHITELIST=""
```

## 🔧 常用命令

```bash
# 启动服务（后台运行）
docker-compose up -d

# 启动服务（前台，显示日志）
docker-compose up

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart
```

## 💾 数据持久化

- 数据库文件自动保存到 `./data/` 目录
- 服务重启后数据不会丢失
- 定期备份 `./data/` 目录即可

```bash
# 备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# 恢复数据
tar -xzf backup-YYYYMMDD.tar.gz
```

## 🛠 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 512MB 内存

## 🔍 故障排除

### 容器启动失败

```bash
# 查看错误日志
docker-compose logs

# 检查端口占用
lsof -i :3000
```

### 忘记管理员密码

```bash
# 查看启动日志中的自动生成密码
docker-compose logs | grep "密码"

# 或进入容器重置
docker-compose exec activation-core-app node scripts/reset-admin-password.js newpassword
```

### 清理重置

```bash
# 停止并删除所有数据
docker-compose down -v
rm -rf data/

# 重新启动
docker-compose up -d
```

## 🚀 生产部署建议

1. **修改默认密钥**：务必修改 `.env` 中的 `JWT_SECRET`
2. **设置防火墙**：限制 3000 端口访问
3. **配置反向代理**：使用 Nginx 或 Traefik 添加 HTTPS
4. **定期备份**：备份 `./data/` 目录

---

**就这么简单！** 🎉
