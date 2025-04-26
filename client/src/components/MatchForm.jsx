import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useService } from "../ContextAPI/axios";
import dayjs from "dayjs";
import io from "socket.io-client";

// const socket = io.connect("http://localhost:3001");
const socket = io(`${import.meta.env.VITE_SERVER}`);

function MatchForm({ event }) {
	const { addMatch, getAllUsers, playerList } = useService();

	const [matchTypeOption, setMatchTypeOption] = useState(false);
	const [matchBox, setMatchBox] = useState(true);
	const [playerState, setPlayerState] = useState(false);
	const [umpireOptions, setUmpireOptions] = useState([]);
	const [showUmpireDropdown, setShowUmpireDropdown] = useState(false);
	const umpireDropdownRef = React.useRef(null);

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

	// Fetch all users when component mounts
	useEffect(() => {
		getAllUsers();
	}, []);

	// Filter umpires from playerList
	useEffect(() => {
		if (playerList && playerList.length > 0) {
			const umpires = playerList.filter(user => user.jobrole === "umpire");
			setUmpireOptions(umpires);
		}
	}, [playerList]);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (umpireDropdownRef.current && !umpireDropdownRef.current.contains(event.target)) {
				setShowUmpireDropdown(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	function selectUmpire(username) {
		setMatchDetail({
			...matchDetail,
			umpireId: username,
		});
		setShowUmpireDropdown(false);
	}

	function matchType(opt) {
		matchDetail.typeOfMatch = `${opt}`;
		if (opt == "Men's doubles" || opt == "Women's doubles" || opt == "Mixed Doubles") {
			setPlayerState(true);
		} else {
			setPlayerState(false);
		}
		setMatchTypeOption(!matchTypeOption);
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
		setMatchDetail({
			...matchDetail,
			[name]: name === 'totalPoints' ? parseInt(value) : value,
		});

		// If typing in umpire field, show dropdown and filter results
		if (name === 'umpireId') {
			setShowUmpireDropdown(true);
		}
	};

	const verifyDate = () => {
		const date = dayjs(matchDetail?.matchDate);
		const startDate = dayjs(event?.eventStart, "DD-MM-YYYY");
		const endDate = dayjs(event?.eventEnd, "DD-MM-YYYY");

		const isWithinRange = date.isBetween(startDate, endDate, null, "[]");
		if (!isWithinRange) {
			toast.error("Date must be within event range");
			return false;
		}
		return date.format("DD-MM-YYYY");
	};

	const handleSumbmit = async (e) => {
		e.preventDefault();

		// Validate all required fields
		if (!matchDetail.firstTeamName || !matchDetail.secondTeamName) {
			toast.error("All fields are required");
			return;
		}

		// Check if date is valid
		const formattedDate = verifyDate();
		if (!formattedDate) {
			// verifyDate already shows an error toast
			return;
		}

		try {
			const newDetails = {
				...matchDetail,
				matchDate: formattedDate,
			};
			const response = await addMatch(event?._id, newDetails);

			// Check if there was an error
			if (response.status === 'error') {
				// Error toast is already shown in the service
				return;
			}

			if (response.status === 201) {
				// Show success toast only here
				toast.success(response.data?.message || "Match created successfully");
				socket.emit("new_match_created", response.data.match._id);

				setMatchDetail({
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
				setMatchBox(!matchBox);
			} else {
				// Handle specific error cases
				if (response.status === 500) {
					toast.error("Server error. Please try again later.");
				} else {
					// Show generic error for other status codes
					toast.error(response.data?.message || "Failed to create match");
				}
			}
		} catch (error) {
			console.error("Match creation error:", error);
			toast.error("Failed to create match. Please try again.");
		}
	};

	return (
		<>
			{matchBox && (
				<div className="absolute top-0 sm:top-10 sm:left-20 xl:top-1/2 xl:left-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 bg-white p-4 rounded-2xl max-h-[580px] lg:h-auto overflow-y-auto">
					<h1 className="text-lg md:text-xl lg:text-2xl sm:text-center p-2 font-inter font-bold text-[#B1D848]">
						Create New Match
					</h1>
					<form
						onSubmit={handleSumbmit}
						action="post"
						className="flex flex-col gap-4 font-inert"
					>
						<div className="relative">
							<label htmlFor="typeOfMatch" className="mx-2 font-semibold">
								Type of match :
							</label>
							<input
								type="text"
								name="typeOfMatch"
								value={matchDetail.typeOfMatch}
								onChange={handleMatchData}
								onClick={() => setMatchTypeOption((prev) => !prev)}
								id=""
								className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1"
							/>
							{matchTypeOption ? (
								<div className="p-2 cursor-pointer absolute shadow-2xl bg-white right-16 top-7">
									{[
										"Men's singles",
										"Men's doubles",
										"Women's singles",
										"Women's doubles",
										"Mixed Doubles",
									].map((opt) => (
										<p
											key={opt}
											className="font-medium text-sm md:text-lg text-nowrap text-center border-b-[1px] border-slate-800 px-5 pb-2"
											onClick={() => matchType(opt)}
										>
											{opt}
										</p>
									))}
								</div>
							) : null}
						</div>
						<div className="block sm:flex justify-between">
							<label htmlFor="firstTeamName" className="mx-2 font-semibold">
								Team 1 :
							</label>
							<input
								type="text"
								name="firstTeamName"
								value={matchDetail.firstTeamName}
								onChange={handleMatchData}
								id=""
								className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 flex-1"
							/>
						</div>
						<div className="block sm:flex justify-between">
							<label htmlFor="playerOne" className="mx-2">
								{playerState ? <span>Player 1 :</span> : <span>Player :</span>}
							</label>
							<input
								type="text"
								name="playerOne"
								value={matchDetail.playerOne}
								onChange={handleMatchData}
								id=""
								className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 flex-1"
							/>
						</div>
						<div
							className={` ${
								matchDetail.typeOfMatch === "Women's doubles" ||
								matchDetail.typeOfMatch === "Men's doubles"
									? `block`
									: `hidden`
							}`}
						>
							<div className="block sm:flex justify-between">
								<label htmlFor="playerThree" className="mx-2">
									Player 2 :
								</label>
								<input
									type="text"
									name="playerThree"
									value={matchDetail.playerThree}
									onChange={handleMatchData}
									id=""
									className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 flex-1"
								/>
							</div>
						</div>
						<div className="block sm:flex justify-between">
							<label htmlFor="secondTeamName" className="mx-2 font-semibold">
								Team 2 :
							</label>
							<input
								type="text"
								name="secondTeamName"
								value={matchDetail.secondTeamName}
								onChange={handleMatchData}
								id=""
								className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 flex-1"
							/>
						</div>
						<div className="block sm:flex justify-between">
							<label htmlFor="playerTwo" className="mx-2">
								{playerState ? <span>Player 1 :</span> : <span>Player :</span>}
							</label>
							<input
								type="text"
								name="playerTwo"
								value={matchDetail.playerTwo}
								onChange={handleMatchData}
								id=""
								className="border-b-[1px] font-medium  border-slate-500 outline-none px-4 py-1 flex-1"
							/>
						</div>
						<div
							className={` ${
								matchDetail.typeOfMatch === "Women's doubles" ||
								matchDetail.typeOfMatch === "Men's doubles"
									? `block`
									: `hidden`
							}`}
						>
							<div className="block sm:flex justify-between">
								<label htmlFor="playerFour" className="mx-2">
									Player 2 :
								</label>
								<input
									type="text"
									name="playerFour"
									value={matchDetail.playerFour}
									onChange={handleMatchData}
									id=""
									className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 flex-1"
								/>
							</div>
						</div>
						<div className="block sm:flex justify-between relative">
							<label htmlFor="umpireId" className="mx-2 font-semibold">
								Umpire Username :
							</label>
							<div className="flex-1 relative" ref={umpireDropdownRef}>
								<input
									type="text"
									name="umpireId"
									value={matchDetail.umpireId}
									placeholder="username"
									onChange={handleMatchData}
									onClick={() => setShowUmpireDropdown(true)}
									className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 w-full"
								/>
								{showUmpireDropdown && (
									<div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
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
						<div className="block sm:flex justify-between">
							<label htmlFor="totalPoints" className="mx-2 font-semibold">
								Total Points for Match :
							</label>
							<select
								name="totalPoints"
								value={matchDetail.totalPoints}
								onChange={handleMatchData}
								className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 flex-1"
							>
								<option value={21}>21</option>
								<option value={15}>15</option>
							</select>
						</div>
						<div>
							<label htmlFor="typeofmatch" className="mx-2">
								Match Date :
							</label>
							<input
								type="date"
								name="matchDate"
								placeholder="DD-MM-YYYY"
								value={matchDetail.matchDate}
								onChange={handleMatchData}
								id=""
								className="border-b-[1px] font-medium border-slate-500 outline-none px-4 py-1 "
							/>
						</div>
						<div className="flex justify-between px-0 md:px-4 items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24px"
								viewBox="0 -960 960 960"
								width="24px"
								fill="#1"
								className="cursor-pointer"
								onClick={() => setMatchBox(!matchBox)}
							>
								<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
							</svg>
							<button
								className=" border-[1px] border-black px-4 py-1 rounded-2xl"
								type="submit"
							>
								Create
							</button>
						</div>
					</form>
				</div>
			)}
		</>
	);
}

export default MatchForm;
