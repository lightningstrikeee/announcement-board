# Announcement Board Backend (NestJS)

Backend service for auth + announcement management.

## Run Locally

Install dependencies:

```bash
npm install
```

Start in dev mode:

```bash
npm run start:dev
```

Run unit tests:

```bash
npm test
```

## Environment

The app reads values from environment variables (or Docker Compose service config):

- `PORT` (default `3001`)
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `CORS_ORIGIN`

## API

### Auth

- `POST /auth/register` -> register user and return `accessToken` + `user`
- `POST /auth/login` -> login and return `accessToken` + `user`
- `GET /auth/me` -> current user from JWT (`Authorization: Bearer <token>`)

### Announcements

- `POST /announcements` -> create (auth required)
- `GET /announcements` -> list all (ordered by `pinned DESC`, then `created_at DESC`)
- `GET /announcements/:id` -> get one
- `PATCH /announcements/:id` -> update (owner only, auth required)
- `PATCH /announcements/:id/pin` -> toggle pin (auth required)
- `DELETE /announcements/:id` -> delete (owner only, auth required, returns `204`)

## Authorization Rules

- Any logged-in user can create announcements.
- Any logged-in user can toggle pin.
- Only the owner can edit or delete their announcement.

## Announcement Fields

- `id`
- `title`
- `body`
- `author`
- `owner_id`
- `pinned`
- `created_at`
- `updated_at`

## Notes

- DTO validation is enforced with `class-validator`.
- Passwords are hashed with bcrypt.
- TypeORM `synchronize: true` is used for development convenience.