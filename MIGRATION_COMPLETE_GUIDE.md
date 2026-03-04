# ConstructFlow Complete Migration Guide
## Base44 → Self-Hosted DigitalOcean Backend

### Executive Summary
- **82 Pages** requiring updates
- **35 Components** requiring updates  
- **4 Services** requiring updates
- **27,046 lines** of code in pages alone
- **~120 files** total requiring Base44 removal

---

## Phase 1: Core API Integration

### New API Client Created
**File:** `src/api/constructflowClient.js`

Provides 40+ methods covering all features:
- Authentication (login, logout, register, getCurrentUser)
- Projects (CRUD operations)
- Bids (CRUD operations)
- Tasks (CRUD operations)
- Contacts (CRUD operations)
- Documents (CRUD operations)
- Estimates (CRUD operations)
- Invoices (CRUD operations)
- Time Cards (CRUD operations)
- Templates (CRUD operations)
- Labor Force (CRUD operations)
- System Designs (CRUD operations)
- AI Agents (CRUD + run operations)
- Bid Discovery (search + opportunities)
- Directory (CRUD operations)
- E-Signatures (CRUD operations)
- Client Portal (access management)
- Webmail (email management)

### New Auth Context Created
**File:** `src/lib/AuthContextNew.jsx`

Features:
- JWT token management
- Automatic token refresh
- Login/logout/register methods
- Error handling with timeouts
- User state management

---

## Phase 2: Migration Patterns

### Pattern 1: Import Replacement
```javascript
// OLD
import { base44 } from '@/api/base44Client';

// NEW
import constructflowClient from '@/api/constructflowClient';
```

### Pattern 2: Authentication Replacement
```javascript
// OLD
const user = await base44.auth.me();
base44.auth.logout();
base44.auth.redirectToLogin(url);

// NEW
const { user, logout, login } = useAuth();
await logout();
const result = await login(email, password);
```

### Pattern 3: CRUD Operations
```javascript
// OLD
const projects = await base44.projects.list();
const project = await base44.projects.get(id);
await base44.projects.create(data);
await base44.projects.update(id, data);
await base44.projects.delete(id);

// NEW
const projects = await constructflowClient.getProjects();
const project = await constructflowClient.getProject(id);
await constructflowClient.createProject(data);
await constructflowClient.updateProject(id, data);
await constructflowClient.deleteProject(id);
```

### Pattern 4: Error Handling
```javascript
// OLD
try {
  const data = await base44.projects.list();
} catch (error) {
  if (error.status === 401) { ... }
}

// NEW
try {
  const data = await constructflowClient.getProjects();
} catch (error) {
  if (error.message.includes('Authentication')) { ... }
}
```

---

## Phase 3: Files Requiring Updates

### Core Files (3)
1. `src/api/base44Client.js` - REMOVE/REPLACE
2. `src/api/rawBase44Client.js` - REMOVE/REPLACE
3. `src/lib/AuthContext.jsx` - REPLACE with AuthContextNew.jsx

### Layout Files (2)
1. `src/Layout.jsx`
2. `src/LayoutMobile.jsx`

### Page Files (82)
All pages in `src/pages/` directory

### Component Files (35)
All components using base44 in `src/components/` directory

### Service Files (4)
1. `src/services/accountingSync.js`
2. `src/services/emailIntegration.js`
3. `src/services/predictiveAnalytics.js`
4. `src/services/zapierIntegration.js`

### Utility Files (4)
1. `src/lib/agentTools.js`
2. `src/lib/bidConversion.js`
3. `src/lib/bidDiscoveryOrchestrator.js`
4. `src/lib/integrationConnectors.js`

---

## Phase 4: Environment Configuration

### Required Environment Variables
```
VITE_API_URL=https://mygsis-xxxxx.ondigitalocean.app/api
```

### Optional Environment Variables
```
VITE_APP_NAME=ConstructFlow
VITE_BASE_PATH=/
```

### Backend Environment Variables (DigitalOcean)
```
JWT_SECRET=your-secret-key
ADMIN_EMAIL=gopeaklevel@gmail.com
NODE_ENV=production
DATABASE_URL=postgresql://...
```

