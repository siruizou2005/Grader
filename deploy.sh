#!/bin/bash
# Grader 一键部署脚本 - Ubuntu 24.04
# 自动检测环境、创建虚拟环境、安装依赖并启动服务

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 打印标题
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Grader 一键部署脚本${NC}"
echo -e "${BLUE}  适用于 Ubuntu 24.04${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ==================== 1. 检测系统环境 ====================
echo -e "${GREEN}[1/8] 检测系统环境...${NC}"

# 检测是否为 Ubuntu
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}❌ 错误: 无法检测操作系统版本${NC}"
    exit 1
fi

. /etc/os-release
if [ "$ID" != "ubuntu" ]; then
    echo -e "${YELLOW}⚠️  警告: 此脚本专为 Ubuntu 设计，当前系统: $ID${NC}"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ 系统: $PRETTY_NAME${NC}"

# 检测架构
ARCH=$(uname -m)
echo -e "${GREEN}✅ 架构: $ARCH${NC}"
echo ""

# ==================== 2. 检测并安装系统依赖 ====================
echo -e "${GREEN}[2/8] 检测并安装系统依赖...${NC}"

# 处理有问题的仓库源（修复 GPG 错误）
echo -e "${YELLOW}检查并修复仓库源...${NC}"
# 移除有问题的 Caddy 仓库源（如果存在）
if [ -f /etc/apt/sources.list.d/caddy-stable.list ] || grep -r "cloudsmith.io.*caddy" /etc/apt/sources.list.d/ > /dev/null 2>&1; then
    echo -e "${YELLOW}检测到有问题的 Caddy 仓库源，正在移除...${NC}"
    sudo rm -f /etc/apt/sources.list.d/caddy*.list 2>/dev/null || true
    # 也检查 sources.list 文件
    sudo sed -i '/cloudsmith.io.*caddy/d' /etc/apt/sources.list 2>/dev/null || true
fi

# 更新包列表（使用更健壮的方式）
echo -e "${YELLOW}更新包列表...${NC}"
if ! sudo apt-get update -qq 2>&1; then
    echo -e "${YELLOW}⚠️  更新包列表时遇到警告，继续执行...${NC}"
    # 即使有警告也继续，因为我们不需要 Caddy
fi

# 检测 Python3
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}安装 Python3...${NC}"
    sudo apt-get install -y python3 python3-pip python3-venv
else
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ $PYTHON_VERSION${NC}"
fi

# 检测 pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${YELLOW}安装 pip3...${NC}"
    sudo apt-get install -y python3-pip
else
    PIP_VERSION=$(pip3 --version | cut -d' ' -f2)
    echo -e "${GREEN}✅ pip $PIP_VERSION${NC}"
fi

# 检测 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}安装 Node.js...${NC}"
    # 使用 NodeSource 仓库安装最新的 LTS 版本
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
fi

# 检测 npm
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}安装 npm...${NC}"
    sudo apt-get install -y npm
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm $NPM_VERSION${NC}"
fi

# 安装其他必要的系统依赖
echo -e "${YELLOW}安装其他系统依赖...${NC}"
sudo apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    git \
    lsof \
    sqlite3

echo -e "${GREEN}✅ 系统依赖检查完成${NC}"
echo ""

# ==================== 3. 检查项目文件 ====================
echo -e "${GREEN}[3/8] 检查项目文件...${NC}"

if [ ! -d "backend" ]; then
    echo -e "${RED}❌ 错误: 未找到 backend 目录${NC}"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ 错误: 未找到 frontend 目录${NC}"
    exit 1
fi

if [ ! -f "backend/requirements.txt" ]; then
    echo -e "${RED}❌ 错误: 未找到 backend/requirements.txt${NC}"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ 错误: 未找到 frontend/package.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 项目文件检查完成${NC}"
echo ""

# ==================== 4. 创建 Python 虚拟环境 ====================
echo -e "${GREEN}[4/8] 创建 Python 虚拟环境...${NC}"

VENV_DIR="$SCRIPT_DIR/backend/venv"

if [ -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}⚠️  虚拟环境已存在，跳过创建${NC}"
else
    echo -e "${YELLOW}创建虚拟环境...${NC}"
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}✅ 虚拟环境创建成功${NC}"
fi

# 激活虚拟环境
source "$VENV_DIR/bin/activate"

# 升级 pip
echo -e "${YELLOW}升级 pip...${NC}"
pip install --upgrade pip -q

echo -e "${GREEN}✅ Python 虚拟环境准备完成${NC}"
echo ""

# ==================== 5. 安装后端依赖 ====================
echo -e "${GREEN}[5/8] 安装后端依赖...${NC}"

cd "$SCRIPT_DIR/backend"

# 检查是否需要安装依赖
if [ ! -f "venv/.installed" ] || [ "requirements.txt" -nt "venv/.installed" ]; then
    echo -e "${YELLOW}安装 Python 依赖包...${NC}"
    pip install -r requirements.txt -q
    touch "venv/.installed"
    echo -e "${GREEN}✅ 后端依赖安装完成${NC}"
