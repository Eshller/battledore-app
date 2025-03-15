import React, { useState, useEffect } from "react";

const CountdownTimer = ({ onComplete }) => {
	const [countdown, setCountdown] = useState(3);
	const [knockupTime, setKnockupTime] = useState(120);
	const [isKnockupActive, setIsKnockupActive] = useState(false);
	const [showTimer, setShowTimer] = useState(false);

	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		} else if (countdown === 0) {
			setShowTimer(true);
			setIsKnockupActive(true); // Auto-start knockup
		}
	}, [countdown]);

	useEffect(() => {
		if (isKnockupActive && knockupTime > 0) {
			const timer = setTimeout(() => setKnockupTime(knockupTime - 1), 1000);
			return () => clearTimeout(timer);
		} else if (knockupTime === 0) {
			onComplete();
		}
	}, [knockupTime, isKnockupActive]);

	// Auto-complete when knockup time ends
	useEffect(() => {
		if (knockupTime === 0 && isKnockupActive) {
			onComplete();
		}
	}, [knockupTime, isKnockupActive]);

	const formatTime = (time) => {
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;
		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	};

	if (!showTimer) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
				<div className="text-white text-9xl font-bold animate-pulse">
					{countdown}
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
			<div className="bg-white p-8 rounded-lg shadow-lg text-center">
				<h2 className="text-4xl font-bold mb-4">Knocking Period</h2>
				<div className="text-6xl font-mono mb-6">{formatTime(knockupTime)}</div>
				<div className="flex gap-4 justify-center">
					{isKnockupActive ? (
						<button
							onClick={() => setIsKnockupActive(false)}
							className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded"
						>
							Pause
						</button>
					) : (
						<button
							onClick={() => setIsKnockupActive(true)}
							className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
						>
							Resume
						</button>
					)}
					<button
						onClick={onComplete}
						className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
					>
						Stop
					</button>
				</div>
			</div>
		</div>
	);
};

export default CountdownTimer;
