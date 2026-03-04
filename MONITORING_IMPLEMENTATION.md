# Monitoring Implementation Guide

**Phase:** 5 - Monitoring, Analytics & Error Tracking  
**Status:** Ready for Implementation

---

## Quick Start

This guide provides step-by-step instructions to set up production monitoring for ConstructFlow.

---

## 1. Error Tracking Implementation (Sentry)

### Installation
```bash
npm install @sentry/react @sentry/tracing
```

### Configuration File: `src/monitoring/sentry.js`
```javascript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.exception) {
        const error = event.exception.values[0];
        console.error('Sentry Error:', error);
      }
      return event;
    },
  });
}
```

### Initialize in App
```javascript
import { initSentry } from '@/monitoring/sentry';

// Initialize Sentry before rendering
if (import.meta.env.VITE_ERROR_TRACKING_ENABLED === 'true') {
  initSentry();
}
```

### Capture Custom Errors
```javascript
import * as Sentry from "@sentry/react";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'projects',
      action: 'create',
    },
  });
}
```

---

## 2. Performance Monitoring (Datadog)

### Installation
```bash
npm install @datadog/browser-rum @datadog/browser-logs
```

### Configuration File: `src/monitoring/datadog.js`
```javascript
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

export function initDatadog() {
  datadogRum.init({
    applicationId: import.meta.env.VITE_DATADOG_APP_ID,
    clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.com',
    service: 'constructflow-frontend',
    env: import.meta.env.MODE,
    version: '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  });

  datadogRum.startSessionReplayRecording();

  datadogLogs.init({
    clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.com',
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  });
}
```

### Initialize in App
```javascript
import { initDatadog } from '@/monitoring/datadog';

if (import.meta.env.VITE_PERFORMANCE_MONITORING === 'true') {
  initDatadog();
}
```

### Log Custom Events
```javascript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.addUserAction('create_project', {
  projectName: 'Test Project',
  userId: user.id,
});
```

---

## 3. User Analytics (Google Analytics 4)

### Installation
```bash
npm install @react-ga/core @react-ga/event-handler
```

### Configuration File: `src/monitoring/analytics.js`
```javascript
import ReactGA from 'react-ga4';

export function initAnalytics() {
  ReactGA.initialize(import.meta.env.VITE_GA_ID);
}

export function trackPageView(path) {
  ReactGA.pageview(path);
}

export function trackEvent(category, action, label) {
  ReactGA.event({
    category,
    action,
    label,
  });
}

export function trackUser(userId, email) {
  ReactGA.set({ 'user_id': userId });
  ReactGA.event({
    category: 'engagement',
    action: 'user_login',
    label: email,
  });
}
```

### Initialize in App
```javascript
import { initAnalytics, trackPageView } from '@/monitoring/analytics';

useEffect(() => {
  initAnalytics();
}, []);

useEffect(() => {
  trackPageView(window.location.pathname);
}, [location]);
```

### Track Events
```javascript
import { trackEvent } from '@/monitoring/analytics';

const handleCreateProject = async (data) => {
  trackEvent('projects', 'create', data.name);
  // Create project...
};
```

---

## 4. Logging Implementation

### Configuration File: `src/monitoring/logger.js`
```javascript
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL || 'INFO'];

export const logger = {
  debug: (message, data) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  info: (message, data) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${message}`, data);
    }
  },

  warn: (message, data) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  error: (message, error) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, error);
    }
  },
};
```

### Usage
```javascript
import { logger } from '@/monitoring/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Failed to create project', error);
```

---

## 5. Health Check Endpoint

### Backend Implementation
```javascript
// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});
```

### Frontend Health Check
```javascript
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

---

## 6. Custom Dashboards

### Sentry Dashboard
- Error rate over time
- Top errors
- Affected users
- Error trends
- Release comparison

### Datadog Dashboard
- Page load times
- API response times
- User interactions
- Session replays
- Error rates

### Google Analytics Dashboard
- Daily active users
- User retention
- Feature adoption
- Conversion funnels
- User flows

---

## 7. Alert Configuration

### Sentry Alerts
```javascript
// Alert on error spike
{
  name: 'Error Rate Alert',
  conditions: [
    {
      id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
      value: 100,
      comparisonType: 'count',
      interval: '5m',
    },
  ],
  actions: [
    {
      service: 'slack',
      channel: '#alerts',
    },
  ],
}
```

### Datadog Alerts
```javascript
// Alert on high latency
{
  name: 'High Latency Alert',
  query: 'avg:trace.web.request.duration{env:production} > 3000',
  thresholds: {
    critical: 3000,
    warning: 2000,
  },
  notify: ['slack:@devops'],
}
```

---

## 8. Monitoring Checklist

### Daily Monitoring
- [ ] Check error rate
- [ ] Review critical errors
- [ ] Monitor API response times
- [ ] Check uptime status
- [ ] Review user activity

### Weekly Monitoring
- [ ] Analyze performance trends
- [ ] Review user feedback
- [ ] Check resource usage
- [ ] Review security logs
- [ ] Plan optimizations

### Monthly Monitoring
- [ ] Performance analysis
- [ ] Capacity planning
- [ ] Cost optimization
- [ ] Security audit
- [ ] Disaster recovery test

---

## 9. Troubleshooting

### Sentry Not Capturing Errors
- Verify DSN is correct
- Check network tab for requests to sentry.io
- Verify error actually occurred
- Check Sentry project settings

### Datadog Not Showing Data
- Verify API credentials
- Check network connectivity
- Verify data is being sent
- Check Datadog dashboard filters

### Analytics Not Tracking
- Verify GA ID is correct
- Check Google Analytics property
- Verify tracking code installed
- Check browser privacy settings

---

## 10. Environment Variables

Add to `.env.production`:
```
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
VITE_DATADOG_APP_ID=xxxxx
VITE_DATADOG_CLIENT_TOKEN=xxxxx
VITE_GA_ID=G-XXXXX
VITE_ERROR_TRACKING_ENABLED=true
VITE_PERFORMANCE_MONITORING=true
VITE_ANALYTICS_ENABLED=true
VITE_LOG_LEVEL=info
```

---

## 11. Implementation Timeline

- **Day 1:** Set up Sentry
- **Day 2:** Configure Datadog
- **Day 3:** Implement Google Analytics
- **Day 4:** Create dashboards
- **Day 5:** Configure alerts
- **Day 6:** Test all monitoring
- **Day 7:** Deploy to production

---

## 12. Success Metrics

✅ 99.9% uptime  
✅ < 3 second page load  
✅ < 1 second API response  
✅ < 5% error rate  
✅ 100% error tracking  
✅ Real-time alerting  

---

**Status: READY FOR IMPLEMENTATION** 🚀
