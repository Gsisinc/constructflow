# Testing Execution Guide

**Phase:** 2 - Execute Comprehensive Testing Suite  
**Status:** Ready for Execution

---

## Overview

Complete guide to execute all 135 tests across authentication, features, performance, security, and all 82 pages.

---

## Pre-Testing Setup

### Environment Preparation

1. **Start Dev Server**
   ```bash
   cd /home/ubuntu/constructflow-migration
   npm run dev
   ```
   - Server should start on http://localhost:5173
   - No build errors
   - No console warnings

2. **Verify Build**
   ```bash
   npm run build
   ```
   - Build successful
   - 0 errors
   - dist/ folder created

3. **Test Credentials**
   - Email: test@gsistech.com
   - Password: TestPassword123!
   - Ensure account exists in backend

---

## Test Execution Plan

### Phase 1: Authentication Tests (7 tests - 15 minutes)

#### Test 1: Login with Valid Credentials
```
Steps:
1. Navigate to https://gsistech.com
2. Enter email: test@gsistech.com
3. Enter password: TestPassword123!
4. Click "Login"

Expected Results:
✓ Login successful
✓ JWT token stored in localStorage
✓ Redirect to Dashboard
✓ User profile visible
✓ No console errors

Status: ⏳ Pending
```

#### Test 2: Login with Invalid Credentials
```
Steps:
1. Navigate to login page
2. Enter email: test@gsistech.com
3. Enter password: WrongPassword
4. Click "Login"

Expected Results:
✓ Login fails
✓ Error message displayed
✓ Stay on login page
✓ No token stored

Status: ⏳ Pending
```

#### Test 3: Register New Account
```
Steps:
1. Click "Sign Up" link
2. Enter email: newuser@gsistech.com
3. Enter password: NewPassword123!
4. Confirm password: NewPassword123!
5. Click "Register"

Expected Results:
✓ Account created
✓ Auto-login
✓ Redirect to Dashboard
✓ Account visible in system

Status: ⏳ Pending
```

#### Test 4: Logout
```
Steps:
1. Click user menu
2. Click "Logout"

Expected Results:
✓ Token cleared
✓ Redirect to login page
✓ localStorage empty
✓ Session ended

Status: ⏳ Pending
```

#### Test 5: Token Persistence
```
Steps:
1. Login
2. Refresh page (F5)
3. Check localStorage

Expected Results:
✓ Token persists
✓ User stays logged in
✓ No re-login required
✓ Dashboard loads

Status: ⏳ Pending
```

#### Test 6: Session Timeout
```
Steps:
1. Login
2. Wait 1 hour (or simulate)
3. Try to access protected page

Expected Results:
✓ 401 error
✓ Redirect to login
✓ Session ended
✓ Re-login required

Status: ⏳ Pending
```

#### Test 7: CORS Headers
```
Steps:
1. Open DevTools Network tab
2. Make API request
3. Check response headers

Expected Results:
✓ CORS headers present
✓ No CORS errors
✓ Request successful
✓ Response valid

Status: ⏳ Pending
```

---

### Phase 2: Core Features Tests (15 tests - 30 minutes)

#### Projects CRUD (5 tests)
```
Test 1: List Projects
- Navigate to Projects page
- All projects display
- Pagination works
- Filtering works

Test 2: Create Project
- Click "New Project"
- Enter project details
- Click "Create"
- Project appears in list

Test 3: View Project Details
- Click on project
- All details load
- Related items display
- No errors

Test 4: Edit Project
- Click "Edit"
- Change project name
- Click "Save"
- Changes persist

Test 5: Delete Project
- Click "Delete"
- Confirm deletion
- Project removed
- List updates

Status: ⏳ Pending
```

#### Bids CRUD (5 tests)
```
Test 1: List Bids
- Navigate to Bids page
- All bids display
- Status indicators show
- Sorting works

Test 2: Create Bid
- Click "New Bid"
- Enter bid details
- Click "Create"
- Bid appears in list

Test 3: Upload Bid Document
- Click "Upload"
- Select PDF file
- Upload completes
- AI analysis starts

Test 4: Convert to Project
- Click "Convert"
- Confirm conversion
- Project created
- Bid marked as converted

Test 5: Delete Bid
- Click "Delete"
- Confirm deletion
- Bid removed
- List updates

Status: ⏳ Pending
```

#### Tasks & Contacts (5 tests)
```
Test 1: Create Task
- Click "New Task"
- Enter task details
- Assign to user
- Task created

Test 2: Update Task Status
- Click task
- Change status
- Save changes
- Status updates

Test 3: Create Contact
- Click "New Contact"
- Enter contact info
- Click "Save"
- Contact appears in list

Test 4: Edit Contact
- Click contact
- Edit details
- Save changes
- Changes persist

Test 5: Delete Contact
- Click "Delete"
- Confirm deletion
- Contact removed
- List updates

Status: ⏳ Pending
```

---

### Phase 3: All 82 Pages Load Test (82 tests - 30 minutes)