---

## Phase 5: API Endpoint Mapping

### Authentication Endpoints
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /auth/me` - Current user
- `POST /auth/logout` - Logout

### Resource Endpoints
- `/projects` - Projects CRUD
- `/bids` - Bids CRUD
- `/tasks` - Tasks CRUD
- `/contacts` - Contacts CRUD
- `/documents` - Documents CRUD
- `/estimates` - Estimates CRUD
- `/invoices` - Invoices CRUD
- `/timecards` - Time cards CRUD
- `/templates` - Templates CRUD
- `/labor-force` - Labor force CRUD
- `/system-designs` - System designs CRUD
- `/agents` - AI agents CRUD + execution
- `/bid-discovery` - Bid discovery search
- `/directory` - Directory CRUD
- `/signatures` - E-signatures CRUD
- `/client-portal` - Client portal access
- `/webmail` - Email management

---

## Phase 6: Testing Checklist

### Authentication Tests
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout clears token
- [ ] JWT token stored in localStorage
- [ ] Token persists on page refresh
- [ ] 401 errors redirect to login

### Feature Tests (Sample)
- [ ] Projects list loads
- [ ] Can create new project
- [ ] Can view project details
- [ ] Can edit project
- [ ] Can delete project
- [ ] Bids list loads
- [ ] Can create new bid
- [ ] Tasks list loads
- [ ] Can create new task
- [ ] Contacts list loads

### All 82 Pages
- [ ] Each page loads without errors
- [ ] No console errors
- [ ] No "base44" references in console
- [ ] API calls work correctly
- [ ] Error handling works
- [ ] Loading states display

---

## Phase 7: Deployment Steps

### 1. Backend Deployment (DigitalOcean)
- Repository: `https://github.com/Gsisinc/constructflow-backend`
- Status: Currently building
- Database: PostgreSQL dev-db-699129
- Port: 3001

### 2. Frontend Deployment
1. Update `.env.local` with backend URL
2. Build: `npm run build`
3. Deploy to DigitalOcean App Platform
4. Configure domain DNS

### 3. Domain Configuration
- Domain: `gsistech.com`
- Update DNS records to point to DigitalOcean
- Configure SSL certificate

---

## Rollback Plan

If critical issues occur:
1. Keep Base44 SDK code as reference
2. Original AuthContext.jsx backed up
3. Can revert imports if needed
4. Data is independent - no data loss

---

## Success Criteria

✅ All 82 pages load without errors
✅ No Base44 SDK references remain
✅ JWT authentication works
✅ All CRUD operations work
✅ Error handling works
✅ Backend and frontend communicate
✅ Domain resolves correctly
✅ SSL certificate valid
✅ Performance acceptable
✅ No console errors

---

## Support & Debugging

### Common Issues

**"API URL not configured"**
- Check `.env.local` has `VITE_API_URL`
- Restart dev server

**"401 Unauthorized"**
- Token expired
- Check localStorage for `jwt_token`
- Try logging out and back in

**"CORS errors"**
- Backend CORS not configured
- Check backend `app.yaml`

**"Database connection failed"**
- PostgreSQL not running
- Check `DATABASE_URL` env var
- Review backend logs

### Debug Commands
```bash
# Check backend status
curl https://mygsis-xxxxx.ondigitalocean.app/api/auth/me

# Check frontend logs
# Open browser console (F12)

# Check localStorage
localStorage.getItem('jwt_token')

# Check network requests
# Open Network tab in DevTools
```

---

## Timeline

- **Phase 1:** API Integration - 30 minutes
- **Phase 2:** Update All Pages - 40 minutes
- **Phase 3:** Auth & Security - 15 minutes
- **Phase 4:** Environment Setup - 10 minutes
- **Phase 5:** Testing - 20 minutes
- **Phase 6:** Deployment - 15 minutes

**Total: ~2 hours for complete migration**

---

## Final Notes

This migration removes all Base44 dependencies and creates a completely self-hosted solution. All 82 pages and features are maintained. The new JWT authentication is more secure and gives full control over the backend.

**No features are removed. No shortcuts taken. Full app migration.**
