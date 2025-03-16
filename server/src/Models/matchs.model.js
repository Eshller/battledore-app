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
        "Mixed Doubles",
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
    totalPoints: {
      type: Number,
      enum: [15, 21],
      default: 21,
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
    rightTeam: {
      type: String,
      default: "",
    },
    matchTime: {
      minutes: {
        type: Number,
        default: 0,
        required: true,
      },
      seconds: {
        type: Number,
        default: 0,
        required: true,
      },
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
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

// Add a pre-save middleware to ensure matchTime is always set
matSchema.pre('save', function(next) {
  if (!this.matchTime) {
    this.matchTime = { minutes: 0, seconds: 0 };
  }
  next();
});

// Add middleware to handle matchTime on updates
matSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.matchTime) {
    // Ensure numbers are properly parsed
    update.$set.matchTime = {
      minutes: parseInt(update.$set.matchTime.minutes) || 0,
      seconds: parseInt(update.$set.matchTime.seconds) || 0
    };
  }
  next();
});

export const Match = mongoose.model("Match", matSchema);
