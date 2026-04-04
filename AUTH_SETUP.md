# Auth Setup Guide — openclawslc.com

## Overview

The admin (`/admin`) routes are protected by two auth methods:

1. **Google OAuth** (primary) — sign in with `0xgrainzy@gmail.com`
2. **Password** (fallback) — env var `ADMIN_PASSWORD` (default: `SLCAdmin2026!`)

---

## Step 1 — Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one), e.g. `openclawslc-auth`
   - Or reuse the same project you created for grantstell.com — just add a new OAuth client ID
3. Navigate to **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `openclawslc.com Admin`
   - Support email: `0xgrainzy@gmail.com`
   - Developer contact: `0xgrainzy@gmail.com`
   - On the **Test users** step, add `0xgrainzy@gmail.com`
   - Leave the app in "Testing" mode — only one user needed
4. Navigate to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `openclawslc-com`
   - Authorized JavaScript origins:
     - `http://localhost:3001` (development)
     - `https://openclawslc.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/callback/google` (development)
     - `https://openclawslc.com/api/auth/callback/google` (production)
6. Click **Create** — copy the **Client ID** and **Client Secret**

---

## Step 2 — Environment Variables

Edit `.env.local` in the project root:

```env
NEXTAUTH_URL=https://openclawslc.com     # or http://localhost:3001 for dev
NEXTAUTH_SECRET=<generate with: openssl rand -hex 32>

GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Optional — fallback password (defaults to SLCAdmin2026! if not set)
ADMIN_PASSWORD=<your-password>
```

For **production on Vercel**, set the same variables in:
Vercel Dashboard → Project → Settings → Environment Variables

---

## File Reference

| File | Purpose |
|------|---------|
| `.env.local` | Local environment variables (never commit) |
| `lib/auth-options.ts` | NextAuth configuration |
| `lib/rate-limit.ts` | Login rate limiter (5 req/min per IP) |
| `proxy.ts` | Route protection middleware (requires valid session) |

---

## Security Notes

- Rate limit: 5 password attempts per minute per IP
- Sessions expire after 24 hours (JWT strategy)
- Google OAuth restricted to `0xgrainzy@gmail.com` only
- CSRF protection provided by NextAuth built-in
- Password is compared in plaintext from env var — keep `ADMIN_PASSWORD` secret in production
