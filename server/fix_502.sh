#!/bin/bash
# 502错误诊断和修复脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  502错误诊断和修复工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查后端服务
echo -e "${GREEN}[1/5] 检查后端服务状态...${NC}"
BACKEND_RUNNING=false
if lsof -ti :8000 > /dev/null 2>&1; then
    BACKEND_PID=$(lsof -ti :8000 | head -1)
    echo -e "${GREEN}✅ 后端服务正在运行 (PID: $BACKEND_PID)${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
fi

# 测试后端连接
echo -e "${GREEN}[2/5] 测试后端连接...${NC}"
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端API可访问${NC}"
    curl -s http://localhost:8000/api/health | head -1
else
    echo -e "${RED}❌ 后端API不可访问${NC}"
    if [ "$BACKEND_RUNNING" = false ]; then
        echo -e "${YELLOW}原因: 后端服务未启动${NC}"
    else
        echo -e "${YELLOW}原因: 后端服务可能崩溃或配置错误${NC}"
    fi
fi

# 检查前端服务
echo -e "${GREEN}[3/5] 检查前端服务状态...${NC}"
FRONTEND_RUNNING=false
if lsof -ti :5173 > /dev/null 2>&1; then
    FRONTEND_PID=$(lsof -ti :5173 | head -1)
    echo -e "${GREEN}✅ 前端服务正在运行 (PID: $FRONTEND_PID)${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${RED}❌ 前端服务未运行${NC}"
fi

# 检查日志
echo -e "${GREEN}[4/5] 检查最近错误日志...${NC}"
if [ -f "logs/backend.log" ]; then
    echo -e "${YELLOW}后端日志最后20行:${NC}"
    tail -20 logs/backend.log | grep -i "error\|exception\|traceback" || echo "  无错误信息"
else
    echo -e "${YELLOW}⚠️  后端日志文件不存在${NC}"
fi

if [ -f "logs/frontend.log" ]; then
    echo -e "${YELLOW}前端日志最后20行:${NC}"
    tail -20 logs/frontend.log | grep -i "error\|failed" || echo "  无错误信息"
else
    echo -e "${YELLOW}⚠️  前端日志文件不存在${NC}"
fi

# 修复建议
echo -e "${GREEN}[5/5] 修复建议...${NC}"
echo ""

if [ "$BACKEND_RUNNING" = false ]; then
    echo -e "${RED}问题: 后端服务未运行${NC}"
    echo -e "${YELLOW}解决方案:${NC}"
    echo "  1. 检查后端配置: cat backend/.env"
    echo "  2. 手动启动后端测试:"
    echo "     cd backend"
    echo "     source venv/bin/activate"
    echo "     python run.py"
    echo "  3. 如果启动失败，查看错误信息"
    echo ""
fi

if [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${RED}问题: 前端服务未运行${NC}"
    echo -e "${YELLOW}解决方案:${NC}"
    echo "  1. 手动启动前端测试:"
    echo "     cd frontend"
    echo "     npm run dev"
    echo ""
fi

# 提供一键修复选项
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  一键修复选项${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "选择操作:"
echo -e "  1) 重启所有服务"
echo -e "  2) 仅重启后端"
echo -e "  3) 仅重启前端"
echo -e "  4) 查看详细日志"
echo -e "  5) 退出"
echo ""
read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}重启所有服务...${NC}"
        ./stop.sh
        sleep 2
        ./deploy.sh
        ;;
    2)
        echo -e "${GREEN}重启后端服务...${NC}"
        if [ -f "logs/backend.pid" ]; then
            kill $(cat logs/backend.pid) 2>/dev/null || true
        fi
        lsof -ti :8000 | xargs kill -9 2>/dev/null || true
        sleep 1
        cd backend
        source venv/bin/activate
        nohup python run.py > ../logs/backend.log 2>&1 &
        echo $! > ../logs/backend.pid
        cd ..
        echo -e "${GREEN}✅ 后端服务已重启${NC}"
        ;;
    3)
        echo -e "${GREEN}重启前端服务...${NC}"
        if [ -f "logs/frontend.pid" ]; then
            kill $(cat logs/frontend.pid) 2>/dev/null || true
        fi
        lsof -ti :5173 | xargs kill -9 2>/dev/null || true
        sleep 1
        cd frontend
        nohup npm run dev > ../logs/frontend.log 2>&1 &
        echo $! > ../logs/frontend.pid
        cd ..
        echo -e "${GREEN}✅ 前端服务已重启${NC}"
        ;;
    4)
        echo -e "${YELLOW}后端日志:${NC}"
        tail -50 logs/backend.log
        echo ""
        echo -e "${YELLOW}前端日志:${NC}"
        tail -50 logs/frontend.log
        ;;
    5)
        echo "退出"
        exit 0
        ;;
    *)
        echo -e "${RED}无效选项${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}等待服务启动...${NC}"
sleep 5

# 再次检查
echo -e "${GREEN}验证服务状态...${NC}"
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务正常${NC}"
else
    echo -e "${RED}❌ 后端服务仍有问题，请查看日志${NC}"
fi

if lsof -ti :5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端服务正常${NC}"
else
    echo -e "${RED}❌ 前端服务仍有问题，请查看日志${NC}"
fi

