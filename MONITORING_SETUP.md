# Monitoring, Analytics & Error Tracking Setup

**Date:** March 3, 2026  
**Purpose:** Production monitoring and observability

---

## Overview

Complete setup for monitoring ConstructFlow application performance, errors, and user analytics in production.

---

## 1. Error Tracking with Sentry

### Setup Instructions

1. **Create Sentry Account**
   - Go to https://sentry.io
   - Create organization: "MYGSIS"
   - Create project: "constructflow-frontend"

2. **Get DSN**
   - Copy DSN from project settings
   - Format: `https://xxxxx@sentry.io/xxxxx`

3. **Update Environment Variables**
   ```
   VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   VITE_ERROR_TRACKING_ENABLED=true
   ```

4. **Install Sentry SDK**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

5. **Initialize in App**
   ```javascript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: "production",
     tracesSampleRate: 0.1,
   });
   ```

### Monitoring Features

- ✅ Automatic error capture
- ✅ Stack traces
- ✅ User context
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ Alerts and notifications

### Alert Rules

1. **Error Rate Alert**
   - Threshold: > 5% error rate
   - Window: 5 minutes
   - Action: Email notification

2. **Performance Alert**
   - Threshold: > 3 second page load
   - Window: 10 minutes
   - Action: Slack notification

3. **Critical Error Alert**
   - Threshold: Any critical error
   - Action: Immediate email + Slack

---

## 2. Performance Monitoring

### Google Lighthouse

1. **Setup Automated Testing**
   ```bash
   npm install --save-dev @lighthouse-labs/lighthouse-ci
   ```

2. **Configure lighthouse.json**
   ```json
   {
     "ci": {
       "collect": {
         "url": ["https://gsistech.com"]
       },
       "upload": {
         "target": "temporary-public-storage"
       }
     }
   }
   ```

3. **Run Tests**
   ```bash
   lhci autorun
   ```

### Performance Metrics

- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Time to Interactive (TTI):** < 3.8s

---

## 3. User Analytics

### Google Analytics 4 Setup

1. **Create GA4 Property**
   - Go to https://analytics.google.com
   - Create new property: "MYGSIS"
   - Get Measurement ID

2. **Install Analytics**
   ```bash
   npm install @react-ga/core @react-ga/event-handler
   ```

3. **Initialize**
   ```javascript
   import ReactGA from 'react-ga4';
   
   ReactGA.initialize(import.meta.env.VITE_GA_ID);
   ```

### Events to Track

- User login/logout
- Page views
- Feature usage
- Error events
- Performance metrics
- Conversion events

### Dashboards

1. **User Dashboard**
   - Daily active users
   - User retention
   - User demographics
   - Device types

2. **Feature Dashboard**
   - Feature usage
   - Popular pages
   - User flows
   - Conversion funnels

3. **Performance Dashboard**
   - Page load times
   - API response times
   - Error rates
   - Uptime

---

## 4. Application Performance Monitoring (APM)

### Datadog Setup

1. **Create Datadog Account**
   - Go to https://www.datadoghq.com
   - Create organization

2. **Install Datadog Agent**
   ```bash
   npm install @datadog/browser-rum
   ```

3. **Initialize**
   ```javascript
   import { datadogRum } from '@datadog/browser-rum';
   
   datadogRum.init({
     applicationId: 'xxxxx',
     clientToken: 'xxxxx',
     site: 'datadoghq.com',
     service: 'constructflow-frontend',
     env: 'production',
     version: '1.0.0',
     sessionSampleRate: 100,
     sessionReplaySampleRate: 20,
     trackUserInteractions: true,
     trackResources: true,
     trackLongTasks: true,
     defaultPrivacyLevel: 'mask-user-input',
   });
   ```

### Monitoring Features

- Real User Monitoring (RUM)
- Session replay
- Error tracking
- Performance monitoring
- Distributed tracing
- Custom metrics

---

## 5. Uptime Monitoring

### UptimeRobot Setup

1. **Create UptimeRobot Account**
   - Go to https://uptimerobot.com
   - Create monitor for https://gsistech.com

2. **Configure Monitor**
   - URL: https://gsistech.com
   - Check interval: 5 minutes
   - Alert contacts: Email + Slack

3. **Add Heartbeat Checks**
   - Check every 5 minutes
   - Alert if down > 2 minutes
   - Retry 3 times before alerting

