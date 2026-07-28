<div align="center">

# ⚡ APEX ESPORTS

### The Complete Competitive Gaming Tournament Ecosystem

*Organize. Compete. Get Paid.*

[![Made with Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![Socket.io](https://img.shields.io/badge/Socket.io-RealTime-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

[Live Demo](https://apex-esports-zlbc.vercel.app) · [Admin Console](https://apex-esports-admin.vercel.app) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## 📖 Overview

**Apex Esports** is a full-stack tournament management ecosystem built for competitive gaming communities — think of it as the operating system behind a mini-BGMI/Free Fire league. It handles everything from player registration and UPI payment verification to auto-revealed match room credentials, live results, prize distribution, and a real-time social layer with friends, teams, and chat.

The platform ships as a **monorepo** with three coordinated apps:

| App | Purpose |
|---|---|
| 🖥️ **User Frontend** | Player-facing portal — browse tournaments, register, pay, chat, and climb the leaderboard |
| 🛡️ **Admin Frontend** | Operator console — manage tournaments, verify payments, resolve disputes, publish results |
| ⚙️ **Backend API** | Node/Express + MongoDB core powering auth, payments, sockets, and push notifications |

---

## ✨ Key Features

### 🏆 Tournament Engine
- Full tournament lifecycle: create → open registration → auto room reveal → declare results → sync leaderboard
- Configurable **winner count (1/2/3)** with automatic prize pool breakdown
- Live slot tracking (`filledSlots / totalSlots`) computed from real registrations

### 🔐 Secure Room Credential System
- Room ID & password stay hidden until **15 minutes before match start**
- Background cron job (`roomRevealJob.js`) auto-reveals credentials with a full audit trail
- Admin **RELEASE NOW ⚡** override for manual early release

### 💳 UPI Payment Verification
- Player submits payment screenshot + 12-digit UTR
- Admin approval queue with live sync — approve/reject with remarks
- Cloudinary-backed uploads with local disk fallback when offline

### 📊 Multi-Dimensional Leaderboard
- Tabs for `Overall`, `Solo`, `Squad`, `Monthly`, `Weekly`
- Auto-calculated from published results — wins, kills, points, and prize money (₹)
- Top-3 podium UI with real-time sync on result publish

### 🎮 Social & Community Layer
- Player directory with search, filters, and win-rate sorting
- Friend system (send/accept/block) with real-time request handling
- 1-on-1 direct messaging with image attachments & typing indicators
- Permanent clans/teams with captain-led invitations and squad tournament registration

### 🔔 Real-Time Notification Infrastructure
- Firebase Cloud Messaging (FCM) push notifications for offline/background users
- Socket.io live events for online users (payment approved, room released, match won)
- In-app notification center with read/unread, filters, and search

### 🎫 Support & Helpdesk
- Ticketing system with categories, priorities, and status pipeline
- Live 2-way admin ↔ player chat with photo/file sharing

### 🎨 Design System
- Kinetic typography, brutalist geometry, and neon accent theming
- Fully responsive across mobile, tablet, and desktop with dedicated nav drawers
- Framer Motion micro-interactions across navigation, cards, and modals

---

## 🧱 Tech Stack

<table>
<tr>
<td valign="top" width="33%">

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io (real-time engine)
- JWT + Bcryptjs (auth)
- Multer + Cloudinary (uploads)
- Firebase Admin SDK (push)
- Helmet, CORS, Morgan

</td>
<td valign="top" width="33%">

**User Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- TanStack Query + Axios
- Framer Motion
- Socket.io Client

</td>
<td valign="top" width="33%">

**Admin Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- TanStack Table
- Chart.js (react-chartjs-2)
- Tailwind CSS
- Framer Motion

</td>
</tr>
</table>

---

## 🗂️ Project Structure

```
apex-esports/
├── backend/
│   └── src/
│       ├── config/          # DB & Cloudinary config
│       ├── controllers/     # Business logic
│       ├── models/          # Mongoose schemas
│       ├── routes/          # API route definitions
│       ├── middleware/      # Auth, upload, error handling
│       ├── socket/          # Socket.io event handling
│       ├── jobs/            # Cron jobs (room reveal, etc.)
│       └── services/        # Cloudinary, FCM services
├── user-frontend/           # Next.js player portal
│   └── src/
│       ├── app/              # App Router pages
│       ├── components/       # Navbar, Chat, Modals, etc.
│       ├── context/          # Auth & Toast contexts
│       └── lib/              # API client, Firebase
└── admin-frontend/           # Next.js admin console
    └── src/
        ├── app/               # Tournaments, Users, Disputes, Payments
        └── components/        # AdminSidebar
```

---

## 🔌 API Reference

Base URL: `http://localhost:5000/api/v1`

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register + dispatch email OTP |
| `POST` | `/auth/verify-otp` | Verify OTP & activate account |
| `POST` | `/auth/login` | Login & receive JWT |
| `POST` | `/auth/google` | Google OAuth sign-in |
| `GET/PUT` | `/auth/profile` | Get / update profile |

</details>

<details>
<summary><strong>Tournaments & Registrations</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tournaments` | List with filters & search |
| `GET` | `/tournaments/:id/room-credentials` | Secure 15-min auto-reveal |
| `POST` | `/registrations/join` | Join a tournament |
| `GET` | `/registrations/timeline/:tournamentId` | 4-stage registration status |

</details>

<details>
<summary><strong>Payments & Results</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payments/submit` | Submit UTR + screenshot proof |
| `PATCH` | `/payments/:id/approve` \| `/reject` | Admin verification |
| `POST` | `/results/publish` | Publish winners & sync leaderboard |
| `GET` | `/leaderboard?game=&tab=` | Multi-dimensional rankings |

</details>

> Full endpoint list lives in [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas connection string
- Cloudinary account (optional — falls back to local storage)
- Firebase project (for push notifications)

### Installation

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

# Or individually
npm run dev:backend   # http://localhost:5000
npm run dev:user      # http://localhost:3000
npm run dev:admin     # http://localhost:3001
```

---

## 🌐 Live Deployments

| Service | URL |
|---|---|
| User Portal | [apex-esports-zlbc.vercel.app](https://apex-esports-zlbc.vercel.app) |
| Admin Console | [apex-esports-admin.vercel.app](https://apex-esports-admin.vercel.app) |
| Backend API | [apex-esports.onrender.com/api/v1](https://apex-esports.onrender.com/api/v1) |

---

## 🗺️ Roadmap

- [x] Auth, tournaments, registrations, payments
- [x] Secure room credential auto-reveal system
- [x] Results, leaderboard & prize sync
- [x] Support ticketing + live chat
- [x] FCM push notifications
- [x] Community layer — friends, teams, direct chat
- [ ] Live bracket visualization
- [ ] In-app wallet & auto-payouts
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ⚡ by **[Divyansh Singh Thakur](https://github.com/ThakurDivyanshsingh-77)**

</div>
