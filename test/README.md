# Workspace Tests

Use this folder for cross-project tests only (for example docker-compose smoke/e2e).

## Test Location Guide

- Backend unit and service tests live in `backend/tests`.
- This `test` folder is for workspace-level tests that validate the app as a whole.

## Backend Smoke Test

Run from repository root:

```bash
bash test/smoke-backend.sh
```

Optional custom API URL:

```bash
API_URL=http://localhost:3001 bash test/smoke-backend.sh
```
