import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import Watermark from "../components/Watermark";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

function Umpire() {
  const navigate = useNavigate();
  const location = useLocation();
  const { match } = location.state || {};

  const { startMatch } = useService();
  const [serverOptions, setServerOptions] = useState(false);
  const [receiverOptions, setReceiverOptions] = useState(false);
  const [rightSideOption, setRightSideOption] = useState(false);

  const [gameState, setGameState] = useState({
    eventPlace: "",
    server: "",
    receiver: "",
    rightTeam: "", // Keeping variable name for backend compatibility
  });

  // Check if this is a team match (only true if actual team names are provided)
  const isTeamMatch = !!(match?.firstTeamName?.trim() && match?.secondTeamName?.trim());
  
  // Check if this is a doubles match
  const isDoublesMatch = match?.typeOfMatch?.toLowerCase().includes('doubles');
  
  // Check if this is a singles match - used in conditional rendering
  const isSinglesMatch = match?.typeOfMatch?.toLowerCase().includes('singles');
  
  // Note: Team terminology is determined by isTeamMatch

  // Note: Singles matches with no team names are handled using isSinglesMatch && !isTeamMatch

  function selectRightSide(value) {
    setGameState({
      ...gameState,
      rightTeam: value,
    });
    setRightSideOption(false);
  }

  function selectServer(playerName) {
    setGameState({
      ...gameState,
      server: playerName,
    });
    setServerOptions(false);
  }

  function selectReceiver(playerName) {
    setGameState({
      ...gameState,
      receiver: playerName,
    });
    setReceiverOptions(false);
  }

  function toSentenceCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGameState((prevState) => ({
      ...prevState,
      [name]: toSentenceCase(value),
    }));
  };

  const verifyFormData = () => {
    if (!gameState.eventPlace || !gameState.server || !gameState.receiver || !gameState.rightTeam) {
      toast.error("All fields are required");
      return false;
    }
    
    // Make sure server and receiver are different players
    if (gameState.server === gameState.receiver) {
      toast.error("Server and receiver must be different players");
      return false;
    }
    
    return true;
  };

  const handleStartGame = async () => {
    const valid = verifyFormData();
    if (valid) {
      const reqDetail = {
        eventPlace: gameState.eventPlace,
        server: gameState.server,
        receiver: gameState.receiver,
        rightTeam: gameState.rightTeam,
      };
      const res = await startMatch(match?._id, reqDetail);
      res.data.message
        ? toast.success(res.data.message)
        : toast.error(res.data.error || "An error occurred");

      if (res.status === 201) {
        setGameState({
          eventPlace: "",
          server: "",
          receiver: "",
          rightTeam: "",
        });
        navigate(`/scorepage/${match?._id}`);
      }
    }
  };

  // Get right side options
  const getRightSideOptions = () => {
    if (isTeamMatch) {
      // For team matches, return team names
      return [match?.firstTeamName, match?.secondTeamName];
    } else {
      // For individual matches, return player combinations
      const firstSide = match?.playerThree 
        ? `${match?.playerOne} & ${match?.playerThree}` 
        : match?.playerOne;
      
      const secondSide = match?.playerFour 
        ? `${match?.playerTwo} & ${match?.playerFour}` 
        : match?.playerTwo;
      
      return [firstSide, secondSide];
    }
  };

  // Get all players for server/receiver selection
  const getAllPlayers = () => {
    const players = [];
    if (match?.playerOne) players.push(match.playerOne);
    if (match?.playerTwo) players.push(match.playerTwo);
    if (match?.playerThree) players.push(match.playerThree);
    if (match?.playerFour) players.push(match.playerFour);
    return players;
  };

  return (
    <>
      <div className="h-screen bg-[url('.././badminton.jpg')] bg-bottom bg-cover bg-no-repeat relative flex flex-col justify-center items-center">
        <div className="w-[80%] m-auto p-4 md:p-10 rounded-3xl bg-[#5ea0b8] bg-opacity-70 shadow-2xl text-white">
          <div className="lg:flex justify-between items-center font-inter">
            <div
              id="details"
              className="w-full max-h-[300px] lg:min-h-[500px] flex flex-col gap-2 md:gap-5 justify-center p-3 md:p-5 lg:p-10 text-sm sm:text-lg xl:text-xl 2xl:text-2xl font-medium"
            >
              <h1 className="text-white font-bold text-3xl sm:text-5xl 2xl:text-6xl">
                <span className="text-[#B1D848]">START</span> MATCH
              </h1>
              <p className="opacity-80">Type of match: {match?.typeOfMatch}</p>
              {isTeamMatch ? (
                <p className="opacity-80">
                  Teams: {match?.firstTeamName} vs {match?.secondTeamName}
                </p>
              ) : isDoublesMatch ? (
                <p className="opacity-80">
                  Players: {match?.playerOne}{match?.playerThree ? ` & ${match?.playerThree}` : ""} vs {match?.playerTwo}{match?.playerFour ? ` & ${match?.playerFour}` : ""}
                </p>
              ) : isSinglesMatch ? (
                <p className="opacity-80">
                  Players: {match?.playerOne} vs {match?.playerTwo}
                </p>
              ) : null}
              {isTeamMatch ? (
                <>
                  <p className="opacity-80">
                    First team player&apos;s name: {match?.playerOne}
                    {match?.playerThree ? ` & ${match?.playerThree}` : null}
                  </p>
                  <p className="opacity-80">
                    Second team player&apos;s name: {match?.playerTwo}
                    {match?.playerFour ? ` & ${match?.playerFour}` : null}
                  </p>
                </>
              ) : null}
              <p className="opacity-80">
                Total Points: {match?.totalPoints || 21}
              </p>
            </div>
            <div
              id="enterDetails"
              className="w-full max-h-[300px] lg:min-h-[500px] flex flex-col justify-between gap-10 md:gap-5 p-2 md:p-7 xl:p-10"
            >
              <div className="flex flex-col gap-4 lg:gap-10 p-5 md:p-0">
                {/* Court Number field */}
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <div className="relative w-full">
                    <input
                      type="text"
                      name="eventPlace"
                      value={gameState.eventPlace}
                      onChange={handleChange}
                      placeholder="Court Number"
                      className="bg-transparent outline-none border-none px-2 md:px-6 w-full placeholder:text-white text-medium md:text-lg lg:text-xl focus:placeholder:text-opacity-70 transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* Player/Team on the right selection */}
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <div className="relative w-full">
                    <div 
                      className="flex items-center justify-between w-full cursor-pointer"
                      onClick={() => setRightSideOption((prev) => !prev)}
                    >
                      <input
                        type="text"
                        name="rightTeam"
                        value={gameState.rightTeam}
                        onChange={handleChange}
                        placeholder={isTeamMatch ? "Team on your right" : isDoublesMatch ? "Players on your right" : "Player on your right"}
                        className="bg-transparent outline-none border-none px-2 md:px-6 w-full placeholder:text-white text-medium md:text-lg lg:text-xl cursor-pointer"
                        readOnly
                      />
                      <div className="text-white mr-2">
                        {rightSideOption ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                      </div>
                    </div>
                    
                    {rightSideOption && (
                      <div 
                        className="absolute z-50 w-full mt-2 py-2 bg-white rounded-lg shadow-xl transition-all duration-200 ease-in-out"
                      >
                        {getRightSideOptions().map((option, index) => (
                          <div 
                            key={index} 
                            className={`px-4 py-2 text-black hover:bg-blue-100 cursor-pointer transition-colors duration-150 ${index > 0 ? 'border-t border-gray-200' : ''}`}
                            onClick={() => selectRightSide(option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Server Player Selection */}
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <div className="relative w-full">
                    <div 
                      className="flex items-center justify-between w-full cursor-pointer"
                      onClick={() => setServerOptions((prev) => !prev)}
                    >
                      <input
                        type="text"
                        name="server"
                        value={gameState.server}
                        onChange={handleChange}
                        placeholder="Server"
                        className="bg-transparent outline-none border-none px-2 md:px-6 w-full placeholder:text-white text-medium md:text-lg lg:text-xl cursor-pointer"
                        readOnly
                      />
                      <div className="text-white mr-2">
                        {serverOptions ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                      </div>
                    </div>
                    
                    {serverOptions && (
                      <div 
                        className="absolute z-50 w-full mt-2 py-2 bg-white rounded-lg shadow-xl transition-all duration-200 ease-in-out max-h-48 overflow-y-auto"
                      >
                        {getAllPlayers().map((player, index) => (
                          <div 
                            key={index} 
                            className={`px-4 py-2 text-black hover:bg-blue-100 cursor-pointer transition-colors duration-150 ${index > 0 ? 'border-t border-gray-200' : ''}`}
                            onClick={() => selectServer(player)}
                          >
                            {player}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Receiver Player Selection */}
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <div className="relative w-full">
                    <div 
                      className="flex items-center justify-between w-full cursor-pointer"
                      onClick={() => setReceiverOptions((prev) => !prev)}
                    >
                      <input
                        type="text"
                        name="receiver"
                        value={gameState.receiver}
                        onChange={handleChange}
                        placeholder="Receiver"
                        className="bg-transparent outline-none border-none px-2 md:px-6 w-full placeholder:text-white text-medium md:text-lg lg:text-xl cursor-pointer"
                        readOnly
                      />
                      <div className="text-white mr-2">
                        {receiverOptions ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                      </div>
                    </div>
                    
                    {receiverOptions && (
                      <div 
                        className="absolute z-50 w-full mt-2 py-2 bg-white rounded-lg shadow-xl transition-all duration-200 ease-in-out max-h-48 overflow-y-auto"
                      >
                        {getAllPlayers().map((player, index) => (
                          <div 
                            key={index} 
                            className={`px-4 py-2 text-black hover:bg-blue-100 cursor-pointer transition-colors duration-150 ${index > 0 ? 'border-t border-gray-200' : ''}`}
                            onClick={() => selectReceiver(player)}
                          >
                            {player}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleStartGame}
                className="w-3/4 bg-white text-black font-inter font-bold py-3 rounded-2xl hover:bg-opacity-90 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Start match
              </button>
            </div>
          </div>
        </div>
        <footer className="text-center">
          <div className="opacity-50 text-5xl md:text-7xl xl:text-9xl">
            <Watermark />
          </div>
          <div className="text-white font-inter text-[0.75rem] md:text-[1rem] tracking-widest">
            Maintained and developed by <span className="font-bold">ESH<span className="font-bold text-[#d86dfc]">WAY</span></span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Umpire;
