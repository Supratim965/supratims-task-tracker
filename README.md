# QA Task Tracker Portal

Responsive internal QA-focused task management system with:

- Task CRUD and assignment workflow
- QA logs, retesting updates, and audit/history timeline
- Search, filter, and sorting across task metadata
- Analytics dashboard (status, priority, bug trends, developer issue counts)
- Secure SQL console with `SELECT`-only query policy

## Tech stack

- Frontend: React + Vite + Recharts + React Toastify
- Backend: Node.js + Express
- Database: SQLite (`server/qa_tracker.db`)

## Run locally

Open 2 terminals:

1) Start backend API

```bash
cd server
npm install
npm run dev
```

2) Start frontend

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and API at `http://localhost:4000`.

## Deploy on Render (free)

This repo includes `render.yaml` for one-click setup.

1. Push this project to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Connect your GitHub repo and select this repository.
4. Deploy.

Render will create one free web service and provide a URL like:

`https://supratim-task-tracker.onrender.com`

Notes:

- First request after idle may take ~30-60s on free tier.
- SQLite file storage is not durable on free instances. For long-term persistent data, move to a managed database.

## SQL console policy

Allowed:

- `SELECT` queries

Blocked:

- `DROP`
- `DELETE`
- `UPDATE`
- `ALTER`
- `INSERT`
- `CREATE`
- `TRUNCATE`

Example:

```sql
SELECT * FROM tasks WHERE status = 'QA Failed';
```
