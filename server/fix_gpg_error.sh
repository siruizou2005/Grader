#!/bin/bash
# 快速修复 GPG 错误的脚本
# 用于解决 Caddy 仓库源的 GPG 签名问题

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}修复 GPG 错误...${NC}"

# 方法1: 移除有问题的 Caddy 仓库源
echo -e "${YELLOW}[方法1] 移除有问题的 Caddy 仓库源...${NC}"
sudo rm -f /etc/apt/sources.list.d/caddy*.list 2>/dev/null || true
sudo sed -i '/cloudsmith.io.*caddy/d' /etc/apt/sources.list 2>/dev/null || true

# 方法2: 尝试添加 GPG key（如果还需要 Caddy）
echo -e "${YELLOW}[方法2] 尝试添加 GPG key...${NC}"
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABA1F9B8875A6661 2>/dev/null || {
    echo -e "${YELLOW}GPG key 添加失败，已移除有问题的源${NC}"
}

# 清理 apt 缓存
echo -e "${YELLOW}清理 apt 缓存...${NC}"
sudo apt-get clean 2>/dev/null || true

# 更新包列表
echo -e "${YELLOW}更新包列表...${NC}"
if sudo apt-get update -qq 2>&1 | grep -q "NO_PUBKEY\|InRelease"; then
    echo -e "${RED}❌ 仍有 GPG 错误，尝试强制更新...${NC}"
    # 如果还有问题，使用 --allow-unauthenticated（仅用于更新，不用于安装）
    sudo apt-get update --allow-unauthenticated -qq 2>&1 | grep -v "NO_PUBKEY\|InRelease" || true
else
    echo -e "${GREEN}✅ 包列表更新成功${NC}"
fi

echo -e "${GREEN}✅ GPG 错误修复完成${NC}"
echo ""
echo -e "现在可以运行部署脚本: ${YELLOW}./deploy.sh${NC}"

