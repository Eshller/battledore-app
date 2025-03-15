import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import ScoreSheet from "../components/ScoreSheet.jsx";
import io from "socket.io-client";
import Watermark from "../components/Watermark";
import { toast } from "react-toastify";
import CountdownTimer from "../components/CountdownTimer";
import MatchTimer from "../components/MatchTimer";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function ScorePage() {
	const { getMatchData, matchData, updateScores, myData, updateMatchTime } =
		useService();
	const gameId = useParams();
	const Navigate = useNavigate();
	
	// Add new state variables for service tracking
	const [servingTeam, setServingTeam] = useState(1); // 1 for first team, 2 for second team
	const [serviceCourt, setServiceCourt] = useState("right"); // "right" or "left"
	const [serverPlayer, setServerPlayer] = useState(""); // Name of the current server
	
	// Add a ref to track if this is the initial score change
	const isInitialScoreChange = useRef(true);

	useEffect(() => {
		const fetchMatchData = async () => {
			const data = await getMatchData(gameId.id);
			if (data?.match) {
				if (
					data.match.scores &&
					data.match.scores.length > 0 &&
					!data.match.isPlayed
				) {
					const lastScore = data.match.scores[data.match.scores.length - 1];
					setTeamOneScore(lastScore.firstTeamScore);
					setTeamTwoScore(lastScore.secondTeamScore);
					setNumberOfShuttlecock(lastScore.numberOfShuttlecock || "1");
					setMatchStarted(true);
					
					// Reset the initial score change flag
					isInitialScoreChange.current = true;

					// Emit score update to ensure all clients are in sync
					sendScore(
						lastScore.firstTeamScore,
						lastScore.secondTeamScore,
						"start"
					);
					
					// Initialize service tracking if available in match data
					if (lastScore.servingTeam) {
						setServingTeam(lastScore.servingTeam);
						setServiceCourt(lastScore.serviceCourt || "right");
						setServerPlayer(lastScore.serverPlayer || "");
					}
				} else {
					setTeamOneScore("0");
					setTeamTwoScore("0");
					setNumberOfShuttlecock("1");
					setMatchStarted(false);
				}
				setMisconducts(data.match.misconducts || []);
			}
		};

		fetchMatchData();
	}, [gameId.id]);

	const [teamOneScore, setTeamOneScore] = useState("0");
	const [teamTwoScore, setTeamTwoScore] = useState("0");
	const [step, setStep] = useState(1);
	const [numberOfShuttlecock, setNumberOfShuttlecock] = useState("1");
	const [matchStarted, setMatchStarted] = useState(false);
	const [isPlay, setPlay] = useState(false);
	const [misconductBox, setMisconductBox] = useState(false);
	const [selectedPlayer, setSelectedPlayer] = useState("");
	const [misconduct, setMisconduct] = useState("");
	const [endMatchConfirmation, setEndMatchConfirmation] = useState(false);
	const [winnerMessage, setWinnerMessage] = useState("");
	const [misconducts, setMisconducts] = useState([]);
	const [showCountdown, setShowCountdown] = useState(false);
	const [showTimer, setShowTimer] = useState(false);
	const [knockupCompleted, setKnockupCompleted] = useState(false);
	const [isMatchTimerRunning, setIsMatchTimerRunning] = useState(false);
	const [matchTime, setMatchTime] = useState(0);
	const timerIntervalRef = useRef(null);
	const [showInterval, setShowInterval] = useState(false);
	const [intervalTeam, setIntervalTeam] = useState(null);
	const [intervalTimeLeft, setIntervalTimeLeft] = useState(120); // 2 minutes in seconds
	const intervalTimerRef = useRef(null);
	// Add new state variables for match/game point
	const [matchPoint, setMatchPoint] = useState(null); // 1 for team 1, 2 for team 2, null for no match point
	const [showWinAnimation, setShowWinAnimation] = useState(false);
	const [winningTeam, setWinningTeam] = useState(null);
	// Add state variables for match start and end times
	const [matchStartTime, setMatchStartTime] = useState(null);
	const [matchEndTime, setMatchEndTime] = useState(null);
	// Add a new state variable to track post-interval state
	const [isPostInterval, setIsPostInterval] = useState(false);

	useEffect(() => {
		if (matchData?.scores?.length > 0 && matchData.isPlayed == false) {
			matchData.scores.map((data) => {
				setTeamOneScore(data.firstTeamScore);
				setTeamTwoScore(data.secondTeamScore);
				setNumberOfShuttlecock(data.numberOfShuttlecock);
			});
			setMatchStarted(true);
		}
	}, [matchData]);

	useEffect(() => {
		if (matchData?.misconducts) {
			setMisconducts(matchData.misconducts);
		}
	}, [matchData]);

	// Add socket listener for misconduct updates
	useEffect(() => {
		socket.on("misconduct_updated", (data) => {
			if (data.matchId === gameId.id) {
				setMisconducts((prev) => [...prev, data.misconduct]);
			}
		});

		return () => {
			socket.off("misconduct_updated");
		};
	}, [gameId.id]);

	useEffect(() => {
		// Listen for new match creation
		socket.on("match_created", () => {
			// Reset all score-related state
			setTeamOneScore("0");
			setTeamTwoScore("0");
			setNumberOfShuttlecock("1");
			setMatchStarted(false);
			setMisconducts([]);
		});

		// Clean up socket listeners when component unmounts
		return () => {
			socket.off("match_created");
			socket.off("score_updated");
			socket.off("misconduct_updated");
		};
	}, []);

	const handleMisconductSelect = (type, player) => {
		if (!player) {
			toast.error("Please select a player first");
			return;
		}

		const misconductData = {
			matchId: gameId.id,
			misconduct: {
				player: player,
				type: type,
				timestamp: new Date(),
			},
		};

		// Emit misconduct via socket
		socket.emit("add_misconduct", misconductData);

		// Update local state only once
		const newMisconduct = {
			player: player,
			type: type,
			timestamp: new Date(),
		};
		setMisconducts((prev) => [...prev, newMisconduct]);

		// Reset misconduct selection state
		setMisconduct("");
		setSelectedPlayer("");
		setMisconductBox(false);
	};

	const handleMisconduct = (e) => {
		setMisconduct(e);
		if (step === 1) {
			handleMisconductSelect(e, selectedPlayer);
			setStep(2);
		} else {
			setStep(1);
		}
	};

	const handlePlayerSelect = (e) => {
		setSelectedPlayer(e.target.value);
		sendToScoreSheet(e.target.value);
		setMisconductBox(false);
		setStep(1);
		// alert("Player Marked")
	};

	const sendToScoreSheet = (player) => {
		console.log("Sending player to ScoreSheet:", player);
	};

	const sendScore = (f_score, s_score, isActive, winner, startTime, endTime, shuttlecockCount) => {
		socket.emit("update_score", {
			_id: new Date().getMilliseconds(),
			firstTeamScore: f_score,
			secondTeamScore: s_score,
			status: isActive,
			won: winner,
			Id: gameId.id,
			numberOfShuttlecock: shuttlecockCount || numberOfShuttlecock,
			firstTeamName: matchData?.firstTeamName,
			secondTeamName: matchData?.secondTeamName,
			timestamp: new Date().toISOString(),
			// Add service tracking data
			servingTeam,
			serviceCourt,
			serverPlayer,
			startTime: startTime ? startTime.toISOString() : null,
			endTime: endTime ? endTime.toISOString() : null
		});
	};

	const undoChanges = () => {
		// Check if there are any points to undo
		if (parseInt(teamOneScore) === 0 && parseInt(teamTwoScore) === 0) {
			// No points to undo
			toast.info("No points to undo");
			return;
		}
		
		// In badminton, we need to determine which team scored last and who was serving
		let lastScoringTeam = null;
		let previousServingTeam = null;
		let newTeamOneScore = teamOneScore;
		let newTeamTwoScore = teamTwoScore;
		
		// Try to determine the last scoring team from match data history
		const scores = matchData?.scores || [];
		
		// Find the previous score state
		let previousScore = null;
		
		// If we have score history, use it to find the previous state
		if (scores.length > 1) {
			// Find the current score in the history
			for (let i = scores.length - 1; i >= 0; i--) {
				const score = scores[i];
				if (score.firstTeamScore === teamOneScore && 
					score.secondTeamScore === teamTwoScore) {
					// Found current score, get the previous one
					if (i > 0) {
						previousScore = scores[i - 1];
						break;
					}
				}
			}
		}
		
		if (previousScore) {
			// If we found previous score data, use it
			newTeamOneScore = previousScore.firstTeamScore;
			newTeamTwoScore = previousScore.secondTeamScore;
			
			// Determine which team scored last by comparing current and previous scores
			if (parseInt(teamOneScore) > parseInt(previousScore.firstTeamScore)) {
				lastScoringTeam = 1;
			} else if (parseInt(teamTwoScore) > parseInt(previousScore.secondTeamScore)) {
				lastScoringTeam = 2;
			}
			
			// Also restore service tracking if available
			if (previousScore.servingTeam) {
				setServingTeam(previousScore.servingTeam);
				setServiceCourt(previousScore.serviceCourt || "right");
				setServerPlayer(previousScore.serverPlayer || "");
				previousServingTeam = previousScore.servingTeam;
			}
		} else {
			// If no history or can't find previous score, use logic
			const team1Points = parseInt(teamOneScore);
			const team2Points = parseInt(teamTwoScore);
			
			if (team1Points > team2Points) {
				// Team 1 is likely the last to score
				lastScoringTeam = 1;
				newTeamOneScore = (team1Points - 1).toString();
			} else if (team2Points > team1Points) {
				// Team 2 is likely the last to score
				lastScoringTeam = 2;
				newTeamTwoScore = (team2Points - 1).toString();
			} else if (team1Points > 0) {
				// Scores are equal and not zero, use serving team as a hint
				lastScoringTeam = servingTeam === 1 ? 2 : 1; // If team 1 is serving, team 2 likely scored last
				if (lastScoringTeam === 1) {
					newTeamOneScore = (team1Points - 1).toString();
				} else {
					newTeamTwoScore = (team2Points - 1).toString();
				}
			}
			
			// Update service tracking based on badminton rules
			if (lastScoringTeam) {
				// In badminton, the right to serve changes only when the receiving side scores
				// So if the last scoring team is the current serving team, they must have been receiving before
				if (lastScoringTeam === servingTeam) {
					// The last scoring team was receiving before and gained the right to serve
					// So we need to give the service back to the other team
					const newServingTeam = lastScoringTeam === 1 ? 2 : 1;
					setServingTeam(newServingTeam);
					previousServingTeam = newServingTeam;
					
					// Determine service court based on the score of the new serving team
					const relevantScore = newServingTeam === 1 ? 
						parseInt(newTeamOneScore) : parseInt(newTeamTwoScore);
					
					setServiceCourt(relevantScore % 2 === 0 ? "right" : "left");
					
					// Update server player
					updateServerPlayer(newServingTeam, relevantScore);
				} else {
					// The last scoring team was already serving and scored again
					// So they keep the service, but we need to update the court
					const relevantScore = servingTeam === 1 ? 
						parseInt(newTeamOneScore) : parseInt(newTeamTwoScore);
					
					setServiceCourt(relevantScore % 2 === 0 ? "right" : "left");
					
					// Update server player
					updateServerPlayer(servingTeam, relevantScore);
				}
			}
		}
		
		// Safety check - don't allow negative scores
		if (parseInt(newTeamOneScore) < 0) newTeamOneScore = "0";
		if (parseInt(newTeamTwoScore) < 0) newTeamTwoScore = "0";
		
		// Update the scores
		setTeamOneScore(newTeamOneScore);
		setTeamTwoScore(newTeamTwoScore);
		
		// Show toast notification for feedback
		toast.success(`Last point undone (${lastScoringTeam === 1 ? 
			matchData?.firstTeamName : matchData?.secondTeamName})`);
		
		// Send updated score to sync with other clients
		sendScore(newTeamOneScore, newTeamTwoScore, "start", null, startTime, endTime, numberOfShuttlecock);
		
		// Check for match point after undoing
		checkForMatchPoint();
	};
	
	// Helper function to update server player based on team and score
	const updateServerPlayer = (team, score) => {
		if (!matchData?.playerThree && !matchData?.playerFour) {
			// Singles - server is always the same player for each team
			setServerPlayer(team === 1 ? matchData?.playerOne : matchData?.playerTwo);
		} else {
			// Doubles - server alternates based on score
			if (team === 1) {
				setServerPlayer(score % 2 === 0 ? matchData?.playerOne : matchData?.playerThree);
			} else {
				setServerPlayer(score % 2 === 0 ? matchData?.playerTwo : matchData?.playerFour);
			}
		}
	};

	const checkForInterval = (team, score) => {
		// Don't trigger interval if it's already showing
		if (showInterval) return;
		
		// Check if we've reached the interval point based on match total points
		const intervalPoint = matchData?.totalPoints === 15 ? 8 : 11;
		
		// Check if this team just reached the interval point
		if (parseInt(score) === intervalPoint) {
			// Pause the match timer
			if (isMatchTimerRunning) {
				clearInterval(timerIntervalRef.current);
				setIsMatchTimerRunning(false);
			}
			
			// Show the interval UI
			setIntervalTeam(team);
			setShowInterval(true);
			setIntervalTimeLeft(120); // Reset interval timer to 2 minutes
			
			// Emit interval start event to sync with other clients
			socket.emit("interval_start", {
				matchId: gameId.id,
				team: team,
				timeLeft: 120
			});
			
			// Start interval timer
			intervalTimerRef.current = setInterval(() => {
				setIntervalTimeLeft(prev => {
					if (prev <= 1) {
						// Auto-resume match when timer reaches zero
						resumeAfterInterval();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
			
			// Notify via toast
			toast.info(`Interval - ${team === 1 ? matchData?.firstTeamName : matchData?.secondTeamName} reached ${intervalPoint} points`);
		}
	};

	// Function to check for match point or game point
	const checkForMatchPoint = () => {
		// Get the winning score based on match type
		const winningScore = matchData?.totalPoints || 21;
		
		// Get current scores as integers
		const team1Score = parseInt(teamOneScore);
		const team2Score = parseInt(teamTwoScore);
		
		// Reset match point if no longer applicable
		if (team1Score < winningScore - 1 && team2Score < winningScore - 1) {
			setMatchPoint(null);
			return;
		}
		
		// Check for match point for team 1
		if (team1Score >= winningScore - 1 && team1Score - team2Score >= 1) {
			setMatchPoint(1);
			return;
		}
		
		// Check for match point for team 2
		if (team2Score >= winningScore - 1 && team2Score - team1Score >= 1) {
			setMatchPoint(2);
			return;
		}
		
		// No match point
		setMatchPoint(null);
	};
	
	// Check if a team has won the match
	const checkForWin = () => {
		// Get the winning score based on match type
		const winningScore = matchData?.totalPoints || 21;
		
		// Get current scores as integers
		const team1Score = parseInt(teamOneScore);
		const team2Score = parseInt(teamTwoScore);
		
		// Prevent win check at the very start of the match
		if (team1Score === 0 && team2Score === 0) {
			return false;
		}
		
		// Check if team 1 has won
		if ((team1Score >= winningScore && team1Score - team2Score >= 2) || 
			(team1Score >= winningScore + 9)) { // Maximum score is winning score + 9
			setWinningTeam(1);
			setShowWinAnimation(true);
			
			// Record the match end time
			const endTime = new Date();
			setMatchEndTime(endTime);
			
			// Automatically end the match after a shorter animation
			setTimeout(() => {
				setShowWinAnimation(false);
				stopMatchTimer();
				end(); // Call end directly instead of endMatchSession
			}, 1500); // Reduced from 3000ms to 1500ms
			
			return true;
		}
		
		// Check if team 2 has won
		if ((team2Score >= winningScore && team2Score - team1Score >= 2) || 
			(team2Score >= winningScore + 9)) { // Maximum score is winning score + 9
			setWinningTeam(2);
			setShowWinAnimation(true);
			
			// Record the match end time
			const endTime = new Date();
			setMatchEndTime(endTime);
			
			// Automatically end the match after a shorter animation
			setTimeout(() => {
				setShowWinAnimation(false);
				stopMatchTimer();
				end(); // Call end directly instead of endMatchSession
			}, 1500); // Reduced from 3000ms to 1500ms
			
			return true;
		}
		
		return false;
	};

	const Team1 = () => {
		const newTeamOneScore = (parseInt(teamOneScore) + 1).toString();
		setTeamOneScore(newTeamOneScore);
		// Update service tracking when team 1 scores
		updateService(1);
		
		// Reset the post-interval state when a score is made
		setIsPostInterval(false);
		
		sendScore(newTeamOneScore, teamTwoScore, "start", null, matchStartTime, matchEndTime, numberOfShuttlecock);
		
		// Check for interval
		checkForInterval(1, newTeamOneScore);
		
		// Check for win first, then match point if no win
		if (!checkForWin()) {
			checkForMatchPoint();
		}
	};

	const Team2 = () => {
		const newTeamTwoScore = (parseInt(teamTwoScore) + 1).toString();
		setTeamTwoScore(newTeamTwoScore);
		// Update service tracking when team 2 scores
		updateService(2);
		
		// Reset the post-interval state when a score is made
		setIsPostInterval(false);
		
		sendScore(teamOneScore, newTeamTwoScore, "start", null, matchStartTime, matchEndTime, numberOfShuttlecock);
		
		// Check for interval
		checkForInterval(2, newTeamTwoScore);
		
		// Check for win first, then match point if no win
		if (!checkForWin()) {
			checkForMatchPoint();
		}
	};

	const handleButtonClick = (team) => {
		if (team === "undo") {
			undoChanges();
			return; // Add return to make it clear this is a separate case
		}
		
		const isReceiverFirstTeam =
			matchData?.firstTeamName === matchData?.receiver;
		if (team === "right") {
			isReceiverFirstTeam ? Team2() : Team1();
		} else {
			isReceiverFirstTeam ? Team1() : Team2();
		}
	};

	const endMatchSession = () => {
		const leftSideTeam =
			matchData.firstTeamName === matchData.receiver
				? matchData.secondTeamName
				: matchData.firstTeamName;

		const rightSideTeam =
			matchData.firstTeamName === matchData.receiver
				? matchData.firstTeamName
				: matchData.secondTeamName;

		const leftSideScore =
			matchData.firstTeamName === matchData.receiver
				? teamOneScore
				: teamTwoScore;

		const rightSideScore =
			matchData.firstTeamName === matchData.receiver
				? teamTwoScore
				: teamOneScore;

		let winner = "";
		let loser = "";

		if (leftSideScore > rightSideScore) {
			winner = `${leftSideTeam}`;
			loser = `${
				winner == matchData.firstTeamName
					? matchData.secondTeamName
					: matchData.firstTeamName
			}`;
		} else if (leftSideScore < rightSideScore) {
			winner = `${rightSideTeam}`;
			loser = `${
				winner == matchData.firstTeamName
					? matchData.secondTeamName
					: matchData.firstTeamName
			}`;
		} else {
			winner = "DRAW";
		}

		// Only show confirmation dialog if not coming from win animation
		if (!showWinAnimation) {
			setEndMatchConfirmation(!endMatchConfirmation);
		}
		
		let winnerStr = "";
		if (winner !== "DRAW") {
			winnerStr = `${winner} wins`;
			setWinnerMessage(`Match won by ${winner} / ${loser}`);
		} else {
			setWinnerMessage(
				`Match is draw between ${leftSideTeam} and ${rightSideTeam}`
			);
			winnerStr = winner;
		}
		return winnerStr;
	};

	const end = async () => {
		try {
			// If win animation is showing, hide it
			setShowWinAnimation(false);
			
			// Record the match end time
			const endTime = new Date();
			setMatchEndTime(endTime);
			
			// Stop the timer first
			stopMatchTimer();

			// Get current time values
			const minutes = Math.floor(matchTime / 60);
			const seconds = matchTime % 60;

			// Create update data
			const updateData = {
				winner: endMatchSession(),
				isPlayed: true,
				matchTime: {
					minutes: parseInt(minutes),
					seconds: parseInt(seconds),
				},
				startTime: matchStartTime ? matchStartTime.toISOString() : null,
				endTime: endTime.toISOString()
			};

			// First, ensure the match time is saved
			await updateMatchTime(gameId.id, minutes, seconds);
			
			// Then end the match
			const res = await updateScores(updateData, gameId.id);

			// Handle both success scenarios
			if (
				res?.status === 200 ||
				(res?.data && res?.data?.message === "Match Ends")
			) {
				sendScore(teamOneScore, teamTwoScore, "end", updateData.winner, matchStartTime, endTime, numberOfShuttlecock);
				// Force navigation after a short delay to ensure state updates
				setTimeout(() => Navigate("/pastmatches"), 500);
				return;
			}

			throw new Error("Failed to end match");
		} catch (error) {
			if (error.message !== "Match Ends") {
				toast.error("Failed to end match");
			}
		}
	};

	const endByWalkover = async () => {
		const temp = {
			winner: "Walkover",
		};
		const res = await updateScores(temp, gameId.id);
		if (res.status == 200) {
			Navigate("/pastmatches");
			sendScore(teamOneScore, teamTwoScore, "end", winner, matchStartTime, matchEndTime, numberOfShuttlecock);
		}
	};

	const resetMatch = () => {
		setTeamOneScore("0");
		setTeamTwoScore("0");
		setNumberOfShuttlecock("1");
		setMatchStarted(false);
		setPlay(false);
		setMisconductBox(false);
		setSelectedPlayer("");
		setMisconduct("");
		setEndMatchConfirmation(false);
		setWinnerMessage("");
		setShowCountdown(false);
		setShowTimer(false);
		setKnockupCompleted(false);
		setIsMatchTimerRunning(false);
		setMatchTime(0);
		setShowInterval(false);
		setIntervalTeam(null);
		setMatchPoint(null);
		setShowWinAnimation(false);
		setWinningTeam(null);
		setMatchStartTime(null);
		setMatchEndTime(null);
		setIsPostInterval(false);
		
		if (timerIntervalRef.current) {
			clearInterval(timerIntervalRef.current);
		}
	};

	const handleMisconductUpdate = (newMisconduct) => {
		setMisconducts((prev) => [...prev, newMisconduct]);
	};

	const handlePlayClick = () => {
		setShowCountdown(true);
		// Emit knockup start event
		socket.emit("knockup_start", { matchId: gameId.id });
	};

	const handleCountdownComplete = () => {
		setShowCountdown(false);
		setKnockupCompleted(true);
		socket.emit("knockup_end", { matchId: gameId.id });
	};

	// Add socket listeners for knockup events
	useEffect(() => {
		socket.on("knockup_started", (data) => {
			if (data.matchId === gameId.id) {
				setShowCountdown(true);
			}
		});

		socket.on("knockup_ended", (data) => {
			if (data.matchId === gameId.id) {
				setShowCountdown(false);
				setKnockupCompleted(true);
			}
		});

		return () => {
			socket.off("knockup_started");
			socket.off("knockup_ended");
		};
	}, [gameId.id]);

	const handleTimerPauseResume = () => {
		setIsMatchTimerRunning(!isMatchTimerRunning);
	};

	const startMatchTimer = () => {
		if (!isMatchTimerRunning) {
			setIsMatchTimerRunning(true);
			timerIntervalRef.current = setInterval(() => {
				setMatchTime((prev) => prev + 1);
			}, 1000);
		}
	};

	const stopMatchTimer = async () => {
		if (timerIntervalRef.current) {
			clearInterval(timerIntervalRef.current);
			timerIntervalRef.current = null;
			setIsMatchTimerRunning(false);

			try {
				// Calculate minutes and seconds
				const minutes = Math.floor(matchTime / 60);
				const seconds = matchTime % 60;

				// Save final time to backend when timer stops
				const result = await updateMatchTime(gameId.id, minutes, seconds);
				// Don't throw error if update fails, just log it
				if (!result) {
					console.warn("Could not update final match time");
				}
			} catch (error) {
				// Ignore "Match Ends" message
				if (error.message !== "Match Ends") {
					console.error("Error stopping timer:", error);
				}
			}
		}
	};

	// Add an interval to periodically save time to backend
	useEffect(() => {
		let saveTimeInterval;

		if (isMatchTimerRunning) {
			// Save time every minute
			saveTimeInterval = setInterval(() => {
				const minutes = Math.floor(matchTime / 60);
				const seconds = matchTime % 60;
				updateMatchTime(gameId.id, minutes, seconds)
					.then(result => {
						if (result) {
							console.log("Match time saved successfully:", { minutes, seconds });
						}
					})
					.catch(err => {
						console.error("Failed to save match time:", err);
					});
			}, 60000); // 60 seconds
		}

		return () => {
			if (saveTimeInterval) {
				clearInterval(saveTimeInterval);
			}
		};
	}, [isMatchTimerRunning, matchTime]);

	// Initialize matchTime from backend data when component loads
	useEffect(() => {
		if (matchData?.matchTime) {
			const totalSeconds =
				matchData.matchTime.minutes * 60 + matchData.matchTime.seconds;
			setMatchTime(totalSeconds);
		}
	}, [matchData]);

	const formatTime = (seconds) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;
		return `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	// Clean up timer on unmount
	useEffect(() => {
		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
		};
	}, []);

	const handleLoveAllPlay = () => {
		setMatchStarted(true);
		setPlay(true);
		
		// Record the match start time
		const startTime = new Date();
		setMatchStartTime(startTime);
		
		// Initialize service based on the server information from the umpire page
		if (matchData?.server) {
			// Determine which team is serving based on the server player name
			let initialServingTeam;
			
			// Check if server belongs to first team
			if (matchData.server === matchData.playerOne || matchData.server === matchData.playerThree) {
				initialServingTeam = 1;
			} 
			// Check if server belongs to second team
			else if (matchData.server === matchData.playerTwo || matchData.server === matchData.playerFour) {
				initialServingTeam = 2;
			}
			// Default to team 1 if server not found
			else {
				initialServingTeam = 1;
			}
			
			setServingTeam(initialServingTeam);
			setServiceCourt("right"); // Even score (0) serves from right court
			setServerPlayer(matchData.server);
		} else {
			// Fallback to default behavior if no server information is available
			setServingTeam(1);
			setServiceCourt("right"); // Even score (0) serves from right court
			
			// Set the correct server based on singles or doubles
			if (!matchData?.playerThree && !matchData?.playerFour) {
				// Singles - server is the first player of team 1
				setServerPlayer(matchData?.playerOne || "");
			} else {
				// Doubles - for even score (0), first player serves
				setServerPlayer(matchData?.playerOne || "");
			}
		}
		
		// Reset the post-interval state
		setIsPostInterval(false);
		
		// Ensure win animation is not showing when starting a match
		setShowWinAnimation(false);
		setWinningTeam(null);
		
		// Reset the initial score change flag
		isInitialScoreChange.current = true;
		
		// Send initial score with service tracking data and start time
		sendScore("0", "0", "start", null, startTime, null, numberOfShuttlecock);
		
		// Notify other clients that match has started
		socket.emit("match_started", { 
			matchId: gameId.id,
			startTime: startTime.toISOString()
		});
		
		// Start the match timer
		startMatchTimer();
	};

	// Function to update service after a point is scored
	const updateService = (scoringTeam) => {
		// In badminton:
		// 1. The right to serve changes ONLY when the receiving side scores a point
		// 2. If the serving side scores, they continue to serve but switch courts
		// 3. The service court is determined by the server's score:
		//    - Even score (0, 2, 4...) = serve from right court
		//    - Odd score (1, 3, 5...) = serve from left court
		// 4. In doubles, the server alternates between partners based on score
		
		// Check if the scoring team is the current serving team
		if (scoringTeam === servingTeam) {
			// If the serving team scores, they continue to serve but switch courts
			// Determine the new score of the serving team
			const newScore = scoringTeam === 1 ? 
				parseInt(teamOneScore) + 1 : parseInt(teamTwoScore) + 1;
			
			// Determine service court based on the new score
			// Even score = right court, odd score = left court
			const newServiceCourt = newScore % 2 === 0 ? "right" : "left";
			setServiceCourt(newServiceCourt);
			
			// In doubles, update the server if needed
			if (matchData?.playerThree && matchData?.playerFour) {
				if (scoringTeam === 1) {
					// For team 1, even score = first player, odd score = second player
					setServerPlayer(newScore % 2 === 0 ? matchData?.playerOne : matchData?.playerThree);
				} else {
					// For team 2, even score = first player, odd score = second player
					setServerPlayer(newScore % 2 === 0 ? matchData?.playerTwo : matchData?.playerFour);
				}
			}
		} else {
			// If the receiving team scores, the right to serve changes
			// Update the serving team to the team that just scored
			setServingTeam(scoringTeam);
			
			// Determine the new score of the serving team
			const newScore = scoringTeam === 1 ? 
				parseInt(teamOneScore) + 1 : parseInt(teamTwoScore) + 1;
			
			// Determine service court based on the new score
			// Even score = right court, odd score = left court
			const newServiceCourt = newScore % 2 === 0 ? "right" : "left";
			setServiceCourt(newServiceCourt);
			
			// Update the server player
			if (!matchData?.playerThree && !matchData?.playerFour) {
				// Singles - server is always the same player for each team
				setServerPlayer(scoringTeam === 1 ? matchData?.playerOne : matchData?.playerTwo);
			} else {
				// Doubles - server alternates based on score
				if (scoringTeam === 1) {
					// For team 1, even score = first player, odd score = second player
					setServerPlayer(newScore % 2 === 0 ? matchData?.playerOne : matchData?.playerThree);
				} else {
					// For team 2, even score = first player, odd score = second player
					setServerPlayer(newScore % 2 === 0 ? matchData?.playerTwo : matchData?.playerFour);
				}
			}
		}
	};
	
	// Function to manually change the server
	const changeServer = (team, court) => {
		// Update serving team
		setServingTeam(team);
		
		// Update service court
		setServiceCourt(court);
		
		// Get the relevant score for the serving team
		const score = team === 1 ? parseInt(teamOneScore) : parseInt(teamTwoScore);
		
		// Update server player
		updateServerPlayer(team, score);
	};

	// Add an effect to update service tracking when scores change
	useEffect(() => {
		if (matchStarted) {
			// Only update if the match has started
			const team1Score = parseInt(teamOneScore);
			const team2Score = parseInt(teamTwoScore);
			
			// Ensure service court is correct based on serving team's score
			const servingTeamScore = servingTeam === 1 ? team1Score : team2Score;
			const correctServiceCourt = servingTeamScore % 2 === 0 ? "right" : "left";
			
			if (serviceCourt !== correctServiceCourt) {
				setServiceCourt(correctServiceCourt);
			}
			
			// Ensure server player is correct
			if (matchData?.playerThree && matchData?.playerFour) {
				// Doubles - server alternates based on score
				let correctServer = "";
				if (servingTeam === 1) {
					correctServer = servingTeamScore % 2 === 0 ? matchData?.playerOne : matchData?.playerThree;
				} else {
					correctServer = servingTeamScore % 2 === 0 ? matchData?.playerTwo : matchData?.playerFour;
				}
				
				if (serverPlayer !== correctServer) {
					setServerPlayer(correctServer);
				}
			}
			
			// Check for match point when scores change, but not on initial load
			if (!isInitialScoreChange.current) {
				if (!checkForWin()) {
					checkForMatchPoint();
				}
			} else {
				isInitialScoreChange.current = false;
			}
		}
	}, [teamOneScore, teamTwoScore, servingTeam, matchStarted]);

	const resumeAfterInterval = () => {
		// Hide the interval UI
		setShowInterval(false);
		setIntervalTeam(null);
		
		// After an interval, service stays with the same player/team
		// But we need to ensure the service court is correct based on the score
		const servingTeamScore = servingTeam === 1 ? 
			parseInt(teamOneScore) : parseInt(teamTwoScore);
		
		// Determine service court based on the serving team's score
		// Even score = right court, odd score = left court
		const correctServiceCourt = servingTeamScore % 2 === 0 ? "right" : "left";
		setServiceCourt(correctServiceCourt);
		
		// Update the server player if needed (for doubles matches)
		if (matchData?.playerThree && matchData?.playerFour) {
			let correctServer = "";
			if (servingTeam === 1) {
				correctServer = servingTeamScore % 2 === 0 ? matchData?.playerOne : matchData?.playerThree;
			} else {
				correctServer = servingTeamScore % 2 === 0 ? matchData?.playerTwo : matchData?.playerFour;
			}
			
			if (serverPlayer !== correctServer) {
				setServerPlayer(correctServer);
			}
		}
		
		// Set the post-interval state to true
		setIsPostInterval(true);
		
		// Emit interval end event to sync with other clients
		socket.emit("interval_end", {
			matchId: gameId.id
		});
		
		// Clear interval timer
		if (intervalTimerRef.current) {
			clearInterval(intervalTimerRef.current);
			intervalTimerRef.current = null;
		}
		
		// Resume the match timer
		if (!isMatchTimerRunning) {
			startMatchTimer();
		}
		
		// Notify via toast
		toast.success("Match resumed after interval");
	};

	// Format interval time as MM:SS
	const formatIntervalTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Clean up interval timer on unmount
	useEffect(() => {
		return () => {
			if (intervalTimerRef.current) {
				clearInterval(intervalTimerRef.current);
			}
		};
	}, []);

	// Auto-resume after interval time is up
	useEffect(() => {
		if (intervalTimeLeft === 0 && showInterval) {
			resumeAfterInterval();
		}
	}, [intervalTimeLeft]);

	// Add an effect to handle win animation cleanup
	useEffect(() => {
		// Create a variable to store the timeout ID
		let winAnimationTimeout;
		
		// If win animation is shown, set up the cleanup
		if (showWinAnimation) {
			winAnimationTimeout = setTimeout(() => {
				setShowWinAnimation(false);
			}, 2000); // Backup timeout in case the main one fails
		}
		
		// Cleanup function to clear the timeout when component unmounts or animation state changes
		return () => {
			if (winAnimationTimeout) {
				clearTimeout(winAnimationTimeout);
			}
		};
	}, [showWinAnimation]);

	// Add shuttlecock counter functions
	const incrementShuttlecock = () => {
		const newCount = (parseInt(numberOfShuttlecock) + 1).toString();
		setNumberOfShuttlecock(newCount);
		// Update in database
		sendScore(teamOneScore, teamTwoScore, "start", null, matchStartTime, matchEndTime, newCount);
	};
	
	const decrementShuttlecock = () => {
		if (parseInt(numberOfShuttlecock) > 1) {
			const newCount = (parseInt(numberOfShuttlecock) - 1).toString();
			setNumberOfShuttlecock(newCount);
			// Update in database
			sendScore(teamOneScore, teamTwoScore, "start", null, matchStartTime, matchEndTime, newCount);
		}
	};

	// Add a new useEffect to listen for socket events related to intervals
	useEffect(() => {
		// Listen for interval start events
		socket.on("interval_start", (data) => {
			if (data.matchId === gameId.id) {
				// Another client has started an interval
				setIntervalTeam(data.team);
				setShowInterval(true);
				setIntervalTimeLeft(data.timeLeft || 120);
				
				// Pause the match timer if it's running
				if (isMatchTimerRunning) {
					clearInterval(timerIntervalRef.current);
					setIsMatchTimerRunning(false);
				}
			}
		});
		
		// Listen for interval end events
		socket.on("interval_end", (data) => {
			if (data.matchId === gameId.id) {
				// Another client has ended an interval
				setShowInterval(false);
				setIntervalTeam(null);
				
				// After an interval, service stays with the same player/team
				// But we need to ensure the service court is correct based on the score
				const servingTeamScore = servingTeam === 1 ? 
					parseInt(teamOneScore) : parseInt(teamTwoScore);
				
				// Determine service court based on the serving team's score
				// Even score = right court, odd score = left court
				const correctServiceCourt = servingTeamScore % 2 === 0 ? "right" : "left";
				setServiceCourt(correctServiceCourt);
				
				// Update the server player if needed (for doubles matches)
				if (matchData?.playerThree && matchData?.playerFour) {
					let correctServer = "";
					if (servingTeam === 1) {
						correctServer = servingTeamScore % 2 === 0 ? matchData?.playerOne : matchData?.playerThree;
					} else {
						correctServer = servingTeamScore % 2 === 0 ? matchData?.playerTwo : matchData?.playerFour;
					}
					
					if (serverPlayer !== correctServer) {
						setServerPlayer(correctServer);
					}
				}
				
				// Set the post-interval state to true
				setIsPostInterval(true);
				
				// Resume the match timer if it's not running
				if (!isMatchTimerRunning) {
					startMatchTimer();
				}
			}
		});
		
		return () => {
			socket.off("interval_start");
			socket.off("interval_end");
		};
	}, [gameId.id, isMatchTimerRunning]);

	return (
		<div className="relative">
			{/* Countdown Timer */}
			{showCountdown && <CountdownTimer onComplete={handleCountdownComplete} />}

			{/* to start or walkout */}
			<div
				className={`${
					(!isPlay || knockupCompleted) && !matchStarted ? "block" : "hidden"
				} w-full h-screen bg-[rgba(0,0,0,0.2)] fixed z-10 font-inter font-semibold flex flex-col justify-center items-center gap-[30rem]`}
			>
				{!knockupCompleted ? (
					<>
						{/* Start knockup button */}
						<button>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 -960 960 960"
								fill="#FFFFFF"
								className="w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full"
								onClick={handlePlayClick}
							>
								<path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-320Z" />
							</svg>
						</button>
						<button
							className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl text-3xl"
							onClick={() => endByWalkover()}
						>
							WALKOVER
						</button>
					</>
				) : (
					/* Love All Play button after knockup */
					<button
						className="text-xl xl:text-3xl min-w-48 text-white font-bold rounded-lg xl:rounded-2xl px-5 py-3 bg-green-400 m-4 flex justify-center items-center shadow-lg uppercase"
						onClick={handleLoveAllPlay}
					>
						Love All Play
					</button>
				)}
			</div>

			{/* misconduct Box */}
			{misconductBox && (
				<div className="bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 z-50 rounded-md flex flex-col items-end gap-4">
					{step === 1 && (
						<div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center gap-2">
							<div
								id="w"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("W")}
							>
								<h1 className="font-bold text-3xl text-yellow-700 bg-yellow-400 rounded-md w-16 m-auto">
									W
								</h1>
								<p className="font-semibold">Warning</p>
							</div>
							<div
								id="f"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("F")}
							>
								<h1 className="font-bold text-3xl text-red-700 bg-red-500 rounded-md w-16 m-auto">
									F
								</h1>
								<p className="font-semibold">Fault</p>
							</div>
							<div
								id="r"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("R")}
							>
								<h1 className="font-bold text-3xl text-blue-950 rounded-md">
									R
								</h1>
								<p className="font-semibold leading-4">
									Referee <br /> called{" "}
								</p>
							</div>
							<div
								id="s"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("S")}
							>
								<h1 className="font-bold text-3xl text-blue-950 rounded-md">
									S
								</h1>
								<p className="font-semibold">Suspension</p>
							</div>
							<div
								id="o"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("O")}
							>
								<h1 className="font-bold text-3xl text-blue-950 rounded-md">
									O
								</h1>
								<p className="font-semibold">Overrule</p>
							</div>
							<div
								id="i"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("I")}
							>
								<h1 className="font-bold text-3xl font-mono text-blue-950 rounded-md">
									I
								</h1>
								<p className="font-semibold">Injury</p>
							</div>
							<div
								id="dec"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("DIS")}
							>
								<h1 className="font-bold text-slate-400 bg-slate-700 rounded-sm w-16 h-10 m-auto flex items-center justify-center">
									DEC
								</h1>
								<p className="font-semibold">Disqualified</p>
							</div>
							<div
								id="ret"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("RET")}
							>
								<h1 className="font-bold text-3xl text-blue-950 rounded-md">
									RET
								</h1>
								<p className="font-semibold">Retired</p>
							</div>
							<div
								id="c"
								className="text-center font-inter px-4 py-2 cursor-pointer"
								onClick={() => handleMisconduct("C")}
							>
								<h1 className="font-bold text-3xl text-blue-950 rounded-md">
									C
								</h1>
								<p className="font-semibold leading-4">
									Service <br /> Court Error
								</p>
							</div>
						</div>
					)}
					{misconductBox && step === 2 && (
						<div className="bg-white w-full h-full top-0 absolute ">
							<div className="flex justify-center flex-col gap-2 align-middle items-center p-2">
								<h1>Choose player</h1>
								<select
									name="player"
									id=""
									className="w-100 h-100 bg-slate-200 p-2"
									onChange={handlePlayerSelect}
								>
									<option value="">Select Player</option>
									<option value={matchData.playerOne}>
										{matchData.playerOne}
									</option>
									<option value={matchData.playerTwo}>
										{matchData.playerTwo}
									</option>
									{matchData.playerThree && (
										<option value={matchData.playerThree}>
											{matchData.playerThree}
										</option>
									)}
									{matchData.playerFour && (
										<option value={matchData.playerFour}>
											{matchData.playerFour}
										</option>
									)}
								</select>
							</div>
						</div>
					)}
					<button
						className="border border-black px-4 py-2 rounded-md text-xl font-inter font-semibold"
						onClick={() => setMisconductBox(false)}
					>
						Cancel
					</button>
				</div>
			)}

			{endMatchConfirmation && (
				<div className="bg-white text-3xl font-inter absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg">
					<h1 className="text-lg lg:text-xl">{winnerMessage}</h1>
					<div className="mt-5 flex gap-10">
						<button
							className="border border-green-500 bg-green-500 hover:border-green-600 hover:bg-green-600 text-2xl font-inter px-4 py-2 rounded-md flex-1 font-semibold"
							onClick={() => end()}
						>
							Yes
						</button>
						<button
							className="border border-red-500 bg-red-500 hover:border-red-600 hover:bg-red-600 text-2xl font-inter px-4 py-2 rounded-md flex-1  font-semibold"
							onClick={() => setEndMatchConfirmation(false)}
						>
							No
						</button>
					</div>
				</div>
			)}

			{/* Interval UI */}
			{showInterval && (
				<>
					{/* Blurred background overlay */}
					<div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
					
					<div className="bg-white text-3xl font-inter absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg shadow-lg z-50 max-w-md w-full">
						<h1 className="text-2xl lg:text-3xl font-bold text-center mb-4">INTERVAL</h1>
						<p className="text-lg text-center mb-4">
							{intervalTeam === 1 ? matchData?.firstTeamName : matchData?.secondTeamName} has reached the interval point
						</p>
						
						{/* Interval timer */}
						<div className="flex flex-col items-center justify-center mb-6">
							<div className="text-4xl font-mono font-bold bg-gray-100 px-6 py-3 rounded-lg">
								{formatIntervalTime(intervalTimeLeft)}
							</div>
							<p className="text-sm text-gray-500 mt-2">Remaining time</p>
						</div>
						
						<div className="flex justify-center">
							<button
								className="border border-blue-500 bg-blue-500 hover:bg-blue-600 text-white text-xl font-inter px-6 py-3 rounded-md font-semibold"
								onClick={resumeAfterInterval}
							>
								Resume Match
							</button>
						</div>
					</div>
				</>
			)}

			{/* Match Point Indicator */}
			{matchPoint && !showWinAnimation && (
				<div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-40 animate-pulse">
					<div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg text-center">
						<h2 className="text-xl font-bold">
							{matchPoint === 1 ? matchData?.firstTeamName : matchData?.secondTeamName} 
							{" MATCH POINT"}
						</h2>
					</div>
				</div>
			)}

			{/* Win Animation */}
			{showWinAnimation && (
				<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 shadow-2xl transform scale-110 transition-all duration-300 max-w-md w-full mx-4">
						<div className="text-center">
							<div className="flex justify-center mb-3">
								<div className="inline-block text-5xl animate-bounce">🏆</div>
							</div>
							<h2 className="text-3xl font-bold text-blue-600 mb-2">
								{winningTeam === 1 ? matchData?.firstTeamName : matchData?.secondTeamName} WINS!
							</h2>
							<div className="text-2xl font-semibold bg-gray-100 rounded-full py-2 px-4 inline-block mb-2">
								{winningTeam === 1 ? teamOneScore : teamTwoScore} - {winningTeam === 1 ? teamTwoScore : teamOneScore}
							</div>
							<div className="mt-3 text-gray-600 text-sm">
								Match ending in a moment...
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="w-[80%] m-auto font-inter">
				{/* Top Button Section */}
				<h1 className="font-inter text-center font-semibold text-2xl pt-4">
					{matchData?.typeOfMatch}
				</h1>
				<div className="sm:flex justify-center items-center">
					<div 
						className="text-3xl text-white font-bold rounded-3xl py-3 px-5 bg-[rgb(124,182,203)] m-4 flex justify-center items-center shadow-lg gap-2 relative group"
					>
						<div className="flex items-center gap-2">
							<button
								className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
								onClick={() => {
									if (matchStarted && parseInt(numberOfShuttlecock) > 1) {
										decrementShuttlecock();
									}
								}}
								disabled={!matchStarted || parseInt(numberOfShuttlecock) <= 1}
								title={matchStarted ? "Remove shuttlecock" : "Match not started"}
							>
								<span className="text-xl font-bold">-</span>
							</button>
							
							<img src=".././mdi_badminton.png" alt="shuttle cock icon" className="h-8" />
							<span className="text-xl font-mono bg-white/20 px-2 py-1 rounded-md min-w-[2rem] text-center">
								{numberOfShuttlecock}
							</span>
							
							<button
								className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
								onClick={() => {
									if (matchStarted) {
										incrementShuttlecock();
									}
								}}
								disabled={!matchStarted}
								title={matchStarted ? "Add shuttlecock" : "Match not started"}
							>
								<span className="text-xl font-bold">+</span>
							</button>
						</div>
					</div>
					<button
						className={`text-xl text-white font-bold rounded-3xl px-5 py-3 bg-[#7cb6cb] m-4 w-auto flex justify-center items-center shadow-lg gap-2 transition-all ${
							parseInt(teamOneScore) === 0 && parseInt(teamTwoScore) === 0
								? "opacity-50 cursor-not-allowed"
								: "hover:bg-[#5a9cb5]"
						}`}
						onClick={() => handleButtonClick("undo")}
						disabled={parseInt(teamOneScore) === 0 && parseInt(teamTwoScore) === 0}
						title="Undo last point"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							height="40px"
							viewBox="0 -960 960 960"
							width="40px"
							fill="#fff"
						>
							<path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z" />
						</svg>
						<span className="hidden sm:inline">Undo</span>
					</button>
					<button
						className="text-3xl text-white font-bold rounded-3xl px-5 py-3 bg-[#7cb6cb] m-4 w-48 flex justify-center items-center shadow-lg"
						onClick={() => setMisconductBox(!misconductBox)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 -960 960 960"
							className="w-12 h-12"
							fill="#FFFFFF"
						>
							<path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z" />
						</svg>
					</button>
					<div>
						{matchStarted ? (
							<div className="flex justify-center gap-4">
								<button
									className="text-xl xl:text-3xl min-w-48 text-white font-bold rounded-lg xl:rounded-2xl px-5 py-3 bg-red-400 m-4 flex justify-center items-center shadow-lg uppercase"
									onClick={() => {
										stopMatchTimer();
										endMatchSession();
									}}
								>
									Stop
								</button>
							</div>
						) : knockupCompleted ? (
							<button
								className="text-xl xl:text-3xl min-w-48 text-white font-bold rounded-lg xl:rounded-2xl px-5 py-3 bg-green-400 m-4 flex justify-center items-center shadow-lg uppercase"
								onClick={handleLoveAllPlay}
							>
								Love All Play
							</button>
						) : null}
					</div>
				</div>

				{/* Timer display */}
				{matchStarted && (
					<div className="flex justify-center my-6">
						<MatchTimer
							isRunning={isMatchTimerRunning}
							onPauseResume={handleTimerPauseResume}
							initialTime={matchTime}
						/>
					</div>
				)}

				{/* Remove ServiceTrackingUI component */}
				
				{/* Main Section */}
				<div className="w-[85%] lg:w-[60%] m-auto h-auto bg-white pb-4 rounded-t-3xl">
					{/* Score */}
					<div className="px-10 text-[4rem] lg:text-[5rem] text-[#7cb6cb] flex justify-center gap-5 md:gap-10 items-center">
						<span>
							{matchData.firstTeamName === matchData.receiver
								? `${teamOneScore}`
								: `${teamTwoScore}`}
						</span>
						<span> - </span>
						<span>
							{matchData.firstTeamName === matchData.receiver
								? `${teamTwoScore}`
								: `${teamOneScore}`}
						</span>
					</div>
					{/* Court */}
					<div className="">
						<div className="h-[10rem] sm:h-[14rem] md:h-[20rem] lg:h-[23rem] xl:h-[25rem] 2xl:h-[30rem] bg-green-600 flex shadow-lg relative">
							{/* Court lines */}
							<div className="absolute inset-0 flex">
								{/* Vertical center line */}
								<div className="w-[2px] h-full bg-white mx-auto"></div>
								
								{/* Horizontal lines */}
								<div className="absolute top-1/4 w-full h-[2px] bg-white"></div>
								<div className="absolute top-3/4 w-full h-[2px] bg-white"></div>
								
								{/* Service court lines */}
								<div className="absolute left-1/4 top-0 w-[2px] h-full bg-white"></div>
								<div className="absolute left-3/4 top-0 w-[2px] h-full bg-white"></div>
							</div>
							
							{/* Score buttons moved outside the court */}
							<button
								className="absolute top-1/2 transform -translate-y-1/2 left-[-4rem] xl:left-[-8rem] p-6 xl:p-10 rounded-xl md:rounded-3xl text-xl md:text-[3rem] text-white bg-[#7cb6cb] shadow-lg"
								onClick={() => handleButtonClick(`left`)}
								disabled={!matchStarted}
							>
								Score
							</button>
							
							{/* Left side of the court */}
							<div className="w-1/2 text-white flex flex-col justify-evenly items-center">
								{matchData?.firstTeamName === matchData?.receiver ? (
									<>
										{/* First team on left side */}
										<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
											<h1 className="text-xl xl:text-3xl">
												{matchData?.playerOne}
											</h1>
											<p className="text-xl md:text-3xl xl:text-[3rem]">
												({matchData?.firstTeamName})
											</p>
										</div>
										{matchData?.playerThree && (
											<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
												<h1 className="text-xl xl:text-3xl">
													{matchData?.playerThree}
												</h1>
												<p className="text-xl md:text-3xl xl:text-[3rem]">
													({matchData?.firstTeamName})
												</p>
											</div>
										)}
									</>
								) : (
									<>
										{/* Second team on left side */}
										<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
											<h1 className="text-xl xl:text-3xl">
												{matchData?.playerTwo}
											</h1>
											<p className="text-xl md:text-3xl xl:text-[3rem]">
												({matchData?.secondTeamName})
											</p>
										</div>
										{matchData?.playerFour && (
											<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
												<h1 className="text-xl xl:text-3xl">
													{matchData?.playerFour}
												</h1>
												<p className="text-xl md:text-3xl xl:text-[3rem]">
													({matchData?.secondTeamName})
												</p>
											</div>
										)}
									</>
								)}
							</div>
							
							{/* Right side of the court */}
							<div className="w-1/2 text-white flex flex-col justify-evenly items-center">
								{matchData?.firstTeamName === matchData?.receiver ? (
									<>
										{/* Second team on right side */}
										<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
											<h1 className="text-xl xl:text-3xl">
												{matchData?.playerTwo}
											</h1>
											<p className="text-xl md:text-3xl xl:text-[3rem]">
												({matchData?.secondTeamName})
											</p>
										</div>
										{matchData?.playerFour && (
											<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
												<h1 className="text-xl xl:text-3xl">
													{matchData?.playerFour}
												</h1>
												<p className="text-xl md:text-3xl xl:text-[3rem]">
													({matchData?.secondTeamName})
												</p>
											</div>
										)}
									</>
								) : (
									<>
										{/* First team on right side */}
										<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
											<h1 className="text-xl xl:text-3xl">
												{matchData?.playerOne}
											</h1>
											<p className="text-xl md:text-3xl xl:text-[3rem]">
												({matchData?.firstTeamName})
											</p>
										</div>
										{matchData?.playerThree && (
											<div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
												<h1 className="text-xl xl:text-3xl">
													{matchData?.playerThree}
												</h1>
												<p className="text-xl md:text-3xl xl:text-[3rem]">
													({matchData?.firstTeamName})
												</p>
											</div>
										)}
									</>
								)}
							</div>
							
							{/* Score button moved outside the court */}
							<button
								className="absolute top-1/2 transform -translate-y-1/2 right-[-4rem] xl:right-[-8rem] p-6 xl:p-10 rounded-xl md:rounded-3xl text-xl md:text-[3rem] text-white bg-[#7cb6cb] shadow-lg"
								onClick={() => handleButtonClick("right")}
								disabled={!matchStarted}
							>
								Score
							</button>
						</div>
					</div>
				</div>
				{/* score table */}
				<div className="w-full md:w-[80%] m-auto">
					<ScoreSheet
						selectedPlayer={selectedPlayer}
						misconduct={misconduct}
						misconducts={misconducts}
						onMisconductUpdate={handleMisconductUpdate}
					/>
				</div>
				<footer className="text-center">
					<div className="opacity-50 text-5xl md:text-7xl xl:text-9xl">
						<Watermark />
					</div>
					<div className="text-white font-inter text-sm md:text-base lg:text-lg tracking-widest">
						Maintained and developed by{" "}
						<span className="font-bold">
							ESH<span className="font-bold text-[#d86dfc]">WAY</span>
						</span>
					</div>
				</footer>
			</div>
		</div>
	);
}

export default ScorePage;

