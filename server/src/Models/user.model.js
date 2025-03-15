import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    jobrole: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: ["match operator", "umpire", "match controller"],
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    isUmpire: {
      type: Boolean,
      default: false,
    },
    isOperator: {
      type: Boolean,
      default: false,
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      _id: this.id.toString(),
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

export const User = mongoose.model("User", userSchema);
