import { Match } from "../Models/matchs.model.js";
import { Event } from "../Models/event.model.js";
import { User } from "../Models/user.model.js";

const startMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { eventPlace, server, receiver } = req.body;
    if ([eventPlace, server, receiver].some((field) => field?.trim() === "")) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const matchexists = await Match.findOne({ _id: matchId });
    if (!matchexists) {
      return res.status(409).json({ message: "Match not exists" });
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      { _id: matchId },
      {
        eventPlace,
        server,
        receiver,
      },
      {
        new: true,
      }
    );

    if (!updatedMatch) {
      return res.status(404).json({ message: "Match details not found" });
    }

    return res.status(201).json({
      message: "Let's Play!!!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const createMatch = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      eventDetails,
      typeOfMatch,
      firstTeamName,
      secondTeamName,
      playerOne,
      playerTwo,
      playerThree,
      playerFour,
      umpireId,
      matchDate,
    } = req.body;
    if (
      [
        eventDetails,
        typeOfMatch,
        firstTeamName,
        secondTeamName,
        playerOne,
        playerTwo,
        umpireId,
        matchDate,
      ].some((field) => field?.trim() === "")
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const umpire = await User.findOne({
      email: umpireId,
      jobrole: "umpire",
    });
    if (!umpire) {
      return res.status(404).json({ message: "Umpire does not exist." });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const newMatch = new Match({
      eventDetails,
      typeOfMatch,
      firstTeamName,
      secondTeamName,
      playerOne,
      playerTwo,
      playerThree,
      playerFour,
      matchDate,
      referee: umpire.username,
    });

    const createdMatch = await newMatch.save();
    if (!createdMatch) {
      return res.status(404).json({ message: "Match not created" });
    }

    event.matches.push(createdMatch._id);
    await event.save();

    umpire.matches.push(createdMatch._id);
    await umpire.save();

    return res
      .status(201)
      .json({ match: createdMatch, message: "Match created successfully" });
  } catch (error) {
    if (error.name == `ValidationError`) {
      if (error.errors.typeOfMatch) {
        return res.status(400).json({ message: "make some good choices" });
      }
    } else {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getMatches = async (req, res) => {
  try {
    const getAllMatches = await Match.find().populate({
      path: "eventDetails",
      select: "-matches",
    });
    if (getAllMatches?.length == 0) {
      return res.status(200).json({ message: "No matches found" });
    }
    return res.status(200).json({ matches: getAllMatches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endMatch = async (req, res) => {
  try {
    const { winner } = req.body;
    const { matchId } = req.params;

    const updatedMatch = await Match.findByIdAndUpdate(
      { _id: matchId },
      {
        winner,
        isPlayed: true,
      },
      {
        new: true,
      }
    );
    if (!updatedMatch) {
      return res.status(404).json({ message: "Match details not found" });
    }

    return res.status(200).json({ message: "Match Ends" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const deleteMatch = async (req, res) => {
  try {
    const { matchId, eventId } = req.params;
    const existingMatch = await Match.findById({ _id: matchId });
    if (!existingMatch) {
      return res.status(404).json({ message: "Match details not found" });
    }

    const deletedMatch = await Match.findByIdAndDelete({ _id: matchId });
    if (!deletedMatch) {
      return res
        .status(500)
        .json({ message: "Something went wrong while deleting the match" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.matches.pull(matchId);
    await event.save();

    return res.status(200).json({
      message: "Match deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const onGoingMatch = async (req, res) => {
  try {
    const { gameId } = req.params;
    const onGoingMatch = await Match.findById({ _id: gameId }).populate({
      path: "eventDetails",
      select: "-matches",
    });
    if (!onGoingMatch) {
      return res.status(404).json({ message: "Match details not found" });
    }

    return res.status(200).json({ match: onGoingMatch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  startMatch,
  getMatches,
  deleteMatch,
  endMatch,
  onGoingMatch,
  createMatch,
};
