# 🚀 Deployment Guide

## Overview
This guide covers deploying the DOA WhatsApp Manager using Docker and Docker Compose.

## Prerequisites

- Docker 24.0+ and Docker Compose v2
- PostgreSQL 15 (or use Docker container)
- Node.js 20+ (for local development)
- Domain name with SSL certificate (for production)
- Minimum server specs:
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage

## Quick Start (Development)

### 1. Clone Repository
```bash
git clone https://github.com/MustafaBasol/DOA.git
cd DOA
```

### 2. Setup Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Start Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Initialize Database
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

### 5. Access Application
- Frontend: http://localhost
- Backend API: http://localhost:3000
- Database: localhost:5432

## Production Deployment

### 1. Server Setup

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone & Configure

```bash
# Clone to production directory
sudo mkdir -p /opt/doa
sudo chown $USER:$USER /opt/doa
cd /opt/doa
git clone https://github.com/MustafaBasol/DOA.git .
```

### 3. Environment Configuration

```bash
# Create production environment file
cp .env.example .env
nano .env
```

**Required Environment Variables:**

```env
# Production mode
NODE_ENV=production

# Database (use strong passwords!)
POSTGRES_USER=doa_prod_user
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=doa_production

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=<your-secure-jwt-secret>
JWT_REFRESH_SECRET=<your-secure-refresh-secret>

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=<app-specific-password>
SMTP_FROM=noreply@yourdomain.com

# Domain
CORS_ORIGIN=https://yourdomain.com

# Redis password
REDIS_PASSWORD=<strong-redis-password>
```

### 4. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot -y

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set permissions
sudo chown -R $USER:$USER nginx/ssl
```

#### Auto-renewal cron job
```bash
# Add to crontab
sudo crontab -e

# Add this line
0 0 * * * certbot renew --quiet && docker-compose -f /opt/doa/docker-compose.yml restart nginx
```

### 5. Update Nginx Configuration

Edit `nginx/nginx.conf`:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 6. Deploy Application

```bash
# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Verify all services are running
docker-compose ps
```

### 7. Database Migration

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# (Optional) Seed admin user
docker-compose exec backend npm run seed
```

### 8. Health Check

```bash
# Check backend health
curl http://localhost:3000/health

# Check frontend
curl http://localhost/health
```

## CI/CD with GitHub Actions

### 1. Setup GitHub Secrets

Go to Repository Settings → Secrets and variables → Actions:

```
DEPLOY_HOST=your-server-ip
DEPLOY_USER=your-ssh-user
DEPLOY_SSH_KEY=<private-ssh-key>
DEPLOY_PORT=22
SLACK_WEBHOOK=<optional-slack-webhook>
```

### 2. Setup SSH Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@doa"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server

# Add private key to GitHub Secrets
cat ~/.ssh/id_ed25519
```

### 3. Automatic Deployment

Push to `main` branch triggers:
1. Lint & code quality checks
2. Run tests with coverage
3. Build Docker image
4. Push to GitHub Container Registry
5. Deploy to production server
6. Health check verification

## Monitoring & Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U doa_prod_user doa_production > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U doa_prod_user doa_production < backup_20260121.sql
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend npx prisma migrate deploy
```

### Scale Services

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

### Clean Up

```bash
# Remove unused containers, images, volumes
docker system prune -a --volumes

# Remove only stopped containers
docker container prune
```

## Performance Optimization

### 1. Enable Redis Caching
Uncomment Redis service in `docker-compose.yml` and configure backend to use it.

### 2. Database Connection Pooling
Already configured in Prisma with connection pooling.

### 3. Nginx Caching
Static assets are cached for 1 year. Adjust in `nginx/nginx.conf`.

### 4. Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Security Best Practices

✅ Use strong passwords (generated, not manual)
✅ Enable SSL/TLS (Let's Encrypt)
✅ Keep Docker and dependencies updated
✅ Use non-root user in containers
✅ Enable firewall (UFW)
✅ Regular security audits: `npm audit`
✅ Monitor logs for suspicious activity
✅ Backup database regularly
✅ Use environment variables for secrets
✅ Enable rate limiting in Nginx

## Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

### Database Connection Error
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify DATABASE_URL in .env
# Ensure postgres container is healthy
docker-compose ps postgres
```

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### SSL Certificate Issues
```bash
# Verify certificate files
ls -l nginx/ssl/

# Test certificate
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Restart Nginx
docker-compose restart nginx
```

## Rollback Strategy

```bash
# Stop current version
docker-compose down

# Checkout previous version
git log --oneline
git checkout <previous-commit-hash>

# Rebuild and start
docker-compose up -d --build

# Restore database if needed
docker-compose exec -T postgres psql -U doa_prod_user doa_production < backup.sql
```

## Cost Estimation

### Cloud Hosting (Monthly)

| Provider | Specs | Estimated Cost |
|----------|-------|----------------|
| DigitalOcean | 2 CPU, 4GB RAM, 80GB SSD | $24/month |
| AWS Lightsail | 2 CPU, 4GB RAM, 80GB SSD | $40/month |
| Hetzner | 2 CPU, 4GB RAM, 80GB SSD | $9/month |
| Vultr | 2 CPU, 4GB RAM, 80GB SSD | $18/month |

**Recommended:** Hetzner or DigitalOcean for best value.

## Support & Resources

- 📖 [Project README](../README.md)
- 🧪 [Testing Guide](../backend/tests/README.md)
- 🏗️ [Architecture Roadmap](./architecture-roadmap.md)
- 🐛 [GitHub Issues](https://github.com/MustafaBasol/DOA/issues)
- 📧 Email: support@autoviseo.com

## License

ISC License - See [LICENSE](../LICENSE) file for details.
