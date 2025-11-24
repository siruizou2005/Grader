#!/bin/bash
# AI作业批改助手 - 启动脚本

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AI作业批改助手 - 启动服务${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查并停止已运行的服务
if lsof -ti :8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  检测到8000端口已被占用，正在停止...${NC}"
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti :5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  检测到5173端口已被占用，正在停止...${NC}"
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 检查Python环境
PYTHON_CMD="/opt/anaconda3/bin/python"
if [ ! -f "$PYTHON_CMD" ]; then
    PYTHON_CMD="python3"
    echo -e "${YELLOW}⚠️  未找到anaconda Python，使用系统Python${NC}"
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到Node.js，请先安装Node.js${NC}"
    exit 1
fi

# 检查后端依赖
echo -e "${GREEN}[1/4] 检查后端环境...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ 错误: 未找到 backend/.env 文件${NC}"
    echo -e "${YELLOW}请先创建 backend/.env 文件并配置 GEMINI_API_KEY${NC}"
    exit 1
fi

# 检查前端依赖
echo -e "${GREEN}[2/4] 检查前端环境...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  前端依赖未安装，正在安装...${NC}"
    cd frontend
    npm install
    cd ..
fi

# 创建日志目录
mkdir -p logs

# 启动后端服务
echo -e "${GREEN}[3/4] 启动后端服务 (端口 8000)...${NC}"
cd backend
nohup $PYTHON_CMD run.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"

# 等待后端启动
sleep 3

# 检查后端是否成功启动
if ! curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端服务启动失败，请查看 logs/backend.log${NC}"
    exit 1
fi

# 启动前端服务
echo -e "${GREEN}[4/4] 启动前端服务 (端口 5173)...${NC}"
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
echo -e "${GREEN}✅ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"

# 等待前端启动
sleep 3

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ 所有服务已成功启动！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📱 前端应用: ${GREEN}http://localhost:5173${NC}"
echo -e "🔧 后端API:  ${GREEN}http://localhost:8000${NC}"
echo -e "📚 API文档:  ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "📝 日志文件:"
echo -e "   - 后端: ${YELLOW}logs/backend.log${NC}"
echo -e "   - 前端: ${YELLOW}logs/frontend.log${NC}"
echo ""
echo -e "🛑 停止服务: 运行 ${YELLOW}./stop.sh${NC} 或 ${YELLOW}bash stop.sh${NC}"
echo ""

