# Workspace Tests

Use this folder for cross-project tests only (for example docker-compose smoke/e2e).

## Test Location Guide

- Backend unit and service tests live in `backend/tests`.
- This `test` folder is for workspace-level tests that validate the app as a whole.

## Backend Smoke Test

Run from repository root:

Windows (recommended in this repo):

```bash
"C:/Program Files/Git/bin/bash.exe" test/smoke-backend.sh
```

Linux/macOS:

```bash
bash test/smoke-backend.sh
```

Optional custom API URL:

Windows:

```bash
API_URL=http://localhost:3001 "C:/Program Files/Git/bin/bash.exe" test/smoke-backend.sh
```

Linux/macOS:

```bash
API_URL=http://localhost:3001 bash test/smoke-backend.sh
```
