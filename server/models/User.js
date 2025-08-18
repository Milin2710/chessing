const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  profilePhoto: { type: String },
  rating: { type: Number, default: 1200 },
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
  lastOnline: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
