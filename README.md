# Announcement Board

Internal team announcement board with NestJS API, React frontend, and PostgreSQL, all running in Docker.

## Quick Start

From repository root:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

## Demo Account

If you do not want to register a new account, use this demo login:

- ID (email): nuntapop.khe@gmail.com
- Password: Hello123

This account is seeded automatically when the backend starts with an empty database.

## End-to-End Flow

1. Register or login.
2. Create announcement with title, body, author, and optional pin.
3. See it in feed.
4. Pin or unpin from card pin icon.
5. Open details, edit (owner only), or delete (owner only).

Notes:

- Pin/unpin is allowed for any logged-in user.
- Edit and delete are owner-only.
- Detail modal shows "Last edited" timestamp after real updates.

## Main Features

- JWT auth: register, login, me.
- Feed sorting options:
  - No sort
  - Pinned first (latest)
  - Publish date (newest/oldest)
  - Owned by me first
  - Owner name (A-Z / Z-A)
- Confirmation dialogs for:
  - Register submit
  - Logout
  - Delete announcement
  - Save edit changes
- Success toasts for publish, update, logout.

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register and return access token + user |
| POST | /auth/login | Login and return access token + user |
| GET | /auth/me | Get current user from JWT |

### Announcements

| Method | Endpoint | Description |
|---|---|---|
| POST | /announcements | Create (auth required) |
| GET | /announcements | List all |
| GET | /announcements/:id | Get one |
| PATCH | /announcements/:id | Update (owner only, auth required) |
| PATCH | /announcements/:id/pin | Toggle pin (auth required) |
| DELETE | /announcements/:id | Delete (owner only, auth required, returns 204) |

Example create request:

```bash
curl -X POST http://localhost:3001/announcements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product launch update",
    "body": "Launch notes are ready for review.",
    "author": "Product Team",
    "pinned": true
  }'
```

Example list request:

```bash
curl http://localhost:3001/announcements
```

## Architecture Decisions

### Backend

- NestJS module/controller/service structure.
- TypeORM with `synchronize: true` for dev speed.
- DTO validation via class-validator.
- Password hashing via bcrypt.
- Ownership checks enforced server-side for update and delete.
- DB ordering for list endpoint by `pinned DESC, created_at DESC`.

### Frontend

- React + TypeScript + Vite.
- API calls centralized in App.tsx typed helpers.
- UI state-driven modals and confirmations.
- Handwritten CSS (no UI framework).

### Database

- PostgreSQL 16 in Docker.
- Named volume `postgres_data` for persistence.
- Healthcheck on db, backend waits for healthy db.

## Tests

### Backend unit tests

```bash
cd backend
npm install
npm test
```

Covers:

- DTO validation
- create/default pin
- list ordering
- findOne + not found
- update + forbidden owner case
- delete + not found

### Backend smoke test

```bash
# from repository root
"C:/Program Files/Git/bin/bash.exe" test/smoke-backend.sh
```

Why Git Bash path on Windows:

- `bash` may point to WSL launcher on some machines and fail.
- Direct Git Bash path is reliable in this repo setup.

## Tradeoffs / Assumptions

- `synchronize: true` is enabled for development convenience.
- For production, replace with migrations.
- Announcements require login so the app can track ownership for edit and delete actions.
- The author field is prefilled from the logged-in user's name, but can be edited before publishing.
- Fresh databases are seeded with a demo user and two announcements so Docker starts with useful data.

## With More Time

- Add quality-of-life features such as image uploads and comment threads on announcements.
- Add separate announcement channels for each department.
