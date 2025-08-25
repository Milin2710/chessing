import User from "./models/User.js";
import Game from "./models/Game.js";
import express from "express";

const router = express.Router();

router.post("/sync-user", async (req, res) => {
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

router.get("/get-auth-user", async (req, res) => {
  const { username } = req.query;
  console.log("username", username);
  try {
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    console.log("Fetching recent games for user:", username);

    const user = await User.findOne({ username });
    const gameIDs = user?.games;
    console.log("Game IDs found:", gameIDs);
    if (!gameIDs) {
      return res.status(404).json({ error: "User not found" });
    }
    const [games, totalGames] = await Promise.all([
      Game.find({ _id: { $in: gameIDs } })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      Game.countDocuments({ _id: { $in: gameIDs } }),
    ]);
    // console.log("games are here", games);
    const gamesWithPlayedAs = games.map((game) => {
      if (game.playerw === username) {
        return {
          ...game,
          playedas: "white",
          rating: game.playerbrating,
        };
      } else if (game.playerb === username) {
        return {
          ...game,
          playedas: "black",
          rating: game.playerwrating,
        };
      }
    });
    console.log("authpp", user.profilePhoto);
    res.json({
      games: gamesWithPlayedAs,
      totalGames: totalGames,
      lastOnline: user.lastOnline,
      username: user.username,
      rating: user.rating,
      profilePhoto: user.profilePhoto,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/search-users", async (req, res) => {
  const { query } = req.query;
  console.log("Searching users with query:", query);
  try {
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const regex = new RegExp(query);
    const users = await User.find({ username: regex })
      .limit(10)
      .select("username");
    console.log("Users found:", users);
    res.json(users.map((user) => user.username));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/get-user", async (req, res) => {
  const { username } = req.query;
  console.log("Fetching user:", username);
  try {
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOne({ username });
    const gameIDs = user?.games;
    console.log("Game IDs found:", gameIDs);
    if (!gameIDs) {
      return res.status(404).json({ error: "User not found" });
    }
    const [games, totalGames] = await Promise.all([
      Game.find({ _id: { $in: gameIDs } })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      Game.countDocuments({ _id: { $in: gameIDs.games } }),
    ]);
    // console.log("games", games);

    const gamesWithPlayedAs = games.map((game) => {
      if (game.playerw === username) {
        return {
          ...game,
          playedas: "white",
          rating: game.playerbrating,
        };
      } else if (game.playerb === username) {
        return {
          ...game,
          playedas: "black",
          rating: game.playerwrating,
        };
      }
    });

    res.json({
      games: gamesWithPlayedAs,
      totalGames: totalGames,
      lastOnline: user.lastOnline,
      username: user.username,
      rating: user.rating,
      profilePhoto: user.profilePhoto,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/all-games", async (req, res) => {
  const { username } = req.query;
  try {
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    console.log("Fetching recent games for user:", username);

    const gameIDs = await User.findOne({ username }).select("games");
    console.log("Game IDs found:", gameIDs);
    if (!gameIDs) {
      return res.status(404).json({ error: "User not found" });
    }
    const [games, totalGames] = await Promise.all([
      Game.find({ _id: { $in: gameIDs.games } })
        .sort({ createdAt: -1 })
        .lean(),
      Game.countDocuments({ _id: { $in: gameIDs.games } }),
    ]);

    const gamesWithPlayedAs = games.map((game) => ({
      ...game,
      playedas:
        game.playerw === username
          ? "white"
          : game.playerb === username
          ? "black"
          : null,
    }));

    res.json({
      games: gamesWithPlayedAs,
      totalGames: totalGames,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
