import { useService } from "../ContextAPI/axios.jsx";
import React from "react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import io from "socket.io-client";
import Watermark from "../components/Watermark.jsx";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function Home() {
	const { myData, getEvents, getScoresData } = useService();

	const [liveScore, setLiveScore] = useState("");
	const [events, setEvents] = useState([]);
	const [score, setScore] = useState([]);

	const getData = async () => {
		const eve = await getEvents();
		setEvents(eve);
		const res = await getScoresData();
		setScore(res);
	};

	dayjs.extend(customParseFormat);
	const startDate = dayjs().subtract(30, "day");
	const endDate = dayjs().add(30, "day");
	const recentEvents = events?.filter((event) => {
		const eventStartDate = dayjs(event.eventStart, "DD-MM-YYYY");
		const eventEndDate = dayjs(event.eventEnd, "DD-MM-YYYY");

		return (
			eventStartDate.isBetween(startDate, endDate, null, "[]") ||
			eventEndDate.isBetween(startDate, endDate, null, "[]")
		);
	});

	function toSentenceCase(str) {
		if (!str) return str;
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	const lastThreeEvents = recentEvents?.length - 3;

	useEffect(() => {
		getData();
	}, []);

	useEffect(() => {
		socket.on("score_updated", (data) => {
			setLiveScore(data);
		});

		return () => {
			socket.off("score_updated");
		};
	}, []);

	return (
		<div className="md:px-10 lg:px-0 min-h-[95vh]">
			<h3 className="mt-5 text-xl sm:text-4xl text-white mb-2 flex gap-2 font-inter">
				Hello,
				<span className="text-[#B1D848] font-bold">
					{toSentenceCase(myData.username)}
				</span>
			</h3>
			<p className="border-b-2 w-1/2 mb-4"></p>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4 items-start">
				{/* Event Section */}
				<div className="border-4 border-[#7CB6CB] rounded-[30px] md:rounded-[60px] flex flex-col h-fit hover:shadow-2xl hover:shadow-[#7CB6CB]/50 transition-all duration-300 hover:-translate-y-1">
					<div className="p-3 lg:p-5">
						<h1 className="text-lg xs:text-xl md:text-2xl lg:text-3xl px-3 py-1 font-bold text-white">
							Events
						</h1>
						<div className="text-white px-2 mt-3 max-h-[350px] overflow-y-auto">
							{recentEvents?.slice(lastThreeEvents)?.map((event) => (
								<div
									key={event._id}
									className="lg:flex md:gap-3 lg:gap-6 mt-2 items-center p-2 rounded-xl hover:bg-[#7CB6CB]/20 transition-all duration-300 cursor-pointer group"
								>
									<div className="w-20 md:w-24 transition-transform duration-300 group-hover:scale-105">
										<img
											src="./badminton.jpg"
											alt="images"
											className="h-auto w-full rounded-xl"
										/>
									</div>
									<div className="leading-4 md:leading-5 lg:leading-8">
										<h1 className="text-sm xs:text-lg md:text-xl text-[#B1D848] font-bold group-hover:text-white transition-colors duration-300">{`${event.eventTitle}`}</h1>
										<p className="font-medium text-sm xs:text-base sm:text-lg">
											{`${event.eventStart}`}
											<span className="font-normal"> to </span>
											{`${event.eventEnd}`}
										</p>
										<p className="text-sm sm:text-base md:text-lg">{`${event.eventDesc}`}</p>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="p-4 bg-[#7CB6CB] rounded-b-[28px] md:rounded-b-[56px]">
						<NavLink
							to="/events"
							className={({ isActive }) =>
								`${
									isActive ? "opacity-70" : "opacity-100"
								} block w-full py-3 text-center font-medium rounded-3xl text-base md:text-xl transition hover:scale-[1.02] bg-white shadow-xl`
							}
						>
							See All
						</NavLink>
					</div>
				</div>

				{/* Live Score Section */}
				<div className="border-4 border-[#7CB6CB] rounded-[30px] md:rounded-[60px] flex flex-col h-fit hover:shadow-2xl hover:shadow-[#7CB6CB]/50 transition-all duration-300 hover:-translate-y-1">
					<div className="rounded-t-[28px] md:rounded-t-[56px] bg-[#7CB6CB] overflow-hidden shadow-xl">
						<h1 className="text-lg xs:text-xl md:text-2xl lg:text-3xl font-bold text-white p-4">
							Live Score
						</h1>
						<div className="w-full h-40 bg-[url(.././badminton.jpg)] bg-center bg-cover bg-no-repeat"></div>
						<div className="text-white p-4 lg:p-6 max-h-[250px] overflow-y-auto">
							{score?.map((isLive) => (
								<div key={isLive._id}>
									{isLive.isPlayed != true && isLive.scores.length > 0 ? (
										<div
											className="flex flex-col gap-3 items-center p-4 rounded-xl 
											hover:bg-white/10 transition-all duration-300 cursor-pointer
											shadow-lg shadow-[#5a8799]/30 mb-4 border border-[#5a8799]/20
											hover:shadow-xl hover:shadow-[#5a8799]/40"
										>
											<h1
												className="text-lg md:text-xl xl:text-2xl font-bold text-[#B1D848] text-center 
												hover:text-white transition-colors duration-300"
											>
												{isLive.eventDetails.eventTitle}
											</h1>
											<h3 className="text-lg md:text-xl font-semibold text-center">
												{isLive.eventDetails.eventStart}
												<span className="font-medium"> to </span>
												{isLive.eventDetails.eventEnd}
											</h3>
											<p className="text-base md:text-lg text-center">
												{isLive.eventDetails.eventDesc}
											</p>
										</div>
									) : null}
								</div>
							))}
						</div>
					</div>
					<div className="p-4 rounded-b-[28px] md:rounded-b-[56px]">
						<NavLink
							to="/liveScore"
							className={({ isActive }) =>
								`${
									isActive ? "opacity-70" : "opacity-100"
								} block w-full py-3 text-center font-medium rounded-3xl text-base md:text-xl transition hover:scale-[1.02] bg-white shadow-xl`
							}
						>
							See All
						</NavLink>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Home;
