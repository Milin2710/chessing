const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const { createClient } = require("redis");
const User = require("./models/User");
const Game = require("./models/Game");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chessing")
  .then(() => console.log("MongoDB connected"));

const pubClient = createClient();
const subClient = pubClient.duplicate();

let waitingPlayer = null; // Store socket.id of waiting player
let waitingPlayerusername = null; // Store username of waiting player
const playerRooms = new Map(); // socket.id -> roomId
const playingUsers = new Map();
const playingUsersID = new Map();
const games = new Map();

(async () => {
  await pubClient.connect();
  await subClient.connect();

  // Listen for Redis messages and emit only to that room
  await subClient.subscribe("moves", (message) => {
    try {
      const { roomId, move } = JSON.parse(message);
      games.get(roomId).moves.push(move);
      console.log(`Move received in room ${roomId}:`, move);
      io.to(roomId).emit("moves", move);
    } catch (err) {
      console.error("Failed to parse move:", message);
    }
  });
})();

io.on("connection", (socket) => {
  console.log("New user:", socket.id);

  socket.on("join", async (userData) => {
    console.log("User joined:", userData);

    if (waitingPlayer && waitingPlayerusername === userData.username) {
      console.log("User already waiting:", userData.username);
      socket.emit("join_fail", "already waiting");
      socket.disconnect(true);
      return;
    }
    if (waitingPlayer && playingUsers.has(userData.username)) {
      console.log("User currently playing:", userData.username);
      socket.emit("join_fail", "currently playing");
      socket.disconnect(true);
      return;
    }

    if (waitingPlayer && waitingPlayerusername !== userData.username) {
      const roomId = `room_${waitingPlayerusername}_${userData.username}`;

      games.set(roomId, {
        playerw: waitingPlayerusername,
        playerb: userData.username,
        moves: [],
        result: "in_progress",
      });

      playingUsers.set(waitingPlayerusername, {
        socketId: waitingPlayer,
        color: "white",
        opponentId: socket.id,
        opponentUsername: userData.username,
      });
      playingUsersID.set(waitingPlayer, {
        username: waitingPlayerusername,
        color: "white",
        opponentId: socket.id,
        opponentUsername: userData.username,
      });
      playingUsers.set(userData.username, {
        socketId: socket.id,
        color: "black",
        opponentId: waitingPlayer,
        opponentUsername: waitingPlayerusername,
      });
      playingUsersID.set(socket.id, {
        username: userData.username,
        color: "black",
        opponentId: waitingPlayer,
        opponentUsername: waitingPlayerusername,
      });

      socket.join(roomId);
      io.sockets.sockets.get(waitingPlayer)?.join(roomId);

      playerRooms.set(socket.id, roomId);
      playerRooms.set(waitingPlayer, roomId);

      io.to(waitingPlayer).emit("system", {
        paired: true,
        color: "white",
        opponentId: socket.id,
      });
      io.to(socket.id).emit("system", {
        paired: true,
        color: "black",
        opponentId: socket.id,
      });

      console.log(`Paired ${waitingPlayer} and ${socket.id} in ${roomId}`);
      waitingPlayer = null;
    } else {
      waitingPlayer = socket.id;
      waitingPlayerusername = userData.username;
      socket.emit("system", "unpaired");
    }
  });

  // Handle moves
  socket.on("moves", async (move) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    await pubClient.publish("moves", JSON.stringify({ roomId, move }));
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    if (waitingPlayer === socket.id) {
      waitingPlayer = null;
    }
    const username = playingUsersID.get(socket.id);
    if (username) {
      playingUsers.delete(username);
      playingUsersID.delete(socket.id);
    }
    console.log(`User ${username} removed from playingUsers`);

    if (
      username &&
      username.color === "white" &&
      games.get(playerRooms.get(socket.id))
    ) {
      const game = await Game.create({
        playerw: username.username,
        playerb: username.opponentUsername,
        moves: games.get(playerRooms.get(socket.id)).moves,
        result: "black won",
      });
      const playerw = await User.findOne({ username: username.username });
      if (playerw) {
        playerw.games.push(game._id);
        await playerw.save();
      }
      const playerb = await User.findOne({
        username: username.opponentUsername,
      });
      if (playerb) {
        playerb.games.push(game._id);
        await playerb.save();
      }
    } else if (
      username &&
      username.color === "black" &&
      games.get(playerRooms.get(socket.id))
    ) {
      const game = await Game.create({
        playerw: username.opponentUsername,
        playerb: username.username,
        moves: games.get(playerRooms.get(socket.id)).moves,
        result: "white won",
      });
      const playerw = await User.findOne({
        username: username.opponentUsername,
      });
      if (playerw) {
        playerw.games.push(game._id);
        await playerw.save();
      }
      const playerb = await User.findOne({ username: username.username });
      if (playerb) {
        playerb.games.push(game._id);
        await playerb.save();
      }
    }

    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      io.to(roomId).emit("result", "Opponent left");
      [...playerRooms.entries()]
        .filter(([_, r]) => r === roomId)
        .forEach(([playerId]) => playerRooms.delete(playerId));
    }
  });
});

app.post("/sync-user", async (req, res) => {
  try {
    // console.log("Syncing user:", req.body);
    const { clerkId, username, email, profilePhoto } = req.body;

    // Check if user already exists
    let user = await User.findOne({ username });

    if (user) {
      // Existing user → update lastOnline
      user.lastOnline = new Date();
      await user.save();
      return res.json({ message: "User logged in", user });
    }

    // New user → create entry
    user = await User.create({
      clerkId,
      username,
      email,
      profilePhoto,
    });

    res.json({ message: "New user created", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
