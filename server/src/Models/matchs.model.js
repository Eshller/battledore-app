import mongoose, { Schema } from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    firstTeamScore: {
      type: String,
    },
    secondTeamScore: {
      type: String,
    },
    numberOfShuttlecock: {
      type: String,
    },
  },
  { timestamps: true }
);

const matSchema = new Schema(
  {
    eventPlace: {
      type: String,
      default: "",
    },
    typeOfMatch: {
      type: String,
      enum: [
        "Men's singles",
        "Men's doubles",
        "Women's singles",
        "Women's doubles",
      ],
      required: true,
      trim: true,
    },
    firstTeamName: {
      type: String,
      required: true,
    },
    secondTeamName: {
      type: String,
      required: true,
    },
    playerOne: {
      type: String,
    },
    playerTwo: {
      type: String,
    },
    playerThree: {
      type: String,
      default: "",
    },
    playerFour: {
      type: String,
      default: "",
    },
    matchDate: {
      type: String,
      required: true,
    },
    server: {
      type: String,
      default: "",
    },
    receiver: {
      type: String,
      default: "",
    },
    scores: [scoreSchema],
    eventDetails: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    winner: {
      type: String,
      default: "not played",
    },
    isPlayed: {
      type: Boolean,
      required: true,
      default: false,
    },
    referee: {
      type: String,
      required: true,
      trim: true,
    },
    misconducts: [{
      player: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
  },
  {
    timestamps: true,
  }
);

export const Match = mongoose.model("Match", matSchema);
