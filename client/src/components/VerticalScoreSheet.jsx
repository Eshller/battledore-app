import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import io from "socket.io-client";

// Don't create socket instance at module level
// const socket = io(`${import.meta.env.VITE_SERVER}`);

function VerticalScoreSheet() {
  const { getMatchData, matchData } = useService();
  const gameId = useParams();
  const [tableData, setTableData] = useState([]);
  // Create socket reference
  const socketRef = useRef(null);

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
      setTableData(combined.reverse());
    }
  }, [matchData]);

  useEffect(() => {
    // Create socket instance on component mount
    if (!socketRef.current) {
      console.log("Creating new socket connection in VerticalScoreSheet");
      socketRef.current = io(`${import.meta.env.VITE_SERVER}`);
    }
    
    const socket = socketRef.current;

    socket.on("score_updated", (data) => {
      // Check for both matchId and gameId in the data
      const matchIdToCheck = data.matchId || data.gameId;
      
      if (gameId.id === matchIdToCheck) {
        console.log("Received score update in VerticalScoreSheet:", data);
        setTableData((prev) => [data, ...prev]);
      }
    });

    return () => {
      console.log("Cleaning up score update listeners in VerticalScoreSheet");
      if (socketRef.current) {
        socketRef.current.off("score_updated");
      }
    };
  }, [gameId.id]);

  // Add an effect to clean up the socket connection when the component unmounts
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket in VerticalScoreSheet");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full mx-auto overflow-y-auto bg-white rounded-lg shadow-lg p-4 h-full">
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-[#5ea0b8] px-2 py-1 sticky top-0 bg-white">
              {matchData?.playerOne}
            </th>
            {matchData?.playerThree ? (
              <th className="border border-[#5ea0b8] px-2 py-1 sticky top-0 bg-white">
                {matchData.playerThree}
              </th>
            ) : null}
            <th className="border border-[#5ea0b8] border-l-4 px-2 py-1 sticky top-0 bg-white">
              {matchData.playerTwo}
            </th>
            {matchData?.playerFour ? (
              <th className="border border-[#5ea0b8] px-2 py-1 sticky top-0 bg-white">
                {matchData.playerFour}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td
                key={index + 1}
                className="border border-[#5ea0b8] text-center px-4 py-2"
              >
                {row.firstTeamScore}
              </td>
              {matchData.playerThree ? (
                <td
                  key={index + 2}
                  className="border border-[#5ea0b8] text-center px-4 py-2"
                >
                  {row.firstTeamScore}
                </td>
              ) : null}
              <td
                key={index + 3}
                className="border border-[#5ea0b8] border-l-4 text-center px-4 py-2"
              >
                {row.secondTeamScore}
              </td>
              {matchData.playerFour ? (
                <td
                  key={index + 4}
                  className="border border-[#5ea0b8] text-center px-4 py-2"
                >
                  {row.secondTeamScore}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VerticalScoreSheet;
