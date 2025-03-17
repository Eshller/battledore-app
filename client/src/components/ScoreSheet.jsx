import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import io from "socket.io-client";

const socket = io(`${import.meta.env.VITE_SERVER}`);

const ScoreSheet = ({ selectedPlayer, misconduct, misconducts = [], onMisconductUpdate, scores = [] }) => {
  console.log("misconducts", misconducts)
  console.log("scores prop", scores)
  const { getMatchData, matchData } = useService();
  const gameId = useParams();
  const [isScorePage, setIsScorePage] = useState(false);

  const [tableData, setTableData] = useState([]);
  const prevMisconductsRef = useRef(misconducts);

  // Determine if we're on the score page or match details page
  useEffect(() => {
    // Check if the current URL contains 'scorepage'
    const currentPath = window.location.pathname;
    setIsScorePage(currentPath.includes('scorepage'));
  }, []);

  // Handle real-time score updates
  useEffect(() => {
    if (!matchData) return;

    const handleScoreUpdate = (data) => {
      console.log("Score update received:", data);
      console.log("Current gameId:", gameId.id);
      
      if (data.status === "start" && data.gameId === gameId.id) {
        console.log("Updating table data with new score");
        setTableData(prev => {
          // If tableData is empty, initialize it with a default entry
          if (!prev || prev.length === 0) {
            const initialState = {
              firstTeamScore: "0",
              secondTeamScore: "0",
              firstTeamName: matchData.firstTeamName,
              secondTeamName: matchData.secondTeamName,
              scoringTeam: 'start',
              status: 'initial',
              timestamp: new Date().toISOString(),
              isMisconduct: false
            };
            return [initialState, {
              ...data,
              scoringTeam: data.scoringTeam || 'first',
              timestamp: data.timestamp || new Date().toISOString(),
              isMisconduct: false,
              firstTeamName: matchData.firstTeamName,
              secondTeamName: matchData.secondTeamName,
              scoringPlayer: data.scoringPlayer,
              individualScore: data.individualScore || false
            }];
          }
          
          const lastEntry = prev[prev.length - 1];
          const scoringTeam =
            parseInt(data.firstTeamScore) > parseInt(lastEntry.firstTeamScore)
              ? 'first'
              : parseInt(data.secondTeamScore) > parseInt(lastEntry.secondTeamScore)
                ? 'second'
                : 'none';

          const newEntry = {
            ...data,
            scoringTeam: data.scoringTeam || scoringTeam,
            timestamp: data.timestamp || new Date().toISOString(),
            isMisconduct: false,
            firstTeamName: matchData.firstTeamName,
            secondTeamName: matchData.secondTeamName,
            scoringPlayer: data.scoringPlayer,
            individualScore: data.individualScore || false
          };

          const existingMisconducts = prev.filter(entry =>
            entry.isMisconduct &&
            new Date(entry.timestamp).getTime() === new Date(newEntry.timestamp).getTime()
          );

          const filteredPrev = prev.filter(entry =>
            !existingMisconducts.some(m => m.timestamp === entry.timestamp)
          );

          const updatedMisconducts = existingMisconducts.map(m => ({
            ...m,
            firstTeamScore: newEntry.firstTeamScore,
            secondTeamScore: newEntry.secondTeamScore
          }));

          return [...filteredPrev, newEntry, ...updatedMisconducts].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
      }
    };

    // Listen for both score and update_score events
    socket.on("score_updated", handleScoreUpdate);
    socket.on("score", handleScoreUpdate);
    
    return () => {
      socket.off("score_updated");
      socket.off("score");
    };
  }, [matchData, gameId.id]);

  // Initialize table data with match data and initial misconducts
  useEffect(() => {
    const initializeTable = async () => {
      if (!matchData) return;

      const firstTeamName = matchData.firstTeamName;
      const secondTeamName = matchData.secondTeamName;
      const initialState = {
        firstTeamScore: "0",
        secondTeamScore: "0",
        firstTeamName,
        secondTeamName,
        scoringTeam: 'start',
        status: 'initial',
        timestamp: new Date(0).toISOString(), // Use earliest possible timestamp for initial state
        isMisconduct: false
      };

      // Use scores prop if provided and not on score page, otherwise use matchData.scores
      // This ensures that on the score page, we always use matchData.scores for real-time updates
      const scoreData = (!isScorePage && scores.length > 0) ? scores : (matchData.scores || []);
      
      // Create score entries with proper timestamps
      const scoreEntries = scoreData.map((score, index) => {
        const previousScore = index > 0 ? scoreData[index - 1] : { firstTeamScore: "0", secondTeamScore: "0" };
        const scoringTeam =
          parseInt(score.firstTeamScore) > parseInt(previousScore.firstTeamScore)
            ? 'first'
            : parseInt(score.secondTeamScore) > parseInt(previousScore.secondTeamScore)
              ? 'second'
              : 'none';

        return {
          firstTeamScore: score.firstTeamScore,
          secondTeamScore: score.secondTeamScore,
          firstTeamName,
          secondTeamName,
          scoringTeam,
          status: 'start',
          timestamp: score.createdAt || score.timestamp || new Date().toISOString(),
          numberOfShuttlecock: score.numberOfShuttlecock,
          isMisconduct: false,
          scoringPlayer: score.scoringPlayer,
          individualScore: score.individualScore || false
        };
      });

      // Create misconduct entries with proper score context
      const misconductEntries = misconducts.map(m => {
        // Find the most recent score entry before this misconduct
        const matchingScore = [...scoreEntries].filter(score =>
          new Date(score.timestamp) <= new Date(m.timestamp)
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || 
        { 
          firstTeamScore: "0", 
          secondTeamScore: "0",
          firstTeamName,
          secondTeamName
        };

        return {
          ...matchingScore,
          scoringTeam: 'none',
          status: 'misconduct',
          timestamp: m.timestamp,
          isMisconduct: true,
          misconductType: m.type,
          misconductPlayer: m.player
        };
      });

      // Combine all entries and sort by timestamp
      const allEntries = [...scoreEntries, ...misconductEntries]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Set the table data with initial state and all entries
      setTableData([initialState, ...allEntries]);
    };

    initializeTable();
  }, [matchData, misconducts, scores, isScorePage]);

  // Handle new misconducts added via props
  useEffect(() => {
    if (!misconducts || !tableData.length) return;

    const prevMisconducts = prevMisconductsRef.current || [];
    if (misconducts.length > prevMisconducts.length) {
      const newMisconducts = misconducts.slice(prevMisconducts.length);
      
      // Create a copy of the current table data to avoid losing previous records
      let updatedTableData = [...tableData];
      
      newMisconducts.forEach(m => {
        // Find the most recent score entry before this misconduct
        const matchingScore = [...updatedTableData].filter(entry => 
          !entry.isMisconduct && new Date(entry.timestamp) <= new Date(m.timestamp)
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || 
        { 
          firstTeamScore: "0", 
          secondTeamScore: "0",
          firstTeamName: matchData?.firstTeamName,
          secondTeamName: matchData?.secondTeamName
        };

        const newEntry = {
          ...matchingScore,
          scoringTeam: 'none',
          status: 'misconduct',
          timestamp: m.timestamp,
          isMisconduct: true,
          misconductType: m.type,
          misconductPlayer: m.player
        };
        
        // Add the new entry to our updated data
        updatedTableData.push(newEntry);
      });
      
      // Sort the updated data by timestamp
      updatedTableData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Update the table data with all entries preserved
      setTableData(updatedTableData);
    }
    
    // Update the ref to the current misconducts
    prevMisconductsRef.current = misconducts;
  }, [misconducts, matchData]);


  const renderMisconducts = React.useCallback((playerName) => {
    if (!misconducts || !Array.isArray(misconducts) || !playerName) return null;

    const uniqueMisconducts = misconducts.reduce((acc, curr) => {
      const key = `${curr.player}-${curr.type}-${curr.timestamp}`;
      if (!acc[key]) {
        acc[key] = curr;
      }
      return acc;
    }, {});

    return Object.values(uniqueMisconducts)
      .filter(m => m.player === playerName)
      .map((m, index) => (
        <div
          key={`${m.player}-${m.type}-${index}-${m.timestamp}`}
          className="text-center font-inter px-2 inline-block"
        >
          <h1 className={`font-bold text-xl rounded-md w-6 p-0 m-auto my-0 ${
            m.type === "W" ? "bg-yellow-400 text-yellow-700" :
            m.type === "F" ? "bg-red-500 text-red-700" :
            m.type === "R" ? "bg-blue-200 text-blue-700" :
            m.type === "S" ? "bg-green-200 text-green-700" :
            m.type === "O" ? "bg-purple-200 text-purple-700" :
            m.type === "I" ? "bg-orange-200 text-orange-700" :
            m.type === "DIS" ? "bg-slate-700 text-slate-400" :
            m.type === "RET" ? "bg-blue-200 text-blue-700" :
            m.type === "C" ? "bg-green-200 text-green-700" : ""
          }`}>
            {m.type}
          </h1>
          <p className="font-semibold text-xs">
            {m.type === "W" ? "Warning" :
              m.type === "F" ? "Fault" :
                m.type === "R" ? "Referee Called" :
                  m.type === "S" ? "Suspension" :
                    m.type === "O" ? "Overrule" :
                      m.type === "I" ? "Injury" :
                        m.type === "DIS" ? "Disqualified" :
                          m.type === "RET" ? "Retired" :
                            m.type === "C" ? "Service Court Error" : null}
          </p>
        </div>
      ));
  }, [misconducts]);

  const leftSideTeam = matchData ? (
    matchData.firstTeamName === matchData.receiver
      ? matchData.secondTeamName
      : matchData.firstTeamName
  ) : '';

  // Check if we have valid matchData
  if (!matchData || !matchData.firstTeamName) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 text-center">
        <p className="text-gray-500">Loading score sheet data...</p>
      </div>
    );
  }

  // Check if we have any scores to display
  if (tableData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 text-center">
        <p className="text-gray-500">No score data available for this match.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-4 overflow-x-auto w-full">
        <table className="table-auto border-collapse w-full">
          <tbody>
            <tr>
              <td className="flex items-center border border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white min-w-[200px]">
                {leftSideTeam == matchData.firstTeamName
                  ? matchData.playerOne
                  : matchData.playerTwo}
                {/* {renderMisconducts(leftSideTeam == matchData.firstTeamName ? matchData.playerOne : matchData.playerTwo)} */}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-[#5ea0b8] text-center px-4 py-2 min-w-[40px]"
                >
                  <div className="flex flex-col items-center">
                    {/* Show score */}
                    <div>
                      {index === 0 ? 'S' :
                        index === 1 ? '0' :
                          (row.individualScore && row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData.playerOne : matchData.playerTwo)) ?
                            (leftSideTeam === matchData.firstTeamName ? row.firstTeamScore : row.secondTeamScore) : 
                          // If no individual scoring data, show team score for the first player
                          (!row.individualScore && index > 1 && row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'first' : 'second')) ?
                            (leftSideTeam === matchData.firstTeamName ? row.firstTeamScore : row.secondTeamScore) : ''}
                    </div>
                    {/* Remove scoring player indicator */}
                    {/* Show misconduct below score if it exists */}
                    {row.isMisconduct && row.misconductPlayer === (
                      leftSideTeam === matchData.firstTeamName
                        ? matchData.playerOne
                        : matchData.playerTwo
                    ) && (
                      <div className={`text-sm font-bold mt-1 px-1 rounded ${
                        row.misconductType === "W" ? "bg-yellow-400 text-yellow-700" :
                        row.misconductType === "F" ? "bg-red-500 text-white" :
                        row.misconductType === "R" ? "bg-blue-200 text-blue-700" :
                        row.misconductType === "S" ? "bg-green-200 text-green-700" :
                        row.misconductType === "O" ? "bg-purple-200 text-purple-700" :
                        row.misconductType === "I" ? "bg-orange-200 text-orange-700" :
                        row.misconductType === "DIS" ? "bg-slate-700 text-white" :
                        row.misconductType === "RET" ? "bg-blue-200 text-blue-700" :
                        row.misconductType === "C" ? "bg-green-200 text-green-700" : ""
                      }`}>
                        {row.misconductType}
                      </div>
                    )}
                  </div>
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
                  {row.isMisconduct &&
                    row.misconductPlayer === (
                      leftSideTeam === matchData.firstTeamName
                        ? matchData.playerOne
                        : matchData.playerTwo
                    ) &&
                    (row.misconductType === 'F' || row.misconductType === 'I') && (
                      <div className="text-sm font-bold">R</div>
                    )}
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
                    <div className="flex flex-col items-center">
                      {/* Show score */}
                      <div>
                        {(row.individualScore && row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData.playerThree : matchData.playerFour)) ?
                          (leftSideTeam === matchData.firstTeamName ? row.firstTeamScore : row.secondTeamScore) : 
                        // If no individual scoring data, show team score for the second player of the first team
                        (!row.individualScore && index > 1 && row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'first' : 'second')) ?
                          (leftSideTeam === matchData.firstTeamName ? row.firstTeamScore : row.secondTeamScore) : ''}
                      </div>
                      {/* Remove scoring player indicator */}
                      {/* Show misconduct below score if it exists */}
                      {row.isMisconduct && row.misconductPlayer === (
                        leftSideTeam === matchData.firstTeamName
                          ? matchData.playerThree
                          : matchData.playerFour
                      ) && (
                        <div className={`text-sm font-bold mt-1 px-1 rounded ${
                          row.misconductType === "W" ? "bg-yellow-400 text-yellow-700" :
                          row.misconductType === "F" ? "bg-red-500 text-white" :
                          row.misconductType === "R" ? "bg-blue-200 text-blue-700" :
                          row.misconductType === "S" ? "bg-green-200 text-green-700" :
                          row.misconductType === "O" ? "bg-purple-200 text-purple-700" :
                          row.misconductType === "I" ? "bg-orange-200 text-orange-700" :
                          row.misconductType === "DIS" ? "bg-slate-700 text-white" :
                          row.misconductType === "RET" ? "bg-blue-200 text-blue-700" :
                          row.misconductType === "C" ? "bg-green-200 text-green-700" : ""
                        }`}>
                          {row.misconductType}
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ) : null}

            <tr>
              <td className="border border-[#5ea0b8] border-t-4 px-4 py-2 sticky left-0 bg-white min-w-[200px] text-black border-l-0 border-r-0">
                {/* <td className="flex items-center border border-t-4 border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white min-w-[200px]"> */}

                {leftSideTeam == matchData.firstTeamName
                  ? matchData.playerTwo
                  : matchData.playerOne}
                {/* {renderMisconducts(leftSideTeam == matchData.firstTeamName ? matchData.playerTwo : matchData.playerOne)} */}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-[#5ea0b8] border-t-4 text-center px-4 py-2 min-w-[40px]"
                >
                  <div className="flex flex-col items-center">
                    {/* Show score */}
                    <div>
                      {index === 0 && matchData.server === (
                        leftSideTeam === matchData.firstTeamName
                          ? matchData.playerTwo
                          : matchData.playerOne) ? 'S' :
                        index === 1 ? '0' :
                          (row.individualScore && row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData.playerTwo : matchData.playerOne)) ?
                            (leftSideTeam === matchData.firstTeamName ? row.secondTeamScore : row.firstTeamScore) : 
                          // If no individual scoring data, show team score for the first player of the second team
                          (!row.individualScore && index > 1 && row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'second' : 'first')) ?
                            (leftSideTeam === matchData.firstTeamName ? row.secondTeamScore : row.firstTeamScore) : ''}
                    </div>
                    {/* Remove scoring player indicator */}
                    {/* Show misconduct below score if it exists */}
                    {row.isMisconduct && row.misconductPlayer === (
                      leftSideTeam === matchData.firstTeamName
                        ? matchData.playerTwo
                        : matchData.playerOne
                    ) && (
                        <div className={`text-sm font-bold mt-1 px-1 rounded ${
                          row.misconductType === "W" ? "bg-yellow-400 text-yellow-700" :
                          row.misconductType === "F" ? "bg-red-500 text-white" :
                          row.misconductType === "R" ? "bg-blue-200 text-blue-700" :
                          row.misconductType === "S" ? "bg-green-200 text-green-700" :
                          row.misconductType === "O" ? "bg-purple-200 text-purple-700" :
                          row.misconductType === "I" ? "bg-orange-200 text-orange-700" :
                          row.misconductType === "DIS" ? "bg-slate-700 text-white" :
                          row.misconductType === "RET" ? "bg-blue-200 text-blue-700" :
                          row.misconductType === "C" ? "bg-green-200 text-green-700" : ""
                        }`}>
                          {row.misconductType}
                        </div>
                      )}
                    {/* {row.isMisconduct &&
                    row.misconductPlayer === (
                      leftSideTeam === matchData.firstTeamName
                        ? matchData.playerOne
                        : matchData.playerTwo
                    ) &&
                    (row.misconductType === 'F' || row.misconductType === 'I') && (
                      <div className="text-sm font-bold">R</div>
                    )} */}
                  </div>
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
                  {row.isMisconduct &&
                    row.misconductPlayer === (
                      leftSideTeam === matchData.firstTeamName
                        ? matchData.playerOne
                        : matchData.playerTwo
                    ) &&
                    (row.misconductType === 'F' || row.misconductType === 'I') && (
                      <div className="text-sm font-bold">R</div>
                    )}
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
                    <div className="flex flex-col items-center">
                      {/* Show score */}
                      <div>
                        {(row.individualScore && row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData.playerFour : matchData.playerThree)) ?
                          (leftSideTeam === matchData.firstTeamName ? row.secondTeamScore : row.firstTeamScore) : 
                        // If no individual scoring data, show team score for the second player of the second team
                        (!row.individualScore && index > 1 && row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'second' : 'first')) ?
                          (leftSideTeam === matchData.firstTeamName ? row.secondTeamScore : row.firstTeamScore) : ''}
                      </div>
                      {/* Remove scoring player indicator */}
                      {/* Show misconduct below score if it exists */}
                      {row.isMisconduct && row.misconductPlayer === (
                        leftSideTeam === matchData.firstTeamName
                          ? matchData.playerFour
                          : matchData.playerThree
                      ) && (
                        <div className={`text-sm font-bold mt-1 px-1 rounded ${
                          row.misconductType === "W" ? "bg-yellow-400 text-yellow-700" :
                          row.misconductType === "F" ? "bg-red-500 text-white" :
                          row.misconductType === "R" ? "bg-blue-200 text-blue-700" :
                          row.misconductType === "S" ? "bg-green-200 text-green-700" :
                          row.misconductType === "O" ? "bg-purple-200 text-purple-700" :
                          row.misconductType === "I" ? "bg-orange-200 text-orange-700" :
                          row.misconductType === "DIS" ? "bg-slate-700 text-white" :
                          row.misconductType === "RET" ? "bg-blue-200 text-blue-700" :
                          row.misconductType === "C" ? "bg-green-200 text-green-700" : ""
                        }`}>
                          {row.misconductType}
                        </div>
                      )}
                    </div>
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