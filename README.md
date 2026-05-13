# Supratim's Task Tracker Portal

A production-ready Task Management application with a specialized workflow for Developers, Designers, and QA teams.

## 🚀 Live Deployment
Hosted on **Vercel**: [https://supratims-task-tracker.vercel.app](https://supratims-task-tracker.vercel.app)

## 🛠️ Technology Stack
- **Frontend**: React 19 (Vite)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: MongoDB Atlas (Cloud)
- **State Management**: React Context API
- **Styling**: Vanilla CSS (Modern Design System)
- **Notifications**: React Toastify

## ✨ Key Features
- **QA Workflow**: Specialized logging for testing notes, bug remarks, and retesting status.
- **Audit Trail**: Full history tracking of every status change and task assignment.
- **Team Management**: Real-time management of Developers, Designers, and QA members.
- **Analytics Dashboard**: Visual charts for bug trends, task priority distribution, and developer performance.
- **Optimized UI**: 
  - Mandatory field validation (frontend & backend).
  - Searchable user selection for large teams.
  - Concurrency control (prevents duplicate task creation).
  - Dark/Light mode support.

## 📦 Migration Details
This project has been migrated from a local SQLite-based Express server to a modern Serverless architecture on Vercel. 
- **Legacy Files**: The `server/` directory contains the legacy code for reference but is no longer used for the production site.
- **API**: All backend logic is now modularized in the `api/` directory.

## 🛠️ Local Development

1. **Clone the repo**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Create a `.env` file with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB_NAME=qa_tracker
   ```
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```

---
*Maintained by Antigravity AI Assistant.*