### Alerts

- Email notification on downtime
- Slack notification
- SMS for critical downtime
- Webhook for custom actions

---

## 6. Log Aggregation

### DigitalOcean Logging

1. **Enable App Logs**
   - DigitalOcean Dashboard → Apps
   - Select "constructflow-frontend"
   - Enable logging

2. **View Logs**
   - Access logs in DigitalOcean Dashboard
   - Filter by date/time
   - Search for errors

### Log Types

- Application logs
- Build logs
- Deployment logs
- Error logs
- Access logs

---

## 7. Database Monitoring

### PostgreSQL Monitoring

1. **Enable Query Logging**
   ```sql
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   ```

2. **Monitor Connections**
   ```sql
   SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
   ```

3. **Monitor Performance**
   - Slow query logs
   - Index usage
   - Cache hit ratio
   - Connection pool status

---

## 8. Alerting Configuration

### Alert Channels

1. **Email**
   - Critical errors
   - Downtime alerts
   - Performance degradation

2. **Slack**
   - Deployments
   - Error spikes
   - Performance alerts

3. **SMS**
   - Critical downtime
   - Security issues
   - Revenue-impacting errors

4. **PagerDuty**
   - On-call escalation
   - Incident management
   - Runbook integration

### Alert Rules

| Alert | Threshold | Action |
|-------|-----------|--------|
| Error Rate | > 5% | Email + Slack |
| Page Load | > 3s | Slack |
| API Response | > 1s | Slack |
| Downtime | > 2min | Email + SMS |
| Memory | > 80% | Slack |
| CPU | > 80% | Slack |

---

## 9. Dashboard Setup

### Main Dashboard

1. **Real-time Metrics**
   - Current users
   - Error rate
   - Page load time
   - API response time

2. **Historical Trends**
   - Daily active users
   - Error trend
   - Performance trend
   - Uptime percentage

3. **Feature Analytics**
   - Top pages
   - User flows
   - Conversion rates
   - Feature usage

### Custom Dashboards

1. **Operations Dashboard**
   - Server health
   - Database status
   - API performance
   - Deployment status

2. **Business Dashboard**
   - User growth
   - Feature adoption
   - User retention
   - Revenue metrics

3. **Security Dashboard**
   - Failed logins
   - Suspicious activity
   - API abuse
   - Security alerts

---

## 10. Incident Response

### On-Call Setup

1. **Assign On-Call**
   - Primary: Development Lead
   - Secondary: Senior Developer
   - Escalation: CTO

2. **Response Time**
   - Critical: 15 minutes
   - High: 1 hour
   - Medium: 4 hours
   - Low: Next business day

3. **Escalation Path**
   - Level 1: Automated alerts
   - Level 2: On-call engineer
   - Level 3: Engineering manager
   - Level 4: CTO

### Incident Checklist

- [ ] Acknowledge alert
- [ ] Assess severity
- [ ] Notify stakeholders
- [ ] Start investigation
- [ ] Implement fix
- [ ] Deploy fix
- [ ] Verify resolution
- [ ] Post-mortem analysis

---

## 11. Maintenance & Optimization

### Weekly Tasks

- Review error logs
- Check performance metrics
- Analyze user analytics
- Review uptime reports

### Monthly Tasks

- Performance optimization
- Database maintenance
- Security audit
- Capacity planning

### Quarterly Tasks

- Infrastructure review
- Cost optimization
- Disaster recovery test
- Security assessment

---

## 12. Cost Estimation

| Service | Cost | Notes |
|---------|------|-------|
| Sentry | $29/month | Error tracking |
| Datadog | $15/month | APM |
| Google Analytics | Free | User analytics |
| UptimeRobot | $10/month | Uptime monitoring |
| DigitalOcean | $12-50/month | App hosting |
| **Total** | **~$66-96/month** | Production monitoring |

---

## Implementation Timeline

- **Week 1:** Set up Sentry and error tracking
- **Week 2:** Configure performance monitoring
- **Week 3:** Implement user analytics
- **Week 4:** Set up alerting and dashboards

---

## Success Metrics

✅ 99.9% uptime  
✅ < 3 second page load  
✅ < 1 second API response  
✅ < 5% error rate  
✅ 100% error tracking  
✅ Real-time alerting  

---

**Status: READY FOR IMPLEMENTATION** 🚀
