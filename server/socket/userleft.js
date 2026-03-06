import User from "../models/User.js";
import Game from "../models/Game.js";

export async function userLeft(
  socket,
  io,
  waitingPlayer,
  waitingPlayerusername,
  playingUsersID,
  playingUsers,
  games,
  playerRooms
) {
  if (waitingPlayer !== null) {
    if (waitingPlayer === socket.id) {
      waitingPlayer = null;
      waitingPlayerusername = null;
      console.log("Waiting player disconnected:", socket.id);
      return;
    }
  }
  const player = playingUsersID.get(socket.id);
  if (player) {
    playingUsers.delete(player.username);
    playingUsersID.delete(socket.id);
    playingUsers.delete(player.opponentUsername);
    playingUsersID.delete(player.opponentId);

    console.log(`User ${player.username} removed from playingUsers`);
    console.log(`User ${player.opponentUsername} removed from playingUsers`);
  }
  let rating = 1200;
  if (
    player &&
    player.color === "white" &&
    games.get(playerRooms.get(socket.id)) &&
    games.get(playerRooms.get(socket.id)).moves.length >= 1
  ) {
    const playerw = await User.findOne({ username: player.username });
    const playerb = await User.findOne({
      username: player.opponentUsername,
    });
    const game = await Game.create({
      playerw: player.username,
      playerb: player.opponentUsername,
      moves: games.get(playerRooms.get(socket.id)).moves,
      result: "black won",
      playerwrating: playerw.rating,
      playerbrating: playerb.rating,
    });
    if (playerw) {
      playerw.games.push(game._id);
      playerw.rating = (playerw.rating || 1200) - 8;
      await playerw.save();
    }
    if (playerb) {
      playerb.games.push(game._id);
      playerb.rating = (playerb.rating || 1200) + 8;
      rating = playerb.rating;
      await playerb.save();
    }
  } else if (
    player &&
    player.color === "black" &&
    games.get(playerRooms.get(socket.id)).moves.length >= 1
  ) {
    const playerw = await User.findOne({
      username: player.opponentUsername,
    });
    const playerb = await User.findOne({ username: player.username });
    const game = await Game.create({
      playerw: player.opponentUsername,
      playerb: player.username,
      moves: games.get(playerRooms.get(socket.id)).moves,
      result: "white won",
      playerwrating: playerw.rating,
      playerbrating: playerb.rating,
    });
    if (playerw) {
      playerw.games.push(game._id);
      playerw.rating = (playerw.rating || 1200) + 8;
      rating = playerw.rating;
      await playerw.save();
    }
    if (playerb) {
      playerb.games.push(game._id);
      playerb.rating = (playerb.rating || 1200) - 8;
      await playerb.save();
    }
  }

  const roomId = playerRooms.get(socket.id);
  if (roomId) {
    io.to(roomId).emit("result", {
      result: "Opponent left",
      rating: rating,
      increment: 8,
    });
    [...playerRooms.entries()]
      .filter(([_, r]) => r === roomId)
      .forEach(([playerId]) => playerRooms.delete(playerId));
  }
}