```
Test each page:
1. Dashboard ✓
2. Projects ✓
3. Bids ✓
4. Tasks ✓
5. Contacts ✓
6. Documents ✓
7. Estimates ✓
8. Invoices ✓
9. TimeCards ✓
10. Templates ✓
... (72 more pages)

Expected Results:
✓ Page loads
✓ No console errors
✓ No 404 errors
✓ Data displays
✓ Navigation works

Status: ⏳ Pending
```

---

### Phase 4: API Connectivity Tests (5 tests - 10 minutes)

```
Test 1: GET /auth/me
- Expected: 200 OK
- Response: User data
- Status: ⏳ Pending

Test 2: GET /projects
- Expected: 200 OK
- Response: Projects list
- Status: ⏳ Pending

Test 3: POST /projects
- Expected: 201 Created
- Response: New project
- Status: ⏳ Pending

Test 4: PUT /projects/:id
- Expected: 200 OK
- Response: Updated project
- Status: ⏳ Pending

Test 5: DELETE /projects/:id
- Expected: 204 No Content
- Response: Empty
- Status: ⏳ Pending
```

---

### Phase 5: Performance Tests (4 tests - 10 minutes)

```
Test 1: Page Load Time
- Measure: Total load time
- Target: < 3 seconds
- Tool: DevTools Network tab
- Status: ⏳ Pending

Test 2: API Response Time
- Measure: API request time
- Target: < 1 second
- Tool: DevTools Network tab
- Status: ⏳ Pending

Test 3: Bundle Size
- Measure: JS + CSS size
- Target: < 500KB gzipped
- Tool: DevTools Network tab
- Status: ⏳ Pending

Test 4: Memory Usage
- Measure: Heap size
- Target: < 100MB
- Tool: DevTools Memory tab
- Status: ⏳ Pending
```

---

### Phase 6: Browser Compatibility (6 tests - 15 minutes)

```
Test on each browser:
1. Chrome (Latest) ✓
2. Firefox (Latest) ✓
3. Safari (Latest) ✓
4. Edge (Latest) ✓
5. Mobile Chrome ✓
6. Mobile Safari ✓

Expected Results:
✓ App loads
✓ All features work
✓ No console errors
✓ Responsive layout

Status: ⏳ Pending
```

---

### Phase 7: Security Tests (4 tests - 10 minutes)

```
Test 1: XSS Protection
- Try: <script>alert('xss')</script>
- Expected: Script not executed
- Status: ⏳ Pending

Test 2: CSRF Protection
- Check: CSRF tokens present
- Expected: Tokens validated
- Status: ⏳ Pending

Test 3: SQL Injection
- Try: ' OR '1'='1
- Expected: Query parameterized
- Status: ⏳ Pending

Test 4: Secure Cookies
- Check: HttpOnly flag
- Expected: Secure flag set
- Status: ⏳ Pending
```

---

## Automated Testing

### Run Test Script

```bash
cd /home/ubuntu/constructflow-migration
node test-all-pages.js
```

### Expected Output

```
✅ Passed: 135
❌ Failed: 0
⏭️  Skipped: 0

Success Rate: 100%
Duration: ~5 minutes
```

---

## Manual Testing Checklist

### Before Testing
- [ ] Dev server running
- [ ] Backend running
- [ ] Database connected
- [ ] Environment variables set
- [ ] Test account created

### During Testing
- [ ] Follow test steps exactly
- [ ] Document any failures
- [ ] Take screenshots of errors
- [ ] Note performance metrics
- [ ] Record browser console output

### After Testing
- [ ] Generate test report
- [ ] Document all results
- [ ] Identify any issues
- [ ] Create bug reports
- [ ] Plan fixes if needed

---

## Test Report Template

```
Test Report - ConstructFlow
Date: March 3, 2026
Tester: [Name]
Environment: Production

Results:
- Total Tests: 135
- Passed: ___
- Failed: ___
- Skipped: ___
- Success Rate: ____%

Issues Found:
1. [Issue description]
2. [Issue description]

Performance Metrics:
- Page Load Time: ___ ms
- API Response Time: ___ ms
- Bundle Size: ___ KB

Browser Compatibility:
- Chrome: ✓/✗
- Firefox: ✓/✗
- Safari: ✓/✗
- Edge: ✓/✗

Conclusion:
[Pass/Fail] - Ready for production
```

---

## Success Criteria

✅ All 135 tests pass  
✅ No console errors  
✅ No API errors  
✅ All pages load  
✅ Performance acceptable  
✅ Security verified  
✅ Browser compatible  

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Authentication | 15 min | ⏳ |
| Core Features | 30 min | ⏳ |
| Page Load | 30 min | ⏳ |
| API Connectivity | 10 min | ⏳ |
| Performance | 10 min | ⏳ |
| Browser Compat | 15 min | ⏳ |
| Security | 10 min | ⏳ |
| **Total** | **~120 min** | **⏳** |

---

**Status: READY FOR TESTING** ✅
