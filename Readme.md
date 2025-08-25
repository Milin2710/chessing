# ♟️ Chess Multiplayer 3D

A real-time multiplayer chess platform with a **3D interactive board**, built using modern full-stack technologies.
Players can log in, create or join rooms, and play chess against others in real time.

---

### Game Board

![Game Board](./readme-assets/game.png)

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React framework)
- **3D Rendering**: [Three.js](https://threejs.org/) for interactive 3D chessboard
- **Backend**: Node.js + Express
- **Real-time Communication**: [Socket.io](https://socket.io/) for handling game moves & room updates
- **Database**: MongoDB for storing users, games, and history
- **Caching / PubSub**: Redis for session management and real-time game state sync
- **Authentication**: Clerk for secure login & signup

---

## ✨ Features

- 🔐 **Authentication**: Login or signup using Clerk (supports OAuth providers).
- 🎮 **Multiplayer Chess**: Play against real users in private rooms.
- ♟️ **Chessboard**: Drag and drop pieces to move.
- ⚡ **Real-time Sync**: Moves are instantly broadcast to the opponent using Socket.io.
- 🏆 **Game Tracking**: Store moves, players, and results for each match.
- 📡 **Room System**: Create/join rooms with unique room IDs.
- 🗄️ **State Management**: Game states stored in Redis for fast recovery & persistence.

### Waiting Board

![Waiting Board](./readme-assets/waiting.png)

---

## 📂 Project Structure

```
/client (Next.js frontend)
├── pages
├── components
├── utils
└── styles

/server (Node.js backend)
├── models (MongoDB schemas)
├── routes (API endpoints)
├── sockets (Socket.io logic)
├── redis (cache & pubsub)
└── index.js
```

---

## ⚡ Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Milin2710/chessing.git
   cd chessing
   ```

   **Install Dependencies**

   For server:

   ```bash
   cd server
   npm install
   ```

   For client:

   ```bash
   cd client
   npm install
   ```

   **Setup Environment Variables**

   - MongoDB URI
   - Redis URL
   - Clerk API Keys

   Example `.env` for backend:

   ```env
   MONGO_URI=mongodb+srv://...
   REDIS_URL=redis://localhost:6379
   CLERK_API_KEY=your-clerk-key
   ```

   **Run the project**

   Start backend:

   ```bash
   cd server
   npm run dev
   ```

   Start frontend:

   ```bash
   cd client
   npm run dev
   ```

🚀 **Roadmap**

- ✅ Basic login & signup
- ✅ Multiplayer socket rooms
- ✅ 3D chessboard with drag & drop
- 🔄 Game history persistence in MongoDB
- 🔄 Leaderboard & player ratings (Elo system)
- 🔄 Spectator mode
- 🔄 Mobile support

⚠️ **Known Issues**

- Illegal moves can still be dragged on the board.
- Turn by Turn moves is not applied.
