import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useService } from "../ContextAPI/axios.jsx";
import LoadingSpinner from "../assets/LoadingSpinner.jsx";

function Signup() {
	const Navigate = useNavigate();
	const { signup, isLoading, setIsLoading } = useService();
	const [signupData, setSignupData] = useState({
		jobrole: "",
		username: "",
		email: "",
		password: "",
	});

	const [showPassword, setShowPassword] = useState(false);
	const [dropDown, setDropDown] = useState(false);
	const token = localStorage.getItem("token");

	const handleRole = (role) => {
		signupData.jobrole = `${role}`;
		setDropDown(false);
	};

	const handleSignup = (e) => {
		setSignupData({
			...signupData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		setIsLoading(true);
		e.preventDefault();
		if (token) {
			localStorage.removeItem("token");
		}
		try {
			const response = await signup(signupData);
			setSignupData({
				jobrole: "",
				username: "",
				email: "",
				password: "",
			});
			if (response.status === 201) {
				Navigate("/login");
			} else {
				Navigate("/signup");
			}
		} catch (error) {
			console.log(error.message);
			// toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleSubmit(e);
		}
	};

	return (
		<div className="min-h-screen bg-[url('./badminton.jpg')] bg-center bg-cover bg-no-repeat flex items-center justify-center relative">
			{/* Overlay for better readability */}
			<div className="absolute inset-0 bg-black/30"></div>

			{/* Back button */}
			<button
				onClick={() => Navigate("/")}
				className="absolute top-8 left-8 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="28px"
					viewBox="0 -960 960 960"
					width="28px"
					fill="#ffffff"
				>
					<path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
				</svg>
			</button>

			{/* Main container */}
			<div className="relative z-10 w-full max-w-xl mx-4">
				<div className="bg-[#5ea0b8]/85 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
					<div className="flex flex-col space-y-8">
						{/* Header */}
						<div>
							<h1 className="text-4xl md:text-5xl text-white font-bold font-inter">
								CREATE <span className="text-[#B1D848]">ACCOUNT</span>
							</h1>
						</div>

						{/* Form fields */}
						<form onSubmit={handleSubmit} className="flex flex-col space-y-6">
							{/* Job Position Input */}
							<div className="group border-b-2 border-white/50 hover:border-white focus-within:border-white transition-colors pb-2">
								<div className="flex items-center text-white relative">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="24px"
										viewBox="0 -960 960 960"
										width="24px"
										fill="#e8eaed"
									>
										<path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z" />
									</svg>
									<input
										type="text"
										name="jobrole"
										value={signupData.jobrole}
										onChange={handleSignup}
										onClick={() => setDropDown(true)}
										placeholder="Job Position"
										className="w-full bg-transparent outline-none px-4 text-white placeholder-white/70"
									/>
								</div>
								{dropDown && (
									<div className="absolute mt-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg py-1 w-48 z-20 right-0">
										{["Match Controller", "Umpire", "Match Operator"].map(
											(role) => (
												<div
													key={role}
													onClick={() => handleRole(role)}
													className="px-4 py-2 text-sm text-gray-700 hover:bg-[#5ea0b8]/10 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
												>
													{role}
												</div>
											)
										)}
									</div>
								)}
							</div>

							{/* Username Input */}
							<div className="group border-b-2 border-white/50 hover:border-white focus-within:border-white transition-colors pb-2">
								<div className="flex items-center text-white">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="24px"
										viewBox="0 -960 960 960"
										width="24px"
										fill="#e8eaed"
									>
										<path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
									</svg>
									<input
										type="text"
										name="username"
										value={signupData.username}
										onChange={handleSignup}
										placeholder="Username"
										className="w-full bg-transparent outline-none px-4 text-white placeholder-white/70"
									/>
								</div>
							</div>

							{/* Email Input */}
							<div className="group border-b-2 border-white/50 hover:border-white focus-within:border-white transition-colors pb-2">
								<div className="flex items-center text-white">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="24px"
										viewBox="0 -960 960 960"
										width="24px"
										fill="#e8eaed"
									>
										<path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" />
									</svg>
									<input
										type="email"
										name="email"
										value={signupData.email}
										onChange={handleSignup}
										placeholder="Email"
										className="w-full bg-transparent outline-none px-4 text-white placeholder-white/70"
									/>
								</div>
							</div>

							{/* Password Input */}
							<div className="group border-b-2 border-white/50 hover:border-white focus-within:border-white transition-colors pb-2">
								<div className="flex items-center text-white">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="24px"
										viewBox="0 -960 960 960"
										width="24px"
										fill="#e8eaed"
									>
										<path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" />
									</svg>
									<input
										type={showPassword ? "text" : "password"}
										name="password"
										value={signupData.password}
										onChange={handleSignup}
										placeholder="Password"
										className="w-full bg-transparent outline-none px-4 text-white placeholder-white/70"
									/>
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											setShowPassword(!showPassword);
										}}
									>
										{showPassword ? (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												height="24px"
												viewBox="0 -960 960 960"
												width="24px"
												fill="#e8eaed"
											>
												<path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
											</svg>
										) : (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												height="24px"
												viewBox="0 -960 960 960"
												width="24px"
												fill="#e8eaed"
											>
												<path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
											</svg>
										)}
									</button>
								</div>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								className="w-full bg-white text-[#5ea0b8] font-semibold py-3 rounded-2xl text-lg
                  transition-all duration-300 hover:bg-[#B1D848] hover:text-white disabled:opacity-70
                  disabled:cursor-not-allowed transform hover:scale-[1.02] mt-4"
								disabled={isLoading}
							>
								{isLoading ? (
									<div className="flex items-center justify-center gap-2">
										<span>Creating Account...</span>
										<LoadingSpinner />
									</div>
								) : (
									"Sign Up"
								)}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Signup;
