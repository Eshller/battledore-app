import { Router } from "express";
import { authMiddleware } from "../Middleware/authmiddleware.js";
import {
  loginUser,
  registerUser,
  allUsers,
  getUser,
  updateUserDetail,
  createNewPassword,
  deleteUser,
} from "../Controllers/user.controller.js";
import {
  getAllEvents,
  setEvent,
  updateEvent,
  deleteEvent,
} from "../Controllers/event.controller.js";

import email from "../Controllers/mail.controller.js";
import {
  startMatch,
  getMatches,
  deleteMatch,
  endMatch,
  onGoingMatch,
  createMatch,
	updateMatchTime,
} from "../Controllers/matchs.controller.js";

const router = Router();

// user routes
router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/forgotpassword").post(email);
router.route("/createNewPassword").post(createNewPassword);
router.route("/users/delete/:userId").delete(authMiddleware, deleteUser);
router.route("/getmydata").get(authMiddleware, getUser);
router.route("/updatemydata").put(authMiddleware, updateUserDetail);

// get all registered users
router.route("/players").get(authMiddleware, allUsers);

// event routes
router.route("/events").get(authMiddleware, getAllEvents);
router.route("/events/post").post(authMiddleware, setEvent);
router.route("/events/update/:eventId").put(authMiddleware, updateEvent);
router.route("/events/delete/:eventId").delete(authMiddleware, deleteEvent);

// match routes
router.route("/createMatch/:eventId").post(authMiddleware, createMatch);
router.route("/match/:gameId").get(authMiddleware, onGoingMatch);
router.route("/matches").get(authMiddleware, getMatches);
router.route("/startmatch/:matchId").patch(authMiddleware, startMatch);
router.route("/endmatch/:matchId").patch(authMiddleware, endMatch);
router
  .route("/removematch/:eventId/:matchId")
  .delete(authMiddleware, deleteMatch);
router.patch("/match/:matchId/time", authMiddleware, updateMatchTime);

export default router;
