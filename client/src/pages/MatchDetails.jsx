import React, { useEffect, useState } from "react";
import ScoreSheet from "../components/ScoreSheet";
import VerticalScoreSheet from "../components/VerticalScoreSheet";
import Watermark from "../components/Watermark";
import { useService } from "../ContextAPI/axios";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function MatchDetails() {
	const { getMatchData, matchData } = useService();
	const gameId = useParams();
	const Navigate = useNavigate();

	const [liveScore, setLiveScore] = useState("");
	const [error, setError] = useState(null);
	const [matchTime, setMatchTime] = useState({ minutes: 0, seconds: 0 });
	const [startTime, setStartTime] = useState(null);
	const [endTime, setEndTime] = useState(null);
	const [shuttlecockCount, setShuttlecockCount] = useState("0");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const response = await getMatchData(gameId.id);
				if (response?.match) {
					const time = {
						minutes: parseInt(response.match.matchTime?.minutes) || 0,
						seconds: parseInt(response.match.matchTime?.seconds) || 0,
					};
					setMatchTime(time);
					
					// Set start and end times if available
					if (response.match.startTime) {
						setStartTime(new Date(response.match.startTime));
					}
					if (response.match.endTime) {
						setEndTime(new Date(response.match.endTime));
					}
					
					// Set shuttlecock count if available
					if (response.match.scores && response.match.scores.length > 0) {
						const lastScore = response.match.scores[response.match.scores.length - 1];
						setShuttlecockCount(lastScore.numberOfShuttlecock || "0");
					}
				}
			} catch (err) {
				console.error("Error fetching match data:", err);
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [gameId.id]);

	// Update local matchTime when matchData changes
	useEffect(() => {
		if (matchData?.matchTime) {
			const time = {
				minutes: parseInt(matchData.matchTime.minutes) || 0,
				seconds: parseInt(matchData.matchTime.seconds) || 0,
			};
			setMatchTime(time);
		}
		
		// Update start and end times if available
		if (matchData?.startTime) {
			setStartTime(new Date(matchData.startTime));
		}
		if (matchData?.endTime) {
			setEndTime(new Date(matchData.endTime));
		}
	}, [matchData]);

	useEffect(() => {
		socket.on("score_updated", (data) => {
			setLiveScore(data);
		});

		return () => {
			socket.off("score_updated");
		};
	}, []);

	function toSentenceCase(str) {
		if (!str) return str;
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	const formatTime = (time) => {
		if (!time || typeof time !== "object") {
			return "00:00";
		}

		const minutes = String(parseInt(time.minutes) || 0).padStart(2, "0");
		const seconds = String(parseInt(time.seconds) || 0).padStart(2, "0");
		return `${minutes}:${seconds}`;
	};
	
	// Format date and time for display
	const formatDateTime = (date) => {
		if (!date) return "Not available";
		
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		}).format(date);
	};

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center text-red-500">
					<h2 className="text-2xl font-bold">Something went wrong</h2>
					<p>Please try again later</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[90vh] w-full max-w-6xl mx-auto px-3 md:px-4 pt-6 font-inter">
			<h1 className="text-xl md:text-3xl text-white font-bold mb-4">
				Match Details
			</h1>

			<div className="bg-white rounded-xl shadow-lg overflow-hidden">
				{/* Header Image */}
				<div className="relative h-[160px] sm:h-[200px] overflow-hidden">
					<img
						src="../badminton.jpg"
						className="w-full h-full object-cover"
						alt="Match Banner"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
				</div>

				{/* Match Info */}
				<div className="bg-gradient-to-br from-[#90cae3] to-[#7CB6CB] p-4 md:p-6">
					<div className="max-w-3xl mx-auto space-y-4">
						{/* Title and Date */}
						<div className="text-center space-y-2">
							<h2 className="text-xl md:text-2xl font-bold text-white">
								{matchData?.eventDetails?.eventTitle}
							</h2>
							<p className="text-base md:text-lg text-white/90">
								{matchData?.eventDetails?.eventStart} to{" "}
								{matchData?.eventDetails?.eventEnd}
							</p>
							<p className="text-sm md:text-base text-white/80">
								Match Date: {matchData?.matchDate}
							</p>
						</div>

						{/* Match Start and End Times */}
						{(startTime || endTime) && (
							<div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center space-y-3">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex flex-col items-center justify-center">
										<span className="text-sm font-medium uppercase tracking-wider text-white/90 mb-2">Match Started At</span>
										<div className="bg-white/20 px-4 py-2 rounded-lg text-white font-medium">
											{formatDateTime(startTime)}
										</div>
									</div>
									
									<div className="flex flex-col items-center justify-center">
										<span className="text-sm font-medium uppercase tracking-wider text-white/90 mb-2">Match Ended At</span>
										<div className="bg-white/20 px-4 py-2 rounded-lg text-white font-medium">
											{formatDateTime(endTime)}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Shuttlecock Count */}
						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
							<span className="text-sm font-medium uppercase tracking-wider text-white/90 mb-2 block">Shuttlecocks Used</span>
							<div className="bg-white/20 px-4 py-2 rounded-lg inline-block">
								<span className="text-2xl font-bold text-white">{shuttlecockCount}</span>
							</div>
						</div>

						{/* Score Display */}
						{(matchData.isPlayed || matchData?.scores?.length > 0) && (
							<div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center space-y-3">
								{/* Match Duration - Enhanced styling */}
								<div className="flex flex-col items-center justify-center gap-2 text-white/90 mb-4">
									<span className="text-sm font-medium uppercase tracking-wider">Match Duration</span>
									<div className="flex items-center justify-center gap-2">
										<div className="flex flex-col items-center">
											<div className="text-2xl font-bold font-mono bg-white/20 px-3 py-1 rounded-lg">
												{String(parseInt(matchTime.minutes) || 0).padStart(2, "0")}
											</div>
											<span className="text-xs text-white/80 mt-1">MIN</span>
										</div>
										<div className="text-xl font-bold text-white/70 mb-2">:</div>
										<div className="flex flex-col items-center">
											<div className="text-2xl font-bold font-mono bg-white/20 px-3 py-1 rounded-lg">
												{String(parseInt(matchTime.seconds) || 0).padStart(2, "0")}
											</div>
											<span className="text-xs text-white/80 mt-1">SEC</span>
										</div>
									</div>
								</div>
								
								{/* Winner/Live Status */}
								{matchData.isPlayed ? (
									<p className="inline-block px-6 py-2 bg-green-500 text-white rounded-full text-lg font-bold">
										{toSentenceCase(matchData.winner)}
									</p>
								) : (
									matchData?.scores?.length > 0 && (
										<div className="space-y-3">
											{(liveScore.status === "start" || liveScore === "") && (
												<div className="flex items-center justify-center gap-2">
													<span className="relative flex h-3 w-3">
														<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
														<span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
													</span>
													<p className="text-red-500 font-bold">LIVE NOW</p>
												</div>
											)}
											{liveScore.status === "end" && (
												<p className="text-green-500 font-bold text-xl">
													{liveScore.won}
												</p>
											)}
										</div>
									)
								)}

								{/* Score */}
								<div className="flex justify-center items-center gap-4 text-3xl md:text-4xl font-bold text-white">
									<div className="text-center">
										<span>
											{matchData.isPlayed || !liveScore
												? matchData?.scores?.slice(-1)[0]?.firstTeamScore
												: liveScore.firstTeamScore}
										</span>
										<p className="text-sm mt-1 font-normal opacity-80">
											{matchData?.firstTeamName}
										</p>
									</div>
									<span className="opacity-50">vs</span>
									<div className="text-center">
										<span>
											{matchData.isPlayed || !liveScore
												? matchData?.scores?.slice(-1)[0]?.secondTeamScore
												: liveScore.secondTeamScore}
										</span>
										<p className="text-sm mt-1 font-normal opacity-80">
											{matchData?.secondTeamName}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Match Details Grid */}
						<div className="grid sm:grid-cols-2 gap-3 text-white/90">
							{matchData.eventPlace && (
								<div className="bg-white/10 rounded-lg p-3">
									<p className="text-sm opacity-70">Court Number</p>
									<p className="text-lg font-semibold">
										{matchData.eventPlace}
									</p>
								</div>
							)}
							<div className="bg-white/10 rounded-lg p-3">
								<p className="text-sm opacity-70">Match Type</p>
								<p className="text-lg font-semibold">{matchData.typeOfMatch}</p>
							</div>
							<div className="bg-white/10 rounded-lg p-3">
								<p className="text-sm opacity-70">Total Points</p>
								<p className="text-lg font-semibold">{matchData.totalPoints || 21}</p>
							</div>
							<div className="bg-white/10 rounded-lg p-3">
								<p className="text-sm opacity-70">First Team Players</p>
								<p className="text-lg font-semibold">
									{matchData.playerOne}
									{matchData.playerThree && ` & ${matchData.playerThree}`}
								</p>
							</div>
							<div className="bg-white/10 rounded-lg p-3">
								<p className="text-sm opacity-70">Second Team Players</p>
								<p className="text-lg font-semibold">
									{matchData.playerTwo}
									{matchData.playerFour && ` & ${matchData.playerFour}`}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Score Sheet */}
			{matchData && (matchData.isPlayed || matchData?.scores?.length > 0) && (
				<div className="mt-6 mb-8">
					<h2 className="text-xl md:text-2xl text-white font-bold mb-4">
						Score Sheet
					</h2>
					<ScoreSheet 
						misconducts={matchData.misconducts || []} 
						scores={matchData.scores || []}
					/>
				</div>
			)}
		</div>
	);
}

export default MatchDetails;
