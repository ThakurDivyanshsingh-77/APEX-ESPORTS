# PROJECT_CONTEXT.md - AI Handoff & Memory Bank

> **Single Source of Truth** for AI Agents working on the Esports Tournament Platform. Update this document whenever code, configuration, database schema, or project status changes.

---

## 1. Project Overview
The **Esports Tournament Platform** is a full-stack web ecosystem designed to organize, host, track, and manage competitive gaming tournaments. It features automated match bracket generation, real-time match/lobby updates via WebSockets, live tournament chatrooms, push notification engines, game-wise & multi-dimensional hall of fame leaderboards (`Overall`, `Solo`, `Squad`, `Monthly`, `Weekly`), automated prize distribution, anti-cheat verification pipelines, team/roster hubs, user portals, UPI payment verification engines, 4-stage registration timeline tracking, 15-minute room auto reveal distribution, post-login auto-redirection (`/tournaments`), dual-state Guest vs Logged-In Navbar, permanent email ban enforcement, live real registered user synchronization in admin moderation, real-time UPI payment proof & UTR verification sync, and a comprehensive 6-module administrative control dashboard.

---

## 2. Tech Stack & Architecture

### Backend (`backend/`)
- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB & Mongoose ORM
- **Real-Time Engine**: Socket.io
- **Authentication**: JSON Web Tokens (JWT) & Bcryptjs
- **File Uploads**: Multer (temporary local storage) & Cloudinary v2 SDK
- **Security & Logging**: Helmet, CORS, Morgan, Dotenv

### User Frontend (`user-frontend/`)
- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS (Dark Esports Aesthetic: Deep void background `#090d16`, neon cyan `#00f2fe`, vibrant electric violet `#9d4edd`)
- **State & Data Fetching**: `@tanstack/react-query`, Axios, AuthContext
- **Real-Time Socket Client**: `socket.io-client`
- **Form Management**: React Hook Form / Controlled forms
- **Animations & Icons**: Framer Motion, Lucide React

### Admin Frontend (`admin-frontend/`)
- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS (Dark Slate Dashboard Theme)
- **Data Table**: `@tanstack/react-table`
- **Analytics & Data Viz**: Chart.js (`react-chartjs-2`: Line & Doughnut Charts)
- **State & Data Fetching**: `@tanstack/react-query`, Axios
- **Animations & Icons**: Framer Motion, Lucide React


---

## 3. File Structure

```
tornament-2/
├── PROJECT_CONTEXT.md         # AI Handoff & Memory Bank (Single Source of Truth)
├── README.md                  # Project documentation & quickstart
├── package.json               # Root monorepo workspace runner (concurrently)
├── .gitignore                 # Monorepo ignore rules
├── backend/
│   ├── src/
│   │   ├── config/            # DB (db.js) & Cloudinary (cloudinary.js)
│   │   ├── controllers/       # healthController.js, authController.js, tournamentController.js, registrationController.js, adminController.js, paymentController.js, notificationController.js, settingsController.js, resultController.js
│   │   ├── models/            # userModel.js, tournamentModel.js, registrationModel.js, paymentModel.js, notificationModel.js, resultModel.js, leaderboardModel.js
│   │   ├── routes/            # index.js, healthRoutes.js, authRoutes.js, tournamentRoutes.js, registrationRoutes.js, adminRoutes.js, paymentRoutes.js, notificationRoutes.js, resultRoutes.js
│   │   ├── middleware/        # authMiddleware.js (verifyJWT, authorizeRoles), uploadMiddleware.js, errorMiddleware.js
│   │   ├── services/          # cloudinaryService.js
│   │   ├── socket/            # Socket.io connection & event handling (index.js)
│   │   ├── utils/             # ApiResponse, ApiError, asyncHandler, timeUtils.js
│   │   ├── jobs/              # Scheduled cron jobs (roomRevealJob.js)
│   │   ├── validators/        # authValidator.js, tournamentValidator.js, paymentValidator.js
│   │   └── uploads/           # Temp file storage (.gitkeep)
│   ├── .env & .env.example    # Environment variables
│   ├── package.json           # Backend package configuration
│   └── server.js              # Server entry point & Socket server wrapper
├── user-frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router (layout.tsx, page.tsx, globals.css, not-found.tsx, error.tsx, login/, signup/, dashboard/, leaderboard/, tournaments/)
│   │   ├── components/        # Navbar.tsx, PaymentModal.tsx, StatusTimeline.tsx, CountdownTimer.tsx, LiveChat.tsx
│   │   ├── context/           # AuthContext.tsx
│   │   ├── lib/               # Axios API client (api.ts)
│   │   └── providers/         # React Query Provider (QueryProvider.tsx)
│   ├── tailwind.config.js     # Esports custom color theme
│   ├── tsconfig.json          # TypeScript config
│   ├── next.config.js         # Next.js config
│   └── package.json           # User app dependencies
└── admin-frontend/
    ├── src/
    │   ├── app/               # Next.js App Router (layout.tsx, page.tsx, globals.css, not-found.tsx, error.tsx, tournaments/, users/, disputes/, payments/, settings/)
    │   ├── components/        # AdminSidebar.tsx
    │   ├── lib/               # Axios API client (api.ts)
    │   └── providers/         # React Query Provider (QueryProvider.tsx)
    ├── tailwind.config.js     # Admin slate color theme
    ├── tsconfig.json          # TypeScript config
    ├── next.config.js         # Next.js config
    └── package.json           # Admin app dependencies
```

---

## 4. Database Schemas

### `User` Collection Schema (`backend/src/models/userModel.js`)
```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  gameName?: string;
  gameUID?: string;
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
  profileImage: string;
  status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### `Tournament` Collection Schema (`backend/src/models/tournamentModel.js`)
```typescript
interface ITournament {
  _id: ObjectId;
  title: string;
  game: string;
  mode: string;
  entryFee: number;
  prizePool: string;
  slots: number;
  filledSlots: number;
  date: string;
  time: string;
  map: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  registrationOpen: boolean;
  roomID?: string;
  password?: string;
  bannerImage?: string;
  description?: string;
  createdBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### `Registration` Collection Schema (`backend/src/models/registrationModel.js`)
```typescript
interface IRegistration {
  _id: ObjectId;
  user: ObjectId;
  tournament: ObjectId;
  gameName: string;
  gameUID: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  paymentStatus: 'PENDING' | 'PAID' | 'FREE' | 'REFUNDED';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### `Payment` Collection Schema (`backend/src/models/paymentModel.js`)
```typescript
interface IPayment {
  _id: ObjectId;
  user: ObjectId;
  tournament: ObjectId;
  amount: number;
  utr: string;
  image: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  verifiedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### `Notification` Collection Schema (`backend/src/models/notificationModel.js`)
```typescript
interface INotification {
  _id: ObjectId;
  user: ObjectId;
  title: string;
  message: string;
  type: 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'ROOM_RELEASED' | 'TOURNAMENT_STARTING' | 'SUPPORT_REPLY' | 'ANNOUNCEMENT';
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### `Result` Collection Schema (`backend/src/models/resultModel.js`)
```typescript
interface IResult {
  _id: ObjectId;
  tournament: ObjectId;
  rankings: Array<{
    rank: number;
    user?: ObjectId;
    gameName: string;
    kills: number;
    points: number;
    prizeAmount: number;
  }>;
  mvp?: { user?: ObjectId; gameName: string; kills: number };
  proofImage?: string;
  createdBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### `Leaderboard` Collection Schema (`backend/src/models/leaderboardModel.js`)
```typescript
interface ILeaderboard {
  _id: ObjectId;
  user: ObjectId;
  gameName: string;
  game: string;
  mode?: 'Solo' | 'Squad';
  timeframe?: 'Weekly' | 'Monthly' | 'Overall';
  profileImage: string;
  totalTournamentsPlayed: number;
  totalWins: number;
  totalKills: number;
  totalEarnings: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. API Endpoints & Routing

### Backend Base URL: `http://localhost:5000/api/v1`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Root Welcome Message | Public |
| `GET` | `/api/v1/health` | System Uptime & Health Check | Public |
| `POST` | `/api/v1/auth/signup` | Register user & dispatch 6-digit Email OTP (10-min expiry) | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user & return JWT (Blocks unverified/banned) | Public |
| `POST` | `/api/v1/auth/verify-otp` | Verify 6-digit OTP code & activate account (`isVerified=true`) | Public |
| `POST` | `/api/v1/auth/resend-otp` | Resend fresh 6-digit Email OTP (10-min expiry) | Public |
| `POST` | `/api/v1/auth/google` | Google Authentication (Sign in & Sign up with Google) | Public |
| `GET` | `/api/v1/auth/profile` | Get current logged-in user profile | Protected (JWT) |
| `PUT` | `/api/v1/auth/profile` | Update profile info | Protected (JWT) |
| `POST` | `/api/v1/auth/avatar` | Upload avatar image | Protected (JWT) |
| `GET` | `/api/v1/tournaments` | List tournaments with filters & search | Public |
| `GET` | `/api/v1/tournaments/:id` | Get single tournament details | Public |
| `GET` | `/api/v1/tournaments/:id/room-credentials` | Secure 15-min room credentials auto reveal | Protected (JWT) |
| `POST` | `/api/v1/tournaments` | Create new tournament | Protected (Admin/Organizer) |
| `PUT` | `/api/v1/tournaments/:id` | Update tournament & room credentials | Protected (Admin/Organizer) |
| `DELETE` | `/api/v1/tournaments/:id` | Delete tournament | Protected (Admin/Organizer) |
| `PATCH` | `/api/v1/tournaments/:id/status` | Quick status & registration toggle | Protected (Admin/Organizer) |
| `POST` | `/api/v1/registrations/join` | Join tournament | Protected (JWT) |
| `GET` | `/api/v1/registrations/my-registrations` | Fetch user joined tournaments | Protected (JWT) |
| `GET` | `/api/v1/registrations/tournament/:tournamentId` | Fetch participants list | Protected (Admin/Organizer) |
| `PATCH` | `/api/v1/registrations/:id/status` | Approve payment / status | Protected (Admin/Organizer) |
| `POST` | `/api/v1/registrations/bulk-approve` | Bulk approve selected player registrations | Protected (Admin/Organizer) |
| `GET` | `/api/v1/registrations/timeline/:tournamentId` | Get 4-stage registration timeline status | Protected (JWT) |
| `DELETE` | `/api/v1/registrations/:id` | Cancel registration | Protected (JWT) |
| `GET` | `/api/v1/admin/users` | List all real registered & logged-in users for admin moderation | Protected (Admin) |
| `PATCH` | `/api/v1/admin/users/:id` | Update user role or status (Ban/Unban) | Protected (Admin) |
| `GET` | `/api/v1/admin/disputes` | List match disputes and activity logs | Protected (Admin) |
| `PATCH` | `/api/v1/admin/disputes/:id` | Resolve or reject match disputes | Protected (Admin) |
| `GET` | `/api/v1/admin/settings` | Get platform configurations | Protected (Admin) |
| `PATCH` | `/api/v1/admin/settings` | Update platform configurations | Protected (Admin) |
| `POST` | `/api/v1/payments/submit` | Submit payment screenshot proof & UTR | Protected (JWT) |
| `GET` | `/api/v1/payments/my-payments` | User payment history | Protected (JWT) |
| `GET` | `/api/v1/payments/pending` | Admin pending payments list | Protected (Admin) |
| `PATCH` | `/api/v1/payments/:id/approve` | Approve payment & confirm slot | Protected (Admin) |
| `PATCH` | `/api/v1/payments/:id/reject` | Reject payment with remarks | Protected (Admin) |
| `GET` | `/api/v1/notifications/my-notifications` | Fetch user notifications | Protected (JWT) |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark notification as read | Protected (JWT) |
| `POST` | `/api/v1/notifications/broadcast` | Admin broadcast announcement | Protected (Admin) |
| `POST` | `/api/v1/results` | Submit match result & calculate leaderboard | Protected (Admin) |
| `GET` | `/api/v1/results/tournament/:tournamentId` | Get published match results | Public |
| `GET` | `/api/v1/leaderboard` | Get multi-dimensional global hall of fame leaderboard (`?game=VALORANT&tab=Solo`) | Public |

---

## 6. Current Status & Changelog

### Phase 0 – Project Setup & Architecture (Completed 2026-07-22)
- [x] Initialized Monorepo directory structure (`backend`, `user-frontend`, `admin-frontend`).

### Phase 1 – Authentication System (Completed 2026-07-22)
- [x] Mongoose User model, bcrypt hashing, JWT tokens, Cloudinary upload, AuthContext, Login, Signup, and User Dashboard.

### Phase 2 – Tournament Module (Completed 2026-07-22)
- [x] Tournament Mongoose schema, CRUD APIs, User Browse & Details pages, Admin TanStack Table management panel.

### Phase 3 – Registration System (Completed 2026-07-22)
- [x] Registration Mongoose schema, Rule validation engine, User Join modal & dashboard tracking, Admin participants approval manager.

### Phase 4 – Payment Module (Completed 2026-07-22)
- [x] Payment Mongoose schema, UTR validator, Multer + Cloudinary upload, `POST /payments/submit`, `GET /payments/my-payments`, `GET /payments/pending`, `PATCH /payments/:id/approve`, `PATCH /payments/:id/reject`.
- [x] PaymentModal.tsx, User Dashboard payment history, Admin Pending Payments panel.

### Phase 5 – Tournament Approval Flow (Completed 2026-07-22)
- [x] `POST /api/v1/registrations/bulk-approve`, `GET /api/v1/registrations/timeline/:tournamentId`, StatusTimeline.tsx 4-stage progress card, Admin Bulk Approval button.

### Phase 6 – Room Distribution System (Completed 2026-07-22)
- [x] `timeUtils.js` IST offset parser & 15-min threshold check, `roomRevealJob.js` 60s background scheduler, `GET /tournaments/:id/room-credentials` API, CountdownTimer.tsx, and One-Click Clipboard Copy buttons.

### Phase 7 – Live Chat & Notifications (Completed 2026-07-22)
- [x] Notification Mongoose schema, Socket.io chatrooms & notifications, `LiveChat.tsx`, Navbar notification dropdown bell.

### Phase 8 – Admin Dashboard (Completed 2026-07-22)
- [x] `settingsController.js`, `GET /admin/settings`, `PATCH /admin/settings`, Admin settings page, Chart.js analytics, 6-module AdminSidebar.

### Phase 9 – Results & Leaderboard (Completed 2026-07-22)
- [x] `resultModel.js`, `leaderboardModel.js`, `POST /results`, `GET /results/tournament/:id`, `GET /leaderboard`.
- [x] Built [leaderboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/leaderboard/page.tsx) with Top 3 Podium Cards, multi-dimensional tabs (`Overall`, `Solo`, `Squad`, `Monthly`, `Weekly`), data columns, guest teaser preview, and user rank highlight.

### Real-Time Payment Proof & UTR Admin Verification Sync (Completed 2026-07-22)
- [x] Updated [paymentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/paymentController.js) to populate full `user` and `tournament` objects on payment submissions.
- [x] Fixed payment screenshot image url fallback issue:
  - `cloudinaryService.js`: Preserves local uploaded image file when Cloudinary is unconfigured/offline instead of deleting it.
  - `server.js`: Added static route `app.use('/uploads', express.static(...))` with `helmet` cross-origin resource sharing.
  - `paymentController.js`: Constructs exact local URL (`http://localhost:5000/uploads/<filename>`) when Cloudinary is offline. Verified via [test-payment-upload.js](file:///C:/Users/divya/.gemini/antigravity-ide/brain/d20c9aae-9554-4ecb-9f60-b32f7fd6c4b5/scratch/test-payment-upload.js) (HTTP 200 OK static file access).
- [x] Verified that every submitted UPI screenshot & 12-digit UTR appears live in [payments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/payments/page.tsx) with **Approve Slot** and **Reject Payment** actions.
- [x] Fixed Live Tournament Capacity Increment & Registration Confirmation Display:
  - `registrationController.js`: Updated `joinTournament` to increment `filledSlots` in persistent mock store on join.
  - `tournamentController.js`: Updated `getTournamentById` and `getAllTournaments` to dynamically calculate `filledSlots` from actual active registrations count.
  - `user-frontend`: Updated [TournamentDetailPage](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/tournaments/%5Bid%5D/page.tsx) hero banner & Summary Card to display **`REGISTRATION DONE ✅ (CONFIRMED)`** status badge and live updated capacity (`1 / 64 TEAMS`).




### Phase 11 – Secure Room Management System (Completed 2026-07-22)
- [x] Implemented end-to-end role-restricted, audit-logged **Secure Room Management System**:
  - `tournamentModel.js`: Added `roomID`, `password`, `roomVisible` (default `false`), and `roomAuditLog` array schema.
  - `tournamentController.js`: Added `updateRoomCredentials` (`PATCH /tournaments/:id/room`), `releaseRoomNow` (`PATCH /tournaments/:id/room/release`), and `sanitizeRoomCredentials`.
  - Security Filtering: `roomID` and `password` are strictly hidden from API output unless requester is **Admin / Organizer** OR `roomVisible === true` **AND** user has an **Approved (`CONFIRMED`) registration**.
  - Background Job (`roomRevealJob.js`): Automatically sets `roomVisible = true` 15 minutes before scheduled match start time with audit logging.
  - Admin Frontend ([admin-frontend/src/app/tournaments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/tournaments/page.tsx)): Dedicated **Room Management Modal** with visibility status badges, credentials editing, instant **RELEASE NOW ⚡** override button, and timestamped audit log trail.
  - User Frontend ([user-frontend/src/app/tournaments/[id]/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/tournaments/%5Bid%5D/page.tsx)): Fetches `/room-credentials` with auth token; displays unlocked credentials with 1-click copy buttons for approved participants.
### Phase 12 – Tournament Result Management Module (Completed 2026-07-22)
- [x] Implemented complete end-to-end **Tournament Result Management Module**:
  - `resultModel.js`: Enhanced schema with `gameUID`, `profileImage`, `distribution` tier ('1ST_ONLY', 'TOP_2', 'TOP_3'), `notes`, and `auditLog` schema.
  - `resultController.js`: Added `verifyWinnerByUID` (`GET /results/verify-winner`) and `publishTournamentResult` (`POST /results/publish`).
  - UID Auto-Verification: Searches `User` & `Registration` collections; verifies player exists, is registered for the tournament, and has status `CONFIRMED` (Approved). Auto-displays avatar, name, handle, and UID badge.
  - Form Validation: Prevents duplicate winner UIDs across winning positions.
  - Automatic Sync: Publishing marks tournament as `COMPLETED`, updates User profile stats (`totalWins`, `totalEarnings`, `points`), syncs `Leaderboard` standings, increments `totalTournamentsPlayed` for all participants, and records audit trail with admin ID and timestamp.
  - Admin Frontend ([admin-frontend/src/app/results/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/results/page.tsx)): Built full **Match Results Hub** with prize tier selectors, real-time UID verification, proof image input, and audit trail drawer. Updated [AdminSidebar.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/components/AdminSidebar.tsx) with **Match Results** link.
  - User Frontend ([user-frontend/src/app/tournaments/[id]/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/tournaments/%5Bid%5D/page.tsx)): Built **Official Match Results & Winners Podium Section** displaying declared winner cards (Rank #1 Champion, Rank #2 Runner Up, Rank #3), Player Name, Handle, UID, Kills Count (🔥), Points (⚡), Cash Prize ($), Referee Notes, and Proof Screenshot.
  - Fixed Tournament Status Sync: Fixed `getTournamentResult` in `resultController.js` to return `404 Not Found` when results are unpublished, preventing unpublished `UPCOMING` tournaments from mistakenly displaying fallback dummy winner cards or `COMPLETED` badges.


### Phase 13 – Support Ticket & Live Admin Helpdesk System (Completed 2026-07-22)
- [x] Implemented complete end-to-end **Support Ticket & Live Admin Helpdesk System**:
  - `ticketModel.js`: Added schema for Support Ticket with `ticketNumber`, `category` (PAYMENT, ROOM_CREDENTIALS, REGISTRATION, ACCOUNT, DISPUTE, OTHER), `priority` (LOW, MEDIUM, HIGH, URGENT), `status` (OPEN, IN_PROGRESS, RESOLVED, CLOSED), and `messages` array.
  - `ticketController.js`: Added `createTicket` (`POST /tickets`), `getMyTickets` (`GET /tickets/my-tickets`), `getAllTickets` (`GET /tickets/all`), `getTicketById` (`GET /tickets/:id`), `addTicketMessage` (`POST /tickets/:id/messages`), and `updateTicketStatus` (`PATCH /tickets/:id/status`).
  - User Frontend ([user-frontend/src/app/support/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/support/page.tsx)): Built full Support & Helpdesk page with Raise Ticket modal, filter tabs (`ALL`, `OPEN`, `IN_PROGRESS`, `RESOLVED`), and Live Admin Chat Drawer with real-time 2-way message stream. Added **SUPPORT & HELPDESK** link to Navbar.
  - Admin Frontend ([admin-frontend/src/app/disputes/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/disputes/page.tsx)): Built Admin Helpdesk Portal with Ticket Status filtering, ticket priority badges, and Admin Live Chat & Resolver Modal for direct 2-way messaging and status updates (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`). Updated AdminSidebar link to **Support & Helpdesk**.
  - E2E Automated Verification: Executed [test-support-tickets.js](file:///C:/Users/divya/.gemini/antigravity-ide/brain/d20c9aae-9554-4ecb-9f60-b32f7fd6c4b5/scratch/test-support-tickets.js) confirming 100% test pass across user ticket creation, admin listing, 2-way chat message posting, and status resolution.

### Platform Mock Data Purge & Dynamic Slot Sync (Completed 2026-07-22)
- [x] Completely purged all hardcoded initial mock data seeds and cleared disk JSON stores across the backend:
  - `tournamentController.js`: Reset default mock tournaments seed array to empty (`[]`). Updated `getAllTournaments` to dynamically compute `filledSlots` from actual active registrations count.
  - `ticketController.js`: Reset default mock tickets seed array to empty (`[]`).
  - `resultController.js`: Reset default mock leaderboard seed array to empty (`[]`).
  - `backend/data/`: Reset `tournaments.json`, `users.json`, `registrations.json`, `payments.json`, `results.json`, `tickets.json`, and `tokens.json` to clean empty stores (`{}`).
- [x] Fixed Real-time Admin Registered User List Sync & Guest Route Protection:
  - `authController.js`: Updated `signup` and `getRegisteredUsersList` to read freshly from disk via `createPersistentStore('users', [])`, ensuring every new user created via `/signup` is immediately persisted to disk and retrieved.
  - `user-frontend`: Added guest route protection to [tournaments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/tournaments/page.tsx), [tournaments/[id]/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/tournaments/%5Bid%5D/page.tsx), [dashboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/dashboard/page.tsx), and [support/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/support/page.tsx). Guests clicking **EXPLORE MATCHES** or attempting to view protected arena pages are automatically redirected to `/login`, while guest access to Home (`/`) and Leaderboard (`/leaderboard`) remains open.
  - Resolved Next.js build compilation error: Cleaned duplicate `const { user } = useAuth()` declarations across frontend page components (`DashboardPage`, `TournamentDetailPage`, `SupportPage`), and restored missing closing brace in `TournamentDetailPage` (`if (user)` block).

### Global Leaderboard Real-Time Sync & 404 Error Boundary Fix (Completed 2026-07-25)
- [x] **Backend Leaderboard Controller Update** ([resultController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/resultController.js)):
  - Updated `getGlobalLeaderboard` to accept `category` query parameter (`OVERALL`, `SOLO`, `SQUAD`, `MONTHLY`, `WEEKLY`).
  - Added dynamic real-time aggregation from persistent stores (`users.json`, `registrations.json`, `results.json`) in dev mode. Registered users and published match winners are now automatically calculated, ranked, and displayed on the Leaderboard.
- [x] **Frontend Leaderboard Empty State & Error Boundaries**:
  - Updated [LeaderboardPage](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/leaderboard/page.tsx) with a custom empty state card when no players/results exist.
  - Fixed Next.js App Router 404 & runtime error boundaries ([user-frontend/src/app/not-found.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/not-found.tsx), [user-frontend/src/app/error.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/error.tsx), [admin-frontend/src/app/not-found.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/not-found.tsx), [admin-frontend/src/app/error.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/error.tsx)).

### Professional Gaming Statistics Dashboard (Completed 2026-07-25)
- [x] **Backend Player Stats API & Real-time Socket Broadcast** ([resultController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/resultController.js), [resultRoutes.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/routes/resultRoutes.js)):
  - Added `getUserGamingStats` (`GET /api/v1/results/my-stats?game=ALL|Free Fire|BGMI`) aggregating Total Matches Played, Total Wins, Win Rate %, Total Prize Won (₹), Total Kills, Leaderboard Points, Best Position, and Global Rank.
  - Generates dynamic Top 5 Player Achievements (*First Victory 🏆*, *Sharpshooter 🎯*, *High Roller 💰*, *Tournament Veteran 🎖️*, *Podium Master 👑*) and Recent Tournament History list.
  - Emits `results_published` Socket.io event on match result publication to update client dashboards automatically in real-time.
- [x] **User Dashboard Gaming Stats UI** ([user-frontend/src/app/dashboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/dashboard/page.tsx)):
  - Integrated 8-metric Player Statistics Card Grid with game tabs (`ALL GAMES`, `FREE FIRE`, `BGMI`).
  - Added Top 5 Player Achievements Grid with progress tracking and unlock status badges.
  - Added Recent Tournament History Table with match details (Name, Game, Mode, Final Position, Prize Won ₹, Match Date).
  - Wired Socket.io listener (`results_published`) to auto-sync stats without manual page refreshes.

### WebSocket Connection & Socket.io Server Fix (Completed 2026-07-25)
- [x] **Socket.io CORS & Express App Binding Update** ([backend/src/socket/index.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/socket/index.js), [backend/server.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/server.js)):
  - Configured dynamic CORS origin matching for Socket.io server to allow cross-origin browser WebSocket handshakes (`http://localhost:3000` & `http://localhost:3001`).
  - Added `app.set('io', io)` in `server.js` so controllers can broadcast Socket.io events (`results_published`, `global_announcement`) seamlessly.

### User Ban Status Persistence & Auto-Unban Fix (Completed 2026-07-25)
- [x] **Backend Banned User Persistence Fix** ([authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js)):
  - Fixed `updateMockUserStatus` so admin ban updates (`status: 'BANNED'`) are immediately written to disk store (`users.json`), `mockUsers`, and `tokenToUserMap`.
  - Resolved auto-unban bug where periodic admin page auto-refresh (polling every 5 seconds) reverted banned users to `ACTIVE` due to unpersisted disk state. Banned players now remain permanently banned across reloads, profile updates, and login attempts.
  - Excluded all `BANNED` and `SUSPENDED` users from the Global Leaderboard API (`getGlobalLeaderboard`).
  - Enforced strict registration (`signup`) and login prevention for banned email addresses with `403 Forbidden` until explicitly unbanned by an admin.

### Published Win Results & Prize Sync Fix (Completed 2026-07-25)
- [x] **Backend Result Persistence & Winner Matching Fix** ([resultController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/resultController.js)):
  - Updated `publishTournamentResult` to persist match result documents to the disk persistent store (`results.json`), `mockResults` map, and `users.json` store.
  - Enhanced multi-attribute winner matching across `userId`, `gameUID` (case-insensitive), and `gameName` (case-insensitive).
  - Resolved bug where declared wins, cash prizes (₹), kills, and points were not updating on the User Dashboard or Global Leaderboard. Wins, prizes, kills, and points now calculate and sync in real time across the entire platform.

### Automated Match Result Declaration & Participant Roster Auto-Detection (Completed 2026-07-25)
- [x] **Backend Participant Population** ([registrationController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/registrationController.js)):
  - Updated `getTournamentRegistrations` to populate full user profiles (`name`, `email`, `profileImage`, `gameName`, `gameUID`) for all tournament registrations in dev and production modes.
- [x] **Admin Results Declaration Modal Upgrade** ([admin-frontend/src/app/results/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/results/page.tsx)):
  - Added **Auto Participant Detection**: Automatically fetches registered participants for the tournament and displays them in interactive selection dropdowns for Rank #1, #2, and #3.
  - Added **Auto Prize Distribution Split**: Parses the tournament's `prizePool` (e.g. `₹10,000`) and splits it based on distribution mode (1st Place: 50%, 2nd Place: 30%, 3rd Place: 20%).
  - Added **Auto Avatar & User Profile Detection**: Selecting a participant instantly loads & previews their profile avatar photo, name, handle, and UID with a green `VERIFIED PARTICIPANT` badge without manual UID typing.

### Admin Tournaments Table UI Cleanup (Completed 2026-07-25)
- [x] **Removed Duplicate Buttons** ([admin-frontend/src/app/tournaments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/tournaments/page.tsx)):
  - Removed the `Players` and `Results` buttons from the ACTIONS column in the Tournaments Hub table to keep the UI clean and streamlined.
  - Results declaration is handled dedicatedly via the **Match Results Module** (`/results`), and participant rosters are managed in **Users & Teams Hub** (`/users`).

### Tournament Winner Count Config & Result Auto-Detection (Completed 2026-07-25)
- [x] **Schema & Controller Updates** ([tournamentModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/tournamentModel.js), [tournamentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/tournamentController.js)):
  - Added `winnerCount` (`'1' | '2' | '3'`) and `prizeBreakdown` (`{ first, second, third }`) fields to Tournament schema and controllers.
- [x] **Creation & Result Auto-Detection UI** ([admin-frontend/src/app/tournaments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/tournaments/page.tsx), [admin-frontend/src/app/results/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/results/page.tsx)):
  - Added Winner Count Selector (`1 Winner`, `2 Winners`, `3 Winners`) and individual prize pool inputs (1st, 2nd, 3rd) in Create/Edit Tournament modal.
  - Declare Result Modal now **automatically detects** if a tournament was configured for 1, 2, or 3 winners, auto-selects the corresponding tab, and auto-fills the exact prize amounts configured during tournament creation.

### Persistent Payment Approval & Re-Approve Bug Fix (Completed 2026-07-25)
- [x] **Backend Payment Status Disk Sync** ([paymentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/paymentController.js)):
  - Updated `approvePayment` and `rejectPayment` to persist status updates (`status: 'APPROVED'`) directly to the disk store (`payments.json`) and update associated player registrations in `registrations.json` (`status: 'CONFIRMED'`, `paymentStatus: 'PAID'`).
  - Resolved bug where 30-second admin polling or page reloads re-read unpersisted disk state and caused approved payments to reappear as `PENDING` requiring re-approval. Payments now stay permanently approved across all client sessions and server reloads.

### Real-Time Responsive Notification System (Completed 2026-07-25)
- [x] **Event Triggers & Disk Persistence** ([notificationController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/notificationController.js), [paymentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/paymentController.js), [tournamentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/tournamentController.js), [resultController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/resultController.js)):
  - Created `sendUserNotification` helper with Socket.io real-time event emission (`new_notification`, `user_notification`) and persistent file storage (`notifications.json`).
  - **Payment Approved Trigger**: Dispatches `PAYMENT_APPROVED` notification to user when admin approves payment.
  - **Room Credentials Released Trigger**: Dispatches `ROOM_RELEASED` notification with Room ID & Password to all confirmed tournament participants when admin releases match lobby.
  - **Match Win & Results Trigger**: Dispatches `MATCH_WIN` victory & prize notification to 1st, 2nd, and 3rd place winners when match results are published.
- [x] **Responsive Client Notification Center** ([Navbar.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/Navbar.tsx), [notificationRoutes.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/routes/notificationRoutes.js)):
  - Upgraded Navbar Notification Bell with unread pulse badge, real-time socket listener, and 1-click **CLEAR ALL** (`PATCH /api/v1/notifications/read-all`).
  - Styled notification modal for **100% Mobile & Desktop Responsiveness** (`w-[92vw] max-w-sm sm:w-96`), preventing overflow on small mobile viewports (320px–480px).

### Support Ticket Screenshot Image Uploader (Completed 2026-07-25)
- [x] **Backend Multipart Upload & Cloudinary Fallback** ([ticketRoutes.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/routes/ticketRoutes.js), [ticketController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/ticketController.js)):
  - Added `upload.single('file')` multer middleware to `POST /api/v1/tickets`.
  - Updated `createTicket` controller to handle file upload attachments, generating local image URLs or Cloudinary links automatically.
- [x] **Interactive Drag & Drop UI with Thumbnail Preview** ([support/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/support/page.tsx)):
  - Replaced plain text URL input in "Raise Support Ticket" modal with an interactive **Image Dropzone** (`CLICK OR DRAG SCREENSHOT HERE`).
  - Added instant thumbnail preview image with file size info and a 1-click remove button (`X`). Supports image URL paste mode toggle as fallback.

### Real-Time Live Support Chat with Photo & File Sharing (Completed 2026-07-25)
- [x] **Backend Attachment Schema & Socket Dispatch** ([ticketModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/ticketModel.js), [ticketRoutes.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/routes/ticketRoutes.js), [ticketController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/ticketController.js)):
  - Added `attachment` property to `messageSchema` in Ticket model.
  - Added `upload.single('file')` multer middleware to `POST /api/v1/tickets/:id/messages`.
  - Added Socket.io `ticket_message_sent` real-time event broadcast to instantly push new chat messages and uploaded attachments to active clients.
- [x] **Real-Time Client & Admin Live Chat UI** ([support/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/support/page.tsx), [disputes/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/disputes/page.tsx)):
  - Added paperclip image/file upload button (`📎`) and image preview chip in both User Support Chat Drawer and Admin Disputes Chat Modal.
  - Added Socket.io `ticket_message_sent` real-time listeners and `chatEndRef` auto-scrolling on both frontends so user ↔ admin replies & photos pop up **instantly without page refresh**.

### Tournament Result Check 404 Console Error Resolution (Completed 2026-07-25)
- [x] **Clean 200 OK Response for Pending Match Results** ([resultController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/resultController.js)):
  - Updated `getTournamentResult` (`GET /api/v1/results/tournament/:tournamentId`) to return `200 OK` with `data: null` instead of throwing `404 Not Found` when a match result is not published yet.
  - Completely eliminated repeated red `404 (Not Found)` console error logs during tournament details page background polling.

### Interactive User Avatar Photo Upload Feature (Completed 2026-07-25)
- [x] **Backend Multipart Route & Storage Sync** ([authRoutes.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/routes/authRoutes.js), [authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js)):
  - Added `upload.fields` and `upload.single` middleware to `/api/v1/auth/update-profile` and `/api/v1/auth/avatar`.
  - Processed uploaded profile avatar files and synced updates to disk storage (`users.json`), `mockUsers`, and active session tokens.
- [x] **1-Click Avatar Photo Upload UI** ([dashboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/dashboard/page.tsx)):
  - Made Profile Summary card avatar picture directly clickable with a hover `UPLOAD PHOTO` overlay icon.
  - Selecting an image file immediately uploads and updates the user's avatar image across Navbar, Dashboard, and Match Leaderboards.

### "Bitcoin DeFi" Design System Overhaul (Completed 2026-07-25)
- [x] **Central Design Tokens & Typography** ([tailwind.config.js (user)](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/tailwind.config.js), [tailwind.config.js (admin)](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/tailwind.config.js), [globals.css (user)](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/globals.css), [globals.css (admin)](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/globals.css)):
  - Remapped global color palette to True Void `#030304`, Dark Matter `#0F1115`, Bitcoin Orange `#F7931A`, Burnt Orange `#EA580C`, and Digital Gold `#FFD600`.
  - Configured typography system: `Space Grotesk` (Headings), `Inter` (Body), `JetBrains Mono` (Monospace Data).
  - Built reusable utilities: `.bg-grid-pattern` (fading radial network overlay), `.text-btc-gradient` (`linear-gradient(to right, #F7931A, #FFD600)` text gradient), `.shadow-orange-glow`, `.shadow-gold-glow`, `.corner-border-accent`, `.tech-input`, pill buttons (`rounded-full`), and elevated floating block cards.
- [x] **Site-Wide Kinetic Typography Design System Overhaul**:
  - Implemented **Kinetic Typography Design System** across `user-frontend` and `admin-frontend`.
  - Color Tokens: Rich Black (`#09090B`), Off-white (`#FAFAFA`), Acid Yellow (`#DFE104`), Zinc 700 Borders (`#3F3F46`).
  - Added SVG feTurbulence poster/print noise texture overlay (`opacity-[0.03]`).
  - Viewport Kinetic Typography: `text-[clamp(3.5rem,11vw,13rem)]` viewport-scaled display headlines with uppercase tracking-tighter lockups.
  - Brutalist Geometry: Sharp 0px corners (`rounded-none`), 2px solid zinc borders (`border-2 border-[#3F3F46]`).
  - Hard Color Inversions on Hover: Cards and primary controls flood to `#DFE104` Acid Yellow background with pure `#000000` text inversion.
  - Infinite Marquees: Raw GPU-accelerated stats & reviews marquees without gradient fades (`gradient={false}`).
  - Extra-Tall Technical Inputs: Underline-only inputs (`border-b-2 border-[#3F3F46] focus:border-[#DFE104]`).

- [x] **Google OAuth Credentials Configuration** (`backend/.env`, `user-frontend/.env.local`):
  - Configured `GOOGLE_CLIENT_ID` (`915518431027-hlqlv3t55ipdhpc13i5gu80uv8g3kh0v.apps.googleusercontent.com`) & `GOOGLE_CLIENT_SECRET` in backend `.env`.
  - Configured `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `user-frontend/.env.local`.
  - Loaded Google GIS Client Script (`https://accounts.google.com/gsi/client`) in root layout (`user-frontend/src/app/layout.tsx`).
  - Integrated `initTokenClient` OAuth popup flow to dynamically fetch verified Google profile (`email`, `name`, `sub`, `picture`) and log in users smoothly.

- [x] **Dashboard Identification Form UI Cleanup** ([dashboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/dashboard/page.tsx)):
  - Removed redundant "PROFILE AVATAR" and "GOVT ID PROOF VERIFICATION" raw file upload buttons from the player identification form.
  - Avatar photo update remains seamlessly handled by 1-click interactive profile photo upload at top of dashboard.

- [x] **Secure Email OTP Authentication Backend Module** ([sendEmail.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/utils/sendEmail.js), [userModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/userModel.js), [authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js), [authRoutes.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/routes/authRoutes.js)):
  - **Schema Update**: Added `isVerified` (Boolean, default `false`), `otp` (String), and `otpExpires` (Date) to Mongoose User schema.
  - **Nodemailer Utility**: Created dedicated Gmail transporter utility with zero-spacing `.env` configuration (`EMAIL_USER`, `EMAIL_PASS`).
  - **Signup & Resend**: Generates secure 6-digit random OTP with a 10-minute expiry timestamp and dispatches HTML verification email via Nodemailer.
  - **OTP Verification Route**: (`POST /api/v1/auth/verify-otp`) Validates OTP code & expiry, sets `isVerified = true`, clears OTP fields, and returns JWT access token.
  - **Login Guard**: Blocks unverified accounts with `403 Forbidden` status code until email verification is complete.

---



### Live Chat Access & Navigation Enhancements (Completed 2026-07-27)
- **TypeScript User Interface Type Fix** ([AuthContext.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/context/AuthContext.tsx)): Added optional `_id?: string;` field to the `User` interface in `AuthContext.tsx`, resolving the TypeScript compilation error (`Property '_id' does not exist on type 'User'`) when referencing `user?._id` in components like [LiveChat.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/LiveChat.tsx).
- **Viewport Auto-Scroll Fix** ([LiveChat.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/LiveChat.tsx)): Replaced global `window.scrollIntoView()` with internal `messagesContainerRef` container scroll (`scrollTop = scrollHeight`). Clicking "VIEW MATCH" on tournament cards opens the details page smoothly at the top without page jump.
- **5-Minute Post-Completion Auto-Lock**: Added `completedAt` timestamp tracking to `Tournament` model schema ([tournamentModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/tournamentModel.js)). Chat auto-locks exactly 5 minutes post tournament completion (`tournamentStatus === 'COMPLETED'`).
- **Dynamic Winner Prize Pool Breakdown** ([page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/tournaments/%5Bid%5D/page.tsx)): Added dynamic prize breakdown rows in the Tournament Summary sidebar card. Reads `winnerCount` ('1', '2', or '3') and `prizeBreakdown` (first, second, third prizes) set by admin. Automatically displays 🥇 1st Prize, 🥈 2nd Prize, and 🥉 3rd Prize conditionally based on declared winner count.
- **Custom Pacman Loading Animation Integration** ([globals.css](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/globals.css) & [PacmanLoader.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/PacmanLoader.tsx)): Added Uiverse Pacman eating dots CSS animation matching neon yellow theme (`#EFF107`). Integrated into Next.js App Router root [loading.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/loading.tsx) and page loading states (`Tournaments`, `Tournament Details`, `Leaderboard`, `Dashboard`).

### Comprehensive UI/UX & Framer Motion Animations Overhaul (Completed 2026-07-28)
- **Framer Motion Setup & Dependency Integration**: Installed and configured `framer-motion` (`^11.0.8`) across `user-frontend` and `admin-frontend`.
- **Navigation & Mobile Drawer Motion Architecture** ([Navbar.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/Navbar.tsx), [AdminSidebar.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/components/AdminSidebar.tsx)):
  - Added spring motion to header logo, nav buttons, and active tab highlights.
  - Wrapped notification dropdown drawer, community menu, and mobile navigation drawer in `AnimatePresence` for smooth exit & enter animations.
  - Upgraded Admin Sidebar with item spring hover effects (`whileHover={{ x: 4 }}`).
- **Kinetic Landing Page Staggered Motion** ([page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/page.tsx)):
  - Added staggered motion entrance (`staggerContainer`) for hero title, subtitle, CTA buttons, and stats cards.
  - Added ambient animated background glowing blobs (`animate={{ scale: [1, 1.2, 1] }}`).
  - Integrated scroll-triggered card entrance animations (`whileInView`) and interactive card hover tilt effects (`whileHover={{ y: -8 }}`).
- **Tournaments Arena Staggered Motion** ([tournaments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/tournaments/page.tsx)):
  - Added spring motion animations to game filter category pill buttons.
  - Animated tournament grid cards with staggered motion children and dynamic hover glow transitions (`shadow-[0_0_30px_-10px_rgba(223,225,4,0.25)]`).
- **Global Leaderboard Podium & Data Table Motion** ([leaderboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/leaderboard/page.tsx)):
  - #1 Champion, #2 Silver, and #3 Bronze podium cards animated with spring scale-up and glowing halo rings.
  - Staggered leaderboard data table row entrance animations (`motion.tr`).
- **Spring Backdrop & Modal Popups** ([PaymentModal.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/PaymentModal.tsx)):
  - Wrapped UPI payment modal with `AnimatePresence` and spring scale-up entrance (`type: 'spring', stiffness: 300, damping: 25`).
- **Admin Dashboard Metrics Stagger** ([admin-frontend/src/app/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/page.tsx)):
  - Added staggered motion entrance for total users, active tournaments, revenue pool, and live matches metric cards.
- **Global Indian Rupee (₹) Currency Standardization**: Replaced all remaining dollar signs (`$`) across the website with Indian Rupees (`₹`) in entry fees, winner cash prizes, payment modals, leaderboard earnings, and backend persistent stores.
- **Comprehensive User Profile Edit Feature** ([page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/dashboard/page.tsx) & [authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js)): Added **EDIT PROFILE** button in dashboard header card opening an interactive edit profile modal. Allows users to edit Full Name (`name`), Phone Number (`phone`), Avatar Photo (`profileImage`), In-Game Handle (`gameName`), and Character UID (`gameUID`). Form submits to `/api/v1/auth/update-profile` and updates `AuthContext` + `localStorage` real-time.
- **Cross-Origin-Opener-Policy (COOP) OAuth Fix** ([next.config.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/next.config.js) & [server.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/server.js)): Configured `Cross-Origin-Opener-Policy: same-origin-allow-popups` headers across frontend Next.js configs and backend Helmet middleware. Prevents browser security warnings (`window.closed call blocked`) when Google OAuth / Identity SDK popups open.

### Esports Gaming Community System (Modules 1–16) (Completed 2026-07-27)
- **Module 1: Player Directory** ([players/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/players/page.tsx)): Search & discover registered players with game/role/country filters, win rate & prize sorting, online presence badges, and connect buttons.
- **Module 2: Public Player Profile** ([players/[id]/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/players/%5Bid%5D/page.tsx)): Public profiles featuring custom banners, avatars, statistics, badges, clan roster links, and direct messaging/connection controls.
- **Module 3: Friend System Hub** ([friends/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/friends/page.tsx) & [friendshipModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/friendshipModel.js)): Interactive network hub for incoming, outgoing, accepted, and blocked relationships with real-time request handling.
- **Module 4: Real-Time Direct Chat** ([chat/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/chat/page.tsx) & [messageModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/messageModel.js)): 1-on-1 private messaging restricted to accepted friends with Socket.io real-time delivery, typing indicators, image attachments, and emoji shortcuts.
- **Module 5 & 6: Permanent Teams & Friend Invitations** ([teams/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/teams/page.tsx) & [teamModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/teamModel.js)): Clan creation & management. Captains browse ONLY their accepted friends list to dispatch team invitations.
- **Module 7: Squad Tournament Registration**: Captain registers team for squad tournaments -> dispatches invitations to roster members -> registration approved once ALL members accept.
- **Module 8 & 14: Real-Time Socket Events** ([socket/index.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/socket/index.js)): Added `direct_message`, `user_online`, `typing_start`, `typing_stop`, and notification socket dispatchers.
- **Module 9 & 10 & 11: Automated Stats & Team Leaderboard** ([team-leaderboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/team-leaderboard/page.tsx)): Automatic statistics calculation and team leaderboard with game, mode, and timeline filters.
- **Module 12: Admin Community Moderation Hub** ([teams/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/community/teams/page.tsx)): Admin panel hub to inspect all permanent clans, captains, roster members, and squad tournament registrations.

### Ultra-Premium & Dynamic Motion Login Page Redesign (Completed 2026-07-27)
- **Framer Motion Floating Cyber Cards & Kinetic Visuals** ([login/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/login/page.tsx)): Integrated dynamic Framer Motion floating elements (`#1 Rank Athlete Badge`, `Live Lobby #941 Card`, `12-Digit UTR Security Badge`) that continuously float with smooth sine-wave animations.
- **Rotating Neon Beam & Scanning Laser Overlay**: Added 360-degree rotating conic neon light beam and vertical scanning laser lines behind the glassmorphism authentication card.
- **Top & Bottom Infinite Marquee Tickers**: Integrated double infinite marquee text tickers (`₹5,00,000+ Distributed`, `15-Min Automated Lobby Credentials`, `SSL Encryption`, `Real-Time Bracket Engine`).
- **Glassmorphism Auth Card & Interactive Features**: Form container styled with deep void glassmorphism (`#0D1117/90`, `backdrop-blur-2xl`), electric neon accents (`#DFE104`), interactive password eye toggle (`Eye` / `EyeOff`), Google SSO button, spring button micro-interactions, and a **⚡ DEMO LOGIN** button for instant 1-click test authentication.

### User & Admin Portals Responsiveness Upgrade (Completed 2026-07-27)
- **User Frontend Mobile Navigation Drawer** ([Navbar.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/Navbar.tsx)): Added mobile hamburger button (`Menu` / `X`) and slide-down navigation drawer overlay on small screen devices (`< md`). Gives mobile phone users 100% access to all sections (Tournaments, Matches, Player Directory, Friends, Direct Chat, Teams, Leaderboard, Support, Notifications).
- **Admin Portal Mobile Navigation Header & Slide-over Drawer** ([AdminSidebar.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/components/AdminSidebar.tsx)): Implemented a mobile top header with `APEX ADMIN` branding and animated mobile navigation drawer for phone and tablet screens while retaining sticky sidebar for desktop screens (`>= md`).
- **Responsive Flex Containers & Scrollable Tables** (All Admin Pages & User Hubs): Converted outer layout divs across all Admin pages to `flex flex-col md:flex-row min-h-screen` and verified touch-friendly horizontal scroll containers (`overflow-x-auto`) for data tables.

### Home Page Real Leaderboard Data Integration (Completed 2026-07-27)
- **Dynamic Leaderboard Data Fetching** ([page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/page.tsx)): Replaced hardcoded demo user data (`PXS_VIPER`, `CYBER_SHADOW`, `NEON_BLADE`) on the landing page Hall of Fame section with live API integration (`/leaderboard?category=OVERALL` with fallback to `/community/players?sortBy=prize`).
- **Dynamic Live Payout Feed & Card Grid**: Updated both the scrolling Marquee feed and Top Earners card grid to dynamically render real registered players' IGNs, preferred games, total wins, and verified earnings.

### Clan & Team Invitations & Roster Synchronization (Completed 2026-07-27)
- **Pending Team Invitations API & UI** ([communityController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/communityController.js), [communityRoutes.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/routes/communityRoutes.js) & [teams/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/teams/page.tsx)): Added `GET /api/v1/community/teams/invitations` endpoint to fetch pending team/clan invitations for the logged-in user. Rendered a prominent **INCOMING TEAM & CLAN INVITATIONS** banner on `/community/teams` featuring team logo, tag, captain name, game title, and 1-click `ACCEPT` & `DECLINE` action buttons.
- **Roster Joining & Player Profile Enrichment**: Enhanced `respondTeamInvitation` to add accepting users to `mockTeamMembers` with `MEMBER` role. Updated `getMyTeam` with `getUserDetailObj` enrichment, rendering rich player roster cards (profile avatar photo, username, IGN handle, character UID, rank, level, and captain/member badges).

### Player Directory Self-Filtering & Dynamic Friend Status Badges (Completed 2026-07-27)
- **Self Player Card Exclusion** ([communityController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/communityController.js) & [players/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/players/page.tsx)): Filtered out the logged-in user's own profile card (`isSelf`) from the Player Directory grid in both backend API queries and client rendering.
- **Dynamic Friend Relationship Badges**: Attached `friendStatus` ('ACCEPTED', 'PENDING_SENT', 'PENDING_RECEIVED', 'NOT_FRIEND') to each player object in `getPlayersList`. On already-connected friend cards, replaced the `UserPlus` (+) button with a green `FRIENDS` status badge, and replaced sent requests with a yellow `PENDING` badge. Added `friendStatus?: string;` to `Player` interface definition in [players/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/players/page.tsx) to satisfy Next.js TypeScript compilation checks.

### Real-Time 1-on-1 Direct Friend Chat Fix & Photo Attachments (Completed 2026-07-27)
- **Frontend Header Typo & Socket Listener Fix** ([chat/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/chat/page.tsx)): Fixed header typo (`Content-[#Type]` -> `Content-Type: multipart/form-data`) in direct chat send request. Enhanced Socket.io real-time `direct_message` listener with deduplication and flexible sender/recipient matching across user IDs and emails. Added photo attachment button (`Paperclip`) with live image preview chip.
- **Backend Dual-Storage Chat Persistence** ([communityController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/communityController.js)): Updated `getDirectMessages` and `sendDirectMessage` with dual-storage persistence (MongoDB `Message` schema when connected + persistent JSON store fallback), supporting multi-attribute user ID resolution and instant Socket broadcasting.

### Friend Requests Full Player Profile Details Resolution (Completed 2026-07-27)
- **Backend User Resolution Helper** ([communityController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/communityController.js)): Implemented `getUserDetailObj` to lookup complete user details across MongoDB and persistent JSON stores via `_id`, `id`, or `email`. Resolves full user profile objects (Name, Avatar, Game Handle, Character UID, Game Title, Gaming Role, Level, Rank, Matches, Wins, Prize ₹) for incoming, outgoing, and accepted friend requests.
- **Rich Player Request Cards UI** ([friends/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/friends/page.tsx)): Upgraded Incoming, Outgoing, and Accepted Friends cards to display complete player profile cards with avatar photos, IGN handles, Character UIDs, game & role badges, career statistics matrix, View Profile link, and 1-click action buttons (Accept, Reject, Direct Chat, Remove).

### User Primary Game & Role Selection Feature (Completed 2026-07-27)
- **User Schema & Controller Updates** ([userModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/userModel.js) & [authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js)): Added `preferredGame` (Free Fire, BGMI, Valorant, Call of Duty, PUBG, Clash Royale, CS:GO) and `preferredRole` (Assaulter, Sniper, IGL, Support, Rusher, Entry Fragger, Anchor, Scout, Flex) to Mongoose schema, profile response formatter, and `updateProfile` API endpoint.
- **Frontend Dashboard Profile Edit UI** ([dashboard/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/dashboard/page.tsx) & [AuthContext.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/context/AuthContext.tsx)): Added dropdown selection inputs for Primary Game & Gaming Role in the Edit Profile modal and displayed chosen badges on the user's dashboard header grid.
- **Player Directory & Public Profile Live Sync** ([players/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/players/page.tsx) & [players/[id]/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/community/players/%5Bid%5D/page.tsx)): Dynamically renders user-selected Game and Role badges across Player Directory cards and Public Player Profiles.

### Production-Ready FCM Push & Real-Time Notification Infrastructure (Completed 2026-07-27)
- **Firebase & Firebase Admin SDK Configuration**:
  - Backend ([firebaseAdmin.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/config/firebaseAdmin.js)): Initialized Firebase Admin SDK for `tournament-ac0ae`. Supports service account JSON or environment variable authentication.
  - Frontend ([firebase.ts](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/lib/firebase.ts)): Configured Client Firebase App and Messaging instance with public VAPID Key (`BAcpFlauWmnytoCC6TXkyETCQo7K...`).
- **Service Worker & Push Notifications**:
  - Public Service Worker ([firebase-messaging-sw.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/public/firebase-messaging-sw.js)): Handles background push notifications, native browser notification popups with icon, badge, vibration, and deep-link click routing (`link`).
  - Custom React Hook ([useFCM.ts](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/hooks/useFCM.ts)): Prompts user for browser notification permission, generates FCM Token, posts token to backend on login, and unregisters token on logout. Supports multiple device tokens per user.
- **Database & Hybrid Dispatch Engine**:
  - Schemas ([fcmTokenModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/fcmTokenModel.js) & [notificationModel.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/models/notificationModel.js)): Expanded `type` enum to 18 distinct notification types (`TOURNAMENT_CREATED`, `MATCH_REMINDER`, `ROOM_RELEASED`, `PRIZE_CREDITED`, `FRIEND_REQUEST`, `SUPPORT_REPLY`, etc.) with `link` and `metadata`.
  - Service ([fcmService.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/services/fcmService.js)): Multicast FCM push dispatch to target user tokens or all registered devices with automatic pruning of invalid/expired tokens.
  - Hybrid Dispatch Strategy ([notificationController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/notificationController.js)): Saves notification to MongoDB/store -> emits Socket.io `user_notification` for online clients -> sends FCM Push Notification for offline/background devices.
- **REST API Endpoints**:
  - `POST /api/v1/notifications/fcm-token` (Register device token)
  - `DELETE /api/v1/notifications/fcm-token` (Unregister token on logout)
  - `GET /api/v1/notifications/my-notifications` (Paginated notifications with status & type filters)
  - `PATCH /api/v1/notifications/:id/read` & `PATCH /api/v1/notifications/:id/unread`
  - `PATCH /api/v1/notifications/read-all` & `DELETE /api/v1/notifications/:id` & `DELETE /api/v1/notifications/all`
  - `POST /api/v1/notifications/broadcast` & `POST /api/v1/notifications/send-push` (Admin push broadcasting)
- **UI Components & Notification Center**:
  - Web Audio Chime ([notificationSound.ts](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/lib/notificationSound.ts)): High-tech esports dual-tone synth chime played on foreground alert arrival.
  - Toast Infrastructure ([ToastContext.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/context/ToastContext.tsx) & [NotificationToast.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/NotificationToast.tsx)): Floating glassmorphism foreground toast popups.
  - Upgraded Navbar Bell ([Navbar.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/components/Navbar.tsx)): Animated ringing bell with unread counter badge, permission banner, dropdown preview drawer, and quick deep-link routing.
  - Notification Center Page ([page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/notifications/page.tsx)): Full `/notifications` hub with tab filters (`ALL`, `UNREAD`, `MATCHES`, `COMMUNITY`, `PAYMENTS`, `SYSTEM`), search filter, push permission banner, mark read/unread, delete single, delete all, and pagination.

### Admin Payment Verification Visibility & Tournament Sync Fix (Completed 2026-07-27)
- **Hybrid Store & Database Sync for Payments** ([paymentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/paymentController.js)):
  - Updated `submitPayment` to write payment submissions to both `freshPayments` (`backend/data/payments.json` disk store) and MongoDB Atlas.
  - Updated `getPendingPayments` to merge pending payments from both `freshPayments` store and MongoDB Atlas, fixing the bug where user-submitted payment proofs and screenshots were hidden from the Admin verification list (`/payments`).
  - Updated `approvePayment` and `rejectPayment` to handle hybrid store/MongoDB records, update registration status to `CONFIRMED`/`PAID` or `REFUNDED`, and trigger real-time Socket.io and FCM push notifications.
- **Tournament Creation Sync Fix** ([tournamentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/tournamentController.js) & [admin-frontend/tournaments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/tournaments/page.tsx)):
  - Validated `createdBy` Mongoose ObjectId to prevent `CastError` when admins log in with dev tokens (`dev-admin-id`).
  - Merged local file store `mockTournaments` and MongoDB query results in `getAllTournaments` so newly created tournaments appear immediately in admin and user lists.
- **COOP Policy & Connection Fallback Fixes** ([server.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/server.js), [user-frontend/src/lib/api.ts](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/lib/api.ts), [admin-frontend/src/lib/api.ts](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/lib/api.ts)):
  - Changed `crossOriginOpenerPolicy` to `{ policy: 'unsafe-none' }` in Helmet to prevent browser COOP popup window warnings during Google OAuth flow.
  - Added automatic Axios connection retry interceptors in both `user-frontend` and `admin-frontend`. If local backend is down or unreachable (`ERR_CONNECTION_REFUSED`), requests automatically failover to `https://apex-esports.onrender.com/api/v1`.

### Login Page Left Showcase Section Removal (Completed 2026-07-27)
- **Login UI Layout Simplification** ([login/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/user-frontend/src/app/login/page.tsx)): Removed the left-side arena showcase hero column, top athlete floating badge, live match lobby badge, and multi-column grid layout. The login authentication card is now cleanly centered on both desktop and mobile viewports with a header logo.

### MongoDB Atlas Database Integration (Completed 2026-07-27)
- **MongoDB Atlas URI Integration** ([.env](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/.env) & [.env.example](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/.env.example)): Configured production-grade MongoDB Atlas cloud connection string (`mongodb+srv://divyanshsingh:divyanshsingh18@cluster0.1odytrs.mongodb.net/esports_platform?retryWrites=true&w=majority`).
- **Removed Local Database Fallback** ([db.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/config/db.js)): Removed local `127.0.0.1:27017` fallback string from Mongoose initialization, enforcing `process.env.MONGO_URI` requirement for database connectivity. Verified successful connection to Atlas cluster.

### Complete Investigation & Multi-Bug Fix (Completed 2026-07-22)
All 6 critical bugs in the Admin ↔ User data sync pipeline were found and fixed:

- **Bug #2 Fixed** ([authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js)): Removed hardcoded fake users (Alex Vance, Sarah Connor, Admin Boss) from `getRegisteredUsersList()`. Admin now sees **only real registered users**.
- **Bug #3 Fixed** ([authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js) L65): `signup()` now registers the token in `tokenToUserMap`. Users who registered but haven't logged in explicitly are now correctly identified in subsequent API calls.
- **Bug #4 Fixed** ([paymentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/paymentController.js) L51): Removed hardcoded fallback name "Alex Vance" and email "alex@esports.com". Payment records now show **real player names and emails** in admin.
- **Tournament Title Fix** ([paymentController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/paymentController.js) L61): Tournament title now looked up from persistent `tournaments.json` store — admin sees real tournament names.
- **Bug #7 Fixed** ([authController.js](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/backend/src/controllers/authController.js) L196): `updateProfile()` now persists changes to `mockUsers` store and `tokenToUserMap` — profile updates survive server restarts and are visible to admin.
- **Bug #8 Fixed** ([payments/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/payments/page.tsx), [users/page.tsx](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/admin-frontend/src/app/users/page.tsx)): Admin pages now auto-refresh every **30 seconds** + have manual Refresh button. New registrations and payments appear without browser reload.

### Confirmed Working Flow
- User registers → immediately visible in admin Users Hub
- User submits payment with UTR → immediately visible in admin Pending Payments with correct player name
- Admin can Approve / Reject payment — works correctly
- Profile updates persist and are visible to admin

---

## 8. Environment & Deployment Notes

### Deployed & Local Endpoints
- **User Frontend App (Deployed Vercel)**: `https://apex-esports-zlbc.vercel.app`
- **Admin Frontend App (Deployed Vercel)**: `https://apex-esports-admin.vercel.app`
- **Render Backend Service (Deployed)**: `https://apex-esports.onrender.com/api/v1`
- **Local User Frontend App (Dev)**: `http://localhost:3000`
- **Local Admin Frontend App (Dev)**: `http://localhost:3001`
- **Local Backend Service (Dev)**: `http://localhost:5000/api/v1`

> Both local execution (`http://localhost:3000`, `http://localhost:3001`, `http://localhost:5000`) and production deployment (`https://apex-esports-zlbc.vercel.app`, `https://apex-esports-admin.vercel.app`, `https://apex-esports.onrender.com`) are fully configured and CORS-whitelisted across `backend`, `user-frontend`, and `admin-frontend`.

### Vercel Deployment Configuration
- Added **[vercel.json](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/vercel.json)** in root workspace directory:
  ```json
  {
    "buildCommand": "cd user-frontend && npm run build",
    "outputDirectory": "user-frontend/.next"
  }
  ```
- Added `"build": "cd user-frontend && npm run build"` in root **[package.json](file:///c:/Users/divya/OneDrive/Desktop/tornament-2/package.json)** so Vercel monorepo deployments build and serve `user-frontend` automatically.

### Useful Commands
```bash
# Install all dependencies across monorepo
npm run install:all

# Run all services concurrently (Backend + User App + Admin Portal)
npm run dev:all

# Run individual services
npm run dev:backend
npm run dev:user
npm run dev:admin
```
