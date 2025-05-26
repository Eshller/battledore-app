import React, { useEffect, useState, useRef } from "react";
import ScoreSheet from "../components/ScoreSheet";
import VerticalScoreSheet from "../components/VerticalScoreSheet";
import ScoreSheetTemplate from "../components/ScoreSheetTemplate";
import Watermark from "../components/Watermark";
import { useService } from "../ContextAPI/axios";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function MatchDetails() {
	const { getMatchData, matchData } = useService();
	const gameId = useParams();
	const Navigate = useNavigate();
	const scoreSheetRef = useRef(null);
	const pdfTemplateRef = useRef(null);
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
				// getMatchData already sets matchData in the context
				const response = await getMatchData(gameId.id);
				if (response?.match) {
					// Process the match data for local state variables
					const matchData = response.match;

					const time = {
						minutes: parseInt(matchData.matchTime?.minutes) || 0,
						seconds: parseInt(matchData.matchTime?.seconds) || 0,
					};
					setMatchTime(time);
					
					// Set start and end times if available
					if (matchData.startTime) {
						setStartTime(new Date(matchData.startTime));
					}
					if (matchData.endTime) {
						setEndTime(new Date(matchData.endTime));
					}
					
					// Set shuttlecock count if available
					if (matchData.scores && matchData.scores.length > 0) {
						const lastScore = matchData.scores[matchData.scores.length - 1];
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

	const handleDownloadPDF = async () => {
		if (!pdfTemplateRef.current) {
			toast.error("Unable to generate PDF. Please try again.");
			return;
		}
		
		setIsGeneratingPDF(true);
		
		try {
			// Create container for PDF generation
			const pdfContainer = document.createElement("div");
			pdfContainer.style.width = "100%";
			pdfContainer.style.backgroundColor = "white";
			pdfContainer.style.position = "absolute";
			pdfContainer.style.top = "-9999px";
			pdfContainer.style.left = "-9999px";
			document.body.appendChild(pdfContainer);
			
			// Clone the template
			const templateClone = pdfTemplateRef.current.cloneNode(true);
			pdfContainer.appendChild(templateClone);
			
			toast.info("Generating PDF, please wait...");
			
			// Create canvas from the container
			const canvas = await html2canvas(pdfContainer, {
				scale: 2,
				useCORS: true,
				allowTaint: true,
				backgroundColor: "#ffffff"
			});
			
			// Convert to image
			const imgData = canvas.toDataURL("image/png");
			
			// Create PDF with landscape orientation
			const pdf = new jsPDF({
				orientation: "landscape",
				unit: "mm",
				format: "a4"
			});
			
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = pdf.internal.pageSize.getHeight();
			
			// Calculate proper scaling to fit the image in the page
			const imgWidth = canvas.width;
			const imgHeight = canvas.height;
			const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
			const imgX = (pdfWidth - imgWidth * ratio) / 2;
			const imgY = (pdfHeight - imgHeight * ratio) / 2;
			
			pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
			
			// Save the PDF
			const eventTitle = matchData?.eventDetails?.eventTitle || "Match";
			const playerNames = [
				matchData?.playerOne || "",
				matchData?.playerTwo || ""
			].filter(Boolean).join("_vs_");
			
			const fileName = `${eventTitle}_${playerNames}_Scoresheet.pdf`;
			pdf.save(fileName);
			
			// Clean up
			document.body.removeChild(pdfContainer);
			
			toast.success(`Scoresheet downloaded as ${fileName}`);
		} catch (error) {
			console.error("Error generating PDF:", error);
			toast.error("Failed to generate PDF. Please try again later.");
		} finally {
			setIsGeneratingPDF(false);
		}
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
											{matchData?.firstTeamName || matchData?.playerOne}
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
											{matchData?.secondTeamName || matchData?.playerTwo}
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
							<div className="bg-white/10 rounded-lg p-3">
								<p className="text-sm opacity-70">Umpire</p>
								<p className="text-lg font-semibold">
									{matchData.umpire || matchData.umpireId || matchData.referee || "Not assigned"}
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
					<div ref={scoreSheetRef}>
						<ScoreSheet 
							misconducts={matchData.misconducts || []} 
							scores={matchData.scores || []}
						/>
					</div>
					
					{/* Hidden PDF Template */}
					<div className="hidden">
						<div ref={pdfTemplateRef}>
							<ScoreSheetTemplate matchData={matchData} />
						</div>
					</div>
					
					{/* Download Button */}
					<div className="mt-4 flex justify-center">
						<button
							onClick={handleDownloadPDF}
							disabled={isGeneratingPDF}
							className={`bg-gradient-to-br from-[#5fa8d3] to-[#2c8bb6] hover:from-[#4c99c4] hover:to-[#207ca7] text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all ${isGeneratingPDF ? 'opacity-75 cursor-not-allowed' : ''}`}
						>
							{isGeneratingPDF ? (
								<>
									<svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Generating PDF...
								</>
							) : (
								<>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									Download Scoresheet PDF
								</>
							)}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default MatchDetails;
