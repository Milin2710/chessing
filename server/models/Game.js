import mongoose from "mongoose";
import { type } from "os";

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
  playerwrating: {
    type: Number,
    default: 1200,
  },
  playerbrating: {
    type: Number,
    default: 1200,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Game || mongoose.model("Game", gameSchema);
