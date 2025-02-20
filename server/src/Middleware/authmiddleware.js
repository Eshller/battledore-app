import jwt from "jsonwebtoken";
import { User } from "../Models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    const jwtToken = token?.replace("Bearer", "").trim();
    const isVerified = jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(isVerified?._id);
    if (!user) {
      res.status(401).json({ msg: "User validation failed" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token for authorization failed !!!" });
  }
};
