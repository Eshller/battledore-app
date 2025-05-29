import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import io from "socket.io-client";

// Don't create socket instance at module level
// const socket = io(`${import.meta.env.VITE_SERVER}`);

const ScoreSheet = ({ selectedPlayer, misconduct, misconducts = [], onMisconductUpdate, scores = [] }) => {
  const { getMatchData, matchData } = useService();
  const gameId = useParams();
  const [isScorePage, setIsScorePage] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [isDoublesMatch, setIsDoublesMatch] = useState(false);
  const prevMisconductsRef = useRef(misconducts);
  // Create socket reference
  const socketRef = useRef(null);

  // Determine if we're on the score page or match details page
  useEffect(() => {
    // Check if the current URL contains 'scorepage'
    const currentPath = window.location.pathname;
    setIsScorePage(currentPath.includes('scorepage'));
  }, []);

  // Handle real-time score updates
  useEffect(() => {
    if (!matchData) return;
    
    // Create socket instance on component mount
    if (!socketRef.current) {
      socketRef.current = io(`${import.meta.env.VITE_SERVER}`);
    }
    
    const socket = socketRef.current;

    const handleScoreUpdate = (data) => {
      // Check for both matchId and gameId in the data
      const matchIdToCheck = data.matchId || data.gameId;
      
      if (matchData && gameId.id === matchIdToCheck) {
        // Skip updates where both scores are 0
        if (data.firstTeamScore === "0" && data.secondTeamScore === "0") {
          return;
        }
        
        setTableData((prev) => {
          // If tableData is empty, create a new entry with the incoming data
          if (!prev || prev.length === 0) {
            return [{
              ...data,
              scoringTeam: data.scoringTeam || 'first',
              status: 'point',
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
            status: 'point',
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
      if (socketRef.current) {
        socketRef.current.off("score_updated");
        socketRef.current.off("score");
      }
    };
  }, [matchData, gameId.id]);

  // Add an effect to clean up the socket connection when the component unmounts
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Initialize table data with match data and initial misconducts
  useEffect(() => {
    const initializeTable = async () => {
      if (!matchData) return;

      // Check if this is a doubles match
      const isDoubles = matchData.typeOfMatch?.toLowerCase().includes('doubles') || 
                       (matchData.playerThree && matchData.playerThree !== '' && 
                        matchData.playerFour && matchData.playerFour !== '');
      setIsDoublesMatch(isDoubles);

      const firstTeamName = matchData.firstTeamName;
      const secondTeamName = matchData.secondTeamName;
      
      // Use scores prop if provided and not on score page, otherwise use matchData.scores
      // This ensures that on the score page, we always use matchData.scores for real-time updates
      // The problem was with scores.length > 0 check which fails when scores is empty array
      const scoreData = isScorePage ? (matchData.scores || []) : (scores || matchData.scores || []);
      
      // Don't use scores with zero values (0-0)
      const filteredScoreData = scoreData.filter(score => 
        score.firstTeamScore !== "0" || score.secondTeamScore !== "0"
      );
      
      // Create score entries with proper timestamps
      const scoreEntries = filteredScoreData.map((score, index) => {
        const previousScore = index > 0 ? filteredScoreData[index - 1] : { firstTeamScore: "0", secondTeamScore: "0" };
        const scoringTeam =
          parseInt(score.firstTeamScore) > parseInt(previousScore.firstTeamScore)
            ? 'first'
            : parseInt(score.secondTeamScore) > parseInt(previousScore.secondTeamScore)
              ? 'second'
              : 'none';

        // For doubles matches, try to determine which player scored if not provided
        let scoringPlayer = score.scoringPlayer;
        
        // If we're in a doubles match but don't have a scoring player, assign one based on team
        const isDoubles = matchData.typeOfMatch?.toLowerCase().includes('doubles') || 
                         (matchData.playerThree && matchData.playerThree !== '' && 
                          matchData.playerFour && matchData.playerFour !== '');
        
        if (isDoubles && !scoringPlayer && scoringTeam !== 'none') {
          // Randomly assign to one of the team members for display purposes
          if (scoringTeam === 'first') {
            scoringPlayer = Math.random() < 0.5 ? matchData.playerOne : matchData.playerThree;
          } else {
            scoringPlayer = Math.random() < 0.5 ? matchData.playerTwo : matchData.playerFour;
          }
        }

        return {
          firstTeamScore: score.firstTeamScore,
          secondTeamScore: score.secondTeamScore,
          firstTeamName,
          secondTeamName,
          scoringTeam,
          status: 'point',
          timestamp: score.createdAt || score.timestamp || new Date().toISOString(),
          numberOfShuttlecock: score.numberOfShuttlecock,
          isMisconduct: false,
          scoringPlayer: scoringPlayer,
          individualScore: score.individualScore || isDoubles
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

      // Set the table data with filtered entries - skip the initialState if we have actual scores
      if (allEntries.length > 0) {
        // Filter out the initial entry with status 'initial'
        const filteredEntries = allEntries.filter(entry => entry.status !== 'initial');
        setTableData(filteredEntries);
      } else {
        // If no scores, show empty state instead of initial entry
        setTableData([]);
      }
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
      ? (matchData.secondTeamName || matchData.playerTwo)
      : (matchData.firstTeamName || matchData.playerOne)
  ) : '';

  // Check if we have valid matchData
  if (!matchData) {
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
      <div className="bg-white rounded-lg shadow-lg p-4 w-full relative">
        <div className="flex">
          {/* Fixed Players Column */}
          <div className="w-[250px] shadow-xl z-30 relative bg-white">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-[#5ea0b8] text-white font-bold border-r-4 border-[#5ea0b8] w-[250px]">
                    Players
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 bg-white border-r-4 border-[#5ea0b8] font-medium h-[52px]">
                    {leftSideTeam == matchData.firstTeamName
                      ? matchData.playerOne
                      : matchData.playerTwo}
                  </td>
                </tr>
                
                {matchData.playerThree != "" ? (
                  <tr>
                    <td className="px-4 py-2 bg-white border-r-4 border-[#5ea0b8] font-medium h-[52px]">
                      {leftSideTeam == matchData.firstTeamName
                        ? matchData.playerThree
                        : matchData.playerFour}
                    </td>
                  </tr>
                ) : null}
                
                <tr className="border-t-4 border-[#5ea0b8]">
                  <td className="px-4 py-2 bg-white border-r-4 border-[#5ea0b8] font-medium h-[52px]">
                    {leftSideTeam == matchData.firstTeamName
                      ? matchData.playerTwo
                      : matchData.playerOne}
                  </td>
                </tr>
                
                {matchData.playerFour != "" ? (
                  <tr>
                    <td className="px-4 py-2 bg-white border-r-4 border-[#5ea0b8] font-medium h-[52px]">
                      {leftSideTeam == matchData.firstTeamName
                        ? matchData.playerFour
                        : matchData.playerThree}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          
          {/* Scrollable Scores Area */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-[#5ea0b8] text-white font-bold border border-[#5ea0b8] text-center" colSpan={tableData.length}>
                    Scores
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {tableData.map((row, index) => (
                    <td
                      key={index}
                      className="border border-[#5ea0b8] text-center px-4 py-2 min-w-[40px] h-[52px]"
                    >
                      <div className="flex flex-col items-center">
                        {/* Show score */}
                        <div className="font-semibold">
                          {
                           // For doubles matches, show individual player scores
                           isDoublesMatch ?
                             // For doubles, we show the team score if this player is on the scoring team
                             (row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'first' : 'second') ?
                               // Show the team score at this point if this player scored
                               (row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData?.playerOne : matchData?.playerTwo) ?
                                 (leftSideTeam === matchData.firstTeamName ? row.firstTeamScore : row.secondTeamScore) : "") :
                               "")
                           :
                             // For singles matches, show the team score progression
                             (leftSideTeam === matchData.firstTeamName ? 
                               (index === 0 ? 
                                 (parseInt(row.firstTeamScore) > 0 ? row.firstTeamScore : '') : 
                                 (parseInt(row.firstTeamScore) !== parseInt(tableData[index-1].firstTeamScore) ? row.firstTeamScore : ''))
                               : 
                               (index === 0 ? 
                                 (parseInt(row.secondTeamScore) > 0 ? row.secondTeamScore : '') : 
                                 (parseInt(row.secondTeamScore) !== parseInt(tableData[index-1].secondTeamScore) ? row.secondTeamScore : '')))
                          }
                        </div>
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

                {matchData.playerThree != "" ? (
                  <tr>
                    {tableData.map((row, index) => (
                      <td
                        key={index}
                        className="border border-[#5ea0b8] text-center px-4 py-2 h-[52px]"
                      >
                        <div className="flex flex-col items-center">
                          {/* Show score */}
                          <div className="font-semibold">
                            {
                             // For doubles matches, show individual player scores
                             isDoublesMatch ?
                               // For doubles, we show the team score if this player is on the scoring team
                               (row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'first' : 'second') ?
                                 // Show the team score at this point if this player scored
                                 (row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData?.playerThree : matchData?.playerFour) ?
                                   (leftSideTeam === matchData.firstTeamName ? row.firstTeamScore : row.secondTeamScore) : "") :
                                 "")
                             :
                               // For singles matches, show the team score progression
                               (leftSideTeam === matchData.firstTeamName ? 
                                 (index === 0 ? 
                                   (parseInt(row.firstTeamScore) > 0 ? row.firstTeamScore : '') : 
                                   (parseInt(row.firstTeamScore) !== parseInt(tableData[index-1].firstTeamScore) ? row.firstTeamScore : ''))
                                 : 
                                 (index === 0 ? 
                                   (parseInt(row.secondTeamScore) > 0 ? row.secondTeamScore : '') : 
                                   (parseInt(row.secondTeamScore) !== parseInt(tableData[index-1].secondTeamScore) ? row.secondTeamScore : '')))
                            }
                          </div>
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

                <tr className="border-t-4 border-[#5ea0b8]">
                  {tableData.map((row, index) => (
                    <td
                      key={index}
                      className="border border-[#5ea0b8] border-t-0 text-center px-4 py-2 min-w-[40px] h-[52px]"
                    >
                      <div className="flex flex-col items-center">
                        {/* Show score */}
                        <div className="font-semibold">
                          {
                           // For doubles matches, show individual player scores
                           isDoublesMatch ?
                             // For doubles, we show the team score if this player is on the scoring team
                             (row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'second' : 'first') ?
                               // Show the team score at this point if this player scored
                               (row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData?.playerTwo : matchData?.playerOne) ?
                                 (leftSideTeam === matchData.firstTeamName ? row.secondTeamScore : row.firstTeamScore) : "") :
                               "")
                           :
                             // For singles matches, show the team score progression
                             (leftSideTeam === matchData.firstTeamName ? 
                               (index === 0 ? 
                                 (parseInt(row.secondTeamScore) > 0 ? row.secondTeamScore : '') : 
                                 (parseInt(row.secondTeamScore) !== parseInt(tableData[index-1].secondTeamScore) ? row.secondTeamScore : ''))
                               : 
                               (index === 0 ? 
                                 (parseInt(row.firstTeamScore) > 0 ? row.firstTeamScore : '') : 
                                 (parseInt(row.firstTeamScore) !== parseInt(tableData[index-1].firstTeamScore) ? row.firstTeamScore : '')))
                          }
                        </div>
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
                      </div>
                    </td>
                  ))}
                </tr>

                {matchData.playerFour != "" ? (
                  <tr>
                    {tableData.map((row, index) => (
                      <td
                        key={index}
                        className="border border-[#5ea0b8] text-center px-4 py-2 h-[52px]"
                      >
                        <div className="flex flex-col items-center">
                          {/* Show score */}
                          <div className="font-semibold">
                            {
                             // For doubles matches, show individual player scores
                             isDoublesMatch ?
                               // For doubles, we show the team score if this player is on the scoring team
                               (row.scoringTeam === (leftSideTeam === matchData.firstTeamName ? 'second' : 'first') ?
                                 // Show the team score at this point if this player scored
                                 (row.scoringPlayer === (leftSideTeam === matchData.firstTeamName ? matchData?.playerFour : matchData?.playerThree) ?
                                   (leftSideTeam === matchData.firstTeamName ? row.secondTeamScore : row.firstTeamScore) : "") :
                                 "")
                             :
                               // For singles matches, show the team score progression
                               (leftSideTeam === matchData.firstTeamName ? 
                                 (index === 0 ? 
                                   (parseInt(row.secondTeamScore) > 0 ? row.secondTeamScore : '') : 
                                   (parseInt(row.secondTeamScore) !== parseInt(tableData[index-1].secondTeamScore) ? row.secondTeamScore : ''))
                                 : 
                                 (index === 0 ? 
                                   (parseInt(row.firstTeamScore) > 0 ? row.firstTeamScore : '') : 
                                   (parseInt(row.firstTeamScore) !== parseInt(tableData[index-1].firstTeamScore) ? row.firstTeamScore : '')))
                            }
                          </div>
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
      </div>
    </div>
  );
};

export default ScoreSheet;