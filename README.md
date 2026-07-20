# Meeting Room Booking System — Backend

> **Technical Assessment Submission**
>
> This repository is the backend for the **Meeting Room Booking System** assignment: a small web application that manages bookings for a single shared meeting room, with three roles (`admin`, `owner`, `user`), role-based permissions enforced server-side, overlap-safe booking rules, and administrative user management. Time budget: **3 days**. Frontend lives in a sibling `frontend/` project.

The service is **Express 5 + TypeScript** on **Node.js 22 (ESM)**, backed by **MySQL 8** (via Kysely) and **Redis** (refresh-token store). Users log in by selecting an account (no password) — every write action is gated by fine-grained permissions attached to their role.

---

## Assumptions & Design Decisions

Called out here because the assignment explicitly asks for them.

- **Time handling.** All API times are ISO 8601 with an offset (e.g. `2026-08-01T09:00:00+07:00`). They are parsed into JS `Date` objects and stored as MySQL `DATETIME(3)` (millisecond precision, server-side UTC). Times are always compared as absolute instants — never as local strings.
- **Overlap semantics — half-open intervals `[start, end)`.** `end` is exclusive, so a booking ending at `11:00` does **not** conflict with one starting at `11:00`. **Back-to-back bookings are allowed**; identical, partial, and fully-contained overlaps are rejected. Enforced by a single SQL predicate: `start_time < :newEnd AND end_time > :newStart` (see [`BookingRepository.hasOverlap`](src/repository/mysql/booking.ts)).
- **Auth model.** Roster-based login (pick a seeded user) — no password. On login the backend issues a 15-minute JWT access cookie and a 7-day refresh cookie (tracked in Redis, revocable on refresh/logout). This is intentionally not production-grade, per the spec, but the identity in `req.user.userId` is trusted server-side and every write is gated by a permission code.
- **Deleting a user.** Cascade delete: `bookings.user_id` has `ON DELETE CASCADE` (migration `003`), so removing a user removes all of their bookings in the same transaction. Admins are told this in the confirm dialog on the frontend.
- **Deleting a booking that has started.** `BookingService.delete` refuses to delete a booking currently **in progress** (`start <= now < end` → `409 BOOKING_IN_PROGRESS`) or already **finished** (`end <= now` → `409 BOOKING_DELETE_IN_PAST`), for **any** caller including Admin/Owner. This goes slightly beyond the spec — a design choice to preserve history and avoid mid-meeting deletions.
- **Booking length cap.** Bookings are capped at 6 hours (`BOOKING_RULES.MAX_BOOKING_MS`) to prevent accidental all-day locks. Rejected with `400 TOO_LONG_SESSION`.

---

## Assignment Requirements → Where They Live

| Requirement (from the spec)                                                                   | Where it's implemented                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **NodeJS backend HTTP API**                                                                   | `src/index.ts` (Express 5)                                                                                                               |
| **User** entity `{ id, name, role }`                                                          | `users` table (migration `001`) + `UserRepository`                                                                                       |
| **Booking** entity `{ id, userId, startTime, endTime, createdAt }`                            | `bookings` table (migration `001`) + `BookingRepository`                                                                                 |
| **Three roles** — admin / owner / user                                                        | `roles` table, seeded in migration `001`; users seeded in migration `002`                                                                |
| **startTime < endTime**                                                                       | `BookingService.create` (`INVALID_TIME_RANGE`) **+** DB `CHECK (start_time < end_time)`                                                  |
| **No overlaps** (identical / partial / contained / back-to-back)                              | `BookingRepository.hasOverlap` — half-open interval predicate                                                                            |
| **Clear error responses**                                                                     | `AppError` + `ValidationError` → global `errorMiddleware` → JSON envelope with `error.code`                                              |
| **User can:** create booking / view all / delete own                                          | Permissions `booking.create`, `booking.view`, `booking.delete.own`                                                                       |
| **User cannot:** delete others' / manage users                                                | Enforced in `BookingService.delete` (ownership check) + absence of `user.*` codes on the `user` role                                     |
| **Owner can:** create / view all / delete any / view grouped-by-user / view summary           | `booking.delete.any` + `summary.view`; `/summary` returns aggregate `total` **and** per-user `users[].bookings[]`                        |
| **Owner cannot:** create/delete users / change roles                                          | Absence of `user.create`, `user.delete`, `user.update_role` on `owner`                                                                   |
| **Admin can:** create/delete users, change roles, view all users/bookings, delete any booking | Full permission set on `admin` role (migration `001`)                                                                                    |
| **User management API (admin)**                                                               | `POST /user`, `DELETE /user`, `PUT /user/role`, `GET /user`                                                                              |
| **Booking creation**                                                                          | `POST /booking`                                                                                                                          |
| **Booking deletion with permission rules server-side**                                        | `DELETE /booking` — `permissionMiddleware` + service-level owner-vs-any check                                                            |
| **List bookings / list users**                                                                | `GET /booking` (paginated), `GET /user`                                                                                                  |
| **Summary / aggregation endpoint (owner + admin)**                                            | `GET /summary` — `SummaryService.get`                                                                                                    |
| **All permission checks enforced in the backend**                                             | `authMiddleware` → `permissionMiddleware` → `requirePermission("code")` on every protected route; ownership on delete inside the service |
| **Deleting a user — defined behavior**                                                        | `ON DELETE CASCADE` on `bookings.user_id` (migration `003`) — deletes the user's bookings                                                |

Frontend requirements (role display, booking CRUD UI, admin-only user management, error surfacing) are covered by the sibling `frontend/` Next.js app, which talks to this API.

---

## Tech Stack

| Category        | Technology                                                       |
| --------------- | ---------------------------------------------------------------- |
| **Runtime**     | Node.js 22+ (ESM)                                                |
| **Framework**   | Express 5                                                        |
| **Language**    | TypeScript                                                       |
| **Database**    | MySQL 8 on Aiven (TLS-required) via `mysql2` + **Kysely**        |
| **Migrations**  | Kysely `Migrator` with file-based migration provider             |
| **Cache**       | Redis (via `redis` v5) — refresh-token store                     |
| **Auth**        | JWT (`jsonwebtoken`) access + refresh tokens in httpOnly cookies |
| **Validation**  | Zod v4                                                           |
| **IDs**         | UUID v7 (`uuid`) for user PKs                                    |
| **Dev Tooling** | `tsx` (watch mode), `tsc`                                        |

---

## Architecture

Layered, dependency-injected:

```
routes → middlewares → controllers → services → repositories → db/redis
```

- **`src/routes/*`** — Express routers; attach validation + auth + permission middleware, then delegate to controllers.
- **`src/controller/*`** — Thin HTTP adapters; unpack `req`, call the service, respond with `sendSuccess`, forward errors to `next()`.
- **`src/service/*`** — Business logic and rule enforcement (e.g. booking overlap, own-vs-any delete, role existence checks). Depend on repository interfaces.
- **`src/repository/mysql/*`** — Kysely-typed query wrappers.
- **`src/repository/redis/*`** — Redis-backed stores (refresh-token set per user).
- **`src/dependency-injection/*`** — Singletons wire concrete repositories → services → controllers.
- **`src/middlewares/*`** — `auth` (JWT cookie), `permission` (load codes + `requirePermission(code)` guard), `error` (global handler).
- **`src/validation/*`** — Zod schemas + `ValidateBody` / `ValidateRouteParams` / `ValidateQueryParams` factories.

---

## Access Control Model

Permissions live in the database, mapped to roles through a `role_permissions` join table. The auth pipeline runs in two steps on protected routes:

1. **`authMiddleware`** — verifies the `accessToken` cookie and populates `req.user = { userId }`.
2. **`permissionMiddleware`** — looks up the user's permission codes and populates `req.user.permissions`.
3. **`requirePermission("<code>")`** — 403s if the required code is missing.

Permission codes are centralized in `src/constants/permission.ts` (typed as `PermissionCode`).

### Seeded roles & permissions (migration `001`)

| Role  | Permissions                                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| admin | `booking.create`, `booking.view`, `booking.delete.own`, `booking.delete.any`, `summary.view`, `user.view`, `user.create`, `user.delete`, `user.update_role`, `role.view` |
| owner | `booking.create`, `booking.view`, `booking.delete.own`, `booking.delete.any`, `summary.view`, `user.view`, `role.view`                                                   |
| user  | `booking.create`, `booking.view`, `booking.delete.own`                                                                                                                   |

## API

Base URL: `http://localhost:8000` (the port comes from `PORT` in `.env`).

All bodies are JSON. Auth cookies (`accessToken`, `refreshToken`) are `httpOnly`, `sameSite=strict`, and `secure` in production.

### Auth (`/auth`)

None of these require a permission code. Access-token auth (`authMiddleware`) is only enforced on `GET /auth/me`; the rest are either public or cookie-based.

| Method | Path                  | Body / Cookie              | Description                                                   |
| ------ | --------------------- | -------------------------- | ------------------------------------------------------------- |
| GET    | `/auth/login/roster`  | —                          | List selectable users (`id`, `name`, role `label`)            |
| POST   | `/auth/login`         | `{ id }`                   | Log in as the given user id (UUID); sets auth cookies         |
| POST   | `/auth/login/refresh` | cookie `refreshToken`      | Rotate access + refresh tokens                                |
| POST   | `/auth/logout`        | cookie `refreshToken`      | Revoke the refresh token in Redis and clear both auth cookies |
| GET    | `/auth/me`            | — (requires access cookie) | Return the current user (`id`, `name`, role `label`)          |

Tokens: access token = 15 min, refresh token = 7 days (also tracked in Redis under `refresh_tokens:<userId>` for revocation on refresh/logout).

### Bookings (`/booking`) — requires auth

| Method | Path       | Permission                                      | Body / Query                   | Description                                               |
| ------ | ---------- | ----------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| GET    | `/booking` | `booking.view`                                  | query: `page?`, `limit?`       | Paginated list of bookings (joined with user name)        |
| POST   | `/booking` | `booking.create`                                | `{ startTime, endTime }` (ISO) | Create a booking (`userId` is taken from the auth cookie) |
| DELETE | `/booking` | own booking, or `booking.delete.any` for others | `{ id }`                       | Delete a booking (ownership checked in service)           |

Business rules (enforced in `BookingService`):

**Create**

- Times are ISO 8601 with offset (e.g. `2026-08-01T09:00:00+07:00`).
- `startTime` must not be in the past (else `400 BOOKING_IN_PAST`).
- `startTime` must be strictly before `endTime` (else `400 INVALID_TIME_RANGE`).
- No time-range overlap with any existing booking (else `409 BOOKING_TIME_CONFLICT`).

**Delete**

- A booking that is currently in progress (`startTime <= now < endTime`) cannot be deleted — by anyone, including holders of `booking.delete.any` (else `409 BOOKING_IN_PROGRESS`).
- Otherwise the owner may always delete their own; any other user needs `booking.delete.any` (else `403 FORBIDDEN`).

### Users (`/user`) — requires auth

| Method | Path         | Permission         | Body                 | Description                                             |
| ------ | ------------ | ------------------ | -------------------- | ------------------------------------------------------- |
| GET    | `/user`      | `user.view`        | —                    | List all users (with role name + label)                 |
| POST   | `/user`      | `user.create`      | `{ name, roleId }`   | Create a user (id = UUIDv7). Validates `roleId` exists. |
| DELETE | `/user`      | `user.delete`      | `{ id }` (UUID)      | Delete a user by id                                     |
| PUT    | `/user/role` | `user.update_role` | `{ userId, roleId }` | Change a user's role. Validates both ids.               |

### Roles (`/role`) — requires auth

