# 白屏问题修复方案

## 🔍 问题分析

从日志看到：
- ✅ 后端服务正常运行
- ✅ 前端服务正常运行
- ❌ 但前端只监听 `localhost`，外部无法访问

Vite 日志显示：`Network: use --host to expose`

## 🛠️ 云端快速修复

### 方法1: 直接修改配置文件（推荐）

```bash
# 1. 修改前端配置，允许外部访问
cd /opt/Grader-web
sed -i "s/port: 5173,/host: '0.0.0.0',\n    port: 5173,/g" frontend/vite.config.ts

# 2. 修改后端CORS配置，允许所有来源
sed -i "s/allow_origins=\[\"http:\/\/localhost:5173\", \"http:\/\/localhost:3000\"\]/allow_origins=[\"*\"]/g" backend/app/main.py

# 3. 重启服务
./stop.sh
sleep 2
./deploy.sh
```

### 方法2: 手动编辑文件

```bash
# 1. 编辑前端配置
nano frontend/vite.config.ts

# 在 server: { 下面添加：
#   host: '0.0.0.0',  // 允许外部访问

# 2. 编辑后端配置
nano backend/app/main.py

# 修改 CORS 配置：
# allow_origins=["*"],  # 允许所有来源

# 3. 重启服务
./stop.sh && sleep 2 && ./deploy.sh
```

### 方法3: 一行命令修复

```bash
cd /opt/Grader-web && \
sed -i "6a\    host: '0.0.0.0'," frontend/vite.config.ts && \
sed -i 's/allow_origins=\["http:\/\/localhost:5173", "http:\/\/localhost:3000"\]/allow_origins=["*"]/g' backend/app/main.py && \
./stop.sh && sleep 3 && ./deploy.sh
```

## 📋 验证修复

修复后，检查：

```bash
# 1. 检查前端是否监听0.0.0.0
netstat -tlnp | grep 5173
# 应该显示 0.0.0.0:5173

# 2. 检查后端CORS配置
grep "allow_origins" backend/app/main.py

# 3. 测试访问
curl http://your_server_ip:5173
```

## ⚠️ 注意事项

1. **防火墙**: 确保服务器防火墙开放 5173 和 8000 端口
   ```bash
   sudo ufw allow 5173
   sudo ufw allow 8000
   ```

2. **安全**: 生产环境建议限制 CORS 来源，而不是使用 `["*"]`

3. **访问地址**: 使用服务器公网IP访问，如：`http://your_server_ip:5173`

## 🔧 如果仍然白屏

检查浏览器控制台（F12）：
- 查看 Network 标签，看哪些资源加载失败
- 查看 Console 标签，看是否有 JavaScript 错误
- 检查是否有 CORS 错误

