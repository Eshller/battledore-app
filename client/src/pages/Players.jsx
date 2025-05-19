import React, { useState, useEffect, useRef } from "react";
import { useService } from "../ContextAPI/axios";
import { toast } from "react-toastify";

function Players() {
	const { numberOfUsers, myData, removeUser, importPlayersFromCSV, getPlayers } = useService();
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [importedPlayers, setImportedPlayers] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [players, setPlayers] = useState([]);
	const fileInputRef = useRef(null);
	const [deleteConfirmation, setDeleteConfirmation] = useState({
		isOpen: false,
		playerId: null,
		playerName: ""
	});

	// Load players on component mount and when number of users changes
	useEffect(() => {
		const loadPlayers = async () => {
			const playerData = await getPlayers();
			setPlayers(playerData || []);
		};
		
		loadPlayers();
	}, [numberOfUsers]);

	// Function to download CSV template
	const downloadCSVTemplate = () => {
		const header = "name,email,phone,age,gender,address";
		const sampleData = "John Doe,johndoe@example.com,1234567890,25,Male,123 Main St";
		const csvContent = `${header}\n${sampleData}`;
		
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "players_template.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		toast.success("CSV template with sample data downloaded");
	};

	// Function to handle file selection
	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.type !== "text/csv") {
				toast.error("Please upload a CSV file");
				return;
			}
			setSelectedFile(file);
			parseCSV(file);
		}
	};

	// Function to parse CSV file
	const parseCSV = (file) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const csvData = event.target.result;
			// Handle different line endings (CRLF, LF)
			const lines = csvData.split(/\r?\n/);
			
			if (lines.length <= 1) {
				toast.error("CSV file is empty or has no data rows");
				return;
			}
			
			// Get headers from first line
			const headers = lines[0].split(",").map(header => header.trim());
			
			// Check if required headers exist
			const requiredFields = ["name", "email", "age", "gender", "phone"];
			const missingFields = requiredFields.filter(field => !headers.includes(field));
			
			if (missingFields.length > 0) {
				toast.error(`CSV must include these required columns: ${missingFields.join(", ")}`);
				return;
			}
			
			// Skip header row and parse data rows
			const parsedData = [];
			const invalidRows = [];
			
			for (let i = 1; i < lines.length; i++) {
				if (lines[i].trim() === "") continue;
				
				const values = lines[i].split(",");
				
				// Skip rows with insufficient data
				if (values.length < requiredFields.length) {
					invalidRows.push(i);
					continue;
				}
				
				const player = {};
				
				// Map values to headers
				headers.forEach((header, index) => {
					if (index < values.length) {
						player[header] = values[index]?.trim() || "";
					} else {
						player[header] = ""; // Handle missing values
					}
				});
				
				// Check if all required fields have values
				const missingRequiredValues = requiredFields.filter(field => !player[field]);
				
				if (missingRequiredValues.length > 0) {
					invalidRows.push(i);
					continue;
				}
				
				// Validate age is a number
				if (isNaN(parseInt(player.age, 10))) {
					invalidRows.push(i);
					continue;
				}
				
				parsedData.push(player);
			}
			
			if (parsedData.length === 0) {
				toast.error("No valid player data found in the CSV file");
				return;
			}
			
			if (invalidRows.length > 0) {
				toast.warning(`${invalidRows.length} rows were skipped due to missing or invalid data`);
			}
			
			setImportedPlayers(parsedData);
			toast.success(`Found ${parsedData.length} valid players in the CSV file`);
		};
		reader.readAsText(file);
	};

	// Function to handle CSV upload
	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Please select a CSV file first");
			return;
		}

		if (importedPlayers.length === 0) {
			toast.error("No valid player data found in the CSV file");
			return;
		}

		setUploading(true);
		
		try {
			const result = await importPlayersFromCSV(importedPlayers);
			
			if (result) {
				if (result.results.success > 0) {
					// Show the success message from the server
					toast.success(result.message);
					
					// Refresh the players list
					const updatedPlayers = await getPlayers();
					setPlayers(updatedPlayers || []);
					
					// Close the modal
					setIsImportModalOpen(false);
					
					// Reset state
					setSelectedFile(null);
					setImportedPlayers([]);
				} else if (result.results.failed > 0) {
					// Show errors if any
					const errorMessages = result.results.errors.slice(0, 3);
					errorMessages.forEach(error => toast.error(error));
					
					if (result.results.errors.length > 3) {
						toast.error(`...and ${result.results.errors.length - 3} more errors`);
					}
				}
			}
		} catch (error) {
			console.error("Error uploading CSV:", error);
			toast.error("Failed to import players. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	// Toggle import modal
	const toggleImportModal = () => {
		setIsImportModalOpen(!isImportModalOpen);
		if (isImportModalOpen) {
			// Reset state when closing modal
			setSelectedFile(null);
			setImportedPlayers([]);
		}
	};

	// Handle opening the delete confirmation dialog
	const handleDeleteClick = (playerId, playerName) => {
		setDeleteConfirmation({
			isOpen: true,
			playerId,
			playerName
		});
	};
	
	// Handle confirming the deletion
	const handleConfirmDelete = async () => {
		try {
			await removeUser(deleteConfirmation.playerId);
			setDeleteConfirmation({
				isOpen: false,
				playerId: null,
				playerName: ""
			});
		} catch (error) {
			toast.error("Failed to delete player");
		}
	};
	
	// Handle canceling the deletion
	const handleCancelDelete = () => {
		setDeleteConfirmation({
			isOpen: false,
			playerId: null,
			playerName: ""
		});
	};

	return (
		<div className="w-full max-w-6xl mx-auto px-4 py-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl md:text-2xl text-white font-bold font-inter">
					Players
				</h1>
				<div className="h-[2px] flex-grow mx-4 bg-gradient-to-r from-[#90cae3] to-transparent"></div>
			</div>

			<div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-6">
				<div className="flex justify-between items-center">
					<p className="text-[#90cae3] font-medium font-inter">
						Total Players: {players.length}
					</p>
					{myData.isOperator && (
						<button
							onClick={() => setIsImportModalOpen(true)}
							className="bg-[#90cae3] hover:bg-[#7CB6CB] text-white px-4 py-2 rounded-lg transition-colors font-medium"
						>
							Import Players
						</button>
					)}
				</div>
			</div>

			{/* Display imported players preview if any */}
			{importedPlayers.length > 0 && isImportModalOpen && (
				<div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-6">
					<h2 className="text-white font-bold mb-3">Preview of Players to Import</h2>
					<div className="grid gap-3">
						{importedPlayers.map((player, index) => (
							<div
								key={index}
								className="bg-gradient-to-br from-[#90cae3] to-[#7CB6CB] rounded-xl p-0.5"
							>
								<div className="bg-white rounded-xl p-3">
									<div className="flex items-center gap-4">
										<img
											className="w-16 h-16 rounded-lg object-cover"
											src="../badminton.jpg"
											alt={player.name}
										/>
										<div className="flex-1 text-gray-800">
											<h3 className="text-lg font-bold text-[#2c8bb6]">
												{player.name}
											</h3>
											<p className="text-sm text-gray-600">{player.email}</p>
											<p className="text-sm text-gray-500">
												Phone: {player.phone}
											</p>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Display CSV-imported players */}
			{players.length > 0 ? (
				<div className="grid gap-3">
					{players.map((player) => (
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
										alt={player.playerDetails.name}
									/>
									<div className="flex-1 text-gray-800">
										<h3 className="text-lg font-bold text-[#2c8bb6]">
											{player.playerDetails.name}
										</h3>
										<p className="text-sm text-gray-600">{player.email}</p>
										{player.playerDetails.phone && (
											<p className="text-sm text-gray-500">
												Phone: {player.playerDetails.phone}
											</p>
										)}
										{player.playerDetails.age && (
											<p className="text-sm text-gray-500">
												Age: {player.playerDetails.age}
											</p>
										)}
										{player.playerDetails.gender && (
											<p className="text-sm text-gray-500">
												Gender: {player.playerDetails.gender}
											</p>
										)}
									</div>

									{myData.isOperator && (
										<button
											onClick={() => handleDeleteClick(player._id, player.playerDetails.name)}
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
			) : (
				<div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 text-center">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
					<h3 className="text-white mt-4 font-medium text-lg">No Players Found</h3>
					<p className="text-gray-300 mt-2">Import players using the CSV file</p>
					{myData.isOperator && (
						<button
							onClick={() => setIsImportModalOpen(true)}
							className="mt-4 bg-[#90cae3] hover:bg-[#7CB6CB] text-white px-4 py-2 rounded-lg transition-colors font-medium"
						>
							Import Players
						</button>
					)}
				</div>
			)}

			{/* Import CSV Modal */}
			{isImportModalOpen && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-xl my-8 relative flex flex-col">
						{/* Header - Fixed at top */}
						<div className="bg-[#5fa8d3] px-5 py-3 flex justify-between items-center rounded-t-xl">
							<h2 className="text-lg font-bold text-white flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Import Players from CSV
							</h2>
							<button 
								onClick={toggleImportModal}
								className="text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-1"
								aria-label="Close modal"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						
						{/* Content - Scrollable */}
						<div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
							{/* Progress Steps */}
							<div className="flex items-center justify-between mb-6">
								<div className="flex flex-col items-center">
									<div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedFile ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-[#5fa8d3] text-white'}`}>
										1
									</div>
									<span className="text-xs mt-1 font-medium">Download</span>
								</div>
								<div className={`h-0.5 flex-1 mx-2 ${selectedFile ? 'bg-blue-300' : 'bg-gray-200'}`}></div>
								<div className="flex flex-col items-center">
									<div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedFile ? 'bg-[#5fa8d3] text-white' : 'bg-gray-200 text-gray-500'}`}>
										2
									</div>
									<span className="text-xs mt-1 font-medium">Upload</span>
								</div>
								<div className={`h-0.5 flex-1 mx-2 ${importedPlayers.length > 0 ? 'bg-blue-300' : 'bg-gray-200'}`}></div>
								<div className="flex flex-col items-center">
									<div className={`w-8 h-8 rounded-full flex items-center justify-center ${importedPlayers.length > 0 ? 'bg-[#5fa8d3] text-white' : 'bg-gray-200 text-gray-500'}`}>
										3
									</div>
									<span className="text-xs mt-1 font-medium">Import</span>
								</div>
							</div>
							
							{/* Template Section */}
							<div className="mb-6 bg-blue-50 p-4 rounded-lg">
								<h3 className="text-base font-semibold mb-3 text-blue-700">
									Step 1: Download Template
								</h3>
								
								<div className="grid grid-cols-2 gap-3 mb-4">
									<div className="bg-white rounded border border-gray-200 p-3">
										<label className="block text-xs font-medium text-blue-600 mb-1">Full Name</label>
										<div className="text-sm text-gray-500">John Doe</div>
									</div>
									<div className="bg-white rounded border border-gray-200 p-3">
										<label className="block text-xs font-medium text-blue-600 mb-1">Valid Email</label>
										<div className="text-sm text-gray-500">johndoe@example.com</div>
									</div>
									<div className="bg-white rounded border border-gray-200 p-3">
										<label className="block text-xs font-medium text-blue-600 mb-1">Contact Number</label>
										<div className="text-sm text-gray-500">1234567890</div>
									</div>
									<div className="bg-white rounded border border-gray-200 p-3">
										<label className="block text-xs font-medium text-blue-600 mb-1">Age</label>
										<div className="text-sm text-gray-500">Numeric</div>
									</div>
									<div className="bg-white rounded border border-gray-200 p-3">
										<label className="block text-xs font-medium text-blue-600 mb-1">Gender</label>
										<div className="text-sm text-gray-500">male / female / other</div>
									</div>
									<div className="bg-white rounded border border-gray-200 p-3">
										<label className="block text-xs font-medium text-gray-400 mb-1">address</label>
										<div className="text-sm text-gray-400">Optional</div>
									</div>
								</div>
								
								<button
									onClick={downloadCSVTemplate}
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2 transition-colors text-sm"
								>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
									</svg>
									Download CSV Template
								</button>
							</div>

							{/* Upload Section */}
							{!selectedFile ? (
								<div className="mb-6 bg-gray-50 p-4 rounded-lg">
									<h3 className="text-base font-semibold mb-3 text-gray-700">
										Step 2: Upload Completed CSV
									</h3>
									<div 
										onClick={() => fileInputRef.current.click()}
										className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-300 transition-all bg-white"
									>
										<input
											type="file" 
											ref={fileInputRef}
											onChange={handleFileChange}
											accept=".csv"
											className="hidden"
										/>
										<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
											</svg>
										</div>
										<p className="text-gray-700 font-medium text-sm mb-1">Drag & drop a CSV file here</p>
										<p className="text-gray-500 text-xs">or <span className="text-blue-600 font-medium">click to browse</span></p>
									</div>
									<p className="text-xs text-gray-500 mt-2 text-center">
										CSV must match the template structure. Max file size: 5MB
									</p>
								</div>
							) : (
								<div className="mb-6 bg-green-50 p-4 rounded-lg">
									<h3 className="text-base font-semibold mb-3 text-green-700 flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
										</svg>
										File Selected Successfully
									</h3>
									<div className="bg-white border border-green-100 rounded-lg p-3 flex items-center justify-between">
										<div className="flex items-center">
											<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
												<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
													<path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
												</svg>
											</div>
											<div>
												<p className="font-medium text-green-700">{selectedFile.name}</p>
												<p className="text-xs text-gray-500">CSV File</p>
											</div>
										</div>
										<button 
											onClick={(e) => {
												e.stopPropagation();
												setSelectedFile(null);
												setImportedPlayers([]);
												if (fileInputRef.current) fileInputRef.current.value = '';
											}}
											className="text-xs text-red-500 hover:text-red-700"
										>
											Remove
										</button>
									</div>
								</div>
							)}
							
							{/* Preview Section */}
							{importedPlayers.length > 0 && (
								<div className="mb-6 bg-green-50 p-4 rounded-lg">
									<div className="flex items-center justify-between mb-3">
										<h3 className="text-base font-semibold text-green-700">
											Step 3: Review and Import
										</h3>
										<span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
											Data Validated
										</span>
									</div>
									
									<p className="text-sm text-green-700 mb-2">
										{importedPlayers.length} Players Ready to Import
									</p>
									
									<div className="bg-white border border-green-100 rounded-lg divide-y divide-gray-100 mb-4 max-h-32 overflow-y-auto">
										{importedPlayers.map((player, index) => (
											<div key={index} className="p-2 hover:bg-gray-50 flex items-center">
												<div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-2">
													{index + 1}
												</div>
												<div>
													<p className="text-sm font-medium">{player.name}</p>
													<div className="flex gap-2 text-xs text-gray-500">
														<span className="truncate max-w-[120px]">{player.email}</span>
														<span>•</span>
														<span>{player.phone}</span>
													</div>
												</div>
											</div>
										))}
									</div>
									
									<button
										onClick={handleUpload}
										disabled={uploading}
										className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 text-sm"
									>
										{uploading ? (
											<div className="flex items-center justify-center">
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Importing Players...
											</div>
										) : (
											<>
												<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
													<path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
												</svg>
												Import {importedPlayers.length} Players
											</>
										)}
									</button>
								</div>
							)}
							
							{/* Action Buttons */}
							{!importedPlayers.length > 0 && selectedFile && (
								<div className="flex justify-end gap-3">
									<button
										onClick={toggleImportModal}
										className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
									>
										Cancel
									</button>
									
									<button
										onClick={handleUpload}
										disabled={!selectedFile || uploading}
										className="px-6 py-2 rounded-lg font-medium text-sm bg-[#5fa8d3] hover:bg-[#4a97c2] text-white"
									>
										{uploading ? (
											<div className="flex items-center justify-center">
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Processing...
											</div>
										) : "Continue"}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteConfirmation.isOpen && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-white rounded-xl p-6 w-full max-w-md">
						<h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete the player <span className="font-semibold">{deleteConfirmation.playerName}</span>? This action cannot be undone.
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

export default Players;
