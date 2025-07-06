# 安装指导

## 1. 安装Node.js

### macOS (推荐使用Homebrew)
```bash
# 安装Homebrew (如果还没有安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Node.js
brew install node

# 验证安装
node --version
npm --version
```

### 或者从官网下载
访问 https://nodejs.org/ 下载并安装最新的LTS版本

## 2. 安装项目依赖

安装Node.js后，在项目根目录运行：

```bash
# 安装所有依赖
npm run install-all

# 或者分别安装
npm install
cd server && npm install
cd web && npm install
```

## 3. 启动应用

```bash
# 同时启动前后端
npm run dev

# 或者分别启动
npm run server  # 后端服务器 (端口 3001)
npm run client  # 前端开发服务器 (端口 3000)
```

## 4. 访问应用

- 前端: http://localhost:3000
- 后端API: http://localhost:3001

## 常见问题

### 如果npm命令不存在
确保Node.js安装正确，可能需要重启终端或重新登录。

### 如果端口被占用
可以修改端口配置：
- 前端: 修改 `web/vite.config.js` 中的端口
- 后端: 修改 `server/index.js` 中的PORT变量

### 如果数据库文件权限问题
确保应用有权限在server目录下创建SQLite数据库文件。 