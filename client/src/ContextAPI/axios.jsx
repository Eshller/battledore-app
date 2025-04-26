import { useContext, createContext, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

// Create context
export const BackendContext = createContext();

// Provide context
export const BackendProvider = ({ children }) => {
	const [token, setToken] = useState(localStorage.getItem("token") || "");
	const [playerList, setPlayerList] = useState([]);
	const [numberOfUsers, setNumberofUsers] = useState(0);
	const [eventList, setEventList] = useState([]);
	const [numberOfEvents, setNumberofEvents] = useState(0);
	const [myData, setMyData] = useState({});
	const [matchData, setMatchData] = useState([]);
	const [numberofMatches, setNumberofMatches] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

	const server = String(import.meta.env.VITE_BATTLEDORE_SERVER_URL);

	// Axios instance
	const axiosInstance = axios.create({
		baseURL: String(import.meta.env.VITE_BATTLEDORE_SERVER_URL),
		headers: { Authorization: `Bearer ${token}` },
	});

	// User functions
	const signup = async (userData) => {
		try {
			setIsLoading(true);
			const response = await axios.post(`${server}/signup`, userData);
			toast.success(response.data?.message);
			return response;
		} catch (error) {
			console.error("Signup failed:", error.message);
			toast.error(error.response?.data?.message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (user) => {
		setIsLoading(true);
		console.log("axios isLoading: ", isLoading);
		try {
			const response = await axios.post(`${server}/login`, user);
			setToken(response.data.token);
			localStorage.setItem("token", response.data.token);
			toast.success(response.data?.message);
		} catch (error) {
			console.log(error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const forgotPassword = async (to) => {
		try {
			setIsLoading(true);
			const response = await axios.post(`${server}/forgotpassword`, to);
			toast.success(response.data?.message);
			return response.data?.otp;
		} catch (err) {
			console.log(err.message);
			toast.error(err.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const createNewPassword = async (detail) => {
		try {
			setIsLoading(true);
			const response = await axios.post(`${server}/createNewPassword`, detail);
			toast.success(response.data?.message);
			return response;
		} catch (err) {
			console.log(err.message);
			toast.error(err.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const logOut = () => {
		setToken("");
		localStorage.removeItem("token");
	};

	const getAllUsers = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.get("/players");
			setPlayerList(response.data.users);
			setNumberofUsers(response.data?.users?.length);
		} catch (error) {
			console.log(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	const removeUser = async (userId) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.delete(`/users/delete/${userId}`);
			setNumberofUsers(numberOfEvents - 1);
			toast.success(response.data?.message);
		} catch (error) {
			console.log(error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const getYourData = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.get("/getmydata");
			setMyData(response.data?.userData);
		} catch (error) {
			console.log("Unable to fetch your data", error.message);
		} finally {
			setIsLoading(false);
		}
	};

	const updateMyData = async (myData) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.put("/updatemydata", myData);
			setMyData(response.data.data);
			toast.success(response.data?.message);
		} catch (error) {
			console.log(error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const setEvent = async (event) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.post("/events/post", event);
			setNumberofEvents(numberOfEvents + 1);
			toast.success(response.data?.message);
		} catch (error) {
			console.log(error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const getEvents = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.get("/events");
			setEventList(response.data?.events);
			setNumberofEvents(response.data?.events?.length);
			return response.data?.events;
		} catch (error) {
			console.log("Unable to fetch all events", error.message);
		} finally {
			setIsLoading(false);
		}
	};

	const removeEvent = async (eventId) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.delete(`/events/delete/${eventId}`);
			setNumberofEvents(numberOfEvents - 1);
			toast.success(response.data?.message);
		} catch (error) {
			console.log(error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const updateEvent = async (eventId, data) => {
		try {
			setIsLoading(true);
			const updatedData = { ...data };
			delete updatedData._id;
			delete updatedData.__v;
			delete updatedData.createdAt;
			delete updatedData.updatedAt;
			const response = await axiosInstance.put(
				`/events/update/${eventId}`,
				updatedData
			);
			toast.success(response.data?.message);
		} catch (error) {
			console.log(error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const addMatch = async (id, reqDetail) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.post(
				`/createMatch/${id}`,
				reqDetail
			);
			// Don't show toast here to avoid duplicate toasts
			setNumberofMatches(numberofMatches + 1);
			return response;
		} catch (error) {
			console.log(error.message);
			// Keep the error toast here
			toast.error(error.response?.data?.message);
			return { status: 'error', error };
		} finally {
			setIsLoading(false);
		}
	};

	const startMatch = async (id, reqDetail) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.patch(
				`/startMatch/${id}`,
				reqDetail
			);
			return response;
		} catch (error) {
			console.log(error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const getMatchData = async (gameId) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.get(`/match/${gameId}`);
			
			if (!response.data?.match) {
				throw new Error('No match data received');
			}

			// Ensure match time is properly formatted
			const match = response.data.match;
			match.matchTime = {
				minutes: parseInt(match.matchTime?.minutes) || 0,
				seconds: parseInt(match.matchTime?.seconds) || 0
			};

			console.log('Processed match data:', {
				id: match._id,
				time: match.matchTime
			});

			setMatchData(match);
			return response.data;
		} catch (error) {
			console.error("Error fetching match data:", error.message);
			toast.error("Failed to fetch match data");
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const getScoresData = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.get("/matches");
			setNumberofMatches(response.data?.matches?.length);
			return response.data?.matches;
		} catch (error) {
			console.error("Error fetching all matches:", error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const updateScores = async (data, gameId) => {
		try {
			setIsLoading(true);
			console.log('Sending final match data:', data);

			const response = await axiosInstance.patch(`/endmatch/${gameId}`, data);
			console.log('Match update response:', response.data);

			// Handle "Match Ends" message as success
			if (response.data?.message === "Match Ends") {
				console.log('Match ended successfully with message:', response.data.message);
				return { status: 200, data: response.data };
			}

			if (response.data?.success) {
				toast.success("Match updated successfully");
				return response;
			}

			throw new Error(response.data?.message || 'Failed to update match');
		} catch (error) {
			console.error("Error updating match:", error.message);
			// Don't throw for "Match Ends" message
			if (error.message === "Match Ends") {
				return { status: 200, data: { message: "Match Ends" } };
			}
			toast.error(error.message);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const removeMatch = async (eventId, matchId) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.delete(
				`/removematch/${eventId}/${matchId}`
			);
			setNumberofMatches(numberofMatches - 1);
			toast.success(response.data?.message);
		} catch (error) {
			console.error("Error removing match:", error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const saveMisconduct = async (misconductData) => {
		try {
			setIsLoading(true);
			const response = await axios.post(
				`${import.meta.env.VITE_SERVER}/api/misconducts`,
				misconductData
			);
			return response.data;
		} catch (error) {
			console.error("Error saving misconduct:", error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const getMisconducts = async (matchId) => {
		try {
			setIsLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_SERVER}/api/misconducts/${matchId}`
			);
			return response.data;
		} catch (error) {
			console.error("Error fetching misconducts:", error.message);
			toast.error(error.response?.data?.message);
		} finally {
			setIsLoading(false);
		}
	};

	const createMatch = async (eventId, data) => {
		try {
			const response = await axiosInstance.post(
				`/createMatch/${eventId}`,
				data
			);
			if (response.data) {
				toast.success("Match created successfully!");
				return { success: true, data: response.data };
			}
		} catch (error) {
			const errorMessage =
				error.response?.data?.message || "All fields are required";
			console.error("Error creating match:", error.message);
			toast.error(errorMessage);
			return {
				success: false,
				error: errorMessage,
				status: error.response?.status,
			};
		}
	};

	const updateMatchTime = async (matchId, minutes, seconds) => {
		try {
			setIsLoading(true);
			console.log('Updating match time:', { minutes, seconds });
		
			const response = await axiosInstance.patch(`/match/${matchId}/time`, {
				minutes: parseInt(minutes),
				seconds: parseInt(seconds)
			});
		
			console.log('Match time update response:', response.data);
		
			if (!response.data?.success) {
				throw new Error(response.data?.message || 'Failed to update match time');
			}
		
			return response.data;
		} catch (error) {
			console.error("Error updating match time:", error.message);
			toast.error("Failed to update match time");
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<BackendContext.Provider
			value={{
				// Variables
				playerList,
				token,
				numberOfUsers,
				eventList,
				myData,
				numberOfEvents,
				matchData,
				numberofMatches,
				// Functions
				signup,
				login,
				logOut,
				getAllUsers,
				getYourData,
				updateMyData,
				removeUser,
				forgotPassword,
				createNewPassword,
				setEvent,
				getEvents,
				updateEvent,
				setNumberofEvents,
				removeEvent,
				addMatch,
				startMatch,
				getMatchData,
				getScoresData,
				updateScores,
				removeMatch,
				saveMisconduct,
				getMisconducts,
				isLoading,
				setIsLoading,
				createMatch,
				updateMatchTime,
			}}
		>
			{children}
		</BackendContext.Provider>
	);
};

export const useService = () => {
	return useContext(BackendContext);
};
