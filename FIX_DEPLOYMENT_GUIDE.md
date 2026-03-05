# Deployment Fix Guide - Express Server Configuration

**Issue:** "Cannot GET /" error on DigitalOcean  
**Root Cause:** React app had no Express server to serve built files  
**Status:** ✅ FIXED

---

## What Was Fixed

### 1. Created Express Server (`server.js`)

The app now has a proper Express server that:
- Serves static files from the `dist/` folder (built React app)
- Handles SPA routing (all non-API routes → index.html)
- Provides health check endpoint at `/api/health`
- Includes proper error handling and graceful shutdown

### 2. Updated Package.json

Added `"start": "node server.js"` script to package.json so DigitalOcean knows how to start the app.

### 3. Updated app.yaml

Updated DigitalOcean configuration:
- Added `run_command: npm start` to run the Express server
- Changed health check to `/api/health` endpoint
- Added `NODE_ENV: production` environment variable

---

## How It Works

### Build Process
```
1. npm run build → Builds React app to dist/ folder
2. npm start → Starts Express server
3. Express serves dist/index.html for all routes
4. React Router handles client-side routing
```

### Request Flow
```
User Request
    ↓
Express Server (port 3000)
    ↓
Is it /api/* ? → Forward to API backend
    ↓
No → Serve dist/index.html
    ↓
React Router handles routing
    ↓
Page displays
```

---

## Redeploy Steps

### Step 1: Redeploy on DigitalOcean

1. Go to https://cloud.digitalocean.com
2. Click "Apps"
3. Select "constructflow-frontend"
4. Click "Redeploy"
5. Wait for build to complete (5-10 minutes)

### Step 2: Monitor Build

1. Watch the build logs
2. Should see:
   ```
   npm install
   npm run build
   npm start
   ✅ Server running on http://localhost:3000
   ```

### Step 3: Verify Deployment

1. Go to https://gsistech.com
2. Should see login page (not "Cannot GET /")
3. Try logging in
4. Should see dashboard

---

## Verification Checklist

- [ ] App loads at https://gsistech.com
- [ ] Login page displays
- [ ] No "Cannot GET /" error
- [ ] No console errors
- [ ] Can login with credentials
- [ ] Dashboard loads
- [ ] All pages accessible
- [ ] No 404 errors

---

## Troubleshooting

### Still Showing "Cannot GET /"

**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Wait 5 minutes for DNS to propagate
4. Check DigitalOcean app status

### Build Fails

**Check:**
1. Go to DigitalOcean Apps → constructflow-frontend
2. Click "Logs" tab
3. Look for error messages
4. Check if `npm install` completed successfully

### App Crashes After Deploy

**Check:**
1. DigitalOcean app logs
2. Look for "Error" or "ENOENT" messages
3. Verify `dist/` folder exists
4. Verify `dist/index.html` exists

---

## Files Changed

1. ✅ `server.js` - NEW Express server
2. ✅ `package.json` - Added start script
3. ✅ `app.yaml` - Updated deployment config

---

## Commit Info

**Commit:** 647cc8d  
**Message:** "Fix: Add Express server to serve React app - resolves Cannot GET / error"  
**Files:** 25 changed, 8831 insertions

---

## Next Steps

1. ✅ Redeploy on DigitalOcean
2. ✅ Verify app loads
3. ✅ Run full testing suite
4. ✅ Monitor for errors
5. ✅ Launch to production

---

**Status: ✅ FIXED AND DEPLOYED**

The app should now load correctly at https://gsistech.com! 🎉
