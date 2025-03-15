import { Match } from "../Models/matchs.model.js";
import { Event } from "../Models/event.model.js";
import { User } from "../Models/user.model.js";

const startMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { eventPlace, server, receiver, rightTeam } = req.body;
    if ([eventPlace, server, receiver, rightTeam].some((field) => field?.trim() === "")) {
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
        rightTeam,
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
      totalPoints,
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
      username: umpireId,
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
      totalPoints: totalPoints || 21,
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
  const { winner, matchTime, isPlayed, startTime, endTime } = req.body;
  const { matchId } = req.params;

		const match = await Match.findById(matchId);
		if (!match) {
			return res
				.status(404)
				.json({ success: false, message: "Match not found" });
		}

		// Create update object
		const updateData = {};

		// Always update matchTime if provided
		if (matchTime) {
			updateData.matchTime = {
				minutes: parseInt(matchTime.minutes) || 0,
				seconds: parseInt(matchTime.seconds) || 0,
			};
		}

		// Update start time if provided
		if (startTime) {
			updateData.startTime = new Date(startTime);
		}

		// Update end time if provided
		if (endTime) {
			updateData.endTime = new Date(endTime);
		}

		// Update winner and isPlayed
		if (winner) {
			updateData.winner = winner;
			updateData.isPlayed = true;
		}

		const updatedMatch = await Match.findByIdAndUpdate(
			matchId,
			{ $set: updateData },
			{ new: true }
		);

		// Always return success when update is complete
		return res.status(200).json({
			success: true,
			message: winner ? "Match Ends" : "Match updated",
			match: updatedMatch,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const deleteMatch = async (req, res) => {
  try {
    const { eventId, matchId } = req.params;
    
    // Remove match from Event
    await Event.findByIdAndUpdate(eventId, {
      $pull: { matches: matchId }
    });

    // Remove match and all its associated data
    const deletedMatch = await Match.findByIdAndDelete(matchId);
    
    if (!deletedMatch) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Remove match reference from Umpire
    await User.updateMany(
      { matches: matchId },
      { $pull: { matches: matchId } }
    );

    return res.status(200).json({ message: "Match deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const onGoingMatch = async (req, res) => {
	try {
		const { gameId } = req.params;
		const match = await Match.findById(gameId)
			.populate({
				path: "eventDetails",
				select: "-matches",
			})
			.lean(); // Using lean() for better performance

		if (!match) {
			return res.status(404).json({ message: "Match not found" });
		}

		// Ensure matchTime is properly initialized and formatted
		match.matchTime = {
			minutes: parseInt(match.matchTime?.minutes || 0),
			seconds: parseInt(match.matchTime?.seconds || 0),
		};

		return res.status(200).json({
			success: true,
			match: {
				...match,
				matchTime: match.matchTime, // Explicitly include matchTime in response
			},
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const updateMatchTime = async (req, res) => {
	try {
		const { matchId } = req.params;
		const { minutes, seconds } = req.body;

		const updatedMatch = await Match.findByIdAndUpdate(
			matchId,
			{
				$set: {
					"matchTime.minutes": parseInt(minutes) || 0,
					"matchTime.seconds": parseInt(seconds) || 0,
				},
			},
			{ new: true }
		);

		if (!updatedMatch) {
			return res.status(404).json({
				success: false,
				message: "Match not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Match time updated successfully",
			match: updatedMatch,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to update match time",
		});
	}
};

export {
  startMatch,
  getMatches,
  deleteMatch,
  endMatch,
  onGoingMatch,
  createMatch,
  updateMatchTime,
};
