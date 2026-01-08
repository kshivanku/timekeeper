import { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId: number | undefined;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault(); // Prevent scrolling
      setIsRunning((prevIsRunning) => !prevIsRunning);
    } else if (event.code === 'Escape') {
      setIsRunning(false);
      setTime(0);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const formatTime = (timeInMs: number) => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <div className="stopwatch">
        {formatTime(time)}
      </div>
      <div className="instructions">
        <p>Press <kbd>Space</kbd> to Start/Stop</p>
        <p>Press <kbd>Esc</kbd> to Reset</p>
      </div>
    </div>
  );
}

export default App;
