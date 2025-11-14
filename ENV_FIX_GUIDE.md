# .env Configuration Fix Guide

## Issues Found

Based on the test output, there are configuration issues in your `.env` file that need to be fixed:

### 1. DATABASE_URL - Special Character in Password

**Issue:** Your password contains `#` which is a special character in URLs that needs to be URL-encoded.

**Current:**
```
DATABASE_URL=postgresql://postgres:Z4HhdZR7J7z#x_i@db.ujffbhskgiuzwkefeksy.supabase.co:5432/postgres
```

**Fixed (encode `#` as `%23`):**
```
DATABASE_URL=postgresql://postgres:Z4HhdZR7J7z%23x_i@db.ujffbhskgiuzwkefeksy.supabase.co:5432/postgres
```

### 2. REDIS_URL - Missing Protocol

**Issue:** Missing `redis://` or `rediss://` protocol prefix.

**Current:**
```
REDIS_URL=redis-12737.c331.us-west1-1.gce.cloud.redislabs.com:12737
```

**Fixed (assuming password is needed):**
```
REDIS_URL=redis://default:YOUR_PASSWORD@redis-12737.c331.us-west1-1.gce.cloud.redislabs.com:12737
```

Or with SSL:
```
REDIS_URL=rediss://default:YOUR_PASSWORD@redis-12737.c331.us-west1-1.gce.cloud.redislabs.com:12737
```

**Note:** If you're using Redis Labs, you'll need to add your password. Check your Redis Labs dashboard for the connection string.

### 3. Upstash Redis - Using Placeholder Values

**Issue:** Still using placeholder values instead of real credentials.

**Current:**
```
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxx...
```

**How to get real values:**
1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your Redis database
3. Go to **Details** tab
4. Under **REST API** section, copy:
   - REST URL → `UPSTASH_REDIS_REST_URL`
   - REST Token → `UPSTASH_REDIS_REST_TOKEN`

## Recommended Configuration

Since you have both Redis Labs and Upstash configured, I recommend:

### Option 1: Use Upstash (Recommended for serverless)
```bash
# Set real Upstash credentials
UPSTASH_REDIS_REST_URL=https://your-actual-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-actual-token

# Comment out or remove REDIS_URL
# REDIS_URL=...
```

### Option 2: Use Redis Labs (Traditional Redis)
```bash
# Fix REDIS_URL with proper format
REDIS_URL=redis://default:YOUR_PASSWORD@redis-12737.c331.us-west1-1.gce.cloud.redislabs.com:12737

# Comment out Upstash (optional)
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
```

## URL Encoding Reference

Common special characters that need encoding in URLs:
- `#` → `%23`
- `@` → `%40`
- `!` → `%21`
- `$` → `%24`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`
- `*` → `%2A`

## After Fixing

1. Save your `.env` file
2. Run the connection test again:
   ```bash
   npm run test:connections
   ```

3. You should see:
   ```
   ✓ Database connection pool initialized
   ✓ Database connected successfully
   ✓ Upstash Redis connected successfully (or Standard Redis)
   ```
