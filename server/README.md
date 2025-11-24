# Grader 服务器部署工具

本文件夹包含所有服务器部署相关的脚本和文档。

## 📁 文件说明

### 核心脚本

- **`deploy.sh`** - 一键部署脚本（主要脚本）
  - 自动检测系统环境
  - 安装系统依赖
  - 创建Python虚拟环境
  - 安装项目依赖
  - 修复常见问题（GPG错误、白屏问题等）
  - 启动前后端服务

- **`stop.sh`** - 停止服务脚本
  - 优雅停止所有服务
  - 清理进程和端口

- **`start.sh`** - 启动服务脚本（备用）

### 诊断工具

- **`fix_502.sh`** - 502错误诊断和修复工具
  - 检查服务状态
  - 诊断问题
  - 提供修复选项

- **`fix_gpg_error.sh`** - GPG错误修复脚本
  - 修复APT仓库源GPG签名问题

### 文档

- **`DEPLOY.md`** - 完整部署文档
- **`QUICK_START.md`** - 快速开始指南
- **`TROUBLESHOOTING.md`** - 故障排查指南
- **`FIX_WHITE_SCREEN.md`** - 白屏问题修复指南
- **`CLOUD_FIX.md`** - 云端快速修复方案

## 🚀 快速开始

### 1. 首次部署

```bash
# 赋予执行权限
chmod +x server/deploy.sh

# 运行部署脚本
./server/deploy.sh
```

### 2. 停止服务

```bash
./server/stop.sh
```

### 3. 重新部署

```bash
./server/stop.sh
sleep 3
./server/deploy.sh
```

## 📋 部署前准备

1. **系统要求**
   - Ubuntu 24.04 或兼容版本
   - 至少 2GB RAM
   - 至少 1GB 可用磁盘空间

2. **配置要求**
   - 编辑 `backend/.env` 文件
   - 设置 `GEMINI_API_KEY`

3. **网络要求**
   - 开放端口：8000（后端）、5173（前端）
   - 确保防火墙允许访问

## 🔧 常见问题

### 502错误
运行诊断脚本：
```bash
./server/fix_502.sh
```

### 白屏问题
查看修复指南：
```bash
cat server/FIX_WHITE_SCREEN.md
```

### GPG错误
运行修复脚本：
```bash
./server/fix_gpg_error.sh
```

## 📝 日志位置

- 后端日志: `logs/backend.log`
- 前端日志: `logs/frontend.log`

查看实时日志：
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

## 🌐 访问地址

部署成功后：

- **前端应用**: `http://your_server_ip:5173`
- **后端API**: `http://your_server_ip:8000`
- **API文档**: `http://your_server_ip:8000/docs`

## ⚠️ 注意事项

1. 部署脚本会自动修复常见问题，但首次部署需要配置 `.env` 文件
2. 生产环境建议使用 Nginx 反向代理和 HTTPS
3. CORS配置在生产环境应限制具体域名，而不是使用 `["*"]`

## 📞 获取帮助

如遇问题，请查看：
- `TROUBLESHOOTING.md` - 故障排查指南
- `DEPLOY.md` - 完整部署文档
- 日志文件 - 查看详细错误信息