| Method | Path    | Permission  | Description    |
| ------ | ------- | ----------- | -------------- |
| GET    | `/role` | `role.view` | List all roles |

### Summary (`/summary`) — requires auth

| Method | Path       | Permission     | Description                                         |
| ------ | ---------- | -------------- | --------------------------------------------------- |
| GET    | `/summary` | `summary.view` | Aggregated usage stats + per-user booking breakdown |

**Response shape** (`data`):

- `total`
  - `totalBookings` — every booking on the system
  - `totalPastBookings` — bookings where `endTime <= now`
  - `totalCurrentBookings` — in progress: `startTime <= now < endTime`
  - `totalUpcomingBookings` — `now < startTime`
  - `activeUsers` — number of users with ≥ 1 booking
  - `totalBookedMinutes` — sum of every booking's duration in minutes
- `users[]` — sorted by `bookingCount` desc. Each entry:
  - `userId`, `name`, `roleName`
  - `bookingCount`, `bookedMinutes`
  - `bookings[]` — each with `id`, `startTime`, `endTime` (ISO 8601, UTC), `durationMinutes`

The three counters (`totalPastBookings` + `totalCurrentBookings` + `totalUpcomingBookings`) always sum to `totalBookings`.

Example:

```json
{
  "success": true,
  "data": {
    "total": {
      "totalBookings": 12,
      "totalPastBookings": 7,
      "totalCurrentBookings": 1,
      "totalUpcomingBookings": 4,
      "activeUsers": 3,
      "totalBookedMinutes": 720
    },
    "users": [
      {
        "userId": "0192...uuid",
        "name": "U Kyaw",
        "roleName": "admin",
        "bookingCount": 5,
        "bookedMinutes": 300,
        "bookings": [
          {
            "id": 42,
            "startTime": "2026-07-19T09:00:00.000Z",
            "endTime": "2026-07-19T10:00:00.000Z",
            "durationMinutes": 60
          }
        ]
      }
    ]
  }
}
```

---

## Response Shape

Produced by `sendSuccess` / `sendError` in `src/utils/helper.ts`.

**Success**

```json
{ "success": true, "data": {}, "message": "optional" }
```

**Error**

```json
{
  "success": false,
  "message": "human-readable message",
  "error": { "code": "FORBIDDEN" }
}
```

**Validation error** — `error` also includes `fieldErrors`:

```json
{
  "success": false,
  "message": "validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "fieldErrors": [{ "field": "roleId", "message": "..." }]
  }
}
```

