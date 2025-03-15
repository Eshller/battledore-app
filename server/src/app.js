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
	// Add new knockup timer events
	socket.on("knockup_start", (data) => {
		socket.broadcast.emit("knockup_started", data);
	});

	socket.on("knockup_end", (data) => {
		socket.broadcast.emit("knockup_ended", data);
	});

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

	socket.on("add_misconduct", async (data) => {
		try {
			const { matchId, misconduct } = data;
			const match = await Match.findOne({ _id: matchId });
			if (match) {
				match.misconducts.push(misconduct);
				await match.save();
				socket.broadcast.emit("misconduct_updated", {
					matchId,
					misconduct,
				});
			}
		} catch (error) {
			console.error("Error adding misconduct:", error);
		}
	});

	socket.on("reset_match", async (data) => {
		const match = await Match.findOne({ _id: data.Id });
		if (match) {
			match.scores = [];
			match.misconducts = [];
			await match.save();
			socket.broadcast.emit("match_reset", { matchId: data.Id });
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
