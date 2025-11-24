# Grader 一键部署指南 - Ubuntu 24.04

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd Grader-git
```

### 2. 运行一键部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

或者：

```bash
bash deploy.sh
```

## 部署脚本功能

部署脚本会自动完成以下操作：

1. ✅ **检测系统环境** - 验证 Ubuntu 版本和架构
2. ✅ **安装系统依赖** - 自动安装 Python3、pip、Node.js、npm 等
3. ✅ **检查项目文件** - 验证必要的文件和目录是否存在
4. ✅ **创建 Python 虚拟环境** - 在 `backend/venv` 目录创建虚拟环境
5. ✅ **安装后端依赖** - 从 `requirements.txt` 安装所有 Python 包
6. ✅ **检查后端配置** - 检查 `.env` 文件，如不存在会创建示例文件
7. ✅ **安装前端依赖** - 运行 `npm install` 安装所有 Node.js 包
8. ✅ **检查端口占用** - 检查 8000 和 5173 端口是否被占用
9. ✅ **启动服务** - 启动后端和前端服务

## 配置要求

### 必需配置

在首次运行前，需要配置 `backend/.env` 文件：

```bash
# Gemini API 配置（必需）
GEMINI_API_KEY=your_gemini_api_key_here
```

### 可选配置

```bash
# 数据库配置（可选，默认使用 SQLite）
# DATABASE_URL=sqlite:///./app.db

# 安全配置（可选）
# SECRET_KEY=your_secret_key_here
```

## 系统要求

- **操作系统**: Ubuntu 24.04 (推荐) 或其他 Ubuntu 版本
- **Python**: 3.8+ (脚本会自动安装)
- **Node.js**: LTS 版本 (脚本会自动安装)
- **内存**: 至少 2GB RAM
- **磁盘空间**: 至少 1GB 可用空间

## 服务端口

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## 日志文件

- **后端日志**: `logs/backend.log`
- **前端日志**: `logs/frontend.log`

查看实时日志：

```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log
```

## 停止服务

### 方法 1: 使用停止脚本

```bash
./stop.sh
```

或

```bash
bash stop.sh
```

### 方法 2: 手动停止

```bash
# 查看进程 ID
cat logs/backend.pid
cat logs/frontend.pid

# 停止进程
kill $(cat logs/backend.pid)
kill $(cat logs/frontend.pid)
```

### 方法 3: 按端口停止

```bash
# 停止后端 (8000端口)
lsof -ti :8000 | xargs kill -9

# 停止前端 (5173端口)
lsof -ti :5173 | xargs kill -9
```

## 重新部署

如果需要重新部署：

```bash
# 1. 停止现有服务
./stop.sh

# 2. 清理虚拟环境（可选）
rm -rf backend/venv

# 3. 清理前端依赖（可选）
rm -rf frontend/node_modules

# 4. 重新运行部署脚本
./deploy.sh
```

## 故障排查

### 后端启动失败

1. 检查日志：`tail -20 logs/backend.log`
2. 检查 `.env` 文件配置是否正确
3. 检查端口 8000 是否被占用：`lsof -i :8000`
4. 检查 Python 虚拟环境：`ls -la backend/venv`

### 前端启动失败

1. 检查日志：`tail -20 logs/frontend.log`
2. 检查 Node.js 版本：`node --version` (需要 18+)
3. 检查端口 5173 是否被占用：`lsof -i :5173`
4. 尝试重新安装依赖：`cd frontend && rm -rf node_modules && npm install`

### 端口被占用

```bash
# 查看占用端口的进程
sudo lsof -i :8000
sudo lsof -i :5173

# 停止占用端口的进程
sudo kill -9 <PID>
```

### 权限问题

如果遇到权限问题，可能需要使用 sudo：

```bash
sudo ./deploy.sh
```

## 生产环境部署建议

对于生产环境，建议：

1. **使用进程管理器**: 使用 `systemd`、`supervisor` 或 `pm2` 管理进程
2. **配置反向代理**: 使用 Nginx 作为反向代理
3. **启用 HTTPS**: 配置 SSL 证书
4. **数据库**: 使用 PostgreSQL 或 MySQL 替代 SQLite
5. **环境变量**: 使用环境变量管理敏感配置
6. **日志管理**: 配置日志轮转和集中日志管理

## 更新项目

```bash
# 1. 停止服务
./stop.sh

# 2. 拉取最新代码
git pull

# 3. 重新部署
./deploy.sh
```

## 联系支持

如遇到问题，请查看：
- 项目 README.md
- 日志文件
- GitHub Issues

