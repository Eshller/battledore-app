import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { useService } from "../ContextAPI/axios";

function Events() {
	const [showCalendar, setShowCalendar] = useState(false);
	const [selectedDate, setSelectedDate] = useState(null);
	const [numberofDays, setNumberofDays] = useState("");
	const [isVisible, setIsVisible] = useState(false);

	const { setEvent, myData } = useService();

	const [events, setEvents] = useState({
		eventTitle: "",
		eventStart: "",
		eventEnd: "",
		eventDesc: "",
	});

	const toggleCalendar = () => {
		setShowCalendar(!showCalendar);
	};
	const handleDateChange = (newDate) => {
		setSelectedDate(newDate);
		setShowCalendar(!showCalendar);
		setIsVisible(!isVisible);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setEvents((prevState) => ({
			...prevState,
			[name]: value,
		}));
	};

	// calculate end date
	function addDaysToDate(date, days, format = "DD-MM-YYYY") {
		const result = dayjs(date).add(days, "day");
		return result.format(format);
	}

	const handleSubmit = (e) => {
		e.preventDefault();

		const currentDate = selectedDate.format("YYYY-MM-DD");
		const daysToAdd = numberofDays;
		const formattedDate = addDaysToDate(currentDate, daysToAdd);

		events.eventStart = selectedDate.format("DD-MM-YYYY");
		events.eventEnd = formattedDate;

		// trying to send backend
		setEvent(events);

		setIsVisible(!isVisible);
		setEvents({
			eventTitle: "",
			eventStart: "",
			eventEnd: "",
			eventDesc: "",
		});
		setNumberofDays("");
	};
	return (
		<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative min-h-[90vh]">
			{/* Header Section */}
			<div className="mt-16 flex flex-col sm:flex-row justify-between items-center gap-4">
				<h1 className="text-3xl sm:text-4xl text-white font-bold font-inter tracking-tight">
					Events
				</h1>

				<div className="flex items-center gap-4">
					<button
						onClick={toggleCalendar}
						className="flex items-center gap-2 bg-[#7cb6cb] hover:bg-[#5a9cb5] text-white px-4 py-2 rounded-lg transition-all"
						aria-label="Toggle Calendar"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 -960 960 960"
							className="w-6 h-6"
							fill="currentColor"
						>
							<path d="M580-240q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
						</svg>
						<span className="hidden sm:inline">Add Event</span>
					</button>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div className="mt-8">
				<nav className="flex space-x-8 border-b border-gray-500/30">
					<NavLink
						to=""
						className={({ isActive }) =>
							`${
								isActive
									? "border-[#7cb6cb] text-[#7cb6cb]"
									: "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
							} cursor-pointer pb-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200`
						}
					>
						Recent
					</NavLink>
					<NavLink
						to="weekly"
						className={({ isActive }) =>
							`${
								isActive
									? "border-[#7cb6cb] text-[#7cb6cb]"
									: "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
							} cursor-pointer pb-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200`
						}
					>
						This Week
					</NavLink>
					<NavLink
						to="upcoming"
						className={({ isActive }) =>
							`${
								isActive
									? "border-[#7cb6cb] text-[#7cb6cb]"
									: "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
							} cursor-pointer pb-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200`
						}
					>
						Upcoming
					</NavLink>
				</nav>
			</div>

			{/* Calendar and Form Overlays */}
			{showCalendar && myData.isOperator && (
				<div className="absolute right-4 z-50 mt-2">
					<div className="bg-white rounded-xl shadow-xl overflow-hidden">
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DateCalendar
								onChange={handleDateChange}
								disablePast
								sx={{
									width: {
										xs: "100%",
										sm: "320px",
									},
									"& .MuiPickersDay-root": {
										borderRadius: "8px",
									},
									"& .MuiPickersDay-today": {
										backgroundColor: "#7cb6cb33",
									},
									"& .MuiPickersDay-root.Mui-selected": {
										backgroundColor: "#7cb6cb",
									},
								}}
							/>
						</LocalizationProvider>
					</div>
				</div>
			)}

			{/* Event Form */}
			{selectedDate && isVisible && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<form
						onSubmit={handleSubmit}
						className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-6"
					>
						<h2 className="text-2xl font-bold text-gray-800">
							Create New Event
						</h2>

						<div className="space-y-4">
							<div>
								<input
									type="text"
									name="eventTitle"
									value={events.eventTitle}
									onChange={handleChange}
									placeholder="Event Name"
									className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#7cb6cb] focus:ring-2 focus:ring-[#7cb6cb]/20 outline-none transition-all"
									required
								/>
							</div>

							<div className="flex items-center gap-4">
								<label className="font-medium text-gray-700">Duration:</label>
								<select
									name="numberofDays"
									value={numberofDays}
									onChange={(e) => setNumberofDays(e.target.value)}
									className="px-3 py-2 rounded-lg border border-gray-300 focus:border-[#7cb6cb] focus:ring-2 focus:ring-[#7cb6cb]/20 outline-none"
									required
								>
									{[1, 2, 3, 4, 5, 6, 7].map((num) => (
										<option key={num} value={num}>
											{num} day{num > 1 ? "s" : ""}
										</option>
									))}
								</select>
							</div>

							<div>
								<textarea
									name="eventDesc"
									value={events.eventDesc}
									onChange={handleChange}
									placeholder="Event Description"
									className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#7cb6cb] focus:ring-2 focus:ring-[#7cb6cb]/20 outline-none transition-all min-h-[100px]"
									required
								/>
							</div>
						</div>

						<div className="flex justify-end gap-4 pt-4">
							<button
								type="button"
								onClick={() => setIsVisible(false)}
								className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="px-6 py-2 bg-[#7cb6cb] hover:bg-[#5a9cb5] text-white rounded-lg transition-colors"
							>
								Create Event
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Event List Section */}
			<div className="mt-6 pb-16">
				<Outlet />
			</div>
		</div>
	);
}

export default Events;
