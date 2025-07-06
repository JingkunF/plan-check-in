# 计划打卡 - 部署指南

## 部署方案推荐

### 方案一：Vercel + Railway (推荐，几乎免费)

#### 前端部署 (Vercel)
1. **准备代码**
   ```bash
   cd web
   npm run build
   ```

2. **上传到GitHub**
   ```bash
   git add .
   git commit -m "准备部署"
   git push origin main
   ```

3. **Vercel部署**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 导入你的GitHub仓库
   - 设置构建命令：`npm run build`
   - 设置输出目录：`dist`
   - 部署

#### 后端部署 (Railway)
1. **准备代码**
   ```bash
   cd server
   ```

2. **Railway部署**
   - 访问 [railway.app](https://railway.app)
   - 使用GitHub账号登录
   - 导入你的GitHub仓库的server目录
   - 设置环境变量：
     - `PORT`: 3001
     - `JWT_SECRET`: 你的密钥
   - 部署

3. **配置域名**
   - 在Railway获取后端URL
   - 在Vercel设置环境变量：`VITE_API_URL=你的后端URL`

### 方案二：腾讯云轻量应用服务器 (60元/年)

#### 服务器配置
- 系统：Ubuntu 20.04
- 配置：1核2G
- 带宽：3Mbps

#### 部署步骤
1. **安装Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **安装PM2**
   ```bash
   npm install -g pm2
   ```

3. **上传代码**
   ```bash
   scp -r . root@你的服务器IP:/var/www/checki-in
   ```

4. **启动服务**
   ```bash
   cd /var/www/checki-in/server
   npm install
   pm2 start index.js --name "checki-in-api"
   
   cd /var/www/checki-in/web
   npm install
   npm run build
   pm2 serve dist 3000 --name "checki-in-web"
   ```

5. **配置Nginx**
   ```nginx
   server {
       listen 80;
       server_name 你的域名;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
       }
   }
   ```

### 方案三：阿里云ECS (100元/年)

步骤与腾讯云类似，但可以使用阿里云的OSS存储静态文件。

## 域名和SSL配置

### 域名购买
推荐：阿里云万网、腾讯云DNSPod
- 价格：约50-100元/年
- 推荐域名：checki-in.com, plan-check.com

### SSL证书
- 免费：Let's Encrypt
- 付费：阿里云、腾讯云SSL证书

## 数据库选择

### 当前：SQLite (开发环境)
- 优点：简单，无需额外配置
- 缺点：不适合高并发

### 生产环境推荐
1. **MongoDB Atlas** (免费层)
2. **阿里云RDS** (MySQL)
3. **腾讯云数据库**

## 监控和维护

### 免费监控工具
- **UptimeRobot**: 网站可用性监控
- **Google Analytics**: 用户行为分析
- **Vercel Analytics**: 性能监控

### 日志管理
- **PM2**: 进程管理和日志
- **Winston**: 应用日志

## 成本估算

### 方案一：Vercel + Railway
- 前端：免费
- 后端：免费 (500小时/月)
- 域名：50-100元/年
- **总计：50-100元/年**

### 方案二：腾讯云
- 服务器：60元/年
- 域名：50-100元/年
- **总计：110-160元/年**

### 方案三：阿里云
- 服务器：100元/年
- 域名：50-100元/年
- **总计：150-200元/年**

## 推荐部署流程

1. **选择方案一** (Vercel + Railway)
2. **购买域名** (阿里云或腾讯云)
3. **部署前后端**
4. **配置域名和SSL**
5. **设置监控**

## 注意事项

1. **数据备份**: 定期备份数据库
2. **安全配置**: 设置强密码和JWT密钥
3. **性能优化**: 启用Gzip压缩，CDN加速
4. **用户体验**: 添加加载动画，错误处理

## 扩展功能

后续可以考虑：
- 微信小程序版本
- 移动端APP
- 团队协作功能
- 数据导出功能 