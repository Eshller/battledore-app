import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useService } from "../ContextAPI/axios.jsx";
import LoadingSpinner from "../assets/LoadingSpinner.jsx";

function Login() {
	const Navigate = useNavigate();
	const { login, token, isLoading, setIsLoading } = useService();

	const [loginData, setLoginData] = useState({
		email: "",
		password: "",
	});

	const [showPassword, setShowPassword] = useState(false);

	const handleLogin = (e) => {
		setLoginData({
			...loginData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		setIsLoading(true);

		try {
			e.preventDefault();
			await login(loginData);
			setLoginData({
				email: "",
				password: "",
			});
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

	useEffect(() => {
		// Add event listener for enter key
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [loginData]); // Add loginData as dependency to ensure latest data is used

	useEffect(() => {
		if (token) {
			Navigate("/home");
		}
	}, [token]);

	return (
		<div className="min-h-screen bg-[url('./badminton.jpg')] bg-center bg-cover bg-no-repeat flex items-center justify-center relative">
			{/* Overlay for better readability */}
			<div className="absolute inset-0 bg-black/30"></div>

			{/* Back button */}
			<button
				onClick={() => Navigate("/")}
				className="absolute top-8 left-8 p-2 hover:bg-white/10 rounded-full transition-colors"
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
								WELCOME <span className="text-[#B1D848]">BACK!</span>
							</h1>
						</div>

						{/* Form fields */}
						<div className="flex flex-col space-y-6">
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
										value={loginData.email}
										onChange={handleLogin}
										placeholder="Email"
										className="w-full bg-transparent outline-none px-4 text-white placeholder-white/70"
									/>
								</div>
							</div>

							<div className="space-y-2">
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
											value={loginData.password}
											onChange={handleLogin}
											placeholder="Password"
											className="bg-transparent outline-none border-none px-6 placeholder:text-white w-full"
										/>
										<button onClick={() => setShowPassword(!showPassword)}>
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
								<div className="text-right">
									<button
										onClick={() => Navigate("/forgotpassword")}
										className="text-white/70 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white"
									>
										Forgot Password?
									</button>
								</div>
							</div>
						</div>

						{/* Login button */}
						<button
							onClick={handleSubmit}
							className="w-full bg-white text-[#5ea0b8] font-semibold py-3 rounded-2xl text-lg
                transition-all duration-300 hover:bg-[#B1D848] hover:text-white disabled:opacity-70
                disabled:cursor-not-allowed transform hover:scale-[1.02]"
							disabled={isLoading}
						>
							{isLoading ? (
								<div className="flex items-center justify-center gap-2">
									<span>Logging in...</span>
									<LoadingSpinner />
								</div>
							) : (
								"Log In"
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Login;