`error.code` values (see `src/types/response.ts`): `VALIDATION_ERROR`, `DUPLICATE_ENTRY`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`.

The global error middleware (`src/middlewares/error.ts`) maps:

- MySQL errors (`ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_DATA_TOO_LONG`, `ECONNREFUSED`, …) → appropriate HTTP status + `ErrorCode`.
- `jwt.JsonWebTokenError` / `TokenExpiredError` → 401 `UNAUTHORIZED`.
- `ValidationError` → `error.statusCode` + `VALIDATION_ERROR` + `fieldErrors`.
- `AppError` → `error.statusCode` + `BAD_REQUEST`.
- Anything else → 500 `INTERNAL_ERROR`.

---

## Project Structure

```
backend/
├── certs/
│   └── ca.pem                  # DB CA cert (not committed; see setup)
├── src/
│   ├── config/
│   │   ├── index.ts            # Loads .env → CONFIGS (JWT + DB_* + NODE_ENV + PORT)
│   │   ├── pool.ts             # mysql2 pool factory (TLS, reads certs/ca.pem)
│   │   ├── database.ts         # Kysely instance wrapping the mysql2 pool
│   │   └── redis.ts            # Redis client singleton
│   ├── constants/
│   │   ├── message.ts          # SuccessMessage / ErrorMessage
│   │   └── permission.ts       # Permission code constants + PermissionCode type
│   ├── controller/
│   │   ├── auth.ts             # getRoster, login, refresh, logout, me
│   │   ├── booking.ts          # getAll, create, delete
│   │   ├── user.ts             # getAll, create, delete, updateRole
│   │   ├── role.ts             # getAll
│   │   └── summary.ts          # get
│   ├── database/
│   │   ├── migrator.ts         # Migration CLI (up, down, latest, baseline, create)
│   │   └── migrations/
│   │       ├── 2026_07_18_001_initial_schema.ts        # Schema + roles/permissions seed
│   │       ├── 2026_07_18_002_add_user_data.ts         # UNIQUE(users.name) + user seed
│   │       └── 2026_07_19_003_add_bookings_user_fk.ts  # FK bookings.user_id → users.id ON DELETE CASCADE
│   ├── dependency-injection/
│   │   ├── repositories.ts     # Repository singletons
│   │   ├── services.ts         # Service singletons (wire repos)
│   │   └── controllers.ts      # Controller singletons (wire services)
│   ├── middlewares/
│   │   ├── auth.ts             # JWT auth (accessToken cookie → req.user)
│   │   ├── permission.ts       # permissionMiddleware + requirePermission(code)
│   │   └── error.ts            # Global error handler (MySQL, Zod, JWT, AppError)
│   ├── repository/
│   │   ├── mysql/
│   │   │   ├── user.ts         # UserRepository (+ role join view)
│   │   │   ├── booking.ts      # BookingRepository (+ user join, overlap query)
│   │   │   ├── role.ts         # RoleRepository
│   │   │   └── permission.ts   # Codes by role / by user id
│   │   └── redis/
│   │       └── refresh-token.ts# Refresh-token set (7-day TTL, per user)
│   ├── routes/
│   │   ├── auth.ts             # /auth/login/roster, /auth/login, /auth/login/refresh, /auth/logout, /auth/me
│   │   ├── booking.ts          # /booking (GET, POST, DELETE)
│   │   ├── user.ts             # /user (GET, POST, DELETE) + PUT /user/role
│   │   ├── role.ts             # /role (GET)
│   │   └── summary.ts          # /summary (GET)
│   ├── service/
│   │   ├── auth/               # AuthService — getRoster, login, refresh, logout, me
│   │   ├── booking/            # BookingService — getAll, create, delete (RBAC + past/in-progress rules)
│   │   ├── user/               # UserService — create, delete, getAll, changeRole
│   │   ├── role/               # RoleService — getAll
│   │   └── summary/            # SummaryService — get (aggregated stats + per-user breakdown)
│   ├── types/
│   │   ├── AppError.ts         # Base error (statusCode + optional code)
│   │   ├── valideError.ts      # ValidationError (extends AppError, +fieldErrors)
│   │   ├── AuthedUser.ts       # { userId, permissions? }
│   │   ├── JwtPayload.ts       # UserPayload (extends jsonwebtoken.JwtPayload)
│   │   ├── response.ts         # Response types + ErrorCode enum
│   │   ├── express.d.ts        # Express Request augmentation (user, validateQuery)
│   │   └── index.ts            # Kysely DB type definitions
│   ├── utils/
│   │   └── helper.ts           # sendSuccess, sendError, setAuthCookies, clearAuthCookies
│   ├── validation/
│   │   ├── index.ts            # Zod middleware factories (Body/Params/Query)
│   │   ├── auth/               # login schema
│   │   ├── booking/            # create / delete schemas
│   │   └── user/               # create / delete / change-role schemas
│   └── index.ts                # Server entry — mounts routers, starts server, graceful shutdown
├── .env                        # Local env (gitignored)
├── package.json
├── tsconfig.json
└── start.sh                    # build + redis-server + dev in one shell
```

---

## Database Schema

```
roles ──< role_permissions >── permissions
  │
  └──< users ──< bookings
