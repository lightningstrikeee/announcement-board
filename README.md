# announcement-board

## Run Full Stack With One Command

From the repository root:

```bash
docker compose up --build
```

This starts:

- Frontend (Vite): `http://localhost:5173`
- Backend (NestJS API): `http://localhost:3001`
- PostgreSQL: `localhost:5432`

## Notes

- API and UI are separated into `backend/` and `frontend/`.
- Database runs in Docker using PostgreSQL.
- `GET /announcements` returns pinned records first, then newest by `created_at`.