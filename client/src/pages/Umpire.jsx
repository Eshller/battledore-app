import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import Watermark from "../components/Watermark";

function Umpire() {
  const Navigate = useNavigate();
  const location = useLocation();
  const { match } = location.state || {};

  const { startMatch } = useService();
  const [teamOption, setTeamOption] = useState(false);
  const [teamOptionForReceiver, setTeamOptionForReceiver] = useState(false);
  const [serverPlayerOptions, setServerPlayerOptions] = useState(false);
  const [receiverPlayerOptions, setReceiverPlayerOptions] = useState(false);
  const [rightTeamOption, setRightTeamOption] = useState(false);

  const [gameState, setGameState] = useState({
    eventPlace: "",
    server: "",
    receiver: "",
    serverTeam: "",
    receiverTeam: "",
    rightTeam: "",
  });

  // Get players based on team
  const getTeamPlayers = (teamName) => {
    if (teamName === match?.firstTeamName) {
      return match?.playerThree 
        ? [match?.playerOne, match?.playerThree] 
        : [match?.playerOne];
    } else if (teamName === match?.secondTeamName) {
      return match?.playerFour 
        ? [match?.playerTwo, match?.playerFour] 
        : [match?.playerTwo];
    }
    return [];
  };

  function selectServerTeam(teamName) {
    setGameState({
      ...gameState,
      serverTeam: teamName,
      server: "", // Reset server when team changes
    });
    setTeamOption(false);
  }

  function selectReceiverTeam(teamName) {
    setGameState({
      ...gameState,
      receiverTeam: teamName,
      receiver: "", // Reset receiver when team changes
    });
    setTeamOptionForReceiver(false);
  }

  function selectRightTeam(teamName) {
    setGameState({
      ...gameState,
      rightTeam: teamName,
    });
    setRightTeamOption(false);
  }

  function selectServerPlayer(playerName) {
    setGameState({
      ...gameState,
      server: playerName,
    });
    setServerPlayerOptions(false);
  }

  function selectReceiverPlayer(playerName) {
    setGameState({
      ...gameState,
      receiver: playerName,
    });
    setReceiverPlayerOptions(false);
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
        : toast.error(res.data.message);

      if (res.status === 201) {
        setGameState({
          eventPlace: "",
          server: "",
          receiver: "",
          serverTeam: "",
          receiverTeam: "",
          rightTeam: "",
        });
        Navigate(`/scorepage/${match?._id}`);
      }
    }
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
                {" "}
                <span className="text-[#B1D848]">START</span> MATCH
              </h1>
              <p className="opacity-80">Type of match : {match?.typeOfMatch}</p>
              <p className="opacity-80">
                Teams : {match?.firstTeamName} vs. {match?.secondTeamName}
              </p>
              <p className="opacity-80">
                First team player's name : {match?.playerOne}
                {match?.playerThree ? " & " + match?.playerThree : null}
              </p>
              <p className="opacity-80">
                Second team player's name : {match?.playerTwo}
                {match?.playerFour ? " & " + match?.playerFour : null}
              </p>
              <p className="opacity-80">
                Total Points : {match?.totalPoints || 21}
              </p>
            </div>
            <div
              id="enterDetails"
              className="w-full max-h-[300px] lg:min-h-[500px] flex flex-col justify-between gap-10 md:gap-5 p-2 md:p-7 xl:p-10"
            >
              <div className="flex flex-col gap-4 lg:gap-10 p-5 md:p-0">
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <input
                    type="text"
                    name="eventPlace"
                    value={gameState.eventPlace}
                    onChange={handleChange}
                    placeholder="Court Number"
                    className="bg-transparent outline-none border-none px-2 md:px-6 w-3/4 placeholder:text-white text-medium md:text-lg lg:text-xl"
                  />
                </div>
                
                {/* Team on the right selection */}
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <input
                    type="text"
                    name="rightTeam"
                    value={gameState.rightTeam}
                    onChange={handleChange}
                    onClick={() => setRightTeamOption((prev) => !prev)}
                    placeholder="Team on your right"
                    className="bg-transparent outline-none border-none px-2 md:px-6 w-3/4 placeholder:text-white text-medium md:text-lg lg:text-xl"
                  />
                  {rightTeamOption && (
                    <div className="p-4 cursor-pointer absolute shadow-2xl bg-white left-20 top-7 text-black rounded-xl font-medium text-xl z-50">
                      <p onClick={() => selectRightTeam(match.firstTeamName)}>
                        {match?.firstTeamName}
                      </p>
                      <p className="border-b-[1px] border-slate-800"></p>
                      <p onClick={() => selectRightTeam(match.secondTeamName)}>
                        {match?.secondTeamName}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Server Team Selection */}
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <input
                    type="text"
                    name="serverTeam"
                    value={gameState.serverTeam}
                    onChange={handleChange}
                    onClick={() => setTeamOption((prev) => !prev)}
                    placeholder="Serving Team"
                    className="bg-transparent outline-none border-none px-2 md:px-6 w-3/4 placeholder:text-white text-medium md:text-lg lg:text-xl"
                  />
                  {teamOption && (
                    <div className="p-4 cursor-pointer absolute shadow-2xl bg-white left-20 top-7 text-black rounded-xl font-medium text-xl z-50">
                      <p onClick={() => selectServerTeam(match.firstTeamName)}>
                        {match?.firstTeamName}
                      </p>
                      <p className="border-b-[1px] border-slate-800"></p>
                      <p onClick={() => selectServerTeam(match.secondTeamName)}>
                        {match?.secondTeamName}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Server Player Selection */}
                {gameState.serverTeam && (
                  <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                    <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                    <input
                      type="text"
                      name="server"
                      value={gameState.server}
                      onChange={handleChange}
                      onClick={() => setServerPlayerOptions((prev) => !prev)}
                      placeholder="Server Player"
                      className="bg-transparent outline-none border-none px-2 md:px-6 w-3/4 placeholder:text-white text-medium md:text-lg lg:text-xl"
                    />
                    {serverPlayerOptions && (
                      <div className="p-4 cursor-pointer absolute shadow-2xl bg-white left-20 top-7 text-black rounded-xl font-medium text-xl z-50">
                        {getTeamPlayers(gameState.serverTeam).map((player, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <p className="border-b-[1px] border-slate-800"></p>}
                            <p onClick={() => selectServerPlayer(player)}>
                              {player}
                            </p>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Receiver Team Selection */}
                <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                  <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                  <input
                    type="text"
                    name="receiverTeam"
                    value={gameState.receiverTeam}
                    onChange={handleChange}
                    onClick={() => setTeamOptionForReceiver(!teamOptionForReceiver)}
                    placeholder="Receiving Team"
                    className="bg-transparent outline-none border-none px-2 md:px-6 w-3/4 placeholder:text-white text-medium md:text-lg lg:text-xl"
                  />
                  {teamOptionForReceiver && (
                    <div className="p-4 cursor-pointer absolute shadow-2xl bg-white left-20 top-7 text-black rounded-xl font-medium text-xl z-50">
                      <p onClick={() => selectReceiverTeam(match.firstTeamName)}>
                        {match?.firstTeamName}
                      </p>
                      <p className="border-b-[1px] border-slate-800"></p>
                      <p onClick={() => selectReceiverTeam(match.secondTeamName)}>
                        {match?.secondTeamName}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Receiver Player Selection */}
                {gameState.receiverTeam && (
                  <div className="flex border-b-2 w-full md:w-3/4 gap-2 md:gap-5 relative">
                    <img src=".././ri_team-line.png" alt="icon" className="w-8" />

                    <input
                      type="text"
                      name="receiver"
                      value={gameState.receiver}
                      onChange={handleChange}
                      onClick={() => setReceiverPlayerOptions((prev) => !prev)}
                      placeholder="Receiver Player"
                      className="bg-transparent outline-none border-none px-2 md:px-6 w-3/4 placeholder:text-white text-medium md:text-lg lg:text-xl"
                    />
                    {receiverPlayerOptions && (
                      <div className="p-4 cursor-pointer absolute shadow-2xl bg-white left-20 top-7 text-black rounded-xl font-medium text-xl z-50">
                        {getTeamPlayers(gameState.receiverTeam).map((player, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <p className="border-b-[1px] border-slate-800"></p>}
                            <p onClick={() => selectReceiverPlayer(player)}>
                              {player}
                            </p>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleStartGame}
                className="w-3/4 bg-white text-black font-inter font-bold py-3 rounded-2xl"
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
