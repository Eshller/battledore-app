import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const initializeTable = () => {
      if (matchData) {
        const firstTeamName = matchData.firstTeamName;
        const secondTeamName = matchData.secondTeamName;

        // Always start with a fresh initial state
        const initialState = {
          firstTeamScore: "0",
          secondTeamScore: "0",
          firstTeamName,
          secondTeamName,
          scoringTeam: 'start',
          status: 'initial',
          timestamp: new Date().toISOString()
        };

        // Only add scores if they exist and belong to current match
        if (matchData.scores && matchData.scores.length > 0) {
          const sortedScores = [...matchData.scores].sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return new Date(a.timestamp) - new Date(b.timestamp);
            }
            return 0;
          });

          setTableData([initialState, ...sortedScores.map((newData) => ({
            ...newData,
            firstTeamName,
            secondTeamName,
            timestamp: newData.timestamp || newData.createdAt // fallback to createdAt if timestamp not present
          }))]);
        } else {
          // For new matches, only show initial state
          setTableData([initialState]);
        }
      }
    };

    initializeTable();
  }, [matchData, gameId.id]);

  useEffect(() => {
    const loadMatchData = async () => {
      await getMatchData(gameId.id);
    };

    loadMatchData();
  }, [gameId.id]);

  useEffect(() => {
    socket.on("score_updated", (data) => {
      if (data.status === "start") {
        const updatedData = {
          ...data,
          scoringTeam: data.firstTeamScore > (tableData[tableData.length - 1]?.firstTeamScore || "0")
            ? 'first'
            : 'second',
          timestamp: new Date().toISOString()
        };
        setTableData(prev => [...prev, updatedData]);
      }
    });

    return () => {
      socket.off("score_updated");
    };
  }, [gameId.id, tableData]);

  const leftSideTeam =
    matchData.firstTeamName === matchData.receiver
      ? matchData.secondTeamName
      : matchData.firstTeamName;

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
                {renderMisconducts(leftSideTeam == matchData.firstTeamName ? matchData.playerOne : matchData.playerTwo)}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-[#5ea0b8] text-center px-2"
                >
                  {index === 0 ? 'S' :
                    index === 1 ? '0' :  // Show 0 in second column
                      leftSideTeam === matchData.firstTeamName
                        ? (row.scoringTeam === 'second' ? row.secondTeamScore : '')
                        : (row.scoringTeam === 'first' ? row.firstTeamScore : '')}
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
                {renderMisconducts(leftSideTeam == matchData.firstTeamName ? matchData.playerTwo : matchData.playerOne)}
              </td>
              {tableData.map((row, index) => (
                <td
                  key={index}
                  className="border border-t-4 border-[#5ea0b8] text-center"
                >
                  {index === 0 && matchData.server === (leftSideTeam === matchData.firstTeamName
                    ? matchData.playerTwo
                    : matchData.playerOne) ? 'S' :
                    index === 1 ? '0' :  // Show 0 in second column
                      leftSideTeam === matchData.firstTeamName
                        ? (row.scoringTeam === 'first' ? row.firstTeamScore : '')
                        : (row.scoringTeam === 'second' ? row.secondTeamScore : '')}
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
