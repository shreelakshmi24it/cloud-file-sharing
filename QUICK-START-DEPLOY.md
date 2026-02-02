# 🚀 Quick Start Deployment Guide

This is a condensed version of the full [DEPLOYMENT.md](./DEPLOYMENT.md) for quick reference.

## What You Need

### 1. Redis Setup (CRITICAL)
Your app needs Redis for:
- Session management
- Rate limiting
- Token blacklisting
- Caching

**Quick Redis Options:**
- **Redis Cloud** (Recommended): https://redis.com/try-free/ - Free 30MB tier
- **Heroku Redis**: If deploying on Heroku
- **Docker**: Included in `docker-compose.yml`

### 2. Environment Setup

Copy the example files:
```bash
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production
```

**Critical variables to set:**
```bash
# Generate secure secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Set in backend/.env:
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<different-generated-secret>
DB_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
S3_BUCKET_NAME=<your-bucket>
```

## Deployment Options

### Option 1: Docker (Easiest)

```bash
# 1. Create .env file in project root with all variables

# 2. Run deployment script
./deploy.sh

# 3. Choose option 1 to build and start
# 4. Choose option 4 to run migrations
# 5. Choose option 5 to check health

# Access:
# Frontend: http://localhost
# Backend: http://localhost:5000
```

### Option 2: Heroku (Quick Cloud Deploy)

```bash
# Backend
cd backend
heroku create your-app-backend
heroku addons:create heroku-postgresql:essential-0
heroku addons:create heroku-redis:mini
heroku config:set JWT_SECRET=$(openssl rand -hex 64)
# ... set other env vars
git push heroku main
heroku run npm run migrate

# Frontend
cd frontend
netlify deploy --prod
# or
vercel --prod
```

### Option 3: AWS/VPS (Full Control)

See full guide in [DEPLOYMENT.md](./DEPLOYMENT.md#option-3-vps-manual-deployment)

## Post-Deployment Checklist

- [ ] Database migrations run
- [ ] Backend health check: `curl https://api.yourdomain.com/health`
- [ ] Frontend accessible
- [ ] Redis connected (check backend logs)
- [ ] Test file upload
- [ ] Test user registration/login
- [ ] SSL certificate configured
- [ ] Set up backups
- [ ] Set up monitoring

## Files Created

| File | Purpose |
|------|---------|
| `DEPLOYMENT.md` | Complete deployment guide |
| `docker-compose.yml` | Multi-service Docker setup |
| `backend/Dockerfile` | Backend container config |
| `frontend/Dockerfile` | Frontend container config |
| `frontend/nginx.conf` | Web server config |
| `backend/.env.production.example` | Backend env template |
| `frontend/.env.production.example` | Frontend env template |
| `backend/src/utils/redis.ts` | Redis utility module |
| `deploy.sh` | Quick deployment script |

## Quick Commands

```bash
# Docker deployment
./deploy.sh                  # Interactive menu
docker-compose up -d         # Start services
docker-compose logs -f       # View logs
docker-compose ps            # Check status

# Generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
curl http://localhost:5000/health
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Can't connect to DB | Check `DB_HOST`, `DB_PASSWORD` in `.env` |
| Can't connect to Redis | Check `REDIS_HOST`, `REDIS_PASSWORD` in `.env` |
| File uploads fail | Check AWS S3 credentials and CORS config |
| CORS errors | Ensure `FRONTEND_URL` matches your frontend domain |
| Sessions not persisting | Redis not connected or not integrated |

## Need More Help?

- **Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Redis Integration**: See [DEPLOYMENT.md - Redis Integration Guide](./DEPLOYMENT.md#redis-integration-guide)
- **Troubleshooting**: See [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#troubleshooting)

## Important Notes

⚠️ **Redis is REQUIRED for production** - Your app won't work properly without it for session management and rate limiting.

⚠️ **Never commit `.env` files** - They contain secrets!

⚠️ **Use strong passwords** - Generate random secrets with the command above.

✅ **Test locally first** - Use Docker to test your deployment before going to production.
