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

	useEffect(() => {
		const fetchData = async () => {
			try {
				await getMatchData(gameId.id);
			} catch (err) {
				setError(err);
				console.error("Error fetching match data:", err);
			}
		};
		fetchData();
	}, [gameId.id]);

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
		<>
			<div className="min-h-[90vh] w-[90%] 2xl:w-full pt-10 font-inter">
				<h1 className="text-2xl md:text-4xl lg:text-5xl text-white font-medium px-4 md:px-10">
					Live Score
				</h1>
				<div id="main" className="mt-4 sm:mt-6 md:mt-10 w-full">
					{/* match details */}
					<div id="infoBox" className="w-full rounded-3xl overflow-hidden">
						<div
							id="img"
							className="h-[180px] sm:h-[240px] md:h-[260px] lg:h-[320px] overflow-hidden flex justify-between items-center"
						>
							<img src="../badminton.jpg" className="h-auto w-full" alt="" />
						</div>
						<div className="bg-[#7cb6cb] h-full text-white p-2 md:p-5 flex flex-col gap-5 items-center">
							<div className="flex flex-col gap-0 md:gap-2 items-center">
								<h1 className="text-[#B1D848] text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
									Title :{" "}
									<span>{`${matchData?.eventDetails?.eventTitle}`}</span>
								</h1>
								<p className="text-base xs:text-lg sm:text-xl md:text-2xl font-normal">
									<span className="font-bold">
										{matchData?.eventDetails?.eventStart}
									</span>{" "}
									to{" "}
									<span className="font-bold">
										{matchData?.eventDetails?.eventEnd}
									</span>{" "}
								</p>
								<p className="text-base sm:text-xl md:text-2xl font-normal">
									Match Date : {matchData?.matchDate}
								</p>
							</div>
							<div className="leading-5 md:leading-8 w-full text-wrap font-normal text-center text-sm sm:text-base md:text-xl">
								{matchData.eventPlace ? (
									<p>
										Court no. :{" "}
										<span className="font-bold">{matchData?.eventPlace}</span>
									</p>
								) : null}
								<p>
									Type of match :{" "}
									<span className="font-bold">{matchData?.typeOfMatch}</span>
								</p>
								<p>
									First team name :{" "}
									<span className="font-bold">{matchData?.firstTeamName}</span>
								</p>
								<p>
									Second team name :{" "}
									<span className="font-bold">{matchData?.secondTeamName}</span>
								</p>
								<p>
									First team player's name :{" "}
									<span className="font-bold">{matchData?.playerOne}</span>
									{matchData?.playerThree ? (
										<span className="font-bold">
											{" "}
											& {matchData?.playerThree}
										</span>
									) : null}
								</p>
								<p>
									Second team player's name :{" "}
									<span className="font-bold">{matchData?.playerTwo}</span>
									{matchData?.playerFour ? (
										<span className="font-bold">
											{" "}
											& {matchData?.playerFour}
										</span>
									) : null}
								</p>
							</div>
						</div>
					</div>
					{matchData.isPlayed || matchData?.scores?.length > 0 ? (
						<div>
							{/* Match scores */}
							<div className="p-1 md:p-3 w-full">
								<div>
									{matchData.isPlayed ? (
										<p className="px-5 py-1 text-center text-xl sm:text-3xl text-green-600 font-bold">
											{toSentenceCase(matchData.winner)}
										</p>
									) : (
										<div>
											{matchData?.scores?.length > 0 ? (
												<div>
													<div>
														{liveScore.status === "start" ||
														liveScore === "" ? (
															<p className="px-5 py-1 text-lg md:text-2xl text-red-600 font-bold text-center">
																Match is Live Now
															</p>
														) : null}
													</div>
													<div>
														{liveScore.status === "end" && (
															<p className="px-5 py-1 text-center text-xl sm:text-3xl text-green-600 font-bold">
																{liveScore.won}
															</p>
														)}
													</div>
												</div>
											) : null}
										</div>
									)}
								</div>
								<div className="flex justify-center items-center gap-1 text-white text-3xl w-full">
									<p>
										{matchData.isPlayed || liveScore == ""
											? matchData?.scores?.length > 0
												? matchData.scores.slice(-1)[0].firstTeamScore
												: null
											: liveScore.firstTeamScore}
									</p>
									<p>-</p>
									<p>
										{matchData.isPlayed || liveScore == ""
											? matchData?.scores?.length > 0
												? matchData.scores.slice(-1)[0].secondTeamScore
												: null
											: liveScore.secondTeamScore}
									</p>
								</div>
							</div>

							{matchData.isPlayed || matchData?.scores?.length > 0 ? (
								<div className="w-[90%] 2xl:w-fit 2xl:m-auto pb-10">
									<ScoreSheet misconducts={matchData.misconducts || []} />
								</div>
							) : null}
						</div>
					) : null}
				</div>
			</div>
		</>
	);
}

export default MatchDetails;