```

- **roles** — `id` (auto-increment), `name` (UNIQUE, varchar 50), `label` (varchar 100)
- **permissions** — `id` (auto-increment), `code` (UNIQUE, varchar 100), `description` (varchar 255, nullable)
- **role_permissions** — `role_id`, `permission_id`; composite PK; `ON DELETE CASCADE` on both FKs
- **users** — `id` (char(36) PK, UUIDv7 in seeds), `name` (varchar 255, **UNIQUE** — added in migration `002`), `role_id` (FK → roles)
- **bookings** — `id` (auto-increment), `user_id` (FK → users, `ON DELETE CASCADE`), `start_time` (`datetime(3)`), `end_time` (`datetime(3)`), `created_at` (`datetime(3)` DEFAULT `CURRENT_TIMESTAMP(3)`); `CHECK (start_time < end_time)`; index on `(start_time, end_time)`

Kysely bookkeeping tables `kysely_migration` and `kysely_migration_lock` are also created on first run.

---

## Getting Started

### Prerequisites

- **Node.js >= 22** (project targets `@tsconfig/node22`)
- **Redis** installed locally — `start.sh` runs `redis-server` on the default port (`6379`) with no auth
- **A TLS-enabled MySQL 8** — configured for **Aiven MySQL** out of the box; any TLS MySQL works if you supply the corresponding CA cert
- **`mysql` CLI** (optional, for inspecting data — see below)

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

At `backend/.env`:

```
NODE_ENV=development
PORT=8000
JWT_SECRET_KEY=<random 32+ byte hex>

DB_HOST=<your-mysql-host>
DB_PORT=<your-mysql-port>
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_NAME=<your-mysql-database>
```

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Provide the CA certificate

`src/config/pool.ts` reads the CA at `backend/certs/ca.pem` and connects with `rejectUnauthorized: true`. Place your provider's CA there.

For Aiven MySQL: **Console → your MySQL service → Overview → Connection information → CA certificate → Download**, then save as `backend/certs/ca.pem`.

The CA cert is public and safe to commit; the `.env` (which holds credentials) is already gitignored.

### 4. Run migrations

```bash
npm run migrate:latest             # apply all pending migrations
npm run migrate:down               # roll back the last one
npm run migrate:create -- <name>   # scaffold a new migration file
```

### 5. Start the server

```bash
./start.sh                   # build + redis-server + dev with hot reload
# or
npm run dev                  # dev only (assumes Redis is already up)
npm run start:prod           # tsc build + node dist/index.js
```

The server listens on the port from `PORT` (default in the example `.env`: **8000**) and expects a browser client at `http://localhost:5173` (CORS with `credentials: true`).

---

## Inspecting Data

The Aiven console has no data browser. Use the `mysql` CLI from the `backend/` directory:

```bash
mysql --host="$DB_HOST" --port="$DB_PORT" \
      --user="$DB_USER" --password="$DB_PASSWORD" \
      --ssl-mode=REQUIRED "$DB_NAME"
```

For full server-certificate verification:

```bash
mysql --host="$DB_HOST" --port="$DB_PORT" \
      --user="$DB_USER" --password="$DB_PASSWORD" \
      --ssl-mode=VERIFY_CA --ssl-ca=certs/ca.pem "$DB_NAME"
```

Quick sanity check once migrations have run:

```sql
SHOW TABLES;
SELECT u.id, u.name, r.name AS role
FROM users u JOIN roles r ON r.id = u.role_id
ORDER BY u.name;
```

---

## NPM Scripts

| Script                     | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `npm run dev`              | Start server with hot reload (`tsx --watch src/index.ts`)     |
| `npm run start:dev`        | Alias of `dev`                                                |
| `npm run build`            | Compile TypeScript to `dist/`                                 |
| `npm start`                | Run compiled server from `dist/`                              |
| `npm run start:prod`       | Build + start in production                                   |
| `npm run migrate:latest`   | Apply all pending migrations                                  |
| `npm run migrate:up`       | Apply the next pending migration                              |
| `npm run migrate:down`     | Roll back the last migration                                  |
| `npm run migrate:baseline` | Mark the initial migration as already applied                 |
| `npm run migrate:create`   | Scaffold a new migration — `npm run migrate:create -- <name>` |
