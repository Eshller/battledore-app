import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import io from "socket.io-client";

const socket = io(`${import.meta.env.VITE_SERVER}`);

const ScoreSheet = ({ selectedPlayer, misconduct }) => {
  const { getMatchData, matchData } = useService();
  const gameId = useParams();

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    getMatchData(gameId.id);
  }, [gameId.id]);

  useEffect(() => {
    if (matchData?.scores) {
      const firstTeamName = matchData.firstTeamName;
      const secondTeamName = matchData.secondTeamName;
      const combined = matchData?.scores.map((newData) => ({
        ...newData,
        firstTeamName,
        secondTeamName,
      }));
      setTableData(combined);
    }
  }, [matchData]);

  useEffect(() => {
    socket.on("score_updated", (data) => {
      if (data.status === "start") {
        setTableData((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off("score_updated");
    };
  }, []);

  const leftSideTeam =
    matchData.firstTeamName === matchData.receiver
      ? matchData.secondTeamName
      : matchData.firstTeamName;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-4 overflow-x-auto w-full">
        <table className="table-auto border-collapse w-full">
          <tbody>
            <tr>
              <td className="flex items-center border border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white">
                {leftSideTeam == matchData.firstTeamName
                  ? matchData.playerOne
                  : matchData.playerTwo}
                {selectedPlayer === matchData.playerOne ? <div
                  id={misconduct}
                  className="text-center font-inter px-4 cursor-pointer"
                >
                  <h1 className={`font-bold text-xl text-yellow-700 bg-yellow-400 rounded-md w-6 m-auto ${misconduct === "W" ? "text-yellow-700" : misconduct === "F" ? "text-red-700" : misconduct === "R" ? "text-blue-700" : misconduct === "S" ? "text-green-700" : misconduct === "O" ? "text-purple-700" : misconduct === "I" ? "text-orange-700" : misconduct === "DIS" ? "text-red-700" : misconduct === "DIS" ? "text-red-700" : misconduct === "RET" ? "text-blue-700" : misconduct === "C" ? "text-green-700" : null}`}>
                    {misconduct}
                  </h1>
                  <p className="font-semibold text-xs">{misconduct === "W" ? "Warning" : misconduct === "F" ? "Fault" : misconduct === "R" ? "Referee Called" : misconduct === "S" ? "Suspension" : misconduct === "O" ? "Overrule" : misconduct === "I" ? "Injury" : misconduct === "DIS" ? "Disqualified" : misconduct === "DIS" ? "Disqualified" : misconduct === "RET" ? "Retired" : misconduct === "C" ? "Service Court Error" : null}</p>
                </div> : null}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-[#5ea0b8] text-center px-2"
                >
                  {leftSideTeam == matchData.firstTeamName
                    ? row.secondTeamScore
                    : row.firstTeamScore}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white text-white">
                {leftSideTeam == matchData.firstTeamName
                  ? matchData.playerOne
                  : matchData.playerTwo}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-[#5ea0b8] text-center px-2"
                >
                </td>
              ))}
            </tr>
            {matchData.playerThree != "" ? (
              <tr>
                <td className="flex items-center border border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white">
                  {leftSideTeam == matchData.firstTeamName
                    ? matchData.playerThree
                    : matchData.playerFour}
                </td>
                {tableData.map((row, index) => (
                  <td
                    key={index}
                    className="border border-[#5ea0b8] text-center"
                  >
                    {leftSideTeam == matchData.firstTeamName
                      ? row.secondTeamScore
                      : row.firstTeamScore}
                  </td>
                ))}
              </tr>
            ) : null}

            <tr>
              <td className="flex items-center border border-t-4 border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white">
                {leftSideTeam == matchData.firstTeamName
                  ? matchData.playerTwo
                  : matchData.playerOne}
                {selectedPlayer === matchData.playerTwo ? <div
                  id={misconduct}
                  className="text-center font-inter px-4"
                >
                  <h1 className="font-bold text-xl text-yellow-700 bg-yellow-400 rounded-md w-6 m-auto">
                    {misconduct}
                  </h1>
                  <p className="font-semibold text-xs">{misconduct === "W" ? "Warning" : misconduct === "F" ? "Fault" : misconduct === "R" ? "Referee Called" : misconduct === "S" ? "Suspension" : misconduct === "O" ? "Overrule" : misconduct === "I" ? "Injury" : misconduct === "DIS" ? "Disqualified" : misconduct === "DIS" ? "Disqualified" : misconduct === "RET" ? "Retired" : misconduct === "C" ? "Service Court Error" : null}</p>
                </div>
                  : null}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-t-4 border-[#5ea0b8] text-center"
                >
                  {leftSideTeam == matchData.firstTeamName
                    ? row.firstTeamScore
                    : row.secondTeamScore}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white text-white">
                {leftSideTeam == matchData.firstTeamName
                  ? matchData.playerOne
                  : matchData.playerTwo}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-[#5ea0b8] text-center px-2"
                >

                </td>
              ))}
            </tr>

            {matchData.playerFour != "" ? (
              <tr>
                <td className="border border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white">
                  {leftSideTeam == matchData.firstTeamName
                    ? matchData.playerFour
                    : matchData.playerThree}
                </td>
                {tableData.map((row, index) => (
                  <td
                    key={index}
                    className="border border-[#5ea0b8] text-center"
                  >
                    {leftSideTeam == matchData.firstTeamName
                      ? row.firstTeamScore
                      : row.secondTeamScore}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreSheet;
