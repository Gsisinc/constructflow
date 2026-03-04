# Backend Deployment & Verification Guide

**Phase:** 5 - Complete Backend Deployment & Verification  
**Status:** Ready for Execution

---

## Overview

Complete guide to verify backend deployment on DigitalOcean, test API endpoints, and ensure full integration with frontend.

---

## Backend Status Check

### Verify Backend is Running

1. **Check Backend URL**
   ```bash
   curl https://mygsis-xxxxx.ondigitalocean.app/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-03-03T...",
     "uptime": 12345,
     "version": "1.0.0"
   }
   ```

2. **Check Backend Logs**
   - DigitalOcean Dashboard
   - Apps → mygsis-backend
   - Logs tab
   - Should show "Server running"

3. **Check Database Connection**
   - DigitalOcean Dashboard
   - Databases → dev-db-699129
   - Connection status: "Active"
   - No connection errors

---

## API Endpoint Verification

### Authentication Endpoints

#### 1. Login Endpoint
```bash
curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gsistech.com",
    "password": "TestPassword123!"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "test@gsistech.com",
    "name": "Test User"
  }
}
```

#### 2. Get Current User
```bash
curl https://mygsis-xxxxx.ondigitalocean.app/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Expected response:
```json
{
  "id": "user-123",
  "email": "test@gsistech.com",
  "name": "Test User",
  "role": "admin"
}
```

#### 3. Logout
```bash
curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Expected response:
```json
{
  "message": "Logged out successfully"
}
```

---

### Project Endpoints

#### 1. List Projects
```bash
curl https://mygsis-xxxxx.ondigitalocean.app/api/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Expected response:
```json
{
  "data": [
    {
      "id": "proj-1",
      "name": "Project 1",
      "status": "active",
      "created_at": "2026-03-01T..."
    }
  ],
  "total": 1,
  "page": 1
}
```

#### 2. Create Project
```bash
curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "Test Project",
    "description": "Test Description",
    "status": "active"
  }'
```

Expected response:
```json
{
  "id": "proj-123",
  "name": "Test Project",
  "description": "Test Description",
  "status": "active",
  "created_at": "2026-03-03T..."
}
```

#### 3. Get Project
```bash
curl https://mygsis-xxxxx.ondigitalocean.app/api/projects/proj-123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Expected response:
```json
{
  "id": "proj-123",
  "name": "Test Project",
  "description": "Test Description",
  "status": "active",
  "created_at": "2026-03-03T..."
}
```

---

### Bid Endpoints

#### 1. List Bids
```bash
curl https://mygsis-xxxxx.ondigitalocean.app/api/bids \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### 2. Create Bid
```bash
curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "title": "Test Bid",
    "amount": 50000,
    "status": "open"
  }'
```

#### 3. Upload Bid Document
```bash
curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/bids/bid-123/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "file=@bid.pdf"
```

---

## Database Verification

### Check Database Connection

1. **Connect to Database**
   ```bash
   psql postgresql://user:password@host:5432/constructflow
   ```

2. **Check Tables**
   ```sql
   \dt
   ```
   
   Should show:
   - users
   - projects
   - bids
   - tasks
   - contacts
   - documents
   - etc.

3. **Check Data**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM projects;
   SELECT COUNT(*) FROM bids;
   ```

4. **Check Indexes**
   ```sql
   \di
   ```
   
   Should show indexes on key columns

---

## CORS Configuration

### Verify CORS Headers

