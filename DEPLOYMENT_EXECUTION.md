# Production Deployment Execution Guide

**Phase:** 1 - Production Deployment to DigitalOcean  
**Status:** Ready for Execution

---

## Overview

Complete step-by-step guide to deploy ConstructFlow frontend to DigitalOcean App Platform with DNS configuration and SSL setup.

---

## Pre-Deployment Verification

### Checklist
- [x] Code compiled successfully
- [x] All tests passing
- [x] Code pushed to GitHub (commit: be0d8ed)
- [x] Environment variables configured
- [x] app.yaml prepared
- [x] DNS setup documented
- [x] Team notified
- [x] Rollback plan ready

---

## Step 1: Create DigitalOcean App

### Via DigitalOcean Dashboard

1. **Log in to DigitalOcean**
   - Go to https://cloud.digitalocean.com
   - Sign in with your account

2. **Create New App**
   - Click "Apps" in left sidebar
   - Click "Create App"
   - Select "GitHub" as source
   - Authorize GitHub connection

3. **Select Repository**
   - Repository: `Gsisinc/constructflow`
   - Branch: `main`
   - Click "Next"

4. **Configure Build Settings**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Click "Next"

5. **Set Environment Variables**
   ```
   VITE_API_URL=https://mygsis-xxxxx.ondigitalocean.app/api
   VITE_APP_NAME=MYGSIS
   VITE_APP_TITLE=MYGSIS - Construction Management
   VITE_ANALYTICS_ENABLED=true
   VITE_DEBUG=false
   ```
   - Click "Next"

6. **Review and Create**
   - Review all settings
   - Click "Create Resources"
   - Wait for app to be created

---

## Step 2: Monitor Deployment

### Build Progress

1. **Watch Build Logs**
   - Go to Apps → constructflow-frontend
   - Click "Deployments"
   - Monitor build progress
   - Expected time: 5-10 minutes

2. **Expected Build Output**
   ```
   Building Docker image...
   npm install
   npm run build
   Build successful
   Pushing to registry...
   Deploying...
   ```

3. **Verify Build Success**
   - Build status shows "Success"
   - No error messages
   - App shows "Active"

---

## Step 3: Configure Domain

### Add Custom Domain

1. **Go to App Settings**
   - Apps → constructflow-frontend
   - Click "Settings"
   - Scroll to "Domains"

2. **Add Domain**
   - Click "Add Domain"
   - Enter: `gsistech.com`
   - Click "Add Domain"

3. **Configure DNS**
   - Copy the CNAME value provided
   - Go to your domain registrar
   - Create CNAME record:
     - Name: `gsistech.com` (or @)
     - Type: CNAME
     - Value: (from DigitalOcean)
     - TTL: 3600

4. **Verify DNS**
   ```bash
   nslookup gsistech.com
   dig gsistech.com
   ```
   - Should resolve to DigitalOcean IP

---

## Step 4: SSL Certificate Setup

### Auto-Provisioned SSL

1. **DigitalOcean Auto-Provisions SSL**
   - Automatic for all apps
   - Valid for 90 days
   - Auto-renewal enabled
   - No additional setup needed

2. **Verify HTTPS**
   - Go to https://gsistech.com
   - Should load without certificate warnings
   - Check certificate details
   - Should show valid certificate

3. **Force HTTPS**
   - Apps → constructflow-frontend
   - Settings → HTTPS Redirect
   - Enable "Force HTTPS"
   - Click "Save"

---

## Step 5: Verify Deployment

### Functionality Tests

1. **App Loads**
   - Navigate to https://gsistech.com
   - Page should load completely
   - No console errors
   - No network errors

2. **Login Page**
   - Should display login form
   - Email field present
   - Password field present
   - Login button functional

3. **Authentication**
   - Test login with valid credentials
   - Should redirect to dashboard
   - JWT token should be stored
   - User should remain logged in on refresh

4. **Dashboard**
   - All widgets should load
   - No missing data
   - API calls successful
   - Charts and graphs display

5. **All Pages**
   - Navigate through all major pages
   - Projects page loads
   - Bids page loads
   - Tasks page loads
   - All pages accessible

---

## Step 6: Performance Verification

### Load Time Testing

