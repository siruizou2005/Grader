# 服务器部署文件总结

## 📁 server/ 文件夹结构

```
server/
├── deploy.sh              # 一键部署脚本（主要脚本）
├── stop.sh                # 停止服务脚本
├── start.sh               # 启动服务脚本（备用）
├── fix_502.sh            # 502错误诊断工具
├── fix_gpg_error.sh      # GPG错误修复脚本
├── README.md             # 服务器部署说明
├── DEPLOY.md             # 完整部署文档
├── QUICK_START.md        # 快速开始指南
├── TROUBLESHOOTING.md    # 故障排查指南
├── FIX_WHITE_SCREEN.md   # 白屏问题修复指南
└── CLOUD_FIX.md          # 云端快速修复方案
```

## 🎯 主要功能

### deploy.sh - 一键部署脚本

**功能特性：**
- ✅ 自动检测系统环境（Ubuntu版本、架构）
- ✅ 自动修复GPG仓库源错误
- ✅ 自动安装系统依赖（Python3, Node.js, npm等）
- ✅ 创建Python虚拟环境
- ✅ 安装后端和前端依赖
- ✅ 自动修复前端配置（允许外部访问）
- ✅ 自动修复后端CORS配置
- ✅ 检查并配置防火墙
- ✅ 启动前后端服务
- ✅ 验证服务启动状态

**使用方法：**
```bash
chmod +x server/deploy.sh
./server/deploy.sh
```

### stop.sh - 停止服务脚本

**功能特性：**
- ✅ 优雅停止所有服务
- ✅ 清理进程和端口
- ✅ 验证服务已停止

**使用方法：**
```bash
./server/stop.sh
```

## 🔧 自动修复的问题

部署脚本会自动修复以下问题：

1. **GPG仓库源错误**
   - 自动检测并移除有问题的Caddy仓库源
   - 避免APT更新失败

2. **白屏问题**
   - 自动配置Vite监听0.0.0.0
   - 允许外部访问前端服务

3. **CORS问题**
   - 自动配置后端CORS允许所有来源
   - 确保前后端可以正常通信

4. **防火墙配置**
   - 自动检查并配置UFW防火墙规则
   - 开放必要的端口（8000, 5173）

## 📋 部署流程

1. **准备阶段**
   - 检测系统环境
   - 修复仓库源问题
   - 安装系统依赖

2. **环境配置**
   - 创建Python虚拟环境
   - 安装项目依赖
   - 检查配置文件

3. **服务启动**
   - 启动后端服务
   - 启动前端服务
   - 验证服务状态

## 🚀 快速部署

```bash
# 1. 解压项目
tar -xzf Grader_deploy_*.tar.gz
cd Grader_deploy_*

# 2. 配置环境变量
nano backend/.env
# 设置 GEMINI_API_KEY=your_key

# 3. 运行部署脚本
chmod +x server/deploy.sh
./server/deploy.sh
```

## 📝 注意事项

1. **首次部署前必须配置 `.env` 文件**
2. **确保服务器有足够的资源**（2GB+ RAM, 1GB+ 磁盘）
3. **确保防火墙开放必要端口**
4. **生产环境建议使用Nginx反向代理**

## 🔍 故障排查

如遇问题，请按以下顺序排查：

1. 查看日志文件：`logs/backend.log` 和 `logs/frontend.log`
2. 运行诊断工具：`./server/fix_502.sh`
3. 查看故障排查文档：`server/TROUBLESHOOTING.md`
4. 查看具体问题修复指南

