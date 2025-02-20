import mongoose, { Schema } from "mongoose";

const eveSchema = new Schema(
  {
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },
    eventStart: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    eventEnd: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    eventDesc: {
      type: String,
      required: true,
      trim: true,
    },
    matches: {
      type: [Schema.Types.ObjectId],
      ref: "Match",
    },
  },
  {
    timestamps: true,
  }
);

eveSchema.pre("remove", async function (next) {
  try {
    await this.model("Matches").deleteMany({ _id: { $in: this.matches } });
    next();
  } catch (err) {
    next(err);
  }
});

export const Event = mongoose.model("Event", eveSchema);
