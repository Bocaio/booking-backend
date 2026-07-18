# Booking App — Server

A backend for a **room/resource booking platform** with **role-based access control (RBAC)**, built with **Express 5**, **TypeScript**, **MySQL** (Aiven, TLS), and **Redis**. Users log in by selecting an account (no password); every write action is gated by fine-grained permissions attached to their role.

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

### Seeded users (migration `002`)

Each name is unique (`UNIQUE` constraint added to `users.name` in the same migration). IDs are UUIDv7 generated at migration time.

| Name        | Role    |
| ----------- | ------- |
| `U Kyaw`    | `admin` |
| `Aung Aung` | `owner` |
| `Zaw Zaw`   | `user`  |
| `Tun Tun`   | `user`  |

---

## API

Base URL: `http://localhost:8000` (the port comes from `PORT` in `.env`).

All bodies are JSON. Auth cookies (`accessToken`, `refreshToken`) are `httpOnly`, `sameSite=strict`, and `secure` in production.

### Auth (`/auth`) — no permission required

| Method | Path                  | Body      | Description                                            |
| ------ | --------------------- | --------- | ------------------------------------------------------ |
| GET    | `/auth/login/roster`  | —         | List selectable users (`id`, `name`, role `label`)     |
| POST   | `/auth/login`         | `{ id }`  | Log in as the given user id (UUID); sets auth cookies  |
| POST   | `/auth/login/refresh` | — (cookie)| Rotate access + refresh tokens                         |

Tokens: access token = 15 min, refresh token = 7 days (also tracked in Redis under `refresh_tokens:<userId>` for revocation on refresh).

### Bookings (`/booking`) — requires auth

| Method | Path        | Permission                                        | Body                        | Description                                          |
| ------ | ----------- | ------------------------------------------------- | --------------------------- | ---------------------------------------------------- |
| GET    | `/booking`  | `booking.view`                                    | —                           | List all bookings (joined with user name)            |
| POST   | `/booking`  | `booking.create`                                  | `{ start_time, end_time }`  | Create a booking (ISO 8601 w/ offset, `start < end`) |
| DELETE | `/booking`  | own booking, or `booking.delete.any` for others   | `{ id }`                    | Delete a booking (ownership checked in service)      |

Business rules (enforced in `BookingService`):

- `start_time` must be strictly before `end_time` (else `400 INVALID_TIME_RANGE`).
- No time-range overlap with any existing booking (else `409 BOOKING_TIME_CONFLICT`).
- On delete: the owner can always delete their own; anyone else needs `booking.delete.any` (else `403 FORBIDDEN`).

### Users (`/user`) — requires auth

| Method | Path         | Permission          | Body                     | Description                                              |
| ------ | ------------ | ------------------- | ------------------------ | -------------------------------------------------------- |
| GET    | `/user`      | `user.view`         | —                        | List all users (with role name + label)                  |
| POST   | `/user`      | `user.create`       | `{ name, role_id }`      | Create a user (id = UUIDv7). Validates `role_id` exists. |
| DELETE | `/user`      | `user.delete`       | `{ id }` (UUID)          | Delete a user by id                                      |
| PUT    | `/user/role` | `user.update_role`  | `{ user_id, role_id }`   | Change a user's role. Validates both ids.                |

### Roles (`/role`) — requires auth

| Method | Path    | Permission  | Description    |
| ------ | ------- | ----------- | -------------- |
| GET    | `/role` | `role.view` | List all roles |

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
    "fieldErrors": [{ "field": "role_id", "message": "..." }]
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
│   │   ├── auth.ts             # getRoster, login, refresh
│   │   ├── booking.ts          # getAll, create, delete
│   │   ├── user.ts             # getAll, create, delete, updateRole
│   │   └── role.ts             # getAll
│   ├── database/
│   │   ├── migrator.ts         # Migration CLI (up, down, latest, baseline, create)
│   │   └── migrations/
│   │       ├── 2026_07_18_001_initial_schema.ts   # Schema + roles/permissions seed
│   │       └── 2026_07_18_002_add_user_data.ts    # UNIQUE(users.name) + user seed
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
│   │   ├── auth.ts             # /auth/login/roster, /auth/login, /auth/login/refresh
│   │   ├── booking.ts          # /booking (GET, POST, DELETE)
│   │   ├── user.ts             # /user (GET, POST, DELETE) + PUT /user/role
│   │   └── role.ts             # /role (GET)
│   ├── service/
│   │   ├── auth/               # AuthService — getRoster, login, refresh
│   │   ├── booking/            # BookingService — getAll, create, delete (RBAC)
│   │   ├── user/               # UserService — create, delete, getAll, changeRole
│   │   └── role/               # RoleService — getAll
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

| Script                     | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `npm run dev`              | Start server with hot reload (`tsx --watch src/index.ts`)      |
| `npm run start:dev`        | Alias of `dev`                                                 |
| `npm run build`            | Compile TypeScript to `dist/`                                  |
| `npm start`                | Run compiled server from `dist/`                               |
| `npm run start:prod`       | Build + start in production                                    |
| `npm run migrate:latest`   | Apply all pending migrations                                   |
| `npm run migrate:up`       | Apply the next pending migration                               |
| `npm run migrate:down`     | Roll back the last migration                                   |
| `npm run migrate:baseline` | Mark the initial migration as already applied                  |
| `npm run migrate:create`   | Scaffold a new migration — `npm run migrate:create -- <name>`  |
