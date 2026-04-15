# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repo.

## Project

**openclawslc** — marketing site for OpenClaw SLC, Salt Lake City's AI/crypto
community. Single-page snap-scroll landing page with a Three.js Wasatch
backdrop, three long-form article routes, and a password/Google-protected
admin panel for managing the upcoming-events list.

Production: <https://openclawslc.com> (deployed on Vercel).

## Stack

- **Framework**: Next.js `16.1.6` with the App Router
- **Runtime**: React `19.2.3`, TypeScript `^5` (strict)
- **Styling**: Tailwind CSS `^4` (via `@tailwindcss/postcss`) plus extensive
  inline `style={...}` objects. Most visual styling is inline; Tailwind is
  used mainly for the global reset and `snap-section` helper in
  `app/globals.css`.
- **3D**: `three` `^0.183.2` (no React-Three-Fiber — raw THREE inside
  `useEffect`). Loaded with `next/dynamic({ ssr: false })`.
- **Animation**: `framer-motion` `^12` (available, used sparingly).
- **Auth**: `next-auth` `^4.24` (JWT strategy)
- **Path alias**: `@/*` → repo root (see `tsconfig.json`)

## Scripts

```bash
npm run dev      # next dev (default port 3000; AUTH_SETUP.md mentions 3001 for OAuth)
npm run build    # next build
npm run start    # next start (production server)
```

There is **no lint, typecheck, or test script** in `package.json`. To
typecheck manually run `npx tsc --noEmit`. Don't invent new scripts unless
asked.

## Repository Layout

```
app/
  layout.tsx                Root layout: Inter font, Bebas Neue + JetBrains
                            Mono via Google Fonts <link>, SEO metadata,
                            wraps children in <Providers>.
  providers.tsx             Client-only NextAuth <SessionProvider>.
  globals.css               Tailwind import + reset + scroll-snap rules.
  page.tsx                  Home: snap sections (hero/events/media/contact)
                            with the THREE.js MountainGL backdrop. Fetches
                            /api/events on mount.
  admin/
    page.tsx                Authenticated event CRUD UI (client component).
    login/page.tsx          Google + password login form.
  api/
    auth/[...nextauth]/     NextAuth handler (re-exports authOptions).
    events/route.ts         GET (public) + POST (auth) for events.json.
    events/[id]/route.ts    DELETE (auth) by id.
  articles/
    openclaw-setup/         Static MDX-style React pages (just JSX, no MDX).
    ai-agents-wasatch/
    running-agents-locally/

components/
  MountainGL.tsx            ~22KB raw three.js Wasatch terrain w/ ripples.
  PeakLabels.tsx            DOM peak labels projected from world coords.
  TopoCanvas.tsx            2D canvas "field warp" effect (alternate viz).

lib/
  auth-options.ts           NextAuthOptions: Google + Credentials providers,
                            email allow-list, JWT sessions (24h).
  rate-limit.ts             In-memory token bucket (per-process; not Redis).

public/
  events.json               Source of truth for the events list (read/written
                            by the events API at runtime).
  *.svg, favicon.ico        Static assets.

proxy.ts                    Next.js middleware (see "Middleware" below).
next.config.ts              Empty config (defaults).
vercel.json                 Security headers + framework hints.
AUTH_SETUP.md               Operational guide for OAuth + env vars.
README.md                   create-next-app boilerplate (not very useful).
```

## Key Conventions

### Inline-style design system

Two shared CSSProperties objects appear at the top of most page components:

```ts
const BEBAS: React.CSSProperties = { fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.02em" };
const MONO:  React.CSSProperties = { fontFamily:"'JetBrains Mono','Fira Code','Courier New',monospace" };
```

Spread them (`{...BEBAS, fontSize:"..."}`) — do **not** invent new font
constants or migrate to Tailwind classes unless asked. Color palette:

- Primary blue: `#2563EB`
- Lighter blue: `#60A5FA`, deep `#1D4ED8`, `#1D3A6B` (scrollbar)
- White at varying alphas (`rgba(255,255,255,0.XX)`)
- Black background `#000`

### Sections + scroll-snap

Each home section is `height:"100vh"` + `className="snap-section"`. The HTML
element has `scroll-snap-type: y mandatory` set in `globals.css`. Don't
break this contract when adding sections.

### Mountain backdrop

`MountainGL` is **always** dynamically imported with `ssr: false` from the
home page — three.js touches `window` at module init. Keep this pattern if
you wire the component anywhere else.

### Articles

`app/articles/<slug>/page.tsx` are hand-written client components (each uses
the BEBAS/MONO objects directly). The home page links them via the
`ARTICLES` constant in `app/page.tsx`. To add an article: create the route
folder with a `page.tsx`, then append to `ARTICLES`.

### Events

`public/events.json` shape:

```json
{ "events": [ { "id", "title", "date" (ISO), "description", "lumaUrl", "createdAt" } ] }
```

- The home page fetches `/api/events` and silently no-ops on failure.
- The admin page POSTs (`title`, `date`, `description`, `lumaUrl`) — the
  server generates `id` (`Date.now().toString()`) and `createdAt`.
- ⚠️ Writing to `public/events.json` at runtime works locally but is
  **ephemeral on Vercel** (read-only filesystem outside `/tmp`). If you
  touch this code, preserve the existing behavior unless explicitly asked
  to migrate to a database.

## Auth

See `AUTH_SETUP.md` for full operational steps. Quick reference:

- Two providers: **Google OAuth** (allow-listed to `0xgrainzy@gmail.com` only)
  and **Credentials** with a single `password` field.
- Allowed email is hard-coded in `lib/auth-options.ts` (`ALLOWED_EMAIL`).
- Default password fallback: `process.env.ADMIN_PASSWORD ?? "SLCAdmin2026!"`.
  The default is also baked into `vercel.json` env. Don't print it in logs.
- Sessions: JWT, 24h max age.
- Login rate limit: 5 attempts / minute / IP (in-memory — single-instance
  only; replace with Redis if scaling).
- Required env vars (see `AUTH_SETUP.md`): `NEXTAUTH_URL`, `NEXTAUTH_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, optional `ADMIN_PASSWORD`.

### Middleware (note the filename!)

The middleware lives at `proxy.ts`, **not** `middleware.ts`. It uses
`next-auth/middleware` to require a session on `/admin/((?!login).*)`. If
you need to extend protected paths, edit the `config.matcher` array there.
(Next.js conventionally expects `middleware.ts` — this repo's filename is
intentional; check whether the build still picks it up before renaming.)

## Security

`vercel.json` sets `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, and `X-XSS-Protection`
on every response. Preserve these headers when editing that file.

## Working Norms

- **Don't add docs, comments, or tooling that wasn't asked for.** The
  codebase has a deliberate "single-file, inline-everything" feel — match it.
- **Prefer editing existing files** to creating new abstractions. The home
  page is a 300-line file by design.
- **No test runner is configured.** Don't add Jest/Vitest/Playwright unless
  asked. Verify changes by running `npm run dev` and exercising the page in
  a browser when possible.
- **`@/` imports** for cross-directory references (e.g.
  `import { authOptions } from "@/lib/auth-options"`).
- **Client vs server**: page components that use hooks/`window` need
  `"use client"` at the top. API routes and `lib/auth-options.ts` are
  server-only.
- **Three.js code is performance-sensitive.** Don't refactor `MountainGL`'s
  hot loops (`fbm`, vertex updates) without measuring.

## Git

- Default branch: `main`.
- This task's working branch: `claude/add-claude-documentation-avclQ`.
- Commit style is short, lowercase, imperative (`feat:`, `fix:`, `refactor:`
  prefixes used inconsistently — match nearby history when in doubt).
- Push with `git push -u origin <branch>`. Do **not** open a PR unless the
  user explicitly asks.