else
    echo -e "${YELLOW}⚠️  依赖已安装，跳过${NC}"
fi

cd "$SCRIPT_DIR"
echo ""

# ==================== 6. 检查后端配置 ====================
echo -e "${GREEN}[6/8] 检查后端配置...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  未找到 backend/.env 文件${NC}"
    echo -e "${YELLOW}正在创建示例配置文件...${NC}"
    cat > backend/.env << EOF
# Gemini API 配置
GEMINI_API_KEY=your_gemini_api_key_here

# 数据库配置（可选，默认使用 SQLite）
# DATABASE_URL=sqlite:///./app.db

# 安全配置（可选）
# SECRET_KEY=your_secret_key_here
EOF
    echo -e "${RED}❌ 请编辑 backend/.env 文件，设置 GEMINI_API_KEY${NC}"
    echo -e "${YELLOW}配置文件路径: backend/.env${NC}"
    read -p "配置完成后按 Enter 继续，或按 Ctrl+C 退出..."
else
    # 检查是否配置了 API Key
    if grep -q "GEMINI_API_KEY=your_gemini_api_key_here" backend/.env || ! grep -q "GEMINI_API_KEY=" backend/.env; then
        echo -e "${YELLOW}⚠️  请确保在 backend/.env 中配置了有效的 GEMINI_API_KEY${NC}"
    else
        echo -e "${GREEN}✅ 配置文件检查完成${NC}"
    fi
fi

echo ""

# ==================== 7. 安装前端依赖 ====================
echo -e "${GREEN}[7/8] 安装前端依赖...${NC}"

cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装 Node.js 依赖包...${NC}"
    npm install
    echo -e "${GREEN}✅ 前端依赖安装完成${NC}"
else
    # 检查 package.json 是否更新
    if [ "package.json" -nt "node_modules/.package-lock.json" ] 2>/dev/null || [ ! -f "node_modules/.package-lock.json" ]; then
        echo -e "${YELLOW}检测到依赖更新，重新安装...${NC}"
        npm install
        echo -e "${GREEN}✅ 前端依赖更新完成${NC}"
    else
        echo -e "${YELLOW}⚠️  前端依赖已安装，跳过${NC}"
    fi
fi

cd "$SCRIPT_DIR"
echo ""

# ==================== 8. 检查端口占用 ====================
echo -e "${GREEN}[8/8] 检查端口占用...${NC}"

# 检查 8000 端口
if lsof -ti :8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  检测到 8000 端口已被占用${NC}"
    read -p "是否停止占用该端口的进程? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti :8000 | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ 已释放 8000 端口${NC}"
    fi
fi

# 检查 5173 端口
if lsof -ti :5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  检测到 5173 端口已被占用${NC}"
    read -p "是否停止占用该端口的进程? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti :5173 | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ 已释放 5173 端口${NC}"
    fi
fi

echo ""

# ==================== 9. 创建日志目录 ====================
mkdir -p logs

# ==================== 10. 启动服务 ====================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  启动服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 启动后端服务
echo -e "${GREEN}启动后端服务 (端口 8000)...${NC}"
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
nohup python run.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"

# 等待后端启动
echo -e "${YELLOW}等待后端服务启动...${NC}"
sleep 5

# 检查后端是否成功启动
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务启动成功${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}等待中... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ 后端服务启动失败，请查看 logs/backend.log${NC}"
    tail -20 logs/backend.log
    exit 1
fi

# 启动前端服务
echo -e "${GREEN}启动前端服务 (端口 5173)...${NC}"
cd "$SCRIPT_DIR/frontend"
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"

# 等待前端启动
echo -e "${YELLOW}等待前端服务启动...${NC}"
sleep 5

# ==================== 11. 部署完成 ====================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ✅ 部署完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "📱 前端应用: ${GREEN}http://localhost:5173${NC}"
echo -e "🔧 后端API:  ${GREEN}http://localhost:8000${NC}"
echo -e "📚 API文档:  ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "📝 日志文件:"
echo -e "   - 后端: ${YELLOW}logs/backend.log${NC}"
echo -e "   - 前端: ${YELLOW}logs/frontend.log${NC}"
echo ""
echo -e "🔍 查看日志:"
echo -e "   - 后端: ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "   - 前端: ${YELLOW}tail -f logs/frontend.log${NC}"
echo ""
echo -e "🛑 停止服务:"
echo -e "   - 运行: ${YELLOW}./stop.sh${NC} 或 ${YELLOW}bash stop.sh${NC}"
echo -e "   - 或手动: ${YELLOW}kill $BACKEND_PID $FRONTEND_PID${NC}"
echo ""
echo -e "📦 Python 虚拟环境: ${YELLOW}backend/venv${NC}"
echo -e "📦 Node 依赖: ${YELLOW}frontend/node_modules${NC}"
echo ""

