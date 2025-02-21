import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import io from "socket.io-client";

const socket = io(`${import.meta.env.VITE_SERVER}`);

const ScoreSheet = ({ selectedPlayer, misconduct, misconducts, onMisconductUpdate }) => {
  console.log("misconducts", misconducts)
  const { getMatchData, matchData } = useService();
  const gameId = useParams();

  const [tableData, setTableData] = useState([]);
  // const [misconducts, setMisconducts] = useState([]);

  const prevMisconductsRef = useRef(misconducts);

  // Handle real-time score updates
  useEffect(() => {
    const handleScoreUpdate = (data) => {
      if (data.status === "start") {
        setTableData(prev => {
          const lastEntry = prev[prev.length - 1];
          const scoringTeam =
            parseInt(data.firstTeamScore) > parseInt(lastEntry.firstTeamScore)
              ? 'first'
              : parseInt(data.secondTeamScore) > parseInt(lastEntry.secondTeamScore)
                ? 'second'
                : 'none';

          const newEntry = {
            ...data,
            scoringTeam,
            timestamp: new Date().toISOString(),
            isMisconduct: false,
            firstTeamName: matchData.firstTeamName,
            secondTeamName: matchData.secondTeamName
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

    socket.on("score_updated", handleScoreUpdate);
    return () => socket.off("score_updated");
  }, [matchData]);

  // Initialize table data with match data and initial misconducts
  useEffect(() => {
    const initializeTable = async () => {
      if (matchData) {
        const firstTeamName = matchData.firstTeamName;
        const secondTeamName = matchData.secondTeamName;
        const initialState = {
          firstTeamScore: "0",
          secondTeamScore: "0",
          firstTeamName,
          secondTeamName,
          scoringTeam: 'start',
          status: 'initial',
          timestamp: new Date().toISOString(),
          isMisconduct: false
        };

        const scoreEntries = (matchData.scores || []).map((score, index) => {
          const previousScore = index > 0 ? matchData.scores[index - 1] : { firstTeamScore: "0", secondTeamScore: "0" };
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
            timestamp: score.createdAt || new Date().toISOString(),
            numberOfShuttlecock: score.numberOfShuttlecock,
            isMisconduct: false
          };
        });

        const misconductEntries = misconducts.map(m => {
          const matchingScore = [...scoreEntries].reverse().find(score =>
            new Date(score.timestamp) <= new Date(m.timestamp)
          ) || { firstTeamScore: "0", secondTeamScore: "0" };

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

        const allEntries = [...scoreEntries, ...misconductEntries]
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setTableData([initialState, ...allEntries]);
      }
    };

    initializeTable();
  }, [matchData]); // Only depend on matchData

  // Handle new misconducts added via props
  useEffect(() => {
    const prevMisconducts = prevMisconductsRef.current;
    if (misconducts.length > prevMisconducts.length) {
      const newMisconducts = misconducts.slice(prevMisconducts.length);
      newMisconducts.forEach(m => {
        const matchingScore = [...tableData].reverse().find(entry =>
          !entry.isMisconduct && new Date(entry.timestamp) <= new Date(m.timestamp)
        ) || { firstTeamScore: "0", secondTeamScore: "0" };

        const newEntry = {
          ...matchingScore,
          scoringTeam: 'none',
          status: 'misconduct',
          timestamp: m.timestamp,
          isMisconduct: true,
          misconductType: m.type,
          misconductPlayer: m.player
        };

        setTableData(prev => [...prev, newEntry].sort((a, b) =>
          new Date(a.timestamp) - new Date(b.timestamp))
        );
      });
    }
    prevMisconductsRef.current = misconducts;
  }, [misconducts, tableData]);


  const renderMisconducts = React.useCallback((playerName) => {
    if (!misconducts || !playerName) return null;

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
          <h1 className={`font-bold text-xl bg-yellow-400 rounded-md w-6 p-0 m-auto my-0 ${m.type === "W" ? "text-yellow-700" :
            m.type === "F" ? "text-red-700" :
              m.type === "R" ? "text-blue-700" :
                m.type === "S" ? "text-green-700" :
                  m.type === "O" ? "text-purple-700" :
                    m.type === "I" ? "text-orange-700" :
                      m.type === "DIS" ? "text-red-700" :
                        m.type === "RET" ? "text-blue-700" :
                          m.type === "C" ? "text-green-700" : null
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
                {/* {renderMisconducts(leftSideTeam == matchData.firstTeamName ? matchData.playerOne : matchData.playerTwo)} */}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-[#5ea0b8] text-center px-2"
                >
                  <div className="flex flex-col items-center">
                    {/* Always show score if it exists */}
                    <div>
                      {index === 0 ? 'S' :
                        index === 1 ? '0' :
                          leftSideTeam === matchData.firstTeamName
                            ? (row.scoringTeam === 'second' ? row.secondTeamScore : '')
                            : (row.scoringTeam === 'first' ? row.firstTeamScore : '')}
                    </div>
                    {/* Show misconduct below score if it exists */}
                    {row.isMisconduct && row.misconductPlayer === (
                      leftSideTeam === matchData.firstTeamName
                        ? matchData.playerOne
                        : matchData.playerTwo
                    ) && (
                        <div className="text-sm font-bold mt-1">
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
                    {leftSideTeam === matchData.firstTeamName
                      ? (row.scoringTeam === 'second' ? row.secondTeamScore : '')
                      : (row.scoringTeam === 'first' ? row.firstTeamScore : '')}
                  </td>
                ))}
              </tr>
            ) : null}

            <tr>
              <td className="flex items-center border border-t-4 border-[#5ea0b8] border-l-0 border-r-0 px-4 py-2 sticky left-0 bg-white">
                {leftSideTeam == matchData.firstTeamName
                  ? matchData.playerTwo
                  : matchData.playerOne}
                {/* {renderMisconducts(leftSideTeam == matchData.firstTeamName ? matchData.playerTwo : matchData.playerOne)} */}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-t-4 border-[#5ea0b8] text-center"
                >
                  <div className="flex flex-col items-center">
                    {/* Always show score if it exists */}
                    <div>
                      {index === 0 && matchData.server === (
                        leftSideTeam === matchData.firstTeamName
                          ? matchData.playerTwo
                          : matchData.playerOne) ? 'S' :
                        index === 1 ? '0' :
                          leftSideTeam === matchData.firstTeamName
                            ? (row.scoringTeam === 'first' ? row.firstTeamScore : '')
                            : (row.scoringTeam === 'second' ? row.secondTeamScore : '')}
                    </div>
                    {/* Show misconduct below score if it exists */}
                    {row.isMisconduct && row.misconductPlayer === (
                      leftSideTeam === matchData.firstTeamName
                        ? matchData.playerTwo
                        : matchData.playerOne
                    ) && (
                        <div className="text-sm font-bold mt-1">
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
                    {leftSideTeam === matchData.firstTeamName
                      ? (row.scoringTeam === 'second' ? row.secondTeamScore : '')
                      : (row.scoringTeam === 'first' ? row.firstTeamScore : '')}
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