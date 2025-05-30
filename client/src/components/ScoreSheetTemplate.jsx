import React from "react";

const ScoreSheetTemplate = ({ matchData }) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to format duration
  const formatDuration = (time) => {
    if (!time || typeof time !== "object") {
      return "00:00";
    }

    const minutes = String(parseInt(time.minutes) || 0).padStart(2, "0");
    const seconds = String(parseInt(time.seconds) || 0).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Get scores data
  const scores = matchData?.scores || [];
  const finalScore = scores.length > 0 ? scores[scores.length - 1] : { firstTeamScore: "0", secondTeamScore: "0" };
  const shuttlecockCount = finalScore.numberOfShuttlecock || "0";

  // Check if this is a doubles match
  const isDoublesMatch = matchData?.typeOfMatch?.toLowerCase()?.includes('doubles') || 
                       (matchData?.playerThree && matchData?.playerThree !== '' && 
                        matchData?.playerFour && matchData?.playerFour !== '');

  // Process match scores to display in chronological order
  const processChronologicalScores = () => {
    // No scores data
    if (!scores || scores.length === 0) {
      return {
        team1Counters: [], 
        team2Counters: [],
        columnCount: 0,
        scoreEntries: [],
        playerScores: {}
      };
    }

    // Sort scores chronologically by timestamp
    const sortedScores = [...scores].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });
    
    // Process scores to create chronological display
    const scoreSequence = [];
    let team1Counter = 0;
    let team2Counter = 0;
    let prevTeam1Score = 0;
    let prevTeam2Score = 0;
    
    // For tracking individual player scores in doubles
    const playerScores = {
      playerOne: [],
      playerTwo: [],
      playerThree: [],
      playerFour: []
    };
    
    // Create score entries with proper timestamps
    const scoreEntries = sortedScores.map((score, index) => {
      const previousScore = index > 0 ? sortedScores[index - 1] : { firstTeamScore: "0", secondTeamScore: "0" };
      const scoringTeam =
        parseInt(score.firstTeamScore) > parseInt(previousScore.firstTeamScore)
          ? 'first'
          : parseInt(score.secondTeamScore) > parseInt(previousScore.secondTeamScore)
            ? 'second'
            : 'none';

      // For doubles matches, try to determine which player scored if not provided
      let scoringPlayer = score.scoringPlayer;
      
      // If we're in a doubles match but don't have a scoring player, assign one based on team
      if (isDoublesMatch && !scoringPlayer && scoringTeam !== 'none') {
        // Randomly assign to one of the team members for display purposes
        if (scoringTeam === 'first') {
          scoringPlayer = Math.random() < 0.5 ? matchData.playerOne : matchData.playerThree;
        } else {
          scoringPlayer = Math.random() < 0.5 ? matchData.playerTwo : matchData.playerFour;
        }
      }
      
      // Track individual player scores for doubles
      if (scoringPlayer && scoringTeam !== 'none') {
        const currentScore = scoringTeam === 'first' ? score.firstTeamScore : score.secondTeamScore;
        
        if (scoringPlayer === matchData.playerOne) {
          playerScores.playerOne.push(currentScore);
        } else if (scoringPlayer === matchData.playerTwo) {
          playerScores.playerTwo.push(currentScore);
        } else if (scoringPlayer === matchData.playerThree) {
          playerScores.playerThree.push(currentScore);
        } else if (scoringPlayer === matchData.playerFour) {
          playerScores.playerFour.push(currentScore);
        }
      }

      return {
        firstTeamScore: score.firstTeamScore,
        secondTeamScore: score.secondTeamScore,
        scoringTeam,
        scoringPlayer,
        timestamp: score.createdAt || score.timestamp || new Date().toISOString(),
        numberOfShuttlecock: score.numberOfShuttlecock
      };
    });
    
    // Analyze each score update
    sortedScores.forEach(score => {
      const currentTeam1 = parseInt(score.firstTeamScore) || 0;
      const currentTeam2 = parseInt(score.secondTeamScore) || 0;
      
      // Team 1 scored point(s)
      while (prevTeam1Score < currentTeam1) {
        prevTeam1Score++;
        team1Counter++;
        scoreSequence.push({
          team: 'team1',
          counter: team1Counter,
          player: score.scoringPlayer
        });
      }
      
      // Team 2 scored point(s)
      while (prevTeam2Score < currentTeam2) {
        prevTeam2Score++;
        team2Counter++;
        scoreSequence.push({
          team: 'team2',
          counter: team2Counter,
          player: score.scoringPlayer
        });
      }
    });
    
    // Map the sequence to display counters for each player
    // No limit on the number of columns
    const team1Counters = Array(scoreSequence.length).fill(null);
    const team2Counters = Array(scoreSequence.length).fill(null);
    
    scoreSequence.forEach((point, index) => {
      if (point.team === 'team1') {
        team1Counters[index] = point.counter;
      } else {
        team2Counters[index] = point.counter;
      }
    });
    
    return { 
      team1Counters, 
      team2Counters, 
      columnCount: scoreSequence.length,
      scoreEntries,
      playerScores
    };
  };

  const { team1Counters, team2Counters, columnCount, scoreEntries, playerScores } = processChronologicalScores();

  // Get misconducts for each player
  const playerMisconducts = (playerName) => {
    if (!matchData.misconducts || !playerName) return [];
    return matchData.misconducts.filter(m => m.player === playerName);
  };

  // Sort scores and misconducts chronologically
  const sortedEvents = React.useMemo(() => {
    if (!matchData) return [];
    
    // Create score entries
    const scoreEntries = matchData.scores?.map(score => ({
      ...score,
      isMisconduct: false,
      timestamp: new Date(score.createdAt || score.timestamp)
    })) || [];
    
    // Create misconduct entries
    const misconductEntries = matchData.misconducts?.map(m => ({
      ...m,
      isMisconduct: true,
      timestamp: new Date(m.timestamp)
    })) || [];
    
    // Combine and sort all entries chronologically
    return [...scoreEntries, ...misconductEntries].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [matchData]);

  // Ensure we have at least 36 columns for display (or more if there are more scores)
  // Add safeguards to prevent invalid array length error
  const safeColumnCount = typeof columnCount === 'number' ? columnCount : 0;
  const displayColumnCount = Math.max(36, safeColumnCount);

  return (
    <div className="scoresheet-template bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Battledore Branding at Top - New style with blue background */}
      <div className="bg-[#78a7bb] w-full text-center py-4 mb-6">
        <h1 className="text-6xl font-bold tracking-wider">
          <span className="text-[#a9d18e]">BATTLE</span>
          <span className="text-[#d9e2f3]">DORE</span>
        </h1>
        <p className="text-white text-sm mt-3">
          Maintained and developed by <span className="text-[#c863d4] font-semibold">ESH</span><span className="text-white font-semibold">WAY</span>
        </p>
      </div>

      {/* Top Section */}
      <div className="px-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Left Column */}
          <div>
            <div className="mb-3">
              <div className="text-xs font-semibold">Event:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
                {matchData?.eventDetails?.eventTitle || ""}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold">No:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
              {matchData?.matchOrder || ""}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold">Date:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
                {matchData?.matchDate || ""}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold">Start Match:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
                {matchData?.startTime ? formatTime(matchData.startTime) : ""}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold">End Match:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
                {matchData?.endTime ? formatTime(matchData.endTime) : ""}
              </div>
            </div>
          </div>

          {/* Center Column with Score */}
          <div className="flex items-center justify-center">
            <div className="text-center w-full">
              <div className="text-sm font-semibold text-gray-500 mb-2">FINAL SCORE</div>
              <div className="flex justify-center items-center gap-6">
                <div className="text-6xl font-bold">{finalScore.firstTeamScore || "0"}</div>
                <div className="text-5xl font-bold text-gray-700">:</div>
                <div className="text-6xl font-bold">{finalScore.secondTeamScore || "0"}</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="mb-3">
              <div className="text-xs font-semibold">Court:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
                {matchData?.eventPlace || matchData?.court || ""}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold">Umpire:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm font-medium">
                {matchData?.umpire || matchData?.umpireId || matchData?.referee || "Not assigned"}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold">Service Judge:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
                {matchData?.serviceJudge || ""}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold">Shuttles:</div>
              <div className="border-b border-gray-300 min-h-[20px] text-sm">
                {shuttlecockCount || "0"}
              </div>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="grid grid-cols-3 gap-4 mt-4 mb-8">
          <div></div>
          <div className="text-center">
            <div className="text-xs font-semibold">Duration:</div>
            <div className="border-b border-gray-300 min-h-[20px] text-sm text-center font-semibold">
              {matchData?.matchTime ? formatDuration(matchData.matchTime) : "00:00"}
            </div>
          </div>
          <div></div>
        </div>

        {/* Scoresheet Grid */}
        <div className="scoresheet-grid mb-6 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th className="border border-gray-400 bg-[#5ea0b8] text-white px-2 py-1 w-[100px]">
                  Players
                </th>
                {/* Display numbered columns like in the image */}
                {Array.from({ length: displayColumnCount }).map((_, i) => (
                  <th key={i} className="border border-gray-400 bg-[#5ea0b8] text-white w-[20px] text-center text-[11px]" style={{ padding: '2px' }}>
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Player One */}
              <tr>
                <td className="border border-gray-400 px-2 py-1 font-medium">
                  {matchData?.playerOne || "Player 1"}
                </td>
                {Array.from({ length: displayColumnCount }).map((_, i) => {
                  // For doubles matches with individual player scoring
                  if (isDoublesMatch && scoreEntries && scoreEntries.length > 0) {
                    const entry = i < scoreEntries.length ? scoreEntries[i] : null;
                    if (entry && entry.scoringPlayer === matchData?.playerOne && entry.scoringTeam === 'first') {
                      return (
                        <td 
                          key={i} 
                          className="border border-gray-400 text-center"
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          {entry.firstTeamScore}
                        </td>
                      );
                    }
                    return (
                      <td 
                        key={i} 
                        className="border border-gray-400 text-center"
                        style={{ padding: '4px', fontSize: '12px' }}
                      >
                        {""}
                      </td>
                    );
                  } else {
                    // Get the team1 score counter for this column (if exists) - for singles
                    const counter = i < team1Counters.length ? team1Counters[i] : null;
                    return (
                      <td 
                        key={i} 
                        className="border border-gray-400 text-center"
                        style={{ padding: '4px', fontSize: '12px' }}
                      >
                        {counter !== null ? counter : ""}
                      </td>
                    );
                  }
                })}
              </tr>

              {/* Player Three (if exists) */}
              {matchData?.playerThree && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-medium">
                    {matchData?.playerThree || ""}
                  </td>
                  {Array.from({ length: displayColumnCount }).map((_, i) => {
                    // For doubles matches with individual player scoring
                    if (isDoublesMatch && scoreEntries && scoreEntries.length > 0) {
                      const entry = i < scoreEntries.length ? scoreEntries[i] : null;
                      if (entry && entry.scoringPlayer === matchData?.playerThree && entry.scoringTeam === 'first') {
                        return (
                          <td 
                            key={i} 
                            className="border border-gray-400 text-center"
                            style={{ padding: '4px', fontSize: '12px' }}
                          >
                            {entry.firstTeamScore}
                          </td>
                        );
                      }
                      return (
                        <td 
                          key={i} 
                          className="border border-gray-400 text-center"
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          {""}
                        </td>
                      );
                    } else {
                      // Show same scores for doubles partner in singles mode
                      const counter = i < team1Counters.length ? team1Counters[i] : null;
                      return (
                        <td 
                          key={i} 
                          className="border border-gray-400 text-center"
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          {counter !== null ? counter : ""}
                        </td>
                      );
                    }
                  })}
                </tr>
              )}

              {/* Divider Row */}
              <tr className="bg-gray-200">
                <td colSpan={displayColumnCount + 1} className="border border-gray-400" style={{ height: '8px', padding: 0 }}></td>
              </tr>

              {/* Player Two */}
              <tr>
                <td className="border border-gray-400 px-2 py-1 font-medium">
                  {matchData?.playerTwo || "Player 2"}
                </td>
                {Array.from({ length: displayColumnCount }).map((_, i) => {
                  // For doubles matches with individual player scoring
                  if (isDoublesMatch && scoreEntries && scoreEntries.length > 0) {
                    const entry = i < scoreEntries.length ? scoreEntries[i] : null;
                    if (entry && entry.scoringPlayer === matchData?.playerTwo && entry.scoringTeam === 'second') {
                      return (
                        <td 
                          key={i} 
                          className="border border-gray-400 text-center"
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          {entry.secondTeamScore}
                        </td>
                      );
                    }
                    return (
                      <td 
                        key={i} 
                        className="border border-gray-400 text-center"
                        style={{ padding: '4px', fontSize: '12px' }}
                      >
                        {""}
                      </td>
                    );
                  } else {
                    // Get the team2 score counter for this column (if exists) - for singles
                    const counter = i < team2Counters.length ? team2Counters[i] : null;
                    return (
                      <td 
                        key={i} 
                        className="border border-gray-400 text-center"
                        style={{ padding: '4px', fontSize: '12px' }}
                      >
                        {counter !== null ? counter : ""}
                      </td>
                    );
                  }
                })}
              </tr>

              {/* Player Four (if exists) */}
              {matchData?.playerFour && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-medium">
                    {matchData?.playerFour || ""}
                  </td>
                  {Array.from({ length: displayColumnCount }).map((_, i) => {
                    // For doubles matches with individual player scoring
                    if (isDoublesMatch && scoreEntries && scoreEntries.length > 0) {
                      const entry = i < scoreEntries.length ? scoreEntries[i] : null;
                      if (entry && entry.scoringPlayer === matchData?.playerFour && entry.scoringTeam === 'second') {
                        return (
                          <td 
                            key={i} 
                            className="border border-gray-400 text-center"
                            style={{ padding: '4px', fontSize: '12px' }}
                          >
                            {entry.secondTeamScore}
                          </td>
                        );
                      }
                      return (
                        <td 
                          key={i} 
                          className="border border-gray-400 text-center"
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          {""}
                        </td>
                      );
                    } else {
                      // Show same scores for doubles partner in singles mode
                      const counter = i < team2Counters.length ? team2Counters[i] : null;
                      return (
                        <td 
                          key={i} 
                          className="border border-gray-400 text-center"
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          {counter !== null ? counter : ""}
                        </td>
                      );
                    }
                  })}
                </tr>
              )}

            </tbody>
          </table>
        </div>
        
        {/* Misconducts Section - Separate from table */}
        {matchData?.misconducts && matchData.misconducts.length > 0 && (
          <div className="mt-3 border border-gray-300 p-2">
            <div className="font-semibold text-base mb-2">Misconducts:</div>
            <div className="flex flex-wrap items-center gap-4">
              {matchData.misconducts.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-base font-medium">{m.player}</span>
                  <div 
                    className={`flex items-center justify-center w-8 h-8 ${
                      m.type === "W" ? "bg-yellow-400" :
                      m.type === "F" ? "bg-red-500" :
                      m.type === "R" ? "bg-blue-200" :
                      m.type === "S" ? "bg-green-200" :
                      m.type === "O" ? "bg-purple-200" :
                      m.type === "I" ? "bg-orange-200" :
                      m.type === "DIS" ? "bg-slate-700" :
                      m.type === "RET" ? "bg-blue-200" :
                      m.type === "C" ? "bg-green-200" : ""
                    }`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <span 
                      className={`inline-block text-center font-bold ${
                        m.type === "W" ? "text-yellow-800" :
                        m.type === "F" ? "text-white" :
                        m.type === "R" ? "text-blue-700" :
                        m.type === "S" ? "text-green-700" :
                        m.type === "O" ? "text-purple-700" :
                        m.type === "I" ? "text-orange-700" :
                        m.type === "DIS" ? "text-white" :
                        m.type === "RET" ? "text-blue-700" :
                        m.type === "C" ? "text-green-700" : ""
                      }`}
                      style={{ lineHeight: '1', fontSize: '16px' }}
                    >
                      {m.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Players Info */}
        <div className="players-info mb-6 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold">First Team:</div>
            <div className="border-b border-gray-400 min-h-[20px] text-sm">
              {matchData?.playerOne || ""}
              {matchData?.playerThree ? ` & ${matchData?.playerThree}` : ""}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold">Second Team:</div>
            <div className="border-b border-gray-400 min-h-[20px] text-sm">
              {matchData?.playerTwo || ""}
              {matchData?.playerFour ? ` & ${matchData?.playerFour}` : ""}
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section flex justify-between mt-12 mb-10">
          <div className="umpire-signature w-[40%]">
            <div className="border-t border-black w-full"></div>
            <p className="text-center mt-2 text-sm">Umpire</p>
          </div>
          <div className="referee-signature w-[40%]">
            <div className="border-t border-black w-full"></div>
            <p className="text-center mt-2 text-sm">Referee</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreSheetTemplate; 