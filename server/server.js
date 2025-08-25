import http from "http";
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { createClient } from "redis";
import cors from "cors";
import mongoose from "mongoose";
import router from "./api.js";
import { userLeft } from "./socket/userleft.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
app.use(cors());
app.use(express.json());
app.use("/", router);

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
      console.log("all playing users:", Array.from(playingUsers.keys()));
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
      waitingPlayerusername = null;
    } else {
      waitingPlayer = socket.id;
      waitingPlayerusername = userData.username;
      socket.emit("system", "unpaired");
    }
  });

  socket.on("leave", async (userData) => {
    console.log("User left:", userData);
    userLeft(
      socket,
      io,
      waitingPlayer,
      waitingPlayerusername,
      playingUsersID,
      playingUsers,
      games,
      playerRooms
    );
  });

  // Handle moves
  socket.on("moves", async (move) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    await pubClient.publish("moves", JSON.stringify({ roomId, move }));
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    userLeft(
      socket,
      io,
      waitingPlayer,
      waitingPlayerusername,
      playingUsersID,
      playingUsers,
      games,
      playerRooms
    );
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
