# 打卡积分奖励工具

一个专为家长和孩子设计的假期计划管理工具，通过打卡、积分和奖励机制，帮助孩子养成良好的学习习惯，让假期过得更加充实有意义。

## 功能特点

### 🎯 核心功能
- **用户管理**: 支持家长和孩子两种角色，家长可以管理多个孩子
- **任务管理**: 家长为孩子创建任务，孩子完成任务获得积分
- **打卡系统**: 孩子完成任务后进行打卡，家长可以审核
- **积分系统**: 完成任务获得积分，积分可以兑换奖励
- **奖励兑换**: 孩子用积分兑换奖励，家长审核后发放
- **数据统计**: 详细的进度跟踪和数据分析

### 📱 响应式设计
- 完美适配手机、平板和桌面设备
- 现代化的UI设计，操作简单直观
- 支持触摸操作，适合孩子使用

### 🔐 安全特性
- JWT身份认证
- 密码加密存储
- 角色权限控制

## 技术栈

### 后端
- **Node.js** + **Express.js** - 服务器框架
- **SQLite** - 轻量级数据库
- **bcryptjs** - 密码加密
- **jsonwebtoken** - JWT认证
- **cors** - 跨域支持

### 前端
- **React 18** - 用户界面框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **React Router** - 路由管理
- **Axios** - HTTP客户端
- **Lucide React** - 图标库

## 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn

### 安装依赖
```bash
# 安装所有依赖（包括前后端）
npm run install-all

# 或者分别安装
npm install
cd server && npm install
cd web && npm install
```

### 启动开发服务器
```bash
# 同时启动前后端
npm run dev

# 或者分别启动
npm run server  # 后端服务器 (端口 3001)
npm run client  # 前端开发服务器 (端口 3000)
```

### 访问应用
- 前端: http://localhost:3000
- 后端API: http://localhost:3001

## 使用指南

### 1. 注册账号
- 家长和孩子分别注册账号
- 孩子注册时可以选择关联家长账号

### 2. 家长操作
- **创建任务**: 为孩子设置学习任务，指定积分奖励
- **管理奖励**: 创建可兑换的奖励项目
- **审核打卡**: 查看和批准孩子的任务完成情况
- **查看统计**: 监控孩子的学习进度和表现

### 3. 孩子操作
- **查看任务**: 浏览需要完成的任务列表
- **任务打卡**: 完成任务后进行打卡
- **积分兑换**: 用积分兑换心仪的奖励
- **查看进度**: 了解自己的学习统计

## 数据库结构

### 用户表 (users)
- 支持家长和孩子两种角色
- 孩子可以关联到家长账号

### 任务表 (tasks)
- 记录任务信息、积分奖励
- 关联到具体的孩子

### 打卡记录表 (checkins)
- 记录任务完成情况
- 支持家长审核机制

### 积分记录表 (points_history)
- 记录积分获得和消费历史
- 支持积分余额计算

### 奖励表 (rewards)
- 定义可兑换的奖励项目
- 设置所需积分

### 兑换记录表 (reward_redemptions)
- 记录奖励兑换历史
- 支持家长审核机制

## API接口

### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/user` - 获取用户信息

### 任务管理
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `POST /api/checkin` - 任务打卡
- `GET /api/checkins` - 获取打卡记录

### 积分系统
- `GET /api/points/balance` - 获取积分余额
- `GET /api/points` - 获取积分历史

### 奖励系统
- `GET /api/rewards` - 获取奖励列表
- `POST /api/rewards` - 创建奖励
- `POST /api/rewards/:id/redeem` - 兑换奖励

### 数据统计
- `GET /api/stats` - 获取统计数据
- `GET /api/children` - 获取孩子列表（家长专用）

## 部署说明

### 生产环境部署
1. 构建前端应用
```bash
cd web
npm run build
```

2. 配置环境变量
```bash
# 创建 .env 文件
JWT_SECRET=your-secret-key
PORT=3001
```

3. 启动服务器
```bash
cd server
npm start
```

### Docker部署（可选）
```dockerfile
# Dockerfile 示例
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 开发计划

### 已实现功能
- ✅ 用户注册登录
- ✅ 任务创建和管理
- ✅ 打卡系统
- ✅ 积分系统
- ✅ 奖励兑换
- ✅ 数据统计
- ✅ 响应式设计

### 计划功能
- 📊 图表统计（使用Chart.js或Recharts）
- 📱 PWA支持
- 🔔 消息通知
- 📅 日历视图
- 🎨 主题定制
- 📤 数据导出
- 👥 多家长支持

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过Issue联系。 