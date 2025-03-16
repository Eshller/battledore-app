import React, { useState, useEffect } from 'react';

const MatchTimer = ({ isRunning, onPauseResume, initialTime = 0 }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: remainingSeconds.toString().padStart(2, '0')
    };
  };

  const timeObj = formatTime(time);

  return (
    <div className="flex flex-col items-center gap-3 bg-white rounded-xl shadow-lg p-4">
      <div className="text-gray-600 font-semibold text-sm tracking-wider uppercase">
        Match Duration
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold font-mono bg-gray-100 px-4 py-2 rounded-lg">
            {timeObj.minutes}
          </div>
          <span className="text-xs text-gray-500 mt-1">MINUTES</span>
        </div>
        <div className="text-3xl font-bold text-gray-400 mb-5">:</div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold font-mono bg-gray-100 px-4 py-2 rounded-lg">
            {timeObj.seconds}
          </div>
          <span className="text-xs text-gray-500 mt-1">SECONDS</span>
        </div>
      </div>
      <button
        onClick={onPauseResume}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
          isRunning 
            ? "bg-yellow-500 hover:bg-yellow-600" 
            : "bg-green-500 hover:bg-green-600"
        } text-white`}
      >
        {isRunning ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Pause</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Resume</span>
          </>
        )}
      </button>
    </div>
  );
};

export default MatchTimer;
