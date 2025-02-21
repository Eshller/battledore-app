import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import ScoreSheet from "../components/ScoreSheet.jsx";
import io from "socket.io-client";
import Watermark from "../components/Watermark";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function ScorePage() {
  const { getMatchData, matchData, updateScores, myData } = useService();
  const gameId = useParams();
  const Navigate = useNavigate();
  useEffect(() => {
    const fetchMatchData = async () => {
      const data = await getMatchData(gameId.id);
      if (data?.match) {
        // Only set scores if this match has existing scores
        if (data.match.scores && data.match.scores.length > 0 && !data.match.isPlayed) {
          const lastScore = data.match.scores[data.match.scores.length - 1];
          setTeamOneScore(lastScore.firstTeamScore);
          setTeamTwoScore(lastScore.secondTeamScore);
          setNumberOfShuttlecock(lastScore.numberOfShuttlecock || "1");
          setMatchStarted(true);
        } else {
          // Reset scores for new match
          setTeamOneScore("0");
          setTeamTwoScore("0");
          setNumberOfShuttlecock("1");
          setMatchStarted(false);
        }

        // Reset misconducts for new match
        setMisconducts(data.match.misconducts || []);
      }
    };

    fetchMatchData();
  }, [gameId.id]);

  const [teamOneScore, setTeamOneScore] = useState("0");
  const [teamTwoScore, setTeamTwoScore] = useState("0");
  const [step, setStep] = useState(1);
  const [numberOfShuttlecock, setNumberOfShuttlecock] = useState("1");
  const [matchStarted, setMatchStarted] = useState(false);
  const [isPlay, setPlay] = useState(false);
  const [misconductBox, setMisconductBox] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [misconduct, setMisconduct] = useState("");
  const [endMatchConfirmation, setEndMatchConfirmation] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState("");
  const [misconducts, setMisconducts] = useState([]);

  useEffect(() => {
    if (matchData?.scores?.length > 0 && matchData.isPlayed == false) {
      matchData.scores.map((data) => {
        setTeamOneScore(data.firstTeamScore);
        setTeamTwoScore(data.secondTeamScore);
        setNumberOfShuttlecock(data.numberOfShuttlecock);
      });
      setMatchStarted(true);
    }
  }, [matchData]);

  useEffect(() => {
    if (matchData?.misconducts) {
      setMisconducts(matchData.misconducts);
    }
  }, [matchData]);

  // Add socket listener for misconduct updates
  useEffect(() => {
    socket.on("misconduct_updated", (data) => {
      if (data.matchId === gameId.id) {
        setMisconducts(prev => [...prev, data.misconduct]);
      }
    });

    return () => {
      socket.off("misconduct_updated");
    };
  }, [gameId.id]);

  useEffect(() => {
    // Listen for new match creation
    socket.on("match_created", () => {
      // Reset all score-related state
      setTeamOneScore("0");
      setTeamTwoScore("0");
      setNumberOfShuttlecock("1");
      setMatchStarted(false);
      setMisconducts([]);
    });

    // Clean up socket listeners when component unmounts
    return () => {
      socket.off("match_created");
      socket.off("score_updated");
      socket.off("misconduct_updated");
    };
  }, []);

  const handleMisconductSelect = (type, player) => {
    // Emit misconduct via socket
    socket.emit("add_misconduct", {
      matchId: gameId.id,
      player: player,
      type: type,
      timestamp: new Date()
    });

    // Update local state
    const newMisconduct = {
      player: player,
      type: type,
      timestamp: new Date()
    };
    setMisconducts(prev => [...prev, newMisconduct]);

    // Reset misconduct selection state
    setMisconduct("");
    setSelectedPlayer("");
    setMisconductBox(false);
  };

  const handleMisconduct = (e) => {
    setMisconduct(e);
    if (step === 1) {
      handleMisconductSelect(e, selectedPlayer);
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handlePlayerSelect = (e) => {
    setSelectedPlayer(e.target.value);
    sendToScoreSheet(e.target.value);
    setMisconductBox(false);
    setStep(1);
    // alert("Player Marked")
  };

  const sendToScoreSheet = (player) => {
    console.log("Sending player to ScoreSheet:", player);
  };

  const sendScore = (f_score, s_score, isActive, winner) => {
    socket.emit("update_score", {
      _id: new Date().getMilliseconds(),
      firstTeamScore: f_score,
      secondTeamScore: s_score,
      status: isActive,
      won: winner,
      Id: gameId.id,
      numberOfShuttlecock,
      firstTeamName: matchData.firstTeamName,
      secondTeamName: matchData.secondTeamName,
      timestamp: new Date().toISOString(),
    });
  };

  const undoChanges = () => {
    let newTeamOneScore;
    let newTeamTwoScore;
    if (parseInt(teamOneScore) > 0 && parseInt(teamTwoScore) > 0) {
      newTeamOneScore = (parseInt(teamOneScore) - 1).toString();
      newTeamTwoScore = (parseInt(teamTwoScore) - 1).toString();
      setTeamOneScore(newTeamOneScore);
      setTeamTwoScore(newTeamTwoScore);
      sendScore(newTeamOneScore, newTeamTwoScore, "start");
    } else if (parseInt(teamOneScore) > 0) {
      newTeamOneScore = (parseInt(teamOneScore) - 1).toString();
      setTeamOneScore(newTeamOneScore);
      sendScore(newTeamOneScore, teamTwoScore, "start");
    } else if (parseInt(teamTwoScore) > 0) {
      newTeamTwoScore = (parseInt(teamTwoScore) - 1).toString();
      setTeamTwoScore(newTeamTwoScore);
      sendScore(teamOneScore, newTeamTwoScore, "start");
    }
  };

  const Team1 = () => {
    const newTeamOneScore = (parseInt(teamOneScore) + 1).toString();
    setTeamOneScore(newTeamOneScore);
    sendScore(newTeamOneScore, teamTwoScore, "start");
  };

  const Team2 = () => {
    const newTeamTwoScore = (parseInt(teamTwoScore) + 1).toString();
    setTeamTwoScore(newTeamTwoScore);
    sendScore(teamOneScore, newTeamTwoScore, "start");
  };

  const handleButtonClick = (team) => {
    if (team == "undo") {
      undoChanges();
    }
    const isReceiverFirstTeam =
      matchData?.firstTeamName === matchData?.receiver;
    if (team === "right") {
      isReceiverFirstTeam ? Team2() : Team1();
    } else {
      isReceiverFirstTeam ? Team1() : Team2();
    }
  };

  const endMatchSession = () => {
    const leftSideTeam =
      matchData.firstTeamName === matchData.receiver
        ? matchData.secondTeamName
        : matchData.firstTeamName;

    const rightSideTeam =
      matchData.firstTeamName === matchData.receiver
        ? matchData.firstTeamName
        : matchData.secondTeamName;

    const leftSideScore =
      matchData.firstTeamName === matchData.receiver
        ? teamOneScore
        : teamTwoScore;

    const rightSideScore =
      matchData.firstTeamName === matchData.receiver
        ? teamTwoScore
        : teamOneScore;

    let winner = "";
    let loser = "";

    if (leftSideScore > rightSideScore) {
      winner = `${leftSideTeam}`;
      loser = `${winner == matchData.firstTeamName
        ? matchData.secondTeamName
        : matchData.firstTeamName
        }`;
    } else if (leftSideScore < rightSideScore) {
      winner = `${rightSideTeam}`;
      loser = `${winner == matchData.firstTeamName
        ? matchData.secondTeamName
        : matchData.firstTeamName
        }`;
    } else {
      winner = "DRAW";
    }

    setEndMatchConfirmation(!endMatchConfirmation);

    if (winner != "DRAW") {
      setWinnerMessage(`Match won by ${winner} / ${loser}`);
    } else {
      setWinnerMessage(
        `Match is draw between ${leftSideTeam} and ${rightSideTeam}`
      );
      return winner;
    }
    return `${winner} wins`;
  };

  const end = async () => {
    const temp = {
      winner: endMatchSession(),
    };
    const res = await updateScores(temp, gameId.id);
    if (res.status == 200) {
      Navigate("/pastmatches");
      sendScore(teamOneScore, teamTwoScore, "end", winner);
    }
  };

  const endByWalkover = async () => {
    const temp = {
      winner: "Walkover",
    };
    const res = await updateScores(temp, gameId.id);
    if (res.status == 200) {
      Navigate("/pastmatches");
      sendScore(teamOneScore, teamTwoScore, "end", winner);
    }
  };

  const resetMatch = () => {
    // Reset all relevant state
    setTeamOneScore("0");
    setTeamTwoScore("0");
    setNumberOfShuttlecock("1");
    setMatchStarted(false);
    setMisconducts([]);

    // Emit reset event to update all clients
    socket.emit("reset_match", {
      Id: gameId.id,
      firstTeamScore: "0",
      secondTeamScore: "0",
      numberOfShuttlecock: "1",
      status: "reset"
    });
  };

  return (
    <div className="relative">
      {/* to start or walkout */}
      <div
        className={` ${isPlay ? "hidden" : "block"
          }  w-full h-screen bg-[rgba(0,0,0,0.2)] fixed z-10 font-inter font-semibold flex flex-col justify-center  items-center gap-[30rem]`}
      >
        <button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="#FFFFFF"
            className="w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full"
            onClick={() => setPlay(true)}
          >
            <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl text-3xl"
          onClick={() => endByWalkover()}
        >
          WALKOVER
        </button>
      </div>

      {/* misconduct Box */}
      {misconductBox && (
        <div className="bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 z-50 rounded-md flex flex-col items-end gap-4">
          {step === 1 && (
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center gap-2">
              <div
                id="w"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("W")}
              >
                <h1 className="font-bold text-3xl text-yellow-700 bg-yellow-400 rounded-md w-16 m-auto">
                  W
                </h1>
                <p className="font-semibold">Warning</p>
              </div>
              <div
                id="f"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("F")}
              >
                <h1 className="font-bold text-3xl text-red-700 bg-red-500 rounded-md w-16 m-auto">
                  F
                </h1>
                <p className="font-semibold">Fault</p>
              </div>
              <div
                id="r"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("R")}
              >
                <h1 className="font-bold text-3xl text-blue-950 rounded-md">R</h1>
                <p className="font-semibold leading-4">
                  Referee <br /> called{" "}
                </p>
              </div>
              <div
                id="s"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("S")}
              >
                <h1 className="font-bold text-3xl text-blue-950 rounded-md">S</h1>
                <p className="font-semibold">Suspension</p>
              </div>
              <div
                id="o"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("O")}
              >
                <h1 className="font-bold text-3xl text-blue-950 rounded-md">O</h1>
                <p className="font-semibold">Overrule</p>
              </div>
              <div
                id="i"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("I")}
              >
                <h1 className="font-bold text-3xl font-mono text-blue-950 rounded-md">
                  I
                </h1>
                <p className="font-semibold">Injury</p>
              </div>
              <div
                id="dec"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("DIS")}
              >
                <h1 className="font-bold text-slate-400 bg-slate-700 rounded-sm w-16 h-10 m-auto flex items-center justify-center">
                  DEC
                </h1>
                <p className="font-semibold">Disqualified</p>
              </div>
              <div
                id="ret"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("RET")}
              >
                <h1 className="font-bold text-3xl text-blue-950 rounded-md">
                  RET
                </h1>
                <p className="font-semibold">Retired</p>
              </div>
              <div
                id="c"
                className="text-center font-inter px-4 py-2 cursor-pointer"
                onClick={() => handleMisconduct("C")}
              >
                <h1 className="font-bold text-3xl text-blue-950 rounded-md">C</h1>
                <p className="font-semibold leading-4">
                  Service <br /> Court Error
                </p>
              </div>
            </div>
          )}
          {misconductBox && step === 2 && (
            <div className="bg-white w-full h-full top-0 absolute ">
              <div className="flex justify-center flex-col gap-2 align-middle items-center p-2">
                <h1>Choose player</h1>
                <select name="player" id="" className="w-100 h-100 bg-slate-200 p-2" onChange={handlePlayerSelect}>
                  <option value="">Select Player</option>
                  <option value={matchData.playerOne}>{matchData.playerOne}</option>
                  <option value={matchData.playerTwo}>{matchData.playerTwo}</option>
                  {matchData.playerThree &&
                    <option value={matchData.playerThree}>{matchData.playerThree}</option>
                  }
                  {matchData.playerFour &&
                    <option value={matchData.playerFour}>{matchData.playerFour}</option>
                  }
                </select>
              </div>
            </div>
          )}
          <button
            className="border border-black px-4 py-2 rounded-md text-xl font-inter font-semibold"
            onClick={() => setMisconductBox(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {endMatchConfirmation && (
        <div className="bg-white text-3xl font-inter absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg">
          <h1 className="text-lg lg:text-xl">{winnerMessage}</h1>
          <div className="mt-5 flex gap-10">
            <button
              className="border border-green-500 bg-green-500 hover:border-green-600 hover:bg-green-600 text-2xl font-inter px-4 py-2 rounded-md flex-1 font-semibold"
              onClick={() => end()}
            >
              Yes
            </button>
            <button
              className="border border-red-500 bg-red-500 hover:border-red-600 hover:bg-red-600 text-2xl font-inter px-4 py-2 rounded-md flex-1  font-semibold"
              onClick={() => setEndMatchConfirmation(false)}
            >
              No
            </button>
          </div>
        </div>
      )}

      <div className="w-[80%] m-auto font-inter">
        {/* Top Button Section */}
        <h1 className="font-inter text-center font-semibold text-2xl pt-4">
          {matchData?.typeOfMatch}
        </h1>
        <div className="sm:flex justify-center items-center">
          <div className="text-3xl text-white font-bold rounded-3xl py-3 px-5 bg-[rgb(124,182,203)] m-4 flex justify-center items-center shadow-lg gap-2 lg:gap-5">
            <button
              onClick={() =>
                setNumberOfShuttlecock((prev) =>
                  Number(prev) > 1 ? Number(prev) - 1 : prev
                )
              }
              disabled={!matchStarted}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                fill="#fff"
              >
                <path d="M200-440v-80h560v80H200Z" />
              </svg>
            </button>
            <img src=".././mdi_badminton.png" alt="shuttle cock icon" />
            <div>
              <button
                onClick={() =>
                  setNumberOfShuttlecock((prev) =>
                    Number(prev) < 10 ? Number(prev) + 1 : prev
                  )
                }
                disabled={!matchStarted}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="40px"
                  viewBox="0 -960 960 960"
                  fill="#fff"
                >
                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                </svg>
              </button>
            </div>
          </div>
          <button
            className="text-3xl text-white font-bold rounded-3xl px-5 py-3 bg-[#7cb6cb] m-4 w-48 flex justify-center items-center shadow-lg"
            onClick={() => handleButtonClick("undo")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="50px"
              viewBox="0 -960 960 960"
              width="100px"
              fill="#fff"
            >
              <path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z" />
            </svg>
          </button>
          <button
            className="text-3xl text-white font-bold rounded-3xl px-5 py-3 bg-[#7cb6cb] m-4 w-48 flex justify-center items-center shadow-lg"
            onClick={() => setMisconductBox(!misconductBox)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              className="w-12 h-12"
              fill="#FFFFFF"
            >
              <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z" />
            </svg>
          </button>
          <div>
            {matchStarted ? (
              <div className="flex justify-center gap-4">
                <button
                  className="text-3xl text-white font-bold rounded-3xl px-5 py-3 bg-red-400 m-4 w-48 flex justify-center items-center shadow-lg"
                  onClick={() => {
                    endMatchSession();
                  }}
                >
                  End
                </button>
                {/* <button
                  className="text-3xl text-white font-bold rounded-3xl px-5 py-3 bg-yellow-400 m-4 w-48 flex justify-center items-center shadow-lg"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset the match? This will clear all scores and misconducts.')) {
                      resetMatch();
                    }
                  }}
                >
                  Reset
                </button> */}
              </div>
            ) : (
              <button
                className="text-xl xl:text-3xl min-w-48 text-white font-bold rounded-lg  xl:rounded-2xl px-5 py-3 bg-green-400 m-4 flex justify-center items-center shadow-lg uppercase"
                onClick={() => {
                  setMatchStarted(true);
                  sendScore("0", "0", "start");
                }}
              >
                Love All Play
              </button>
            )}
          </div>
        </div>

        {/* Main Section */}
        <div className="w-[85%] lg:w-[60%] m-auto h-auto bg-white pb-4 rounded-t-3xl">
          {/* Score */}
          <div className="px-10 text-[4rem] lg:text-[5rem] text-[#7cb6cb] flex justify-center gap-5 md:gap-10 items-center">
            <span>
              {matchData.firstTeamName === matchData.receiver
                ? `${teamOneScore}`
                : `${teamTwoScore}`}
            </span>
            <span> - </span>
            <span>
              {matchData.firstTeamName === matchData.receiver
                ? `${teamTwoScore}`
                : `${teamOneScore}`}
            </span>
          </div>
          {/* Court */}
          <div className="">
            <div className="h-[10rem] sm:h-[14rem] md:h-[20rem] lg:h-[23rem] xl:h-[25rem] 2xl:h-[30rem] bg-[url('./../badminton_court.jpg')] bg-cover bg-no-repeat bg-center flex shadow-lg">
              <button
                className="absolute top-1/2 transform -translate-y-1/2 left-[1rem] xl:left-[10rem] p-6 xl:p-10 rounded-xl md:rounded-3xl text-xl md:text-[3rem] text-white bg-[#7cb6cb] shadow-lg"
                onClick={() => handleButtonClick(`left`)}
                disabled={!matchStarted}
              >
                Score
              </button>
              {matchData?.secondTeamName != matchData?.receiver ? (
                <div className="w-full text-white flex flex-col justify-evenly items-center">
                  <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                    <h1 className="text-xl xl:text-3xl">
                      {matchData?.playerTwo}
                    </h1>
                    <p className="text-xl md:text-3xl xl:text-[3rem]">
                      ({matchData?.secondTeamName})
                    </p>
                  </div>
                  {matchData?.playerFour && (
                    <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                      <h1 className="text-xl xl:text-3xl">
                        {matchData?.playerFour}
                      </h1>
                      <p className="text-xl md:text-3xl xl:text-[3rem]">
                        ({matchData?.secondTeamName})
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full text-xl lg:text-xl xl:text-3xl text-white flex flex-col justify-evenly items-center">
                  <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                    <h1 className="text-xl xl:text-3xl">
                      {matchData?.playerOne}
                    </h1>
                    <p className="text-xl md:text-3xl xl:text-[3rem]">
                      ({matchData?.firstTeamName})
                    </p>
                  </div>
                  {matchData?.playerThree && (
                    <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                      <h1 className="text-xl xl:text-3xl">
                        {matchData?.playerThree}
                      </h1>
                      <p className="text-xl md:text-3xl xl:text-[3rem]">
                        ({matchData?.firstTeamName})
                      </p>
                    </div>
                  )}
                </div>
              )}
              {matchData?.firstTeamName == matchData?.receiver ? (
                <div className="w-full text-xl lg:text-xl xl:text-3xl text-white flex flex-col justify-evenly items-center">
                  <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                    <h1 className="text-xl xl:text-3xl">
                      {matchData?.playerOne}
                    </h1>
                    <p className="text-xl md:text-3xl xl:text-[3rem]">
                      ({matchData?.firstTeamName})
                    </p>
                  </div>
                  {matchData?.playerThree && (
                    <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                      <h1 className="text-xl xl:text-3xl">
                        {matchData?.playerThree}
                      </h1>
                      <p className="text-xl md:text-3xl xl:text-[3rem]">
                        ({matchData?.firstTeamName})
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full text-white flex flex-col justify-evenly items-center">
                  <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                    <h1 className="text-xl xl:text-3xl">
                      {matchData?.playerTwo}
                    </h1>
                    <p className="text-xl md:text-3xl xl:text-[3rem]">
                      ({matchData?.secondTeamName})
                    </p>
                  </div>
                  {matchData?.playerFour && (
                    <div className="text-center flex flex-col gap-0 xl:gap-4 max-w-48">
                      <h1 className="text-xl xl:text-3xl">
                        {matchData?.playerFour}
                      </h1>
                      <p className="text-xl md:text-3xl xl:text-[3rem]">
                        ({matchData?.secondTeamName})
                      </p>
                    </div>
                  )}
                </div>
              )}
              <button
                className="absolute top-1/2 transform -translate-y-1/2 right-[1rem] xl:right-[10rem] p-6 xl:p-10 rounded-xl md:rounded-3xl text-xl  md:text-[3rem] text-white bg-[#7cb6cb] shadow-lg"
                onClick={() => handleButtonClick("right")}
                disabled={!matchStarted}
              >
                Score
              </button>
            </div>
          </div>
        </div>
        {/* score table */}
        <div className="w-full md:w-[80%] m-auto">
          <ScoreSheet
            selectedPlayer={selectedPlayer}
            misconduct={misconduct}
            misconducts={misconducts}
          />
        </div>
        <footer className="text-center">
          <div className="opacity-50 text-5xl md:text-7xl xl:text-9xl">
            <Watermark />
          </div>
          <div className="text-white font-inter text-sm md:text-base lg:text-lg tracking-widest">
            Maintained and developed by <span className="font-bold">ESH<span className="font-bold text-[#d86dfc]">WAY</span></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ScorePage;