1. **Check CORS Headers**
   ```bash
   curl -i https://mygsis-xxxxx.ondigitalocean.app/api/projects \
     -H "Origin: https://gsistech.com"
   ```

   Expected headers:
   ```
   Access-Control-Allow-Origin: https://gsistech.com
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

2. **Test CORS Preflight**
   ```bash
   curl -i -X OPTIONS https://mygsis-xxxxx.ondigitalocean.app/api/projects \
     -H "Origin: https://gsistech.com" \
     -H "Access-Control-Request-Method: POST"
   ```

   Expected response: 200 OK

---

## Authentication Flow Verification

### Test Complete Auth Flow

1. **Register User**
   ```bash
   curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser@gsistech.com",
       "password": "Password123!",
       "name": "New User"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser@gsistech.com",
       "password": "Password123!"
     }'
   ```

3. **Get User Info**
   ```bash
   curl https://mygsis-xxxxx.ondigitalocean.app/api/auth/me \
     -H "Authorization: Bearer [token]"
   ```

4. **Logout**
   ```bash
   curl -X POST https://mygsis-xxxxx.ondigitalocean.app/api/auth/logout \
     -H "Authorization: Bearer [token]"
   ```

---

## Error Handling Verification

### Test Error Responses

1. **401 Unauthorized**
   ```bash
   curl https://mygsis-xxxxx.ondigitalocean.app/api/projects
   ```
   
   Expected: 401 Unauthorized

2. **403 Forbidden**
   ```bash
   curl https://mygsis-xxxxx.ondigitalocean.app/api/admin/users \
     -H "Authorization: Bearer [user-token]"
   ```
   
   Expected: 403 Forbidden

3. **404 Not Found**
   ```bash
   curl https://mygsis-xxxxx.ondigitalocean.app/api/projects/nonexistent
   ```
   
   Expected: 404 Not Found

4. **500 Server Error**
   - Check logs for errors
   - Verify database connection
   - Check environment variables

---

## Performance Verification

### Measure API Performance

1. **Response Time**
   ```bash
   time curl https://mygsis-xxxxx.ondigitalocean.app/api/projects \
     -H "Authorization: Bearer [token]"
   ```
   
   Target: < 1 second

2. **Throughput**
   ```bash
   ab -n 100 -c 10 https://mygsis-xxxxx.ondigitalocean.app/api/projects
   ```
   
   Target: > 100 requests/second

3. **Database Query Performance**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM projects WHERE user_id = 'user-123';
   ```
   
   Check execution time

---

## Monitoring Verification

### Check Monitoring Systems

1. **DigitalOcean Monitoring**
   - Apps → mygsis-backend
   - Metrics tab
   - Check CPU, memory, request count

2. **Error Tracking**
   - Sentry dashboard
   - Should show app connected
   - No critical errors

3. **Performance Monitoring**
   - Datadog dashboard
   - Should show API metrics
   - Response times < 1s

4. **Uptime Monitoring**
   - UptimeRobot dashboard
   - Should show "Up"
   - Response time < 500ms

---

## Integration Testing

### Test Frontend-Backend Integration

1. **Login Flow**
   - Frontend: https://gsistech.com
   - Enter credentials
   - Should authenticate with backend
   - Token stored in localStorage

2. **Data Retrieval**
   - Frontend loads projects
   - Should call backend API
   - Data displays correctly
   - No errors in console

3. **Data Creation**
   - Frontend creates new project
   - Should POST to backend
   - Backend stores data
   - Data appears in list

4. **Real-time Updates**
   - Create item in one browser
   - Should appear in another browser
   - No manual refresh needed

---

## Troubleshooting

### Backend Not Responding

**Problem:** Connection refused

**Solutions:**
1. Check backend is running
2. Verify URL is correct
3. Check firewall rules
4. Check DigitalOcean app status

### Database Connection Error

**Problem:** Cannot connect to database

**Solutions:**
1. Verify database is running
2. Check connection string
3. Verify credentials
4. Check network connectivity

### CORS Errors

**Problem:** CORS policy error

**Solutions:**
1. Verify CORS headers configured
2. Check allowed origins
3. Verify request headers
4. Check preflight requests

### Authentication Failing

**Problem:** 401 Unauthorized

**Solutions:**
1. Verify token is valid
2. Check token expiration
3. Verify user exists
4. Check password hash

---

## Verification Checklist

- [ ] Backend health check passing
- [ ] Database connection active
- [ ] All API endpoints responding
- [ ] Authentication working
- [ ] CORS configured correctly
- [ ] Error handling working
- [ ] Performance acceptable
- [ ] Monitoring active
- [ ] Frontend-backend integration working
- [ ] No critical errors in logs

---

## Success Criteria

✅ Backend running on DigitalOcean  
✅ Database connected  
✅ All API endpoints responding  
✅ Authentication working  
✅ CORS configured  
✅ Performance acceptable  
✅ Monitoring active  
✅ Integration working  

---

**Status: READY FOR VERIFICATION** ✅
