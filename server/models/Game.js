const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  playerw: {
    type: String,
    required: true,
  },
  playerb: {
    type: String,
    required: true,
  },
  moves: {
    type: [[Number]],
    default: [[]],
  },
  result: {
    type: String,
    default: "not_declared",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Game || mongoose.model("Game", gameSchema);
