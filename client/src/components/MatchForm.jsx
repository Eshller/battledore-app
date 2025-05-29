import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useService } from "../ContextAPI/axios";
import dayjs from "dayjs";
import io from "socket.io-client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// const socket = io.connect("http://localhost:3001");
const socket = io(`${import.meta.env.VITE_SERVER}`);

function MatchForm({ event, onClose }) {
	const { addMatch, getAllUsers, playerList, getPlayers } = useService();
	const formRef = useRef(null);

	const [matchTypeOption, setMatchTypeOption] = useState(false);
	const [matchBox, setMatchBox] = useState(true);
	const [playerState, setPlayerState] = useState(false);
	const [umpireOptions, setUmpireOptions] = useState([]);
	const [showUmpireDropdown, setShowUmpireDropdown] = useState(false);
	const [availablePlayers, setAvailablePlayers] = useState([]);
	const [showPlayerDropdowns, setShowPlayerDropdowns] = useState({
		playerOne: false,
		playerTwo: false,
		playerThree: false,
		playerFour: false
	});
	
	const umpireDropdownRef = useRef(null);
	const playerDropdownRefs = {
		playerOne: useRef(null),
		playerTwo: useRef(null),
		playerThree: useRef(null),
		playerFour: useRef(null)
	};

	// Add state to track if user is interacting with dropdowns
	const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);

	// Add state for date picker
	const [startDate, setStartDate] = useState(null);

	// Ensure the parent component is notified when matchBox state changes
	useEffect(() => {
		if (!matchBox && onClose) {
			onClose();
		}
	}, [matchBox]);
	
	const [matchDetail, setMatchDetail] = useState({
		eventDetails: event?._id,
		typeOfMatch: "",
		firstTeamName: "",
		secondTeamName: "",
		playerOne: "",
		playerTwo: "",
		playerThree: "",
		playerFour: "",
		umpireId: "",
		matchDate: "",
		totalPoints: 21,
	});

	// Fetch all users and players when component mounts
	useEffect(() => {
		const fetchData = async () => {
			await getAllUsers();
			const players = await getPlayers();
			setAvailablePlayers(players || []);
		};
		fetchData();
	}, []);

	// Filter umpires from playerList
	useEffect(() => {
		if (playerList && playerList.length > 0) {
			const umpires = playerList.filter(user => user.jobrole === "umpire");
			setUmpireOptions(umpires);
		}
	}, [playerList]);

	// Close dropdowns when clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			// Close match type dropdown
			if (!event.target.closest('[data-dropdown="match-type"]')) {
				setMatchTypeOption(false);
			}

			// Close umpire dropdown
			if (umpireDropdownRef.current && !umpireDropdownRef.current.contains(event.target)) {
				setShowUmpireDropdown(false);
			}

			// Handle player dropdowns
			Object.keys(playerDropdownRefs).forEach(key => {
				if (playerDropdownRefs[key].current && !playerDropdownRefs[key].current.contains(event.target)) {
					setShowPlayerDropdowns(prev => ({ ...prev, [key]: false }));
				}
			});
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Add click outside handler
	useEffect(() => {
		function handleClickOutside(event) {
			if (formRef.current && !formRef.current.contains(event.target)) {
				setMatchBox(false);
				if (onClose) {
					onClose();
				}
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	function selectUmpire(username) {
		setMatchDetail({
			...matchDetail,
			umpireId: username,
		});
		setShowUmpireDropdown(false);
	}

	function selectPlayer(field, playerName) {
		setMatchDetail({
			...matchDetail,
			[field]: playerName,
		});
		setShowPlayerDropdowns(prev => ({ ...prev, [field]: false }));
		setIsInteractingWithDropdown(false);
	}

	function matchType(opt) {
		setMatchDetail(prev => ({
			...prev,
			typeOfMatch: opt,
		}));
		if (opt === "Men's doubles" || opt === "Women's doubles" || opt === "Mixed Doubles") {
			setPlayerState(true);
		} else {
			setPlayerState(false);
			setMatchDetail(prev => ({
				...prev,
				playerThree: "",
				playerFour: ""
			}));
		}
		setMatchTypeOption(false);
		setIsInteractingWithDropdown(false);
	}

	function toSentenceCase(str) {
		return str
			.toLowerCase()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	const handleMatchData = (e) => {
		const { name, value } = e.target;
		
		// Handle player fields specially
		if (['playerOne', 'playerTwo', 'playerThree', 'playerFour'].includes(name)) {
			setMatchDetail({
				...matchDetail,
				[name]: value
			});
			// Show dropdown when typing
			setShowPlayerDropdowns(prev => ({ ...prev, [name]: true }));
			return;
		}

		setMatchDetail({
			...matchDetail,
			[name]: name === 'totalPoints' ? parseInt(value) : value,
		});

		// If typing in umpire field, show dropdown
		if (name === 'umpireId') {
			setShowUmpireDropdown(true);
		}
	};

	// Update verifyDate function
	const verifyDate = (selectedDate) => {
		if (!selectedDate) return false;
		
		const date = dayjs(selectedDate);
		const startDate = dayjs(event?.eventStart, "DD-MM-YYYY");
		const endDate = dayjs(event?.eventEnd, "DD-MM-YYYY");

		const isWithinRange = date.isBetween(startDate, endDate, null, "[]");
		if (!isWithinRange) {
			toast.error("Date must be within event range");
			return false;
		}
		return true;
	};

	// Add date change handler
	const handleDateChange = (date) => {
		if (verifyDate(date)) {
			setStartDate(date);
			setMatchDetail(prev => ({
				...prev,
				matchDate: dayjs(date).format("YYYY-MM-DD")
			}));
		}
	};

	const handleSumbmit = async (e) => {
		e.preventDefault();

		// Validate required fields
		if (!matchDetail.typeOfMatch || !matchDetail.playerOne || !matchDetail.playerTwo || !matchDetail.umpireId || !matchDetail.matchDate) {
			toast.error("Type of match, player names, umpire, and match date are required");
			return;
		}

		try {
			const response = await addMatch(event?._id, matchDetail);

			if (response && response.status === 201) {
				// Don't show another success toast here, as addMatch already shows one
				if (response.data && response.data.match && response.data.match._id) {
					socket.emit("new_match_created", response.data.match._id);
				}

				// Reset form data
				setMatchDetail({
					eventDetails: event?._id,
					typeOfMatch: "",
					firstTeamName: "",
					secondTeamName: "",
					playerOne: "",
					playerTwo: "",
					playerThree: "",
					playerFour: "",
					umpireId: "",
					matchDate: "",
					totalPoints: 21,
				});
				
				// Close the form immediately
				if (onClose) {
					onClose();
				}
				setMatchBox(false);
			} else if (response) {
				// Only show error toast if there's actually an error and addMatch didn't already show one
				const errorMessage = response?.message || "Failed to create match";
				if (response.status !== 201) {
					toast.error(errorMessage);
				}
			}
		} catch (error) {
			console.error("Match creation error:", error);
			// Don't show duplicate error toast as addMatch already handles errors
		}
	};

	return (
		<>
			{matchBox && (
				<div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
					<div ref={formRef} className="bg-white rounded-2xl w-[90%] max-w-[500px] p-6 shadow-xl">
						<h1 className="text-lg md:text-xl lg:text-2xl text-center mb-6 font-inter font-bold text-[#B1D848]">
							Create New Match
						</h1>
						<form
							onSubmit={handleSumbmit}
							action="post"
							className="flex flex-col gap-4 font-inter"
						>
							{/* Match Type Selection */}
							<div className="relative mb-2" data-dropdown="match-type">
								<label htmlFor="typeOfMatch" className="mx-2 font-semibold">
									Type of match :
								</label>
								<input
									type="text"
									name="typeOfMatch"
									value={matchDetail.typeOfMatch}
									onChange={handleMatchData}
									onFocus={() => setMatchTypeOption(true)}
									onBlur={() => {
										if (!isInteractingWithDropdown) {
											setMatchTypeOption(false);
										}
									}}
									placeholder="Select match type"
									className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full sm:w-auto cursor-pointer hover:border-[#B1D848] transition-colors bg-transparent"
									readOnly
								/>
								{matchTypeOption && (
									<div 
										className="p-2 cursor-pointer absolute shadow-2xl bg-white right-0 top-full mt-1 z-50 rounded-md border border-gray-200 min-w-[200px]"
										onMouseEnter={() => setIsInteractingWithDropdown(true)}
										onMouseLeave={() => setIsInteractingWithDropdown(false)}
									>
										{[
											"Men's singles",
											"Men's doubles",
											"Women's singles",
											"Women's doubles",
											"Mixed Doubles",
										].map((opt) => (
											<p
												key={opt}
												className="font-medium text-sm md:text-base px-4 py-2 hover:bg-gray-100 transition-colors"
												onClick={() => {
													matchType(opt);
													setMatchTypeOption(false);
												}}
											>
												{opt}
											</p>
										))}
									</div>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Team 1 Section */}
								<div className="bg-gray-50 p-3 rounded-lg space-y-3">
									<div className="flex flex-col gap-2">
										<label htmlFor="firstTeamName" className="mx-2 font-semibold text-[#B1D848]">
											1st Team  <span className="text-gray-500 font-normal text-sm">(optional)</span>
										</label>
										<input
											type="text"
											name="firstTeamName"
											value={matchDetail.firstTeamName}
											onChange={handleMatchData}
											className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full bg-transparent"
											placeholder="Leave blank for individual players"
										/>
									</div>

									<div className="space-y-3">
										<div className="flex flex-col gap-2">
											<label htmlFor="playerOne" className="mx-2 font-medium">
												{playerState ? <span>Player 1 :</span> : <span>Player :</span>}
											</label>
											<div className="relative" ref={playerDropdownRefs.playerOne}>
												<input
													type="text"
													name="playerOne"
													value={matchDetail.playerOne}
													onChange={handleMatchData}
													onFocus={() => setShowPlayerDropdowns(prev => ({ ...prev, playerOne: true }))}
													onBlur={(e) => {
														if (!isInteractingWithDropdown) {
															setShowPlayerDropdowns(prev => ({ ...prev, playerOne: false }));
														}
													}}
													className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full bg-transparent hover:border-[#B1D848] transition-colors cursor-pointer"
													placeholder="Select or type player name"
												/>
												{showPlayerDropdowns.playerOne && (
													<div 
														className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-32 rounded-md py-1 text-base overflow-auto border border-gray-200"
														onMouseEnter={() => setIsInteractingWithDropdown(true)}
														onMouseLeave={() => setIsInteractingWithDropdown(false)}
													>
														{availablePlayers.length === 0 ? (
															<div className="px-4 py-2 text-gray-500 italic">
																No players available
															</div>
														) : (
															availablePlayers
																.filter(player => 
																	matchDetail.playerOne === "" || 
																	player.playerDetails.name.toLowerCase().includes(matchDetail.playerOne.toLowerCase())
																)
																.filter(player => 
																	// Exclude already selected players
																	player.playerDetails.name !== matchDetail.playerTwo &&
																	player.playerDetails.name !== matchDetail.playerThree &&
																	player.playerDetails.name !== matchDetail.playerFour
																)
																.map((player) => (
																	<div
																		key={player._id}
																		onClick={() => selectPlayer('playerOne', player.playerDetails.name)}
																		className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-gray-900"
																	>
																		{player.playerDetails.name}
																	</div>
																))
														)}
													</div>
												)}
											</div>
										</div>

										{(matchDetail.typeOfMatch === "Women's doubles" ||
											matchDetail.typeOfMatch === "Men's doubles" ||
											matchDetail.typeOfMatch === "Mixed Doubles") && (
											<div className="flex flex-col gap-2">
												<label htmlFor="playerThree" className="mx-2 font-medium">
													Player 2 :
												</label>
												<div className="relative" ref={playerDropdownRefs.playerThree}>
													<input
														type="text"
														name="playerThree"
														value={matchDetail.playerThree}
														onChange={handleMatchData}
														onFocus={() => setShowPlayerDropdowns(prev => ({ ...prev, playerThree: true }))}
														onBlur={(e) => {
															if (!isInteractingWithDropdown) {
																setShowPlayerDropdowns(prev => ({ ...prev, playerThree: false }));
															}
														}}
														className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full bg-transparent hover:border-[#B1D848] transition-colors cursor-pointer"
														placeholder="Select or type player name"
													/>
													{showPlayerDropdowns.playerThree && (
														<div 
															className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-32 rounded-md py-1 text-base overflow-auto border border-gray-200"
															onMouseEnter={() => setIsInteractingWithDropdown(true)}
															onMouseLeave={() => setIsInteractingWithDropdown(false)}
														>
															{availablePlayers.length === 0 ? (
																<div className="px-4 py-2 text-gray-500 italic">
																	No players available
																</div>
															) : (
																availablePlayers
																	.filter(player => 
																		matchDetail.playerThree === "" || 
																		player.playerDetails.name.toLowerCase().includes(matchDetail.playerThree.toLowerCase())
																	)
																	.filter(player => 
																		// Exclude already selected players
																		player.playerDetails.name !== matchDetail.playerOne &&
																		player.playerDetails.name !== matchDetail.playerTwo &&
																		player.playerDetails.name !== matchDetail.playerFour
																	)
																	.map((player) => (
																		<div
																			key={player._id}
																			onClick={() => selectPlayer('playerThree', player.playerDetails.name)}
																			className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-gray-900"
																		>
																			{player.playerDetails.name}
																		</div>
																	))
															)}
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Team 2 Section */}
								<div className="bg-gray-50 p-3 rounded-lg space-y-3">
									<div className="flex flex-col gap-2">
										<label htmlFor="secondTeamName" className="mx-2 font-semibold text-[#B1D848]">
											2nd Team  <span className="text-gray-500 font-normal text-sm">(optional)</span>
										</label>
										<input
											type="text"
											name="secondTeamName"
											value={matchDetail.secondTeamName}
											onChange={handleMatchData}
											className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full bg-transparent"
											placeholder="Leave blank for individual players"
										/>
									</div>

									<div className="space-y-3">
										<div className="flex flex-col gap-2">
											<label htmlFor="playerTwo" className="mx-2 font-medium">
												{playerState ? <span>Player 1 :</span> : <span>Player :</span>}
											</label>
											<div className="relative" ref={playerDropdownRefs.playerTwo}>
												<input
													type="text"
													name="playerTwo"
													value={matchDetail.playerTwo}
													onChange={handleMatchData}
													onFocus={() => setShowPlayerDropdowns(prev => ({ ...prev, playerTwo: true }))}
													onBlur={(e) => {
														if (!isInteractingWithDropdown) {
															setShowPlayerDropdowns(prev => ({ ...prev, playerTwo: false }));
														}
													}}
													className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full bg-transparent hover:border-[#B1D848] transition-colors cursor-pointer"
													placeholder="Select or type player name"
												/>
												{showPlayerDropdowns.playerTwo && (
													<div 
														className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-32 rounded-md py-1 text-base overflow-auto border border-gray-200"
														onMouseEnter={() => setIsInteractingWithDropdown(true)}
														onMouseLeave={() => setIsInteractingWithDropdown(false)}
													>
														{availablePlayers.length === 0 ? (
															<div className="px-4 py-2 text-gray-500 italic">
																No players available
															</div>
														) : (
															availablePlayers
																.filter(player => 
																	matchDetail.playerTwo === "" || 
																	player.playerDetails.name.toLowerCase().includes(matchDetail.playerTwo.toLowerCase())
																)
																.filter(player => 
																	// Exclude already selected players
																	player.playerDetails.name !== matchDetail.playerOne &&
																	player.playerDetails.name !== matchDetail.playerThree &&
																	player.playerDetails.name !== matchDetail.playerFour
																)
																.map((player) => (
																	<div
																		key={player._id}
																		onClick={() => selectPlayer('playerTwo', player.playerDetails.name)}
																		className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-gray-900"
																	>
																		{player.playerDetails.name}
																	</div>
																))
														)}
													</div>
												)}
											</div>
										</div>

										{(matchDetail.typeOfMatch === "Women's doubles" ||
											matchDetail.typeOfMatch === "Men's doubles" ||
											matchDetail.typeOfMatch === "Mixed Doubles") && (
											<div className="flex flex-col gap-2">
												<label htmlFor="playerFour" className="mx-2 font-medium">
													Player 2 :
												</label>
												<div className="relative" ref={playerDropdownRefs.playerFour}>
													<input
														type="text"
														name="playerFour"
														value={matchDetail.playerFour}
														onChange={handleMatchData}
														onFocus={() => setShowPlayerDropdowns(prev => ({ ...prev, playerFour: true }))}
														onBlur={(e) => {
															if (!isInteractingWithDropdown) {
																setShowPlayerDropdowns(prev => ({ ...prev, playerFour: false }));
															}
														}}
														className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full bg-transparent hover:border-[#B1D848] transition-colors cursor-pointer"
														placeholder="Select or type player name"
													/>
													{showPlayerDropdowns.playerFour && (
														<div 
															className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-32 rounded-md py-1 text-base overflow-auto border border-gray-200"
															onMouseEnter={() => setIsInteractingWithDropdown(true)}
															onMouseLeave={() => setIsInteractingWithDropdown(false)}
														>
															{availablePlayers.length === 0 ? (
																<div className="px-4 py-2 text-gray-500 italic">
																	No players available
																</div>
															) : (
																availablePlayers
																	.filter(player => 
																		matchDetail.playerFour === "" || 
																		player.playerDetails.name.toLowerCase().includes(matchDetail.playerFour.toLowerCase())
																	)
																	.filter(player => 
																		// Exclude already selected players
																		player.playerDetails.name !== matchDetail.playerOne &&
																		player.playerDetails.name !== matchDetail.playerTwo &&
																		player.playerDetails.name !== matchDetail.playerThree
																	)
																	.map((player) => (
																		<div
																			key={player._id}
																			onClick={() => selectPlayer('playerFour', player.playerDetails.name)}
																			className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-gray-900"
																		>
																			{player.playerDetails.name}
																		</div>
																	))
															)}
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Match Details Section */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
								<div className="flex flex-col gap-2">
									<label htmlFor="umpireId" className="mx-2 font-semibold">
										Umpire Username :
									</label>
									<div className="relative" ref={umpireDropdownRef}>
										<input
											type="text"
											name="umpireId"
											value={matchDetail.umpireId}
											placeholder="Select umpire"
											onChange={handleMatchData}
											onFocus={() => setShowUmpireDropdown(true)}
											onBlur={() => {
												if (!isInteractingWithDropdown) {
													setShowUmpireDropdown(false);
												}
											}}
											className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full hover:border-[#B1D848] transition-colors"
										/>
										{showUmpireDropdown && (
											<div 
												className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-32 rounded-md py-1 text-base overflow-auto border border-gray-200"
												onMouseEnter={() => setIsInteractingWithDropdown(true)}
												onMouseLeave={() => setIsInteractingWithDropdown(false)}
											>
												{(() => {
													if (umpireOptions.length === 0) {
														return (
															<div className="px-4 py-2 text-gray-500 italic">
																Loading umpires...
															</div>
														);
													}
													
													const filteredUmpires = umpireOptions.filter(umpire => 
														umpire.username.toLowerCase().includes(matchDetail.umpireId.toLowerCase())
													);
													
													if (filteredUmpires.length === 0) {
														return (
															<div className="px-4 py-2 text-gray-500 italic">
																No umpires found
															</div>
														);
													}
													
													return filteredUmpires.map((umpire) => (
														<div
															key={umpire._id}
															onClick={() => selectUmpire(umpire.username)}
															className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-gray-900"
														>
															{umpire.username}
														</div>
													));
												})()}
											</div>
										)}
									</div>
								</div>

								<div className="flex flex-col gap-2">
									<label htmlFor="totalPoints" className="mx-2 font-semibold">
										Total Points :
									</label>
									<select
										name="totalPoints"
										value={matchDetail.totalPoints}
										onChange={handleMatchData}
										className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full hover:border-[#B1D848] transition-colors cursor-pointer"
									>
										<option value={21}>21</option>
										<option value={15}>15</option>
									</select>
								</div>

								<div className="flex flex-col gap-2 md:col-span-2">
									<div className="flex items-center mx-2">
										<label htmlFor="matchDate" className="font-semibold">
											Match Date
										</label>
										<div className="ml-1 text-gray-500">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
												<path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
											</svg>
										</div>
										<span className="font-semibold">:</span>
									</div>
									<div className="relative">
										<DatePicker
											selected={startDate}
											onChange={handleDateChange}
											dateFormat="dd/MM/yyyy"
											placeholderText="Select match date"
											className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full hover:border-[#B1D848] transition-colors cursor-pointer bg-transparent"
											minDate={dayjs(event?.eventStart, "DD-MM-YYYY").toDate()}
											maxDate={dayjs(event?.eventEnd, "DD-MM-YYYY").toDate()}
											showPopperArrow={false}
											calendarClassName="bg-white shadow-lg border border-gray-200 rounded-md"
											popperClassName="z-50"
											popperPlacement="bottom-start"
										/>
									</div>
								</div>
							</div>

							<div className="flex justify-between items-center mt-6">
								<button
									type="button"
									className="text-gray-600 hover:text-gray-800 transition-colors"
									onClick={() => {
										setMatchBox(false);
										if (onClose) {
											onClose();
										}
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="24px"
										viewBox="0 -960 960 960"
										width="24px"
										fill="currentColor"
									>
										<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
									</svg>
								</button>
								<button
									className="bg-[#B1D848] text-white px-6 py-2 rounded-full hover:bg-[#9fc339] transition-colors font-medium"
									type="submit"
								>
									Create Match
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}

export default MatchForm;
