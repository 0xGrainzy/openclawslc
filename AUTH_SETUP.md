# Auth Setup Guide — openclawslc.com

## Overview

The admin (`/admin`) routes are protected by a two-layer auth system:

1. **Google OAuth** (primary) — sign in with `0xgrainzy@gmail.com`
2. **Access Key** (fallback) — a rotating key stored bcrypt-hashed in `admin-key.json`

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
```

For **production on Vercel**, set the same variables in:
Vercel Dashboard → Project → Settings → Environment Variables

---

## Step 3 — Access Key Initialization

On first startup, the access key is auto-generated in `admin-key.json` (bcrypt-hashed).
To get your initial plaintext key, rotate it from the Admin Panel after logging in with Google:

1. Sign in with Google OAuth (once credentials are set up)
2. In the Admin Panel header, click **Rotate Key**
3. Copy the displayed key — it is shown **once only**

Alternatively via API:
```bash
curl -X POST https://openclawslc.com/api/admin/rotate-key \
  -H "Cookie: next-auth.session-token=<your-session-cookie>"
```

---

## Step 4 — Key Rotation

Once authenticated, rotate the access key from the Admin Panel (Rotate Key button) or via:

```
POST /api/admin/rotate-key
```

The response JSON contains `newKey` — copy it immediately. Store it securely (password manager).

---

## File Reference

| File | Purpose |
|------|---------|
| `admin-key.json` | Bcrypt hash of current access key + timestamps |
| `.env.local` | Local environment variables (never commit) |
| `lib/admin-key.ts` | Key generation/verification logic |
| `lib/auth-options.ts` | NextAuth configuration |
| `lib/rate-limit.ts` | Login rate limiter (5 req/min per IP) |
| `middleware.ts` | Route protection (requires valid session) |

---

## Security Notes

- Access key is bcrypt-hashed (12 rounds) — plaintext is never stored
- Rate limit: 5 login attempts per minute per IP
- Sessions expire after 24 hours (JWT strategy)
- Google OAuth restricted to `0xgrainzy@gmail.com` only
- CSRF protection provided by NextAuth built-in
