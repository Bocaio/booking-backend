# Booking App — Server

A backend for a **room/resource booking platform** with **role-based access control (RBAC)**, built with **Express 5**, **TypeScript**, **MySQL** (Aiven, TLS), and **Redis**. Users will log in by selecting an account (no password), and every action is gated by fine-grained permissions attached to their role.

> **Project status — early scaffolding.**
> The infrastructure and data layers are in place: TLS MySQL connection, Kysely query builder, migrations + seed data, Redis client, JWT auth middleware, global error middleware, repositories, and Zod validation helpers.
> **The HTTP layer (controllers, routes, services) is not yet wired.** The server starts, but no application endpoints respond. The `## Planned API` section below documents the intended shape.

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

## Access Control Model

Permissions are stored in the database and mapped to roles through a many-to-many `role_permissions` table.

**Implemented today:**

- `authMiddleware` (`src/middlewares/auth.ts`) — verifies the `accessToken` cookie and populates `req.user` with `{ userId, roleId }`.
- `PermissionRepository.getCodesByRole(roleId)` — returns the permission-code strings for a role.

**Not yet implemented:**

- A permission-guard middleware (e.g. `authorize(code)`) that reads `req.user.roleId`, looks up the codes, and 403s if the required code is missing.
- Route wiring that would apply the guard.

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

---

## Planned API

> These endpoints reflect design intent. **None respond today** — the routes are not registered in `src/index.ts`. Tracking them here so the contract is preserved as controllers/services are added.

### Auth (`/login`) — no permission required

| Method | Path              | Body       | Description                                   |
| ------ | ----------------- | ---------- | --------------------------------------------- |
| GET    | `/login/all`      | —          | List selectable users to log in as            |
| POST   | `/login`          | `user_id`  | Log in by selecting a user; sets auth cookies |
| POST   | `/login/refresh`  | — (cookie) | Rotate access + refresh tokens                |
| POST   | `/login/logout`   | — (cookie) | Revoke refresh token and clear cookies        |

### Bookings (`/booking`) — requires auth

| Method | Path              | Permission                                  | Body                     | Description                                            |
| ------ | ----------------- | ------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| GET    | `/booking/all`    | `booking.view`                              | —                        | List all bookings; each includes a `canDelete` flag    |
| POST   | `/booking/create` | `booking.create`                            | `start_time`, `end_time` | Create a booking (ISO 8601 datetimes, `start < end`)   |
| DELETE | `/booking/delete` | `booking.delete.own` / `booking.delete.any` | `booking_id`             | Delete a booking (own vs. any resolved from ownership) |

### Users (`/user`) — requires auth

| Method | Path                | Permission         | Body                 | Description          |
| ------ | ------------------- | ------------------ | -------------------- | -------------------- |
| GET    | `/user/all`         | `user.view`        | —                    | List all users       |
| POST   | `/user/create`      | `user.create`      | `name`, `role_id`    | Create a user        |
| POST   | `/user/delete`      | `user.delete`      | `user_id`            | Delete a user        |
| PUT    | `/user/change-role` | `user.update_role` | `user_id`, `role_id` | Change a user's role |

### Roles (`/role`) — requires auth

| Method | Path        | Permission  | Description    |
| ------ | ----------- | ----------- | -------------- |
| GET    | `/role/all` | `role.view` | List all roles |

---

## Response Shape

The `sendSuccess` / `sendError` helpers in `src/utils/helper.ts` produce these shapes.

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

Possible `error.code` values (see `src/types/response.ts`): `VALIDATION_ERROR`, `DUPLICATE_ENTRY`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`.

---

## Project Structure

Reflects what is currently on disk. Empty/planned directories are omitted.

```
backend/
├── certs/
│   └── ca.pem                  # Aiven CA cert (not committed; see setup)
├── src/
│   ├── config/
│   │   ├── index.ts            # Loads .env → CONFIGS (JWT + DB_* + NODE_ENV)
│   │   ├── pool.ts             # mysql2 pool factory (reads CA from certs/ca.pem)
│   │   ├── database.ts         # Kysely instance wrapping the mysql2 pool
│   │   └── redis.ts            # Redis client singleton
│   ├── constants/
│   │   ├── message.ts          # SuccessMessage / ErrorMessage
│   │   └── permission.ts       # Permission code constants
│   ├── controller/
│   │   └── auth.ts             # AuthController (stub)
│   ├── database/
│   │   ├── migrator.ts         # Migration CLI (up, down, latest, baseline, create)
│   │   └── migrations/
│   │       ├── 2026_07_18_001_initial_schema.ts   # Schema + roles/permissions seed
│   │       └── 2026_07_18_002_add_user_data.ts    # UNIQUE(users.name) + user seed
│   ├── dependency-injection/
│   │   └── repositories.ts     # Repository singletons
│   ├── middlewares/
│   │   ├── auth.ts             # JWT auth (accessToken cookie → req.user)
│   │   └── error.ts            # Global error handler (MySQL, Zod, JWT, AppError)
│   ├── repository/
│   │   ├── mysql/
│   │   │   ├── user.ts         # UserRepository (+ role join view)
│   │   │   ├── booking.ts      # BookingRepository (+ user join view)
│   │   │   ├── role.ts         # RoleRepository
│   │   │   └── permission.ts   # Permission codes by role
│   │   └── redis/
│   │       └── refresh-token.ts# Refresh-token set (7-day TTL, per user)
│   ├── routes/
│   │   ├── auth.ts             # Router shell (no handlers registered yet)
│   │   └── booking.ts          # Router shell (no handlers registered yet)
│   ├── types/
│   │   ├── AppError.ts         # Custom error class
│   │   ├── valideError.ts      # ValidationError class
│   │   ├── JwtPayload.ts       # UserPayload (userId, roleId)
│   │   ├── response.ts         # Response types + ErrorCode
│   │   ├── express.d.ts        # Express Request augmentation (user)
│   │   └── index.ts            # Kysely DB type definitions
│   ├── utils/
│   │   └── helper.ts           # sendSuccess, sendError, setAuthCookies, clearAuthCookies
│   ├── validation/
│   │   ├── index.ts            # Zod middleware factories (Body/Params/Query)
│   │   ├── auth/               # login schema
│   │   ├── booking/            # create / delete schemas
│   │   └── user/               # create / delete / change-role schemas
│   └── index.ts                # Server entry (routes not yet registered)
├── .env                        # Local env (gitignored)
├── package.json
├── tsconfig.json
└── start.sh                    # build + redis-server + dev in one shell
```

Not on disk yet (referenced by planned API): `src/service/`, `src/controller/{booking,user,role,health}.ts`, `src/routes/{user,role,health}.ts`, `src/middlewares/authorize.ts`, `src/dependency-injection/{services,controller}.ts`.

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
npm run migrate:latest       # apply all pending migrations
npm run migrate:down         # roll back the last one
npm run migrate:create -- <name>   # scaffold a new migration file
```

### 5. Start the server

```bash
./start.sh                   # build + redis-server + dev with hot reload
# or
npm run dev                  # dev only (assumes Redis is already up)
npm run start:prod           # tsc build + node dist/index.js
```

The server listens on **port 8080** and expects a browser client at `http://localhost:5173` (CORS with `credentials: true`).

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
