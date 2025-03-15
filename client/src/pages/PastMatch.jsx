import React, { useState, useEffect } from "react";
import { useService } from "../ContextAPI/axios";
import { useNavigate } from "react-router-dom";

function PastMatch() {
	const { getScoresData, numberofMatches, myData, removeMatch } = useService();
	const [list, setList] = useState([]);

	const Navigate = useNavigate();

	const getMatch = async () => {
		const res = await getScoresData();
		setList(res?.reverse());
	};

	useEffect(() => {
		getMatch();
	}, [numberofMatches]);

	return (
		<div className="min-h-screen p-3 md:p-4 w-full max-w-5xl mx-auto">
			<h1 className="text-xl md:text-2xl text-white font-bold mt-8 mb-3 font-inter">
				Past Matches
			</h1>
			<hr className="border-gray-600 mb-3" />
			<div className="grid gap-2">
				{list?.map((event) => (
					<div key={event._id}>
						{event.isPlayed && (
							<div
								className="w-full rounded-lg bg-gradient-to-r from-[#7CB6CB] to-[#6BA5BE] shadow p-2 font-inter 
                             transition-all duration-200 hover:scale-[1.01] hover:shadow-lg cursor-pointer"
							>
								<div className="flex flex-col sm:flex-row gap-2">
									<div
										className="flex-1"
										onClick={() => Navigate(`/matchdetails/${event._id}`)}
									>
										<div className="flex flex-col sm:flex-row gap-2">
											<div className="w-full sm:w-24 h-16 sm:h-20 rounded-lg overflow-hidden">
												<img
													className="w-full h-full object-cover"
													src={`../badminton_court.jpg`}
													alt="Match Court"
												/>
											</div>
											<div className="flex-1 flex flex-col justify-between">
												<h2 className="text-lg sm:text-xl font-bold text-white mb-2">
													{event?.eventDetails?.eventTitle}
												</h2>
												<div className="flex flex-wrap items-center gap-3">
													<div className="flex items-center space-x-3 text-white">
														<div className="text-center">
															<span className="text-2xl sm:text-3xl font-bold">
																{event?.scores.slice(-1)[0]?.firstTeamScore}
															</span>
															<p className="text-xs mt-0.5">
																({event?.firstTeamName})
															</p>
														</div>
														<span className="text-xl font-bold">-</span>
														<div className="text-center">
															<span className="text-2xl sm:text-3xl font-bold">
																{event?.scores.slice(-1)[0]?.secondTeamScore}
															</span>
															<p className="text-xs mt-0.5">
																({event?.secondTeamName})
															</p>
														</div>
													</div>
													<div className="bg-green-500 px-3 py-1 rounded-lg">
														<p className="text-white text-sm font-semibold">
															{event?.winner}
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
									{myData.isOperator && (
										<div className="flex items-start">
											<button
												onClick={() =>
													removeMatch(event?.eventDetails?._id, event?._id)
												}
												className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 -960 960 960"
													className="w-5 h-5"
													fill="#e8eaed"
												>
													<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
												</svg>
											</button>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

export default PastMatch;
