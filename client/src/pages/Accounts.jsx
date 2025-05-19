import React, { useEffect, useState } from "react";
import { useService } from "../ContextAPI/axios";
import { toast } from "react-toastify";

function Accounts() {
	const { numberOfUsers, myData, removeUser, getAccounts } = useService();
	const [accounts, setAccounts] = useState([]);
	const [deleteConfirmation, setDeleteConfirmation] = useState({
		isOpen: false,
		accountId: null,
		accountName: ""
	});

	useEffect(() => {
		const loadAccounts = async () => {
			const accountData = await getAccounts();
			setAccounts(accountData || []);
		};
		
		loadAccounts();
	}, [numberOfUsers]);

	function toSentenceCase(str) {
		if (!str) return str;
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}
	
	// Handle opening the delete confirmation dialog
	const handleDeleteClick = (accountId, accountName) => {
		setDeleteConfirmation({
			isOpen: true,
			accountId,
			accountName
		});
	};
	
	// Handle confirming the deletion
	const handleConfirmDelete = async () => {
		try {
			await removeUser(deleteConfirmation.accountId);
			setDeleteConfirmation({
				isOpen: false,
				accountId: null,
				accountName: ""
			});
		} catch (error) {
			toast.error("Failed to delete account");
		}
	};
	
	// Handle canceling the deletion
	const handleCancelDelete = () => {
		setDeleteConfirmation({
			isOpen: false,
			accountId: null,
			accountName: ""
		});
	};

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
					Total Accounts: {accounts.length}
				</p>
			</div>

			<div className="grid gap-3 mt-4">
				{accounts.map((account) => (
					<div
						key={account._id}
						className="bg-gradient-to-br from-[#90cae3] to-[#7CB6CB] rounded-xl p-0.5 
                     hover:shadow-lg hover:shadow-[#90cae3]/20 transition-all duration-300"
					>
						<div className="bg-white rounded-xl p-3">
							<div className="flex items-center gap-4">
								<img
									className="w-16 h-16 rounded-lg object-cover"
									src="../badminton.jpg"
									alt={account.username}
								/>
								<div className="flex-1 text-gray-800">
									<h3 className="text-lg font-bold text-[#2c8bb6]">
										{toSentenceCase(account.username)}
									</h3>
									<p className="text-sm text-gray-600">{account.email}</p>
									{myData.isOperator && (
										<p className="text-sm mt-1">
											<span className="text-gray-500">Role: </span>
											<span className="font-medium">
												{toSentenceCase(account.jobrole)}
											</span>
										</p>
									)}
								</div>

								{myData._id !== account._id && myData.isOperator && (
									<button
										onClick={() => handleDeleteClick(account._id, account.username)}
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

			{/* Delete Confirmation Modal */}
			{deleteConfirmation.isOpen && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-white rounded-xl p-6 w-full max-w-md">
						<h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete the account <span className="font-semibold">{toSentenceCase(deleteConfirmation.accountName)}</span>? This action cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<button
								onClick={handleCancelDelete}
								className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium transition-colors"
							>
								No, Cancel
							</button>
							<button
								onClick={handleConfirmDelete}
								className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
							>
								Yes, Delete
							</button>
						</div>
					</div>
				</div>
			)}

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
