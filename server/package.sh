#!/bin/bash
# Grader 项目打包脚本
# 用于创建可部署的压缩包，包含所有必要文件和示例.env配置

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 项目名称
PROJECT_NAME="Grader"
VERSION=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}_deploy_${VERSION}"
TEMP_DIR="/tmp/${PACKAGE_NAME}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Grader 项目打包工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 清理临时目录
if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi
mkdir -p "$TEMP_DIR"

echo -e "${GREEN}[1/6] 准备打包目录...${NC}"

# 复制后端文件
echo -e "${YELLOW}复制后端文件...${NC}"

# 复制整个app目录结构（排除__pycache__）
mkdir -p "$TEMP_DIR/backend"
find backend/app -type f -name "*.py" | while read file; do
    # 跳过__pycache__目录
    if [[ "$file" != *"__pycache__"* ]]; then
        rel_path=${file#backend/}
        mkdir -p "$TEMP_DIR/backend/$(dirname "$rel_path")"
        cp "$file" "$TEMP_DIR/backend/$rel_path"
    fi
done

cp backend/requirements.txt "$TEMP_DIR/backend/"
cp backend/run.py "$TEMP_DIR/backend/"

# 复制.env示例文件
if [ -f "backend/.env.example" ]; then
    cp backend/.env.example "$TEMP_DIR/backend/.env.example"
    # 如果存在.env，也复制（但提醒用户检查敏感信息）
    if [ -f "backend/.env" ]; then
        echo -e "${YELLOW}⚠️  检测到 backend/.env 文件，将一并打包${NC}"
        cp backend/.env "$TEMP_DIR/backend/.env"
    else
        # 创建示例.env文件
        cp backend/.env.example "$TEMP_DIR/backend/.env"
    fi
else
    # 创建示例.env文件
    cat > "$TEMP_DIR/backend/.env" << 'EOF'
# Gemini API 配置（必需）
# 请从 https://makersuite.google.com/app/apikey 获取您的 API Key
GEMINI_API_KEY=your_gemini_api_key_here

# 数据库配置（可选，默认使用 SQLite）
# DATABASE_URL=sqlite:///./app.db

# 安全配置（可选，用于JWT token加密）
# SECRET_KEY=your_secret_key_here_change_this_in_production
EOF
fi

# 创建uploads目录结构（空目录）
mkdir -p "$TEMP_DIR/backend/uploads/submissions"
mkdir -p "$TEMP_DIR/backend/uploads/teachers"

echo -e "${GREEN}✅ 后端文件复制完成${NC}"

# 复制前端文件
echo -e "${YELLOW}复制前端文件...${NC}"
mkdir -p "$TEMP_DIR/frontend/src"
cp -r frontend/src/* "$TEMP_DIR/frontend/src/" 2>/dev/null || true
cp frontend/index.html "$TEMP_DIR/frontend/"
cp frontend/package.json "$TEMP_DIR/frontend/"
cp frontend/package-lock.json "$TEMP_DIR/frontend/" 2>/dev/null || true
cp frontend/vite.config.ts "$TEMP_DIR/frontend/"
cp frontend/tsconfig.json "$TEMP_DIR/frontend/"
cp frontend/tsconfig.node.json "$TEMP_DIR/frontend/"
cp frontend/tailwind.config.js "$TEMP_DIR/frontend/"
cp frontend/postcss.config.js "$TEMP_DIR/frontend/"

echo -e "${GREEN}✅ 前端文件复制完成${NC}"

# 复制部署脚本和文档（从server文件夹）
echo -e "${YELLOW}复制部署脚本和文档...${NC}"
mkdir -p "$TEMP_DIR/server"
if [ -d "server" ]; then
    cp -r server/* "$TEMP_DIR/server/" 2>/dev/null || true
    # 确保脚本有执行权限
    chmod +x "$TEMP_DIR/server"/*.sh 2>/dev/null || true
else
    # 兼容旧版本：从根目录复制
    cp deploy.sh "$TEMP_DIR/" 2>/dev/null || true
    cp stop.sh "$TEMP_DIR/" 2>/dev/null || true
    cp start.sh "$TEMP_DIR/" 2>/dev/null || true
fi
cp README.md "$TEMP_DIR/" 2>/dev/null || true

# 创建部署说明文件（使用英文文件名避免编码问题）
cat > "$TEMP_DIR/DEPLOY_INSTRUCTIONS.txt" << 'EOF'
========================================
Grader 项目部署说明
========================================

1. 解压文件
   unzip Grader_deploy_*.zip
   或
   tar -xzf Grader_deploy_*.tar.gz

2. 进入项目目录
   cd Grader_deploy_*

3. 配置环境变量
   编辑 backend/.env 文件，设置您的 GEMINI_API_KEY
   
   nano backend/.env
   或
   vi backend/.env
   
   必需配置：
   GEMINI_API_KEY=your_actual_api_key_here

4. 运行一键部署脚本
   chmod +x server/deploy.sh
   ./server/deploy.sh

5. 访问应用
   前端: http://your_server_ip:5173
   后端API: http://your_server_ip:8000
   API文档: http://your_server_ip:8000/docs

6. 停止服务
   ./server/stop.sh

========================================
注意事项
========================================

- 确保服务器已安装 Ubuntu 24.04 或兼容版本
- 确保服务器有至少 2GB 内存和 1GB 可用磁盘空间
- 确保防火墙开放 8000 和 5173 端口
- 生产环境建议使用 Nginx 反向代理和 HTTPS

========================================
EOF

echo -e "${GREEN}✅ 脚本和文档复制完成${NC}"

# 创建.gitignore（用于部署后的版本控制）
cat > "$TEMP_DIR/.gitignore" << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
*.egg-info/
dist/
build/

# Database
*.db
*.sqlite
*.sqlite3

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/**/*.pdf
uploads/**/*.md
uploads/**/*.json
uploads/**/*.xlsx

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Build
dist/
build/
*.log

# Frontend
frontend/dist/
frontend/.vite/

# Logs
logs/
*.pid
EOF

echo -e "${GREEN}[2/6] 设置文件权限...${NC}"
chmod +x "$TEMP_DIR/deploy.sh"
chmod +x "$TEMP_DIR/stop.sh"
if [ -f "$TEMP_DIR/start.sh" ]; then
    chmod +x "$TEMP_DIR/start.sh"
fi

echo -e "${GREEN}[3/6] 创建压缩包...${NC}"

# 创建 ZIP 压缩包
ZIP_FILE="${PACKAGE_NAME}.zip"
cd /tmp
zip -r "$SCRIPT_DIR/$ZIP_FILE" "$PACKAGE_NAME" -q
cd "$SCRIPT_DIR"

# 创建 TAR.GZ 压缩包（Linux更常用）
TAR_FILE="${PACKAGE_NAME}.tar.gz"
cd /tmp
tar -czf "$SCRIPT_DIR/$TAR_FILE" "$PACKAGE_NAME"
cd "$SCRIPT_DIR"

echo -e "${GREEN}[4/6] 清理临时文件...${NC}"
rm -rf "$TEMP_DIR"

echo -e "${GREEN}[5/6] 计算文件大小...${NC}"
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
TAR_SIZE=$(du -h "$TAR_FILE" | cut -f1)

echo -e "${GREEN}[6/6] 打包完成！${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ✅ 打包成功！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "📦 压缩包文件:"
echo -e "   - ZIP格式: ${GREEN}${ZIP_FILE}${NC} (${ZIP_SIZE})"
echo -e "   - TAR.GZ格式: ${GREEN}${TAR_FILE}${NC} (${TAR_SIZE})"
echo ""
echo -e "📋 包含内容:"
echo -e "   ✅ 后端代码和依赖配置"
echo -e "   ✅ 前端代码和依赖配置"
echo -e "   ✅ 部署脚本 (server/deploy.sh)"
echo -e "   ✅ 停止脚本 (server/stop.sh)"
echo -e "   ✅ 诊断工具和文档"
echo -e "   ✅ 示例配置文件 (.env.example)"
echo ""
echo -e "📝 下一步操作:"
echo -e "   1. 将压缩包上传到服务器"
echo -e "   2. 解压: ${YELLOW}unzip ${ZIP_FILE}${NC} 或 ${YELLOW}tar -xzf ${TAR_FILE}${NC}"
echo -e "   3. 配置: ${YELLOW}编辑 backend/.env 设置 GEMINI_API_KEY${NC}"
echo -e "   4. 部署: ${YELLOW}cd ${PACKAGE_NAME} && ./server/deploy.sh${NC}"
echo ""
echo -e "⚠️  重要提示:"
echo -e "   - 如果压缩包中包含 .env 文件，请检查是否包含敏感信息"
echo -e "   - 部署前务必修改 backend/.env 中的 GEMINI_API_KEY"
echo ""