1. **Page Load Time**
   - Use browser DevTools
   - Open Network tab
   - Reload page
   - Measure total load time
   - Target: < 3 seconds

2. **API Response Time**
   - Monitor Network tab
   - Check API requests
   - Measure response times
   - Target: < 1 second

3. **Bundle Size**
   - Check Network tab
   - JavaScript bundle size
   - CSS bundle size
   - Target: < 500KB total

---

## Step 7: Monitoring Verification

### Monitoring Systems Active

1. **Sentry Error Tracking**
   - Go to https://sentry.io
   - Check project dashboard
   - Should show app connected
   - Ready to capture errors

2. **Datadog APM**
   - Go to https://app.datadoghq.com
   - Check RUM dashboard
   - Should show app data
   - Performance metrics visible

3. **Google Analytics**
   - Go to https://analytics.google.com
   - Check real-time data
   - Should show active users
   - Page views tracked

4. **UptimeRobot**
   - Go to https://uptimerobot.com
   - Check monitor status
   - Should show "Up"
   - Response time < 500ms

---

## Step 8: Post-Deployment Tasks

### Notification

1. **Notify Team**
   - Send Slack message
   - Send email notification
   - Update status page
   - Post announcement

2. **Notify Users**
   - In-app notification
   - Email announcement
   - Release notes
   - Help documentation

3. **Update Documentation**
   - Update README
   - Update deployment guide
   - Update troubleshooting
   - Archive old docs

---

## Step 9: Monitoring Dashboard

### Set Up Dashboards

1. **DigitalOcean Dashboard**
   - Apps → constructflow-frontend
   - View metrics
   - Monitor CPU usage
   - Monitor memory usage
   - Monitor request count

2. **Error Tracking Dashboard**
   - Sentry project dashboard
   - Monitor error rate
   - Watch for new errors
   - Review error details

3. **Performance Dashboard**
   - Datadog RUM dashboard
   - Monitor page load times
   - Monitor API response times
   - Watch for anomalies

4. **Analytics Dashboard**
   - Google Analytics dashboard
   - Monitor active users
   - Track page views
   - Monitor user flows

---

## Step 10: Rollback Procedure

### If Issues Occur

1. **Immediate Rollback**
   - Apps → constructflow-frontend
   - Deployments
   - Select previous deployment
   - Click "Rollback"
   - Confirm rollback

2. **Manual Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```
   - DigitalOcean will auto-redeploy

3. **Verify Rollback**
   - Check app status
   - Verify previous version running
   - Test functionality
   - Notify team

---

## Troubleshooting

### App Won't Start

**Problem:** App shows "Failed" status

**Solutions:**
1. Check build logs for errors
2. Verify environment variables
3. Check GitHub repository access
4. Verify build command is correct

### HTTPS Not Working

**Problem:** Certificate error

**Solutions:**
1. Wait 24-48 hours for DNS propagation
2. Manually trigger certificate renewal
3. Check domain DNS records
4. Verify CNAME is correct

### API Calls Failing

**Problem:** 404 or connection errors

**Solutions:**
1. Verify VITE_API_URL is correct
2. Check backend is running
3. Verify CORS headers
4. Check network connectivity

### Performance Issues

**Problem:** Slow page loads

**Solutions:**
1. Check bundle size
2. Optimize images
3. Enable caching
4. Scale up instance size

---

## Success Criteria

✅ App deployed to DigitalOcean  
✅ Domain resolves to app  
✅ HTTPS working  
✅ App loads without errors  
✅ Authentication working  
✅ All pages accessible  
✅ API responding  
✅ Monitoring active  

---

## Timeline

| Step | Duration | Status |
|------|----------|--------|
| Create App | 5 min | ⏳ |
| Monitor Build | 10 min | ⏳ |
| Configure Domain | 5 min | ⏳ |
| SSL Setup | 2 min | ⏳ |
| Verify Deployment | 10 min | ⏳ |
| Performance Test | 5 min | ⏳ |
| Monitoring Setup | 5 min | ⏳ |
| Post-Deployment | 10 min | ⏳ |
| **Total** | **~50 min** | **⏳** |

---

## Support

For issues during deployment:
- Check DigitalOcean documentation
- Review deployment logs
- Contact DigitalOcean support
- Escalate to development team

---

**Status: READY FOR DEPLOYMENT** 🚀
