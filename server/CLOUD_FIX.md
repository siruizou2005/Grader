# 云端 GPG 错误修复方案

## 🔧 快速修复命令（直接在云端执行）

### 方案1: 移除有问题的仓库源（推荐）

```bash
# 移除 Caddy 仓库源
sudo rm -f /etc/apt/sources.list.d/caddy*.list

# 从主源列表移除（如果有）
sudo sed -i '/cloudsmith.io.*caddy/d' /etc/apt/sources.list

# 清理并更新
sudo apt-get clean
sudo apt-get update
```

### 方案2: 一行命令修复

```bash
sudo rm -f /etc/apt/sources.list.d/caddy*.list && sudo sed -i '/cloudsmith.io.*caddy/d' /etc/apt/sources.list && sudo apt-get clean && sudo apt-get update
```

### 方案3: 如果方案1和2都不行，使用强制更新

```bash
# 移除有问题的源
sudo rm -f /etc/apt/sources.list.d/caddy*.list
sudo sed -i '/cloudsmith.io/d' /etc/apt/sources.list

# 使用 --allow-insecure-repositories（谨慎使用）
sudo apt-get update --allow-insecure-repositories 2>&1 | grep -v "NO_PUBKEY\|InRelease" || true
```

## 📝 修复后继续部署

修复完成后，继续运行部署脚本：

```bash
./deploy.sh
```

## ⚠️ 说明

这个错误是因为系统中存在未正确签名的 Caddy 仓库源。由于我们的项目不需要 Caddy，直接移除该源即可。

如果以后需要 Caddy，可以重新添加并正确配置 GPG key。

