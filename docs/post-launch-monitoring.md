# Post-Launch Monitoring & Operations Guide

Production'a alındıktan sonra DOA sisteminin sağlığını izlemek ve operasyonel mükemmelliği sağlamak için kapsamlı kılavuz.

## 📊 İçindekiler

1. [Monitoring Stratejisi](#monitoring-stratejisi)
2. [Performans Metrikleri](#performans-metrikleri)
3. [Alerting ve Bildirimler](#alerting-ve-bildirimler)
4. [Log Yönetimi](#log-yönetimi)
5. [Database Monitoring](#database-monitoring)
6. [Security Monitoring](#security-monitoring)
7. [User Experience Monitoring](#user-experience-monitoring)
8. [Incident Response](#incident-response)
9. [Kapasİte Planlama](#kapasite-planlama)
10. [Reporting ve Analytics](#reporting-ve-analytics)

---

## 🎯 Monitoring Stratejisi

### Monitoring Katmanları

```
┌─────────────────────────────────────────────┐
│  1. Infrastructure Monitoring              │
│     - Server CPU, RAM, Disk                 │
│     - Network traffic                       │
│     - Docker container health               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  2. Application Monitoring                  │
│     - API response times                    │
│     - Error rates                           │
│     - Request throughput                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3. Database Monitoring                     │
│     - Query performance                     │
│     - Connection pool                       │
│     - Slow query log                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  4. Business Monitoring                     │
│     - Active users                          │
│     - Messages per day                      │
│     - Revenue metrics                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  5. User Experience Monitoring              │
│     - Page load times                       │
│     - Client-side errors                    │
│     - Real user monitoring (RUM)            │
└─────────────────────────────────────────────┘
```

### Monitoring Araçları

#### Önerilen Stack

**1. Infrastructure Monitoring:**
- **Prometheus + Grafana** (Açık kaynak, ücretsiz)
  - Metrics collection
  - Time-series database
  - Powerful visualization

**2. Application Performance Monitoring (APM):**
- **New Relic** (Ücretli, comprehensive)
- **Datadog** (Ücretli, popüler)
- **Elastic APM** (Açık kaynak)

**3. Log Management:**
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki + Grafana** (Lightweight alternative)
- **CloudWatch Logs** (AWS kullanıyorsanız)

**4. Uptime Monitoring:**
- **UptimeRobot** (Ücretsiz plan var)
- **Pingdom** (Ücretli)
- **StatusCake** (Ücretsiz + paid plans)

**5. Error Tracking:**
- **Sentry** (Ücretsiz plan, recommended)
- **Rollbar** (Ücretli)
- **Bugsnag** (Ücretli)

---

## 📈 Performans Metrikleri

### Kritik Metrikler (Golden Signals)

#### 1. Latency (Gecikme)

**Hedefler:**
```
Health Check: < 50ms
Authentication: < 300ms
API Calls: < 500ms (p95)
Database Queries: < 100ms (p95)
Page Load: < 2s
```

**Nasıl Ölçülür:**
```javascript
// Prometheus metric
const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
```

**Grafana Dashboard Query:**
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
)
```

#### 2. Traffic (Trafik)

**Hedefler:**
```
Requests/second: 100+
Concurrent users: 500+
Messages/day: 10,000+
Peak capacity: 1000 req/s
```

**Ölçüm:**
```promql
rate(http_requests_total[5m])
```

#### 3. Errors (Hatalar)

**Hedefler:**
```
Error rate: < 1%
5xx errors: < 0.1%
Failed logins: Track anomalies
Database errors: 0
```

**Ölçüm:**
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m]))
```

#### 4. Saturation (Doygunluk)

**Hedefler:**
```
CPU usage: < 70%
Memory usage: < 80%
Disk usage: < 85%
DB connections: < 80% of pool
```

**Ölçüm:**
```bash
# CPU
node_cpu_seconds_total

# Memory
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes

# Disk
node_filesystem_avail_bytes / node_filesystem_size_bytes
```

### İş Metrikleri

#### Kullanıcı Metrikleri
```
Daily Active Users (DAU)
Monthly Active Users (MAU)
New signups
Churn rate
Session duration
```

#### Mesaj Metrikleri
```
Messages per day
Messages per user
Average response time
Unread message backlog
```

#### Gelir Metrikleri
```
Daily revenue
Monthly recurring revenue (MRR)
Average revenue per user (ARPU)
Payment success rate
```

### Metrik Toplama

#### Backend Instrumentation

```typescript
// src/middleware/metrics.ts
import promClient from 'prom-client';

// Register default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics();

// Custom metrics
export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of active users'
});

export const messagesTotal = new promClient.Counter({
  name: 'messages_total',
  help: 'Total messages processed'
});

// Middleware
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: res.statusCode
    });
  });
  
  next();
};

// Metrics endpoint
export const metricsHandler = async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
};
```

#### Metrics Endpoint

```typescript
// src/app.ts
app.get('/metrics', metricsHandler);
```

---

## 🚨 Alerting ve Bildirimler

### Alert Seviyeleri

**P1 - Critical (Acil)**
- Sistem tamamen down
- Database erişilemiyor
- Güvenlik ihlali
- **Response Time:** 15 dakika
- **Notification:** SMS + Email + PagerDuty

**P2 - High (Yüksek)**
- API error rate > 5%
- CPU usage > 90%
- Disk space < 10%
- **Response Time:** 1 saat
- **Notification:** Email + Slack

**P3 - Medium (Orta)**
- API error rate > 2%
- Response time degradation
- Warning log spikes
- **Response Time:** 4 saat
- **Notification:** Slack

**P4 - Low (Düşük)**
- Minor performance issues
- Non-critical warnings
- **Response Time:** 1 gün
- **Notification:** Ticket system

### Alert Kuralları

#### Prometheus Alert Rules

```yaml
# alerts.yml
groups:
  - name: doa_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
          / 
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # API down
      - alert: APIDown
        expr: up{job="doa-api"} == 0
        for: 1m
        labels:
          severity: P1
        annotations:
          summary: "API is down"
          description: "DOA API has been down for more than 1 minute"

      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 1
        for: 10m
        labels:
          severity: P3
        annotations:
          summary: "High API response time"
          description: "P95 response time is {{ $value }}s"

      # Database connection issues
      - alert: HighDatabaseConnections
        expr: |
          pg_stat_database_numbackends 
          / 
          pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: "Database connection pool nearly exhausted"

      # Disk space
      - alert: DiskSpaceLow
        expr: |
          node_filesystem_avail_bytes{mountpoint="/"} 
          / 
          node_filesystem_size_bytes < 0.15
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: "Low disk space"
          description: "Disk space is {{ $value | humanizePercentage }} full"

      # Memory usage
      - alert: HighMemoryUsage
        expr: |
          (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.9
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: "High memory usage"
```

### Notification Channels

#### Slack Integration

```yaml
# alertmanager.yml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#doa-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

#### Email Integration

```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'ops@autoviseo.com'
        from: 'alertmanager@autoviseo.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@autoviseo.com'
        auth_password: 'password'
```

#### PagerDuty Integration

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        description: '{{ .GroupLabels.alertname }}'
```

---

## 📝 Log Yönetimi

### Log Seviyeleri

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'doa-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
});

// Production'da console log ekleme
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Log Kategorileri

**ERROR:** Sistem hataları, exception'lar
```typescript
logger.error('Database connection failed', { 
  error: err.message,
  stack: err.stack 
});
```

**WARN:** Dikkat gerektiren durumlar
```typescript
logger.warn('High memory usage detected', { 
  usage: memoryUsage 
});
```

**INFO:** Önemli olaylar
```typescript
logger.info('User logged in', { 
  userId, 
  email 
});
```

**DEBUG:** Detaylı debugging bilgisi
```typescript
logger.debug('Query executed', { 
  query, 
  params, 
  duration 
});
```

### Structured Logging

```typescript
// İyi pratik - JSON formatında
logger.info('Payment processed', {
  userId: 'uuid',
  amount: 500.00,
  currency: 'TRY',
  method: 'credit_card',
  timestamp: new Date().toISOString()
});

// Kötü pratik - String interpolation
logger.info(`User ${userId} paid ${amount} TRY`);
```

### Log Rotation

```bash
# /etc/logrotate.d/doa
/var/log/doa/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload doa-api
    endscript
}
```

### ELK Stack Setup

**Docker Compose:**
```yaml
version: '3'
services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - 9200:9200

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:8.11.0
    ports:
      - 5601:5601
    depends_on:
      - elasticsearch
```

---

## 🗄️ Database Monitoring

### PostgreSQL Metrics

**Key Metrics:**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Long running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes';

-- Database size
SELECT pg_size_pretty(pg_database_size('doa_production'));

-- Table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Cache hit ratio (should be > 90%)
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Slow Query Log

**Enable:**
```sql
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
SELECT pg_reload_conf();
```

**Analyze:**
```bash
# pgBadger - PostgreSQL log analyzer
pgbadger /var/log/postgresql/postgresql-15-main.log -o report.html
```

### Connection Pool Monitoring

```typescript
// Prisma connection pool
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Monitor pool
setInterval(async () => {
  const metrics = await prisma.$metrics.json();
  logger.info('Database pool metrics', metrics);
}, 60000); // Every minute
```

---

## 🔐 Security Monitoring

### Failed Login Attempts

```typescript
// Track failed logins
const failedLogins = new Map();

export const trackFailedLogin = (email: string, ip: string) => {
  const key = `${email}:${ip}`;
  const attempts = failedLogins.get(key) || 0;
  failedLogins.set(key, attempts + 1);
  
  if (attempts > 5) {
    logger.warn('Multiple failed login attempts', { 
      email, 
      ip, 
      attempts 
    });
    // Send alert
    sendSecurityAlert('Multiple failed login attempts', { email, ip });
  }
};
```

### Suspicious Activity Detection

```typescript
// Monitor for suspicious patterns
export const detectSuspiciousActivity = async (userId: string) => {
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 3600000) } // Last hour
    }
  });
  
  // Too many API calls
  if (recentActivity.length > 1000) {
    logger.warn('Suspicious activity: Too many API calls', { userId });
  }
  
  // Unusual access patterns
  const actions = recentActivity.map(a => a.action);
  if (actions.filter(a => a === 'DELETE').length > 10) {
    logger.warn('Suspicious activity: Multiple deletes', { userId });
  }
};
```

### Security Events to Monitor

- Multiple failed login attempts
- Privilege escalation attempts
- Unauthorized API access
- Unusual data access patterns
- Bulk data exports
- After-hours access
- Geographic anomalies (VPN detection)

---

## 👥 User Experience Monitoring

### Real User Monitoring (RUM)

```html
<!-- Frontend instrumentation -->
<script>
  // Page load time
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    // Send to backend
    fetch('/api/metrics/rum', {
      method: 'POST',
      body: JSON.stringify({
        metric: 'page_load_time',
        value: pageLoadTime,
        page: window.location.pathname
      })
    });
  });
  
  // Client-side errors
  window.addEventListener('error', (event) => {
    fetch('/api/metrics/error', {
      method: 'POST',
      body: JSON.stringify({
        message: event.message,
        stack: event.error?.stack,
        page: window.location.pathname
      })
    });
  });
</script>
```

### Core Web Vitals

**Metricsler:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

**Ölçüm:**
```javascript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

---

## 🚨 Incident Response

### Incident Response Plan

#### 1. Detection (0-5 dakika)
- Alert alındı
- Initial assessment
- Severity belirleme

#### 2. Response (5-15 dakika)
- On-call engineer bilgilendirildi
- Incident channel açıldı (#incident-YYYYMMDD-XX)
- Initial triage

#### 3. Mitigation (15-60 dakika)
- Root cause investigation
- Temporary fix uygulandı
- Service restored

#### 4. Resolution (1-24 saat)
- Permanent fix
- Testing
- Deploy to production

#### 5. Post-Mortem (1-3 gün sonra)
- Incident review meeting
- Root cause analysis
- Action items
- Documentation update

### Incident Communication Template

```
📢 INCIDENT ALERT [P1]

Status: INVESTIGATING
Service: DOA API
Impact: Users unable to login
Started: 2026-01-22 14:30 UTC

Timeline:
14:30 - Alert triggered (high error rate)
14:32 - Engineer paged
14:35 - Database connection issue identified
14:40 - Restarting database connection pool
14:45 - Service restored

Next update: 15:00 UTC
```

### Runbooks

**Database Connection Failure:**
```bash
# 1. Check database status
systemctl status postgresql

# 2. Check connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Kill long running queries
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';"

# 4. Restart application
pm2 restart doa-api

# 5. Monitor
pm2 logs doa-api
```

---

## 📊 Kapasite Planlama

### Growth Projections

**Varsayımlar:**
- Aylık %20 kullanıcı artışı
- Kullanıcı başına günlük 50 mesaj

**Kapasiteİhtiyaçları:**

| Ay  | Kullanıcı | Günlük Mesaj | Storage | CPU | RAM |
|-----|-----------|--------------|---------|-----|-----|
| 1   | 100       | 5,000        | 10 GB   | 2   | 4GB |
| 3   | 173       | 8,650        | 15 GB   | 2   | 4GB |
| 6   | 300       | 15,000       | 25 GB   | 4   | 8GB |
| 12  | 893       | 44,650       | 60 GB   | 8   | 16GB|

### Scaling Strategy

**Vertical Scaling (İlk 6 ay):**
- CPU: 2 → 4 → 8 cores
- RAM: 4 → 8 → 16 GB
- Disk: 20 → 50 → 100 GB

**Horizontal Scaling (6+ ay):**
- Load balancer ekle
- Multiple API instances
- Read replicas (database)
- Redis cluster

---

## 📈 Reporting ve Analytics

### Daily Reports

**Otomatik Email Raporu (09:00):**
```
📊 DOA Daily Report - 22 Ocak 2026

✅ System Health: Good
⏱️ Uptime: 99.98%
📈 Requests: 156,234 (+12%)
👥 Active Users: 287 (+5)
📧 Messages: 14,320 (+8%)
💰 Revenue: ₺24,500 (+15%)

⚠️ Warnings: None
🔴 Errors: 23 (0.01% - within SLA)

Top Issues:
1. Slow query on messages table (fixed)
2. Brief CPU spike at 14:30 (investigating)

View full report: https://monitoring.autoviseo.com/daily
```

### Weekly Executive Summary

```
📊 DOA Weekly Executive Summary
Week of January 15-22, 2026

🎯 Key Metrics:
- Revenue: ₺175,000 (+18% WoW)
- New Users: 42 (+24%)
- Messages Processed: 98,450 (+12%)
- System Uptime: 99.97%

📈 Growth:
- MoM Revenue: +25%
- User Retention: 94%
- NPS Score: 78 (Excellent)

⚠️ Action Items:
1. Scale database (approaching 80% capacity)
2. Implement caching layer
3. Hire additional support staff

🎉 Wins:
- Zero P1 incidents this week
- Launch of advanced search feature
- Customer satisfaction +15%
```

---

## ✅ Monitoring Checklist

### Daily (Automated)
- [ ] Check system health dashboard
- [ ] Review error logs
- [ ] Verify backup completion
- [ ] Check disk space
- [ ] Monitor API response times

### Weekly (Manual)
- [ ] Review slow query log
- [ ] Analyze user growth trends
- [ ] Check security audit log
- [ ] Database maintenance (vacuum, analyze)
- [ ] Review alert history

### Monthly (Strategic)
- [ ] Capacity planning review
- [ ] Performance optimization
- [ ] Security audit
- [ ] Update runbooks
- [ ] Cost optimization review

### Quarterly (Long-term)
- [ ] Infrastructure review
- [ ] Disaster recovery drill
- [ ] SLA compliance report
- [ ] Technology stack review
- [ ] Team training

---

## 🎯 Success Metrics

### SLA Targets

```
Uptime: 99.9% (43 minutes downtime/month)
API Response (p95): < 500ms
API Response (p99): < 1000ms
Error Rate: < 1%
Support Response: < 4 hours
Incident Resolution: < 2 hours (P1)
```

### KPIs

**Technical:**
- System availability
- Error rate
- Response time
- Deployment frequency
- Mean time to recovery (MTTR)

**Business:**
- Monthly active users
- Revenue growth
- Customer satisfaction
- Feature adoption
- Churn rate

---

**Post-launch monitoring is an ongoing process. This guide should be updated regularly based on operational experience.**

**Son Güncelleme:** 22 Ocak 2026  
**Versiyon:** 1.0  
**Hazırlayan:** DOA DevOps Team
