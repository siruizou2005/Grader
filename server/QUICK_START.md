# Grader 快速部署指南

## 📦 压缩包说明

压缩包已包含所有必要的文件和配置：

- ✅ **后端代码** - 完整的 Python 应用代码
- ✅ **前端代码** - 完整的 React/TypeScript 前端代码
- ✅ **配置文件** - `.env` 示例文件（需要配置 API Key）
- ✅ **部署脚本** - `deploy.sh` 一键部署脚本
- ✅ **停止脚本** - `stop.sh` 停止服务脚本
- ✅ **依赖配置** - `requirements.txt` 和 `package.json`

## 🚀 快速部署步骤

### 1. 上传压缩包到服务器

```bash
# 使用 scp 上传（示例）
scp Grader_deploy_*.tar.gz user@your_server_ip:/home/user/

# 或使用其他工具上传
```

### 2. SSH 登录服务器

```bash
ssh user@your_server_ip
```

### 3. 解压文件

```bash
# 解压 ZIP 格式
unzip Grader_deploy_*.zip

# 或解压 TAR.GZ 格式（推荐）
tar -xzf Grader_deploy_*.tar.gz

# 进入解压后的目录
cd Grader_deploy_*
```

### 4. 配置环境变量

```bash
# 编辑 .env 文件
nano backend/.env
# 或
vi backend/.env

# 设置您的 GEMINI_API_KEY
# GEMINI_API_KEY=your_actual_api_key_here
```

**重要**: 必须配置有效的 `GEMINI_API_KEY`，否则后端无法正常工作。

### 5. 运行一键部署脚本

```bash
# 赋予执行权限（如果还没有）
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

部署脚本会自动：
- 检测系统环境
- 安装必要的系统依赖（Python3, Node.js等）
- 创建 Python 虚拟环境
- 安装后端依赖
- 安装前端依赖
- 启动服务

### 6. 访问应用

部署成功后，访问：

- **前端应用**: http://your_server_ip:5173
- **后端 API**: http://your_server_ip:8000
- **API 文档**: http://your_server_ip:8000/docs

## 🛑 停止服务

```bash
./stop.sh
```

## 📝 查看日志

```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log
```

## ⚠️ 注意事项

1. **防火墙配置**: 确保服务器防火墙开放 8000 和 5173 端口
2. **API Key**: 必须配置有效的 Gemini API Key
3. **系统要求**: Ubuntu 24.04 或兼容版本，至少 2GB 内存
4. **生产环境**: 建议使用 Nginx 反向代理和 HTTPS

## 🔧 故障排查

如果部署失败，请检查：

1. 系统版本是否符合要求
2. 网络连接是否正常（需要下载依赖）
3. 端口是否被占用
4. `.env` 文件配置是否正确
5. 查看日志文件获取详细错误信息

## 📚 更多信息

详细文档请查看：
- `DEPLOY.md` - 完整部署文档
- `README.md` - 项目说明
- `DEPLOY_INSTRUCTIONS.txt` - 部署说明

