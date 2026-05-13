# Vercel + MongoDB Atlas — Deployment Guide

This guide walks you through deploying this app on Vercel with MongoDB Atlas as the database (both free tiers).

---

## Architecture Overview

```
Browser
  └── Vercel (Static hosting + Serverless functions)
        ├── /              → React SPA (built by Vite, served from dist/)
        └── /api/*         → Node.js serverless functions (api/ folder)
                                └── MongoDB Atlas (cloud database, free M0 tier)
```

---

## Step 1 — Set Up MongoDB Atlas (Free)

### 1.1 Create an account
Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up for free.

### 1.2 Create a free cluster
1. Click **Build a Database**
2. Choose **M0 FREE** (512 MB storage, shared cluster)
3. Select a cloud provider and region (pick one closest to your users)
4. Name your cluster (e.g., `qa-tracker-cluster`)
5. Click **Create**

### 1.3 Create a database user
1. In the left sidebar, go to **Security → Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Set a username (e.g., `qa_tracker_user`) and a strong password
5. Under **Database User Privileges**, select **Atlas admin** (or **Read and write to any database**)
6. Click **Add User**

> Save your username and password — you'll need them for the connection string.

### 1.4 Whitelist all IPs (required for Vercel)
Vercel functions run on dynamic IPs, so you must allow all IPs:

1. Go to **Security → Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** — this sets `0.0.0.0/0`
4. Click **Confirm**

### 1.5 Get your connection string
1. Go to **Database → Connect**
2. Choose **Drivers**
3. Select **Node.js** as the driver
4. Copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@qa-tracker-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with the credentials you created in Step 1.3.

---

## Step 2 — Push Your Code to GitHub

If you haven't already:

```bash
# From the project root
git init              # skip if already a git repo
git add .
git commit -m "Initial commit"

# Create a GitHub repo at github.com and then:
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

---

## Step 3 — Deploy on Vercel

### 3.1 Import your repository
1. Go to [https://vercel.com](https://vercel.com) and sign in (use your GitHub account)
2. Click **Add New → Project**
3. Find your repository and click **Import**

### 3.2 Configure the project
Vercel auto-detects Vite. Confirm these settings (they should be pre-filled):

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Do **not** change these.

### 3.3 Add environment variables
Before deploying, scroll to the **Environment Variables** section and add:

| Name | Value |
|---|---|
| `MONGODB_URI` | Your full connection string from Step 1.5 |
| `MONGODB_DB_NAME` | `qa_tracker` |

Optional (only add if you want custom collection names):

| Name | Default value |
|---|---|
| `MONGODB_COLLECTION_USERS` | `users` |
| `MONGODB_COLLECTION_TASKS` | `tasks` |
| `MONGODB_COLLECTION_QA_LOGS` | `qa_logs` |
| `MONGODB_COLLECTION_STATUS_HISTORY` | `status_history` |
| `MONGODB_COLLECTION_ASSIGNMENT_HISTORY` | `assignment_history` |

### 3.4 Deploy
Click **Deploy**. Vercel will:
1. Install dependencies (`npm install`)
2. Build the frontend (`npm run build` → `dist/`)
3. Deploy the `api/` folder as serverless functions
4. Assign you a URL like `https://your-project.vercel.app`

---

## Step 4 — First Launch

The **first time** someone opens the app, the serverless functions will:
1. Connect to MongoDB Atlas
2. Create indexes on the collections (for performance)
3. Seed the default team members (Dev Asha, Dev Rahul, Design Neha, Design Kiran, QA Priya, QA Arjun)

This all happens automatically. No manual database setup is needed.

---

## Step 5 — Verify in MongoDB Atlas

To confirm the database was created:
1. Go to **Database → Browse Collections** in Atlas
2. You should see the `qa_tracker` database with these collections:
   - `users` — seeded with 6 default team members
   - `tasks`
   - `qa_logs`
   - `status_history`
   - `assignment_history`

---

## Updating Your Deployment

Every time you push to the `main` branch on GitHub, Vercel automatically redeploys. No manual action needed.

To update environment variables:
1. Go to your Vercel project → **Settings → Environment Variables**
2. Edit the value and click **Save**
3. Redeploy (go to **Deployments** → click the three-dot menu → **Redeploy**)

---

## Local Development (unchanged)

The original Express + SQLite server still works for local development:

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev       # runs on http://localhost:4000

# Terminal 2 — frontend
npm install
npm run dev       # runs on http://localhost:5173
```

The frontend automatically points to `http://localhost:4000` in dev mode and `/api` in production.

---

## Notes

### SQL Console
The built-in SQL console in the app is **not functional** with MongoDB (MongoDB does not use SQL). The input will return an error message. Use **MongoDB Atlas UI** or **MongoDB Compass** (desktop app) to run direct queries against your database.

### Free Tier Limits
| Service | Limit |
|---|---|
| Vercel Hobby | 100 GB bandwidth, unlimited deployments |
| MongoDB M0 | 512 MB storage, shared cluster |

Both are more than sufficient for an internal team tool.

### Data Persistence
Unlike the local SQLite file, MongoDB Atlas data is **fully persistent** — it survives redeploys, function restarts, and cold starts. Your data is safe.

### Cold Starts
The first request after a period of inactivity may take 1–3 seconds as the serverless function initializes and connects to MongoDB. Subsequent requests are fast (warm connection is reused within the same function instance).
