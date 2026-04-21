# Announcement Board Backend (NestJS)

## Setup

1. Copy `.env.example` to `.env` and update DB settings.
2. Install packages:

```bash
npm install
```

3. Start in dev mode:

```bash
npm run start:dev
```

## API

- `POST /announcements`
- `GET /announcements` (pinned first, then `created_at` descending)
- `GET /announcements/:id`
- `PATCH /announcements/:id`
- `DELETE /announcements/:id`

## Announcement fields

- `id`
- `title`
- `body`
- `author`
- `pinned`
- `created_at`