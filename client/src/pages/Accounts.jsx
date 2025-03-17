import React, { useEffect } from "react";
import { useService } from "../ContextAPI/axios";

function Accounts() {
	const { playerList, getAllUsers, numberOfUsers, myData, removeUser } =
		useService();

	useEffect(() => {
		getAllUsers();
	}, [numberOfUsers]);

	function toSentenceCase(str) {
		if (!str) return str;
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 py-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl md:text-2xl text-white font-bold font-inter">
					Accounts
				</h1>
				<div className="h-[2px] flex-grow mx-4 bg-gradient-to-r from-[#90cae3] to-transparent"></div>
			</div>

			<div className="bg-white/5 backdrop-blur-sm rounded-lg p-3">
				<p className="text-[#90cae3] font-medium font-inter">
					Total Accounts: {playerList.length}
				</p>
			</div>

			<div className="grid gap-3 mt-4">
				{playerList.map((player) => (
					<div
						key={player._id}
						className="bg-gradient-to-br from-[#90cae3] to-[#7CB6CB] rounded-xl p-0.5 
                     hover:shadow-lg hover:shadow-[#90cae3]/20 transition-all duration-300"
					>
						<div className="bg-white rounded-xl p-3">
							<div className="flex items-center gap-4">
								<img
									className="w-16 h-16 rounded-lg object-cover"
									src="../badminton.jpg"
									alt={player.username}
								/>
								<div className="flex-1 text-gray-800">
									<h3 className="text-lg font-bold text-[#2c8bb6]">
										{toSentenceCase(player.username)}
									</h3>
									<p className="text-sm text-gray-600">{player.email}</p>
									{myData.isOperator && (
										<p className="text-sm mt-1">
											<span className="text-gray-500">Role: </span>
											<span className="font-medium">
												{toSentenceCase(player.jobrole)}
											</span>
										</p>
									)}
								</div>

								{myData._id !== player._id && myData.isOperator && (
									<button
										onClick={() => removeUser(player._id)}
										className="p-2 hover:bg-red-50 rounded-full transition-colors"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 -960 960 960"
											className="w-5 h-5"
											fill="#ff4444"
										>
											<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Z" />
										</svg>
									</button>
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			<style jsx>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 6px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #f1f1f1;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #90cae3;
					border-radius: 3px;
				}
			`}</style>
		</div>
	);
}

export default Accounts;
