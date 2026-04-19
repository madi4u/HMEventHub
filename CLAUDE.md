# CLAUDE.md — EventHub Refactoring Guide

> This file tells Claude Code how to work on the EventHub repository.
> Read this before making any code changes.

---

## 🎯 Project identity

**App:** EventHub
**App ID:** `eventhub`
**Domain:** `eventhub.hundm.cloud`
**Role:** SaaS event management app for caterers and event agencies
**Tenant model:** Multi-tenant from day one
**Part of:** H+M Operation Cloud platform

---

## 🏗️ Architecture position

EventHub is **one of four apps** running on the H+M Operation Cloud platform. It must:

1. **Authenticate users** via `auth.hundm.cloud` (never implement own auth)
2. **Use `@hundm/shared`** for all cross-app concerns (auth, files, billing)
3. **Enforce tenant isolation** — every query must filter by `tenant_id`
4. **Check app access** in middleware before serving any page
5. **Prepare for billing** — use feature flags, not hardcoded tiers

---

## 🚨 Hard rules — NEVER break these

### ❌ Never

1. **Never implement own user authentication.** No NextAuth setup here, no login form. Auth lives in `auth.hundm.cloud`.
2. **Never query user tables directly.** Use `@hundm/shared/auth` clients.
3. **Never call Stripe directly.** Billing is done by the billing-service.
4. **Never query `billing.*` tables directly.** Use `@hundm/shared/billing`.
5. **Never write files to local disk or Vercel Blob.** Use `@hundm/shared/files`.
6. **Never hardcode tier checks** like `if (tier === "professional")`. Use `hasFeature("feature_name")` instead.
7. **Never run queries without tenant isolation.** Every `WHERE` needs `tenant_id`.
8. **Never commit `.env` files.** Secrets go in Infisical.
9. **Never install `@supabase/*` packages.** We moved off Supabase.
10. **Never make cross-app imports.** EventHub doesn't know about FleetHub code.

### ✅ Always

1. **Always import from `@hundm/shared`** for cross-cutting concerns.
2. **Always include `tenant_id` in queries.** Use Prisma middleware to enforce this.
3. **Always check app access** in `middleware.ts` for every route.
4. **Always use German for UI text**, English for code.
5. **Always use feature flags** for tier-gated features.
6. **Always log via the shared logger** — no raw `console.log` in production code.

---

## 📁 Expected folder structure

```
eventhub/
├── app/                    Next.js 14 App Router
│   ├── (auth)/            Public routes (login redirect handler)
│   ├── (app)/             Protected routes (requires login)
│   ├── api/               API routes
│   └── layout.tsx
├── components/            React components
├── lib/
│   ├── db.ts             Prisma client with tenant middleware
│   ├── session.ts        Session helpers (uses @hundm/shared/auth)
│   └── constants.ts
├── middleware.ts         REQUIRED: auth + access check
├── prisma/
│   └── schema.prisma     All models must have tenantId field
├── public/
├── .env.example
├── .gitignore            Includes .env
├── CLAUDE.md             (this file)
├── package.json
└── tsconfig.json
```

---

## 🔐 Authentication flow

```
User visits eventhub.hundm.cloud/events
  ↓
middleware.ts checks auth cookie (.hundm.cloud wildcard)
  ↓
No cookie? → redirect to auth.hundm.cloud/login?callback=<current-url>
  ↓
User logs in at auth.hundm.cloud (magic link to email)
  ↓
Auth service sets wildcard cookie for .hundm.cloud
  ↓
User returns to eventhub.hundm.cloud/events
  ↓
middleware.ts validates cookie → fetches session from auth service
  ↓
middleware.ts calls checkAppAccess({ userId, orgId, appId: "eventhub" })
  ↓
Result: { allowed: true, reason: "ok", appRole: "admin" }
  ↓
Page renders with user session available
```

### middleware.ts template

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession, checkAppAccess } from "@hundm/shared/auth"

