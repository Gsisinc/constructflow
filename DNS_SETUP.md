# DNS Configuration Guide for gsistech.com

## Overview
Configure DNS records to point gsistech.com to DigitalOcean App Platform.

---

## DNS Records Required

### 1. Primary Domain (gsistech.com)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | DigitalOcean IP | 3600 |
| CNAME | www | gsistech.com | 3600 |
| MX | @ | mail.gsistech.com | 3600 |
| TXT | @ | v=spf1 include:sendgrid.net ~all | 3600 |

### 2. DigitalOcean App Platform

Get your App Platform endpoint:
```
https://mygsis-xxxxx.ondigitalocean.app
```

Then create CNAME record:
```
gsistech.com CNAME mygsis-xxxxx.ondigitalocean.app
```

---

## Step-by-Step Setup

### Step 1: Get DigitalOcean App Endpoint
1. Go to DigitalOcean Dashboard
2. Navigate to Apps
3. Select "constructflow-frontend" app
4. Copy the App Platform URL

### Step 2: Update DNS Records
1. Go to Domain Registrar (GoDaddy, Namecheap, etc.)
2. Login to DNS management
3. Add/Update CNAME record:
   - **Name:** gsistech.com (or @)
   - **Type:** CNAME
   - **Value:** mygsis-xxxxx.ondigitalocean.app
   - **TTL:** 3600

### Step 3: Add WWW Subdomain
1. Add CNAME record:
   - **Name:** www
   - **Type:** CNAME
   - **Value:** gsistech.com
   - **TTL:** 3600

### Step 4: Verify DNS Propagation
```bash
# Check DNS propagation
nslookup gsistech.com
dig gsistech.com

# Should return DigitalOcean IP or CNAME
```

---

## SSL Certificate Setup

### Automatic SSL (Recommended)
1. DigitalOcean App Platform automatically provisions SSL
2. Certificate is valid for 90 days
3. Auto-renewal is enabled by default

### Manual SSL (Optional)
1. Use Let's Encrypt for free certificates
2. Configure in DigitalOcean App Platform settings
3. Update certificate every 90 days

---

## Verification Checklist

- [ ] CNAME record created for gsistech.com
- [ ] WWW subdomain configured
- [ ] DNS propagation complete (5-48 hours)
- [ ] SSL certificate provisioned
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] App loads correctly

---

## Troubleshooting

### DNS Not Resolving
```bash
# Clear DNS cache
sudo systemctl restart systemd-resolved

# Check DNS records
dig gsistech.com
nslookup gsistech.com
```

### SSL Certificate Issues
1. Wait 24-48 hours for DNS propagation
2. Check certificate status in DigitalOcean
3. Manually trigger certificate renewal if needed

### App Not Loading
1. Verify CNAME record is correct
2. Check DigitalOcean App Platform status
3. Review app logs for errors

---

## DNS Records Examples

### GoDaddy
```
Type: CNAME
Name: gsistech.com
Value: mygsis-xxxxx.ondigitalocean.app
TTL: 3600
```

### Namecheap
```
Type: CNAME
Host: @
Value: mygsis-xxxxx.ondigitalocean.app
TTL: 3600
```

### Route 53 (AWS)
```
Type: CNAME
Name: gsistech.com
Value: mygsis-xxxxx.ondigitalocean.app
TTL: 3600
```

---

## Monitoring

### Check DNS Status
```bash
# Real-time DNS check
watch -n 1 'dig gsistech.com +short'

# Full DNS info
dig gsistech.com

# MX records
dig gsistech.com MX
```

### Monitor Certificate
1. DigitalOcean Dashboard → Apps → constructflow-frontend
2. Check "Certificates" section
3. Verify expiration date

---

## Rollback Plan

If DNS changes cause issues:
1. Revert CNAME to previous value
2. Wait for DNS propagation (5-48 hours)
3. Check app logs for errors
4. Contact DigitalOcean support if needed

---

## Support

For DNS issues:
- Contact your domain registrar
- Check DigitalOcean documentation
- Review app logs in DigitalOcean Dashboard
