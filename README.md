# Esports Tournament Platform

Full-stack esports tournament management platform featuring real-time socket updates, automated match orchestration, user portal, and admin analytics dashboard.

## Project Structure

- **`backend/`**: Node.js + Express + MongoDB + Socket.io + JWT API Server
- **`user-frontend/`**: Next.js (App Router) + Tailwind CSS + Framer Motion Esports Portal
- **`admin-frontend/`**: Next.js (App Router) + TanStack Table + Chart.js Admin Dashboard

## Quick Start

### 1. Install Dependencies
```bash
# Clone the repo
git clone https://github.com/ThakurDivyanshsingh-77/apex-esports.git
cd apex-esports

# Install all dependencies across the monorepo
npm run install:all
```

### Environment Setup

Create `.env` in `backend/` (see `.env.example`):

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Create `.env.local` in `user-frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

### Run Locally

```bash
# All services together (backend + user app + admin portal)
npm run dev:all
```
- Or run services individually:
```bash
npm run dev:backend   # Express Backend on http://localhost:5000
npm run dev:user      # User App on http://localhost:3000
npm run dev:admin     # Admin Portal on http://localhost:3001
```
