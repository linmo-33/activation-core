#!/bin/sh

# Docker入口脚本 - 激活码管理系统
# 处理数据库初始化、环境检查和应用启动

set -e

echo "🚀 启动激活码管理系统容器..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo "${RED}[ERROR]${NC} $1"
}

# 检查必要的环境变量
check_env() {
    log_info "检查环境变量配置..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL未设置，使用默认值"
        export DATABASE_URL="file:/app/data/prod.db"
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        log_warning "JWT_SECRET未设置，使用默认值（生产环境请修改）"
        export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
    fi
    
    if [ -z "$NODE_ENV" ]; then
        export NODE_ENV="production"
    fi
    
    log_success "环境变量检查完成"
}

# 创建数据目录
setup_data_directory() {
    log_info "设置数据目录..."
    
    # 确保数据目录存在
    mkdir -p /app/data
    
    # 检查目录权限
    if [ ! -w /app/data ]; then
        log_error "数据目录没有写入权限"
        exit 1
    fi
    
    log_success "数据目录设置完成"
}

# 数据库初始化
init_database() {
    log_info "初始化数据库..."
    
    # 检查数据库文件是否存在
    DB_FILE="/app/data/prod.db"
    
    if [ ! -f "$DB_FILE" ]; then
        log_info "数据库文件不存在，创建新数据库..."
        
        # 设置Prisma环境变量
        export DATABASE_URL="file:/app/data/prod.db"
        
        # 推送数据库架构
        log_info "推送数据库架构..."
        npx prisma db push --force-reset
        
        if [ $? -eq 0 ]; then
            log_success "数据库架构推送成功"
        else
            log_error "数据库架构推送失败"
            exit 1
        fi
        
        # 初始化管理员账户
        log_info "初始化管理员账户..."
        
        # 设置管理员账户环境变量（如果未设置）
        if [ -z "$ADMIN_USERNAME" ]; then
            export ADMIN_USERNAME="admin"
        fi
        
        # 运行管理员初始化脚本
        node scripts/init-admin.js
        
        if [ $? -eq 0 ]; then
            log_success "管理员账户初始化成功"
        else
            log_error "管理员账户初始化失败"
            exit 1
        fi
        
    else
        log_info "数据库文件已存在，跳过初始化"
        
        # 检查数据库连接
        log_info "验证数据库连接..."
        npx prisma db push
        
        if [ $? -eq 0 ]; then
            log_success "数据库连接正常"
        else
            log_warning "数据库连接验证失败，但继续启动应用"
        fi
    fi
}

# 应用健康检查
wait_for_app() {
    log_info "等待应用启动..."
    
    # 给应用一些时间来启动
    sleep 5
    
    # 可以在这里添加更多的启动后检查逻辑
    log_success "应用启动准备完成"
}

# 清理函数（处理优雅关闭）
cleanup() {
    log_info "接收到停止信号，正在优雅关闭..."
    # 如果需要，可以在这里添加清理逻辑
    exit 0
}

# 设置信号处理
trap cleanup SIGTERM SIGINT

# 主启动流程
main() {
    log_info "开始启动流程..."
    
    # 1. 检查环境变量
    check_env
    
    # 2. 设置数据目录
    setup_data_directory
    
    # 3. 初始化数据库
    init_database
    
    # 4. 启动Next.js应用
    log_info "启动Next.js应用..."
    
    # 使用exec来确保信号能够正确传递给Node.js进程
    exec node server.js
}

# 执行主函数
main "$@" 