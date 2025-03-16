import React from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
	const Navigate = useNavigate();
	return (
		<div className="min-h-screen bg-[url('./badminton.jpg')] bg-center bg-cover bg-no-repeat flex items-center justify-center relative">
			{/* Overlay for better text readability */}
			<div className="absolute inset-0 bg-black/30"></div>

			{/* Main content */}
			<div className="relative z-10 w-full max-w-6xl mx-auto px-4 flex flex-col items-center">
				<h1 className="text-center mb-8 sm:mb-12">
					<span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold">
						<span className="text-[#B1D848] font-inter">BATTLE</span>
						<span className="text-white">DORE</span>
					</span>
				</h1>

				{/* Container Box */}
				<div className="w-full max-w-2xl bg-[#5ea0b8]/75 rounded-3xl shadow-2xl transition-all duration-300 hover:bg-[#5ea0b8]/85">
					{/* Content wrapper */}
					<div className="p-8 sm:p-12">
						<div className="space-y-8">
							{/* Welcome Text */}
							<div className="font-inter space-y-4">
								<h2 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-wide">
									Welcome!
								</h2>
								<p className="text-white/90 text-lg sm:text-xl font-medium leading-relaxed">
									To your Ultimate Backend Solution for Seamless Badminton Match
									Management and Coordination
								</p>
							</div>

							{/* Buttons */}
							<div className="space-y-4 sm:space-y-6 pt-4">
								<button
									onClick={() => Navigate("login")}
									className="w-full bg-white text-[#5ea0b8] font-semibold py-4 rounded-2xl text-lg sm:text-xl 
                    transition-all duration-300 hover:bg-[#B1D848] hover:text-white hover:shadow-lg"
								>
									Log In
								</button>
								<button
									onClick={() => Navigate("signup")}
									className="w-full border-2 border-white text-white font-semibold py-4 rounded-2xl text-lg sm:text-xl
                    transition-all duration-300 hover:bg-[#B1D848] hover:border-[#B1D848] hover:text-white hover:shadow-lg"
								>
									Sign Up
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Welcome;
