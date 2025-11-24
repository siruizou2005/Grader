#!/bin/bash
# AI作业批改助手 - 停止脚本

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  AI作业批改助手 - 停止服务${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# 停止后端服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}[1/2] 停止后端服务 (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        # 如果还在运行，强制杀死
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 后端服务已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务未运行${NC}"
    fi
    rm -f logs/backend.pid
else
    echo -e "${YELLOW}⚠️  未找到后端PID文件${NC}"
fi

# 通过端口停止后端（备用方法）
if lsof -ti :8000 > /dev/null 2>&1; then
    echo -e "${GREEN}停止占用8000端口的进程...${NC}"
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 停止前端服务
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}[2/2] 停止前端服务 (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        # 如果还在运行，强制杀死
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 前端服务已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  前端服务未运行${NC}"
    fi
    rm -f logs/frontend.pid
else
    echo -e "${YELLOW}⚠️  未找到前端PID文件${NC}"
fi

# 通过端口停止前端（备用方法）
if lsof -ti :5173 > /dev/null 2>&1; then
    echo -e "${GREEN}停止占用5173端口的进程...${NC}"
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 停止所有相关的Python和Node进程（更彻底的清理）
echo -e "${GREEN}清理相关进程...${NC}"
pkill -f "python.*run.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "uvicorn.*app.main:app" 2>/dev/null || true

sleep 1

# 验证服务是否已停止
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if lsof -ti :8000 > /dev/null 2>&1; then
    BACKEND_RUNNING=true
fi

if lsof -ti :5173 > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
fi

echo ""
if [ "$BACKEND_RUNNING" = false ] && [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ 所有服务已成功停止！${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ⚠️  警告: 部分服务可能仍在运行${NC}"
    echo -e "${RED}========================================${NC}"
    if [ "$BACKEND_RUNNING" = true ]; then
        echo -e "${RED}后端服务 (8000端口) 仍在运行${NC}"
    fi
    if [ "$FRONTEND_RUNNING" = true ]; then
        echo -e "${RED}前端服务 (5173端口) 仍在运行${NC}"
    fi
fi
echo ""

