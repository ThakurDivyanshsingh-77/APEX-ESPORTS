<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=220&section=header&text=APEX%20ESPORTS&fontSize=62&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Competitive%20Esports%20Tournament%20Management%20Platform&descAlignY=58&descSize=18" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&duration=3000&pause=1000&color=A78BFA&center=true&vCenter=true&width=700&lines=Real-time+Match+Tracking+%26+Leaderboards;UPI+Payment+Verification+for+Entry+Fees;Room+Credential+Auto-Reveal+System;Built+for+Free+Fire+%26+BGMI+Tournaments" alt="Typing SVG" />

<br/><br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-apex--esports-6C5CE7?style=for-the-badge&logo=vercel&logoColor=white)](https://apex-esports-zlbc.vercel.app/)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

</div>

---

## 🎮 About the Project

**APEX ESPORTS** is a full-stack competitive esports tournament management platform built for mobile battle-royale titles like **Free Fire** and **BGMI**. It replaces the usual "manage tournaments over WhatsApp groups and spreadsheets" chaos with a proper product — separate **User** and **Admin** frontends, a dedicated backend, real-time updates, and automated payment + leaderboard flows.

Players can register their squads, pay entry fees via UPI, get their room ID/password the moment a match goes live, and track standings on a real-time leaderboard — while admins run the entire tournament lifecycle from one dashboard.

**🔗 Live:** [apex-esports-zlbc.vercel.app](https://apex-esports-zlbc.vercel.app/)

---

## ✨ Key Features

### For Players
- 🏆 **Team Registration** — seamless squad sign-up flow for tournaments
- 💸 **UPI Payment Verification** — entry fees paid and verified via UPI, no manual back-and-forth
- 🔐 **Room Credential Auto-Reveal** — match Room ID & Password unlock automatically at the scheduled match time, no admin has to paste it manually
- 📊 **Real-time Leaderboard** — live standings update as matches conclude
- 🔔 **Push Notifications** — Firebase Cloud Messaging (FCM) alerts for match timings, results, and announcements

### For Admins
- 🎛️ **Dedicated Admin Dashboard** (`admin-frontend`) — separate, locked-down interface for tournament operators
- ✅ **Payment Verification Panel** — approve/reject UPI payment submissions
- 📅 **Match & Room Management** — schedule matches, assign room credentials, control reveal timing
- 🏅 **Automated Leaderboard Engine** — standings calculated and updated without manual score entry
- 👥 **Team & Player Oversight** — view and manage all registered teams in one place

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **User Frontend** | JavaScript (React) |
| **Admin Frontend** | JavaScript (React) |
| **Backend** | Node.js + Express |
| **Database** | MongoDB |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **Deployment** | Vercel (Frontends) · Render (Backend) |

---

## 📂 Project Structure

```
APEX-ESPORTS/
├── admin-frontend/       # Admin dashboard — tournament & payment management
├── user-frontend/        # Player-facing app — registration, payments, leaderboard
├── backend/              # REST API — auth, matches, payments, notifications
├── PROJECT_CONTEXT.md    # Internal project context & architecture notes
├── vercel.json           # Vercel deployment config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or Atlas)
- Firebase project (for FCM push notifications)

### Installation

```bash
# Clone the repository
git clone https://github.com/ThakurDivyanshsingh-77/APEX-ESPORTS.git
cd APEX-ESPORTS

# Install backend dependencies
cd backend
npm install

# Install user frontend dependencies
cd ../user-frontend
npm install

# Install admin frontend dependencies
cd ../admin-frontend
npm install
```

### Environment Variables

Create a `.env` file inside `backend/` with the following:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_SERVER_KEY=your_firebase_fcm_key
UPI_ID=your_upi_id_for_verification
```

### Running Locally

```bash
# Start backend
cd backend
npm run dev

# Start user frontend (in a new terminal)
cd user-frontend
npm run dev

# Start admin frontend (in a new terminal)
cd admin-frontend
npm run dev
```

---

## 🗺️ Roadmap

- [ ] In-app chat/support for players
- [ ] Multi-game expansion beyond Free Fire & BGMI
- [ ] Automated payout system for winners
- [ ] Analytics dashboard for tournament performance

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/ThakurDivyanshsingh-77/APEX-ESPORTS/issues).

## 📄 License

This project is open source. Add your preferred license (MIT recommended) in a `LICENSE` file.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=150&section=footer&animation=fadeIn" width="100%"/>

**Built by [Divyansh Singh](https://github.com/ThakurDivyanshsingh-77)**

</div>
