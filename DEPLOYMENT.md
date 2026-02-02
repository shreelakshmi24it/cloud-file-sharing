# 🚀 Production Deployment Guide

Complete step-by-step guide for deploying your Cloud File Sharing application to production, including Redis integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Redis Integration Guide](#redis-integration-guide)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Options](#deployment-options)
   - [Option 1: Docker Deployment (Recommended)](#option-1-docker-deployment-recommended)
   - [Option 2: Cloud Platform Deployment](#option-2-cloud-platform-deployment)
   - [Option 3: VPS Manual Deployment](#option-3-vps-manual-deployment)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed (for local testing)
- [ ] Git installed
- [ ] Docker and Docker Compose installed (for Docker deployment)
- [ ] AWS S3 bucket created and configured
- [ ] PostgreSQL database (cloud or self-hosted)
- [ ] Redis instance (cloud or self-hosted) - **Required for production**
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (or use Let's Encrypt)

### Why Redis is Required for Production

While your development environment may work without Redis, **production environments NEED Redis** for:

1. **Session Management**: Store user sessions persistently across server restarts
2. **Rate Limiting**: Distributed rate limiting across multiple server instances
3. **Caching**: Cache frequently accessed data (user profiles, file metadata)
4. **File Upload Progress**: Track multi-part upload progress
5. **Job Queues**: Handle background tasks (file processing, email sending)

Without Redis, you'll have issues with:
- Sessions lost on server restart
- Rate limiting not working properly with multiple instances
- Poor performance under load

---

## Pre-Deployment Checklist

### 1. Code Preparation

```bash
# Clone or navigate to your project
cd /home/aditya/Desktop/programming/cloud-file-sharing

# Ensure all dependencies are up to date
cd backend && npm install && cd ../frontend && npm install && cd ..

# Run tests (if available)
cd backend && npm test
cd frontend && npm test
```

### 2. Build Verification

```bash
# Test backend build
cd backend
npm run build

# Test frontend build
cd frontend
npm run build
```

### 3. Security Audit

```bash
# Check for vulnerabilities
cd backend && npm audit
cd frontend && npm audit

# Fix critical issues
npm audit fix
```

---

## Redis Integration Guide

### Why Do You Need Redis?

Your application is configured to use Redis, but it's not currently being utilized. Here's what you need Redis for:

#### Current State
- Redis is listed in `package.json` dependencies ✅
- Configuration exists in `config/index.ts` ✅
- **No actual Redis usage in the codebase** ❌

#### What Needs Redis Integration

1. **Session Storage** (CRITICAL)
   - Currently using in-memory sessions (lost on restart)
   - Production needs persistent sessions

2. **Rate Limiting** (IMPORTANT)
   - Express-rate-limit needs Redis for distributed systems
   - Without it, rate limiting won't work across multiple instances

3. **Token Blacklist** (SECURITY)
   - JWT token revocation needs Redis
   - Currently, revoked tokens can still be used

4. **File Upload Progress** (ENHANCED UX)
   - Track multi-part uploads
   - Show progress to users

### Redis Setup Options

#### Option A: Managed Redis (Recommended for Production)

1. **Redis Cloud** (redis.com)
   - Free tier: 30MB
   - No maintenance required
   - Global coverage
   - Steps:
     ```
     1. Sign up at https://redis.com/try-free/
     2. Create a new database
     3. Get connection details (host, port, password)
     4. Add to .env file
     ```

2. **AWS ElastiCache**
   - Integrated with AWS
   - Good if using AWS for other services
   - More expensive but highly scalable

3. **Heroku Redis**
   - Easy if deploying on Heroku
   - Free tier available
   - One-click setup

4. **DigitalOcean Managed Redis**
   - Simple pricing
   - Good performance
   - Starting at $15/month

#### Option B: Self-Hosted Redis

Using Docker:
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass "your-strong-password"
```

Using Ubuntu/Debian:
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password (find and uncomment)
requirepass your-strong-password

# Bind to localhost only (for security)
bind 127.0.0.1

# Enable persistence
appendonly yes

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

### Implementing Redis in Your Application

After setting up Redis, you'll need to integrate it. Here are the key areas:

#### 1. Session Management (Priority: HIGH)

**Current Issue**: Sessions are stored in memory - lost on restart

**Solution**: Use `connect-redis` for session storage

Install dependency:
```bash
cd backend
npm install connect-redis express-session
npm install --save-dev @types/express-session
```

#### 2. Rate Limiting (Priority: HIGH)

**Current Issue**: `express-rate-limit` uses memory store

**Solution**: Use Redis store

Install dependency:
```bash
npm install rate-limit-redis
```

#### 3. Token Blacklist (Priority: MEDIUM)

**Use Case**: Logout, password reset, account deletion

**Implementation**: Store revoked tokens in Redis with TTL

#### 4. Caching (Priority: LOW)

**Use Case**: Cache frequently accessed data

**Examples**:
- User profiles
- File metadata
- S3 presigned URLs

---

## Environment Configuration

### Backend Environment Variables

Create `.env` file in `/home/aditya/Desktop/programming/cloud-file-sharing/backend/`:

```bash
# ==========================================
# PRODUCTION ENVIRONMENT VARIABLES
# ==========================================

# Application
NODE_ENV=production
PORT=5000
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database (PostgreSQL)
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_NAME=cloud_file_sharing_prod
DB_USER=your_db_user
DB_PASSWORD=your-strong-db-password

# Redis (REQUIRED for production)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-strong-redis-password

# JWT Secrets (MUST be strong random strings)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# AWS S3 (for file storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-bucket-name

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=SecureCloud <noreply@yourdomain.com>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Settings
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=image/*,video/*,audio/*,application/pdf,application/zip
```

### Frontend Environment Variables

Create `.env.production` file in `/home/aditya/Desktop/programming/cloud-file-sharing/frontend/`:

```bash
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=SecureCloud
```

### Generating Secure Secrets

```bash
# Generate JWT secrets (run on your local machine)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

---

## Deployment Options

## Option 1: Docker Deployment (Recommended)

### Advantages
- ✅ Consistent environment
- ✅ Easy to scale
- ✅ All services in one place
- ✅ Simple rollbacks

### Steps

#### 1. Create Docker Files

All necessary Dockerfiles will be created in the next section.

#### 2. Build and Run

```bash
# Navigate to project root
cd /home/aditya/Desktop/programming/cloud-file-sharing

# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

#### 3. Database Migration

```bash
# Run migrations
docker-compose exec backend npm run migrate

# (Optional) Seed data
docker-compose exec backend npm run seed
```

#### 4. Stop Services

```bash
docker-compose down

# To remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Option 2: Cloud Platform Deployment

### A. Heroku Deployment

#### Prerequisites
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

#### Backend Deployment

```bash
cd backend

# Create Heroku app
heroku create your-app-name-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# Add Redis
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 64)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -hex 64)
heroku config:set AWS_REGION=us-east-1
heroku config:set AWS_ACCESS_KEY_ID=your-key
heroku config:set AWS_SECRET_ACCESS_KEY=your-secret
heroku config:set S3_BUCKET_NAME=your-bucket
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# View logs
heroku logs --tail
```

#### Frontend Deployment

Option 1: Netlify
```bash
cd frontend

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Follow prompts:
# Build command: npm run build
# Publish directory: dist
```

Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

### B. AWS Deployment (EC2 + RDS + ElastiCache)

#### 1. Set Up Infrastructure

**RDS (PostgreSQL):**
```
1. Go to AWS RDS Console
2. Create PostgreSQL database
3. Note down endpoint, port, username, password
4. Configure security group to allow your EC2 instance
```

**ElastiCache (Redis):**
```
1. Go to AWS ElastiCache Console
2. Create Redis cluster
3. Note down endpoint and port
4. Configure security group
```

**S3 Bucket:**
```
Already set up - ensure proper CORS configuration
```

**EC2 Instance:**
```
1. Launch Ubuntu 22.04 LTS instance
2. Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (Backend)
3. Create or use existing key pair
4. Set up Elastic IP (optional)
```

#### 2. Server Setup

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Clone your repository
git clone https://github.com/your-username/cloud-file-sharing.git
cd cloud-file-sharing
```

#### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your production environment variables
# Use RDS and ElastiCache endpoints

# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name backend

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy build to Nginx
sudo cp -r dist/* /var/www/html/

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal  (Certbot sets this up automatically)
sudo certbot renew --dry-run
```

---

### C. DigitalOcean App Platform

```bash
# 1. Push code to GitHub

# 2. Go to DigitalOcean App Platform
# 3. Connect your GitHub repository

# 4. Configure Backend:
#    - Type: Backend Service
#    - Build Command: npm run build
#    - Run Command: npm start
#    - HTTP Port: 5000
#    - Environment Variables: Add all from .env

# 5. Configure Frontend:
#    - Type: Static Site
#    - Build Command: npm run build
#    - Output Directory: dist

# 6. Add PostgreSQL database (managed)
# 7. Add Redis database (managed)

# 8. Deploy
```

---

## Option 3: VPS Manual Deployment

Similar to AWS EC2 setup above, but on any VPS provider (DigitalOcean Droplets, Linode, Vultr, etc.)

### Quick Steps:

1. **Provision VPS** (Ubuntu 22.04)
2. **Install dependencies** (Node.js, PM2, Nginx, PostgreSQL, Redis)
3. **Set up PostgreSQL**
   ```bash
   sudo apt install postgresql postgresql-contrib
   sudo -u postgres createuser your_user -P
   sudo -u postgres createdb cloud_file_sharing_prod -O your_user
   ```
4. **Set up Redis**
   ```bash
   sudo apt install redis-server
   sudo nano /etc/redis/redis.conf
   # Set password, enable persistence
   sudo systemctl restart redis-server
   ```
5. **Deploy backend** (PM2)
6. **Deploy frontend** (Nginx)
7. **Configure SSL** (Let's Encrypt)

---

## Post-Deployment Steps

### 1. Database Migration

```bash
# Docker
docker-compose exec backend npm run migrate

# PM2/Manual
cd backend
npm run migrate
```

### 2. Health Check

```bash
# Backend health
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-26T...","environment":"production"}

# Frontend
curl https://yourdomain.com
```

### 3. Test Redis Connection

```bash
# If using Docker
docker-compose exec backend node -e "
const redis = require('redis');
const config = require('./dist/config').default;
const client = redis.createClient({
    socket: { host: config.redis.host, port: config.redis.port },
    password: config.redis.password
});
client.connect().then(() => {
    console.log('✅ Redis connected');
    client.quit();
}).catch(err => {
    console.error('❌ Redis connection failed:', err);
});
"
```

### 4. Monitor Logs

```bash
# Docker
docker-compose logs -f backend

# PM2
pm2 logs backend

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 5. Set Up Monitoring

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**External Monitoring:**
- Use Uptime Robot (free tier)
- New Relic
- DataDog
- AWS CloudWatch (if on AWS)

### 6. Backup Strategy

**Database Backups:**
```bash
# Automated PostgreSQL backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="backup_$DATE.sql"

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/$FILENAME
gzip $BACKUP_DIR/$FILENAME

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Cron: Run daily at 2 AM
# 0 2 * * * /path/to/backup-script.sh
```

**Redis Backups:**
Redis automatically saves to disk if `appendonly yes` is set in config.

**S3 Backups:**
S3 has built-in versioning - enable it in bucket settings.

---

## Troubleshooting

### Common Issues

#### 1. Backend Can't Connect to Database

**Symptoms:** `Database connection failed` error

**Solutions:**
```bash
# Check database is running
docker-compose ps postgres  # Docker
sudo systemctl status postgresql  # Manual

# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check environment variables
docker-compose exec backend env | grep DB_  # Docker
pm2 env backend | grep DB_  # Manual

# Check security group/firewall
# AWS: Allow port 5432 from backend IP
# VPS: sudo ufw allow from backend-ip to any port 5432
```

#### 2. Backend Can't Connect to Redis

**Symptoms:** Redis connection errors, rate limiting not working

**Solutions:**
```bash
# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping

# Check Redis is running
docker-compose ps redis  # Docker
sudo systemctl status redis  # Manual

# Check firewall
# AWS: Allow port 6379 from backend IP
# VPS: sudo ufw allow from backend-ip to any port 6379
```

#### 3. File Uploads Failing

**Symptoms:** Upload errors, 500 errors

**Solutions:**
```bash
# Check S3 credentials
aws s3 ls s3://your-bucket-name --profile your-profile

# Check S3 CORS configuration
# Must allow POST, PUT from your frontend domain

# Check upload size limits
# Nginx: client_max_body_size 100M;
# Backend: MAX_FILE_SIZE in .env
```

#### 4. Frontend Can't Reach Backend

**Symptoms:** Network errors, CORS errors

**Solutions:**
```bash
# Check CORS configuration
# backend/src/app.ts - origin must match frontend URL

# Check Nginx proxy
sudo nginx -t
sudo systemctl reload nginx

# Test backend directly
curl https://api.yourdomain.com/health

# Check environment variables
# frontend .env.production must have correct VITE_API_URL
```

#### 5. High Memory Usage

**Solutions:**
```bash
# Monitor memory
free -h
docker stats  # Docker

# Increase swap (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Limit container memory (Docker)
# In docker-compose.yml:
#   mem_limit: 512m
```

#### 6. SSL Certificate Issues

**Solutions:**
```bash
# Renew certificate
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

#### 7. Sessions Not Persisting

**Issue:** This WILL happen if Redis is not properly integrated

**Solutions:**
```bash
# Verify Redis is connected
# Check backend logs for Redis connection messages

# Verify session store is using Redis
# (This requires code changes - see Redis Integration section)
```

---

## Performance Optimization

### Backend

1. **Enable Compression** (already in code ✅)
2. **Database Connection Pooling** (already configured ✅)
3. **CDN for Static Assets**
   - CloudFlare (free tier)
   - AWS CloudFront
4. **Redis Caching**
   - Cache file metadata
   - Cache user sessions
   - Cache presigned S3 URLs

### Frontend

1. **Code Splitting** (Vite does this automatically ✅)
2. **Image Optimization**
   - Use WebP format
   - Lazy loading
3. **CDN for Frontend**
   - Netlify/Vercel (automatic)
   - CloudFlare
4. **Service Worker**
   - PWA capabilities
   - Offline support

---

## Security Checklist

- [ ] Strong JWT secrets (64+ characters random)
- [ ] HTTPS enabled everywhere
- [ ] Database not publicly accessible
- [ ] Redis password protected
- [ ] S3 bucket not public (use presigned URLs)
- [ ] Rate limiting enabled with Redis
- [ ] Helmet.js enabled (already in code ✅)
- [ ] CORS properly configured
- [ ] Environment variables secured (never commit .env)
- [ ] Regular dependency updates (`npm audit`)
- [ ] Database backups automated
- [ ] Redis persistence enabled

---

## Summary

### Minimal Production Requirements

1. **PostgreSQL Database** - For data storage
2. **Redis Instance** - For sessions, rate limiting, caching
3. **AWS S3 Bucket** - For file storage
4. **Hosting** - VPS, cloud platform, or Docker
5. **Domain & SSL** - For HTTPS

### Recommended Deployment Path

For beginners:
1. **Backend:** Heroku (with Heroku Postgres + Heroku Redis add-ons)
2. **Frontend:** Netlify or Vercel

For intermediate:
1. **All services:** Digital Ocean App Platform
2. Or Docker Compose on DigitalOcean Droplet

For advanced:
1. **AWS:** EC2 + RDS + ElastiCache + S3 + CloudFront
2. Or Kubernetes cluster

### Next Steps

1. ✅ Choose your deployment platform
2. ✅ Set up Redis (managed or self-hosted)
3. ✅ Implement Redis integration in code (session management, rate limiting)
4. ✅ Configure environment variables
5. ✅ Deploy backend
6. ✅ Deploy frontend
7. ✅ Run migrations
8. ✅ Test thoroughly
9. ✅ Set up monitoring and backups
10. ✅ Document your deployment for future reference

---

**Questions or issues?** Review the troubleshooting section or check application logs.

**Need help with Redis integration?** I can help implement session management and rate limiting with Redis.
