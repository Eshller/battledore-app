import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./Router/routes.js";
import http from "http";
import { Server } from "socket.io";

// to save the data which come through the socket
import { Match } from "./Models/matchs.model.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// router declaration
app.use("/api/v1/battledore", userRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
    credentials: true,
  },
});

// socket io

io.on("connection", (socket) => {
  socket.on("update_score", async (data) => {
    const match = await Match.findOne({ _id: data.Id });
    if (match && data.status == "start") {
      match.scores.push({
        firstTeamScore: data.firstTeamScore,
        secondTeamScore: data.secondTeamScore,
        numberOfShuttlecock: data.numberOfShuttlecock,
      });
      await match.save();

      // Emit the updated scores to all clients
      socket.broadcast.emit("score_updated", data);
    }
  });
  socket.on("disconnect", () => {});
});

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export { server };