export async function middleware(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const session = await getServerSession(cookieHeader)

  if (!session) {
    const authUrl = new URL("https://auth.hundm.cloud/login")
    authUrl.searchParams.set("callback", req.url)
    return NextResponse.redirect(authUrl)
  }

  if (!session.activeOrgId) {
    return NextResponse.redirect("https://auth.hundm.cloud/select-org")
  }

  const access = await checkAppAccess({
    userId: session.userId,
    orgId: session.activeOrgId,
    appId: "eventhub",
  })

  if (!access.allowed) {
    return NextResponse.redirect(
      access.redirectUrl ?? "https://hundm.cloud/no-access"
    )
  }

  // Forward session info to page via headers
  const response = NextResponse.next()
  response.headers.set("X-User-Id", session.userId)
  response.headers.set("X-Org-Id", session.activeOrgId)
  response.headers.set("X-App-Role", access.appRole ?? "viewer")
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
}
```

---

## 🗄️ Database — tenant isolation

Every model in `prisma/schema.prisma` has a `tenantId`:

```prisma
model Event {
  id        String   @id @default(cuid())
  tenantId  String   // REQUIRED — references identity.organizations.id
  name      String
  startDate DateTime
  // ... other fields

  @@index([tenantId, startDate])
  @@schema("eventhub")
}
```

### Prisma client with tenant middleware

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client"

export const db = new PrismaClient({
  log: ["query", "error", "warn"],
})

// Middleware — enforce tenant_id on every query
db.$use(async (params, next) => {
  const tenantId = getTenantFromContext()  // from request context
  if (!tenantId) {
    throw new Error(`Missing tenantId in query to ${params.model}`)
  }

  // Add tenantId to where clauses
  if (params.action === "findUnique" || params.action === "findFirst") {
    params.args.where = { ...params.args.where, tenantId }
  }
  if (params.action === "findMany") {
    params.args.where = { ...params.args.where, tenantId }
  }
  if (params.action === "create") {
    params.args.data = { ...params.args.data, tenantId }
  }

  return next(params)
})
```

---

## 🎨 UI conventions

- **Language:** All UI strings are **German** (not English).
- **i18n:** Use `messages/de.json` for all user-facing text.
- **Components:** Use Tailwind + shadcn/ui. No custom CSS files unless necessary.
- **Forms:** React Hook Form + Zod validation.
- **Dates:** `date-fns` with German locale.
- **Currency:** `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`.

Example:
```tsx
// ✅ Good
<Button>Veranstaltung erstellen</Button>
<p>{formatCurrency(event.totalCents)}</p>

// ❌ Bad
<Button>Create event</Button>
<p>{event.totalCents / 100}€</p>
```

---

## 🔄 Migration from Supabase — what's changing

If this repo currently uses Supabase:

### Removing

- [ ] `@supabase/supabase-js`
- [ ] `@supabase/auth-helpers-nextjs`
- [ ] `@supabase/auth-ui-react`
- [ ] `createClient` calls
- [ ] Supabase-specific row-level-security (handled by PostgreSQL RLS now)
- [ ] Vercel Blob storage calls

### Adding

- [ ] `@hundm/shared` as dependency
- [ ] `@prisma/client` (if not already using)
- [ ] `prisma` as dev dependency
- [ ] `middleware.ts` with auth + access checks
- [ ] `lib/db.ts` with tenant middleware
- [ ] i18n setup (`next-intl` or similar)

### Environment variables

Remove:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Add:
```
DATABASE_URL=postgresql://...
AUTH_SERVICE_URL=https://auth.hundm.cloud
FILES_SERVICE_URL=https://files.hundm.cloud
AUTH_COOKIE_DOMAIN=.hundm.cloud
```

---

## 🚀 Deployment

- **Platform:** Hetzner CPX32 (`49.12.207.109`)
- **Orchestration:** Coolify
- **Domain:** `eventhub.hundm.cloud`
- **CI/CD:** GitHub Actions → Coolify webhook

### Deployment checklist

1. Code passes lint + type check
2. All tests pass
3. Database migrations applied (Prisma)
4. Environment variables set in Coolify
5. Domain DNS points to Hetzner IP (Cloudflare proxied)
6. SSL certificate active
7. Health check endpoint `/api/health` returns 200

---

## 📋 Common tasks

### Add a new page

1. Create route in `app/(app)/events/page.tsx`
2. Use `getSessionFromHeaders()` helper to get user/org
3. Query uses Prisma client (tenantId auto-injected)
4. Use German UI strings from `messages/de.json`

### Add a new model

1. Add to `prisma/schema.prisma` with `tenantId` field
2. Run `prisma migrate dev --name add_<model>`
3. Ensure RLS policy exists in SQL (`public.apply_tenant_rls('eventhub', '<model>')`)
4. Generate client: `prisma generate`

### Add a feature flag

1. In `billing.features`, add the feature key
2. Update relevant `billing.plans.features` arrays
3. In code: `const hasIt = await hasFeature("eventhub", orgId, "my_feature")`
4. Conditionally render based on `hasIt`

---

## 🐛 When something goes wrong

1. **Check logs** — container logs via Coolify or Dozzle
2. **Check auth service** — is it up? `curl https://auth.hundm.cloud/api/health`
3. **Check database** — `pg_isready` from server
4. **Check session** — inspect cookies in browser DevTools, domain `.hundm.cloud`?
5. **Check RLS** — `SELECT current_setting('app.current_tenant_id');` in psql

---

## 📞 Escalation

- Infrastructure issues → check Uptime Kuma at `uptime.hundm.cloud`
- Auth issues → logs of auth service
- Billing issues → logs of billing service (once live)
- Files issues → MinIO console at `minio-console.hundm.cloud`

---

Last updated: April 2026 · Markus Dietrichs
