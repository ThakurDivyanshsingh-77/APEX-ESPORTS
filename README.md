# Esports Tournament Platform

Full-stack esports tournament management platform featuring real-time socket updates, automated match orchestration, user portal, and admin analytics dashboard.

## Project Structure

- **`backend/`**: Node.js + Express + MongoDB + Socket.io + JWT API Server
- **`user-frontend/`**: Next.js (App Router) + Tailwind CSS + Framer Motion Esports Portal
- **`admin-frontend/`**: Next.js (App Router) + TanStack Table + Chart.js Admin Dashboard
Testing CommitPilot AI Phase 3
## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in `backend/`, `user-frontend/`, and `admin-frontend/`.

### 3. Run Applications
- Run all applications concurrently:
```bash
npm run dev:all
```
- Or run services individually:
```bash
npm run dev:backend   # Express Backend on http://localhost:5000
npm run dev:user      # User App on http://localhost:3000
npm run dev:admin     # Admin Portal on http://localhost:3001
```
