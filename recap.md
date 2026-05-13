# Project Recap — Supratim's Task Tracker Portal

---

## 1. Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | ^19.2.6 | UI framework — component-based SPA |
| **Vite** | ^8.0.12 | Build tool & dev server (replaces CRA) |
| **React Router DOM** | ^7.15.0 | Client-side routing |
| **@tanstack/react-table** | ^8.21.3 | Headless table with sorting/filtering |
| **Recharts** | ^3.8.1 | Analytics charts (bar, pie, line) |
| **React Toastify** | ^11.1.0 | Toast notifications |
| **Lucide React** | ^1.14.0 | Icon library |
| **clsx** | ^2.1.1 | Conditional CSS class utility |

**Patterns used:**
- Context API (`AppContext`) for global state — no Redux/Zustand
- `useMemo` for derived data (filtered tasks, role-split user lists)
- Custom `api()` client wrapping `fetch` with JSON handling
- `VITE_API_BASE_URL` env var to switch between dev/prod API endpoints

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v22 (per render.yaml) | Runtime |
| **Express** | ^5.2.1 | HTTP server & REST API |
| **sqlite3** | ^6.0.1 | SQLite driver for Node |
| **cors** | ^2.8.6 | Cross-origin request headers |

**API endpoints exposed:**
- `GET/POST /tasks` — task CRUD
- `PUT/DELETE /tasks/:id`
- `GET/POST /users` — team member management
- `PUT/DELETE /users/:id`
- `GET/POST /qa-logs` — QA testing notes
- `GET /history/:taskId` — audit trail (status + assignment history)
- `GET /analytics/overview` — aggregated chart data
- `POST /query` — read-only SQL console (SELECT only)
- `GET /health` — health check

### Database

| Technology | Details |
|---|---|
| **SQLite** | File-based, single `.db` file |
| **Location** | `server/qa_tracker.db` |
| **Driver** | `sqlite3` npm package (native bindings) |

**Tables:**
- `users` — team members (Developer / Designer / QA roles)
- `tasks` — main task records with assignments, status, priority
- `qa_logs` — QA testing notes per task
- `status_history` — audit log of every status change
- `assignment_history` — audit log of every assignment change

### Tooling

| Tool | Purpose |
|---|---|
| ESLint | Linting (with react-hooks & react-refresh plugins) |
| localtunnel | Expose local dev server publicly (dev-only) |
| render.yaml | One-click deploy config for Render.com |

---

## 2. Where Is Data Saved?

**All data is saved in a single SQLite database file: `server/qa_tracker.db`**

This is a **local file** on the server's disk — not a remote database service. When the Node/Express server boots, it opens (or creates) this `.db` file via `sqlite3` and all reads/writes go directly to that file.

```
/server/
  index.js         ← Express + all API logic
  qa_tracker.db    ← ALL application data lives here
```

There is **no** cloud database, no Redis, no external service. Everything is self-contained in that single file.

**Implications:**
- Simple to run locally — zero setup
- Data is wiped if the server host's disk is cleared (e.g. Render free tier restarts, container redeploys)
- Not suitable for multi-instance/horizontal scaling (two servers can't share one SQLite file)

---

## 3. Hosting on Vercel — Full Guide

### Can This App Be Hosted on Vercel?

**Yes, but it requires adaptation.** The app currently runs as a traditional Express server. Vercel is a **serverless + static** platform — it does not run a long-lived Node process. You need to convert the backend into serverless API routes.

### The SQLite Problem on Vercel

> **SQLite will NOT work reliably on Vercel.**

Here is why:

| Issue | Explanation |
|---|---|
| **Ephemeral filesystem** | Vercel's serverless functions have a read-only filesystem. Only `/tmp` is writable, but it is wiped between cold starts. |
| **No persistent disk** | Each function invocation may run on a fresh container. Any `.db` file written is gone. |
| **No free persistent storage** | Vercel does not offer a free persistent disk/volume. |

**You must migrate to a hosted database.** The best free-tier options are:

| Service | Type | Free Tier | Notes |
|---|---|---|---|
| **Turso** | SQLite (libSQL) | 500 DBs, 9GB storage | Closest to SQLite — minimal code changes. Best choice. |
| **Neon** | PostgreSQL | 0.5 GB storage, 1 project | Vercel has a native Neon integration. Requires SQL dialect changes. |
| **Supabase** | PostgreSQL | 500 MB, 2 projects | Full Postgres, good free tier. |
| **PlanetScale** (Vitess) | MySQL | Free hobby tier | MySQL syntax, good DX. |

**Recommended: Turso** — it is SQLite-compatible (libSQL), so you change the driver but keep your SQL queries unchanged.

---

### Step-by-Step: Deploy to Vercel (with Turso as DB)

#### Step 1 — Restructure for Vercel

Vercel expects API routes inside an `api/` folder at the project root. Each file = one serverless function.

Create a `vercel.json` at the project root:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Move backend logic into `api/` route files. Example structure:

```
/api/
  tasks.js          → GET /api/tasks, POST /api/tasks
  tasks/[id].js     → PUT /api/tasks/:id, DELETE /api/tasks/:id
  users.js
  users/[id].js
  qa-logs.js
  analytics/overview.js
  history/[taskId].js
  query.js
  health.js
```

#### Step 2 — Set Up Turso (Free SQLite)

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth login

# Create a database
turso db create qa-tracker

# Get connection URL and token
turso db show qa-tracker --url
turso db tokens create qa-tracker
```

#### Step 3 — Replace sqlite3 with libsql

```bash
npm install @libsql/client
npm uninstall sqlite3
```

Change the DB connection in your API files:

```js
// Before (sqlite3)
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./qa_tracker.db');

// After (libsql / Turso)
import { createClient } from '@libsql/client';
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

Query calls change from callbacks to async/await:

```js
// Before
db.all('SELECT * FROM tasks', [], (err, rows) => { ... });

// After
const result = await db.execute('SELECT * FROM tasks');
const rows = result.rows;
```

#### Step 4 — Update Frontend API Client

Change `src/api/client.js` to use the `/api` prefix in production:

```js
const API_BASE = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:4000' : '/api');
```

#### Step 5 — Deploy to Vercel

```bash
npm install -g vercel

# From project root
vercel

# Follow the CLI prompts:
# - Link to existing project or create new
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

Add environment variables in the Vercel dashboard (or via CLI):

```bash
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
```

#### Step 6 — Run Database Migrations on Turso

Use the Turso CLI or a migration script to create the tables on the remote DB:

```bash
turso db shell qa-tracker < schema.sql
```

---

### Free Tier Limits Summary

| Service | Free Limit | Enough for this app? |
|---|---|---|
| **Vercel** (Hobby) | 100 GB bandwidth, 100 serverless functions | Yes |
| **Turso** | 500 DBs, 9 GB storage, 1 billion row reads/month | Yes |

### Alternative: Keep Using Render.com

This project already has a `render.yaml` configured for **Render.com**, which does support long-lived Node servers and persistent disks on paid tiers. On the **free tier**, Render also has the same SQLite persistence problem (ephemeral disk), but the architecture (Express server) requires zero changes. If you need a quick deploy without refactoring, Render is the easier path — just accept data loss on restarts until you upgrade to a paid plan or switch to Turso there too.
