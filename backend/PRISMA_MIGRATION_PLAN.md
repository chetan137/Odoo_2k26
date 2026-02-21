# 🔒 Prisma ORM Migration Plan — Production-Safe

> **Project:** ODOO_HACK2 Auth Backend
> **Date:** 2026-02-21
> **Author:** Backend Architect
> **Status:** Implementation-Ready
> **Risk Level:** LOW (narrow migration surface)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Migration Surface Analysis](#2-migration-surface-analysis)
3. [Safe Migration Strategy](#3-safe-migration-strategy)
4. [Schema.prisma — Exact Match](#4-schemaprisma--exact-match)
5. [Drift Detection Handling Plan](#5-drift-detection-handling-plan)
6. [Zero-Downtime Migration Approach](#6-zero-downtime-migration-approach)
7. [Branch-Based Git Workflow](#7-branch-based-git-workflow)
8. [Step-by-Step Testing Checklist](#8-step-by-step-testing-checklist)
9. [Error Handling Middleware](#9-error-handling-middleware)
10. [Production-Grade Folder Structure](#10-production-grade-folder-structure)
11. [Risk Analysis](#11-risk-analysis)
12. [Abort Criteria](#12-abort-criteria)
13. [Rollback Strategy](#13-rollback-strategy)

---

## 1. Executive Summary

This migration replaces the raw `pg` database driver with **Prisma ORM** while preserving:
- ✅ All authentication logic (signup, login, logout, JWT)
- ✅ All forgot/reset password logic
- ✅ Brevo email integration (no DB dependency)
- ✅ Existing `users` table structure
- ✅ All existing data
- ✅ Railway PostgreSQL compatibility
- ✅ SSL configuration

**Migration Surface:** Only **4 files** need modification. No controller logic, middleware logic, routes, or business logic changes.

### Files Modified
| File | Change Type | Risk |
|---|---|---|
| `models/userModel.js` | Replace `pg` queries → Prisma client calls | LOW |
| `config/db.js` | Replace `pg` Pool → Prisma client singleton | LOW |
| `config/initDB.js` | Replace raw SQL init → Prisma connection test | LOW |
| `server.js` | Update init call | MINIMAL |

### Files NOT Modified (Zero Touch)
| File | Reason |
|---|---|
| `controllers/authController.js` | Consumes `UserModel` interface — unchanged |
| `middleware/authMiddleware.js` | Consumes `UserModel.findById` — unchanged |
| `middleware/validationMiddleware.js` | No DB dependency |
| `routes/authRoutes.js` | No DB dependency |
| `utils/emailService.js` | No DB dependency |
| `utils/jwtHelper.js` | No DB dependency |
| `utils/passwordValidator.js` | No DB dependency |

---

## 2. Migration Surface Analysis

### Current Data Flow
```
Controller → UserModel.method() → pool.query(SQL) → PostgreSQL
```

### Target Data Flow
```
Controller → UserModel.method() → prisma.user.method() → PostgreSQL
```

### UserModel Method Mapping

| Method | Current (pg) | Target (Prisma) |
|---|---|---|
| `findByEmail(email)` | `SELECT * FROM users WHERE email = $1` | `prisma.user.findUnique({ where: { email } })` |
| `findById(id)` | `SELECT id, name, email, is_verified, created_at FROM users WHERE id = $1` | `prisma.user.findUnique({ where: { id }, select: {...} })` |
| `create({name, email, hashedPassword})` | `INSERT INTO users (...) VALUES (...) RETURNING ...` | `prisma.user.create({ data: {...}, select: {...} })` |
| `saveResetToken(email, token, expiry)` | `UPDATE users SET reset_token = ... WHERE email = ...` | `prisma.user.update({ where: { email }, data: {...} })` |
| `findByResetToken(token)` | `SELECT * FROM users WHERE reset_token = $1 AND ... > NOW()` | `prisma.user.findFirst({ where: { reset_token, reset_token_expiry: { gt: new Date() } } })` |
| `updatePassword(userId, hashedPassword)` | `UPDATE users SET password = ... WHERE id = ...` | `prisma.user.update({ where: { id }, data: {...} })` |

### Return Value Compatibility Matrix

| Method | Current Returns | Prisma Returns | Compatible? |
|---|---|---|---|
| `findByEmail` | Full user row or `null` | Full user object or `null` | ✅ YES |
| `findById` | `{id, name, email, is_verified, created_at}` or `null` | Same via `select` or `null` | ✅ YES |
| `create` | `{id, name, email, is_verified, created_at}` | Same via `select` | ✅ YES |
| `saveResetToken` | `{id}` or `null` | Full updated object | ✅ YES (superset) |
| `findByResetToken` | Full user row or `null` | Full user object or `null` | ✅ YES |
| `updatePassword` | `{id, name, email}` or `null` | Same via `select` | ✅ YES |

**CRITICAL:** Prisma uses `null` for not-found on `findUnique` — identical to current `result.rows[0] || null` pattern. No behavioral change.

---

## 3. Safe Migration Strategy

### Phase 1: Preparation (No Code Changes)
1. Create `feature/prisma-migration` branch
2. Back up Railway database
3. Document current table schema from live DB
4. Install Prisma dependencies

### Phase 2: Schema Introspection (Read-Only)
1. Run `npx prisma db pull` to introspect existing schema
2. Validate generated `schema.prisma` matches `initDB.js` definition
3. Run `npx prisma validate` to confirm schema validity
4. Generate Prisma client

### Phase 3: Code Swap (Interface-Preserving)
1. Create `config/prismaClient.js` (new Prisma singleton)
2. Rewrite `models/userModel.js` to use Prisma (same interface)
3. Update `config/initDB.js` to use Prisma connection test
4. Update `server.js` startup sequence
5. Keep `config/db.js` as backup (rename to `config/db.pg.backup.js`)

### Phase 4: Validation
1. Run all auth flows manually
2. Compare query results
3. Verify cookie/token behavior
4. Test error scenarios

### Phase 5: Cleanup (Post-Verification Only)
1. Remove `pg` dependency from `package.json`
2. Delete backup files
3. Merge to main

---

## 4. Schema.prisma — Exact Match

The schema below exactly mirrors the existing `users` table defined in `config/initDB.js`:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 Int       @id @default(autoincrement())
  name               String    @db.VarChar(100)
  email              String    @unique @db.VarChar(255)
  password           String    @db.VarChar(255)
  is_verified        Boolean   @default(false)
  reset_token        String?   @db.VarChar(255)
  reset_token_expiry DateTime? @db.Timestamptz
  created_at         DateTime  @default(now()) @db.Timestamptz
  updated_at         DateTime  @default(now()) @updatedAt @db.Timestamptz

  @@map("users")
}
```

### Schema Design Decisions

| Decision | Rationale |
|---|---|
| `@@map("users")` | Maps to existing lowercase table name |
| `@db.VarChar(100/255)` | Exact match to existing column constraints |
| `@db.Timestamptz` | Exact match to `TIMESTAMPTZ` column type |
| `@default(autoincrement())` | Maps to `SERIAL PRIMARY KEY` |
| `@default(false)` | Maps to `DEFAULT FALSE` |
| `@default(now())` | Maps to `DEFAULT NOW()` |
| `String?` (nullable) | `reset_token` and `reset_token_expiry` are nullable |
| `@updatedAt` | Auto-manages `updated_at` timestamp — matches `NOW()` in updates |

---

## 5. Drift Detection Handling Plan

### What is Schema Drift?
Drift occurs when the live database schema doesn't match `schema.prisma`. Since your table was created manually (not via Prisma migrations), drift **will** be detected.

### Strategy: Baseline Migration

```bash
# Step 1: Introspect existing schema
npx prisma db pull

# Step 2: Create migration directory WITHOUT applying
mkdir -p prisma/migrations/0_init

# Step 3: Generate SQL for the baseline
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql

# Step 4: Mark this migration as already applied (crucial!)
npx prisma migrate resolve --applied 0_init
```

### Why This Works
- `migrate resolve --applied` tells Prisma: "This migration is already in the database, don't run it again"
- Future migrations will be applied normally from this baseline
- No data loss, no table recreation

### Drift Verification Command
```bash
# Check for drift at any time
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "$DATABASE_URL" --exit-code
# Exit code 0 = no drift, Exit code 2 = drift detected
```

---

## 6. Zero-Downtime Migration Approach

### Principle: Interface-Level Swap
Since `UserModel` is the **only** interface consumed by the rest of the app, we can swap the implementation without touching any consumers.

### Step-by-Step
```
1. Deploy Prisma schema + client generation (no runtime impact)
2. Swap userModel.js implementation (same exports, same signatures)
3. Swap initDB.js to Prisma connection test
4. Restart server

Total downtime: Server restart time only (~2-5 seconds on Railway)
```

### Railway-Specific Notes
- Railway auto-deploys on push to main branch
- Railway supports `npx prisma generate` in build step
- Add to `package.json` scripts:
  ```json
  "build": "npx prisma generate"
  ```
- Railway uses the `build` script automatically before `start`

---

## 7. Branch-Based Git Workflow

```
main (stable, current pg-based code)
  │
  └─── feature/prisma-migration
         │
         ├── Commit 1: "chore: install prisma dependencies"
         │   - package.json changes only
         │
         ├── Commit 2: "chore: add schema.prisma with baseline"
         │   - prisma/schema.prisma
         │   - prisma/migrations/0_init/migration.sql
         │
         ├── Commit 3: "feat: add prisma client singleton"
         │   - config/prismaClient.js
         │
         ├── Commit 4: "refactor: swap userModel to prisma"
         │   - models/userModel.js
         │   - config/db.js → config/db.pg.backup.js
         │
         ├── Commit 5: "refactor: update initDB for prisma"
         │   - config/initDB.js
         │   - server.js
         │
         ├── Commit 6: "chore: add prisma error middleware"
         │   - middleware/prismaErrorHandler.js
         │
         ├── Commit 7: "test: verify all auth flows"
         │   - Manual testing results documented
         │
         └── Commit 8: "chore: cleanup pg dependency"
              - Remove pg from package.json
              - Delete backup files
              - PR → main
```

### Merge Rules
- ❌ No force push to `feature/prisma-migration`
- ❌ No squash merge (preserve atomic commits for rollback)
- ✅ Use regular merge to main
- ✅ Each commit must pass manual testing before next

---

## 8. Step-by-Step Testing Checklist

### Pre-Migration Tests (Baseline)
- [ ] `POST /api/auth/signup` — creates new user, returns JWT + cookie
- [ ] `POST /api/auth/login` — authenticates, returns JWT + cookie
- [ ] `GET /api/auth/me` — returns user data with valid token
- [ ] `POST /api/auth/logout` — clears cookie
- [ ] `POST /api/auth/forgot-password` — sends email (verify in Brevo dashboard)
- [ ] `POST /api/auth/reset-password` — resets password with valid token
- [ ] `POST /api/auth/login` — login with new password works
- [ ] `GET /api/health` — returns 200
- [ ] Verify existing users table has data
- [ ] Record row count: `SELECT COUNT(*) FROM users;`

### Post-Migration Tests (Must Match Baseline Exactly)
- [ ] `POST /api/auth/signup` — same response shape, user created in DB
- [ ] `POST /api/auth/login` — same response shape, JWT valid
- [ ] `GET /api/auth/me` — same user data fields returned
- [ ] `POST /api/auth/logout` — cookie cleared
- [ ] `POST /api/auth/forgot-password` — email sent (check Brevo)
- [ ] `POST /api/auth/reset-password` — password reset successful
- [ ] `POST /api/auth/login` — login with reset password works
- [ ] `GET /api/health` — returns 200
- [ ] Row count unchanged: `SELECT COUNT(*) FROM users;`
- [ ] Error: signup with duplicate email → 409 response
- [ ] Error: login with wrong password → 401 response
- [ ] Error: login with non-existent email → 404 response
- [ ] Error: reset with expired token → 400 response
- [ ] Error: access /me without token → 401 response
- [ ] Rate limiting still works on /api/auth routes

### Database Verification
- [ ] `npx prisma studio` — opens and shows all users
- [ ] No new tables created (only `users` + `_prisma_migrations`)
- [ ] All column types match original schema
- [ ] Existing data intact and queryable

---

## 9. Error Handling Middleware

Prisma throws specific error types that differ from `pg` errors. A dedicated middleware translates these into the same HTTP response format your app already uses.

### Key Prisma Error Codes
| Code | Meaning | HTTP Status |
|---|---|---|
| `P2002` | Unique constraint violation | 409 Conflict |
| `P2025` | Record not found | 404 Not Found |
| `P2003` | Foreign key constraint failure | 400 Bad Request |
| `P2024` | Connection pool timeout | 503 Service Unavailable |

See implementation in `middleware/prismaErrorHandler.js`.

---

## 10. Production-Grade Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma              ← Schema definition
│   └── migrations/
│       └── 0_init/
│           └── migration.sql      ← Baseline migration
├── config/
│   ├── prismaClient.js            ← NEW: Prisma singleton
│   ├── initDB.js                  ← MODIFIED: Prisma connection test
│   └── db.pg.backup.js            ← RENAMED: old pg pool (temporary)
├── models/
│   └── userModel.js               ← MODIFIED: Prisma queries
├── middleware/
│   ├── authMiddleware.js           ← UNCHANGED
│   ├── validationMiddleware.js     ← UNCHANGED
│   └── prismaErrorHandler.js      ← NEW: Prisma error translation
├── controllers/
│   └── authController.js          ← UNCHANGED
├── routes/
│   └── authRoutes.js              ← UNCHANGED
├── utils/
│   ├── emailService.js            ← UNCHANGED
│   ├── jwtHelper.js               ← UNCHANGED
│   └── passwordValidator.js       ← UNCHANGED
├── server.js                      ← MODIFIED: startup sequence
├── package.json                   ← MODIFIED: dependencies
├── .env                           ← UNCHANGED (DATABASE_URL already exists)
└── .gitignore                     ← MODIFIED: add prisma engine files
```

---

## 11. Risk Analysis

### Risk Matrix

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Schema drift during introspection | MEDIUM | LOW | Validate introspected schema against `initDB.js` manually |
| 2 | Prisma `@updatedAt` behavior differs from `NOW()` | LOW | LOW | `@updatedAt` uses app-level timestamp — functionally equivalent |
| 3 | SSL connection failure with Prisma | LOW | HIGH | Railway DATABASE_URL includes SSL params; add `?sslmode=require` if needed |
| 4 | `findByResetToken` time comparison differs | LOW | MEDIUM | Prisma `{ gt: new Date() }` is equivalent to SQL `> NOW()` |
| 5 | Return value shape mismatch | LOW | HIGH | Prisma returns plain objects — same as `result.rows[0]` |
| 6 | Connection pool exhaustion | LOW | HIGH | Prisma client singleton pattern prevents multiple instances |
| 7 | `pg` removal breaks other code | VERY LOW | HIGH | `grep -r "require.*pg"` confirms only `db.js` imports `pg` |
| 8 | Data loss during migration | NONE | CRITICAL | We never run destructive migrations — baseline only |
| 9 | Prisma generate fails on Railway | LOW | HIGH | Add `"build": "npx prisma generate"` to package.json |
| 10 | `null` vs `undefined` for not-found | LOW | MEDIUM | Prisma `findUnique` returns `null` — matches current `|| null` pattern |

### Dependency Risk
- **Prisma** is MIT-licensed, actively maintained, 35k+ GitHub stars
- **@prisma/client** is auto-generated, version-locked to schema
- **No additional runtime dependencies** beyond `@prisma/client`

---

## 12. Abort Criteria

### 🛑 STOP MIGRATION IMMEDIATELY IF:

1. **`npx prisma db pull` generates a schema that doesn't match the `initDB.js` definition**
   - This means the live database has drifted from what `initDB.js` defines
   - Resolution: Manually inspect and reconcile before proceeding

2. **`npx prisma migrate resolve --applied 0_init` fails**
   - This means Prisma cannot recognize the existing table as the baseline
   - Resolution: Check `_prisma_migrations` table, may need manual cleanup

3. **Any existing user data is lost or corrupted during testing**
   - Resolution: Restore from backup, abort migration entirely

4. **Post-migration auth flow tests fail on ANY endpoint**
   - Resolution: Revert to `db.pg.backup.js`, re-deploy `main` branch

5. **SSL/Connection errors that don't resolve with `?sslmode=require`**
   - Resolution: Keep `pg` driver, investigate Railway-specific Prisma config

6. **Response body shapes differ between pg and Prisma implementations**
   - Resolution: Debug select/return clauses; if unfixable, abort

7. **Build/deploy fails on Railway after adding Prisma**
   - Resolution: Check Railway build logs, ensure `prisma generate` runs in build

### ✅ PROCEED IF:
- Schema introspection matches 100%
- Baseline migration resolved successfully
- All 6 UserModel methods return identical data shapes
- All auth endpoints pass testing checklist
- No new tables created (except `_prisma_migrations`)
- Existing data row count unchanged

---

## 13. Rollback Strategy

### Instant Rollback (< 1 minute)
Since we preserve the original `db.js` as `db.pg.backup.js`:

```bash
# Revert model to pg-based version
git checkout main -- models/userModel.js config/db.js config/initDB.js server.js

# Restart
npm start
```

### Git-Based Rollback
```bash
# If on feature branch, simply switch back
git checkout main

# If already merged, revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Railway Rollback
- Railway keeps deployment history
- One-click rollback to previous deployment in Railway dashboard

### Data Safety
- Prisma never deletes or modifies the `users` table structure
- The `_prisma_migrations` table is metadata-only, safe to keep or drop
- `DROP TABLE IF EXISTS _prisma_migrations;` is safe post-rollback

---
