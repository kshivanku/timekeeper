import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import './App.css';

function App() {
  const [workDuration, setWorkDuration] = useState(25);
  const [restDuration, setRestDuration] = useState(5);
  const [phase, setPhase] = useState<'Work' | 'Rest'>('Work');
  const [timeLeft, setTimeLeft] = useState(workDuration * 60 * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate total time for current phase for progress calculation
  const totalTime = (phase === 'Work' ? workDuration : restDuration) * 60 * 1000;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Handle Resize to fit viewport
  useLayoutEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate dynamic radius based on viewport size
  // Reserve space for controls at bottom (approx 150px) + padding
  const availableHeight = dimensions.height - 200; 
  const availableDimension = Math.min(dimensions.width, availableHeight);
  
  const radius = Math.max(100, (availableDimension / 2) - 20);
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Font size scales with radius
  const fontSize = Math.max(2, radius / 50); 

  // Update time left when duration changes logic moved to input handlers to prevent reset on pause

  const announcePhase = (type: 'Work' | 'Rest') => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any current speech
    window.speechSynthesis.cancel();

    const text = type === 'Work' 
      ? "Your break is ending, time to start working"
      : "Your work interval is over, time to take a break";

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to select a friendlier voice
    const voices = window.speechSynthesis.getVoices();
    
    // Preference list: Google US English, Samantha (Mac), Microsoft Zira (Windows), any female voice, any English voice
    const preferredVoice = voices.find(voice => voice.name === 'Google US English') 
      || voices.find(voice => voice.name === 'Samantha')
      || voices.find(voice => voice.name.includes('Zira'))
      || voices.find(voice => voice.name.includes('Google') && voice.lang.startsWith('en'))
      || voices.find(voice => voice.name.toLowerCase().includes('female'))
      || voices.find(voice => voice.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1; 
    utterance.pitch = 1.1; 
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let intervalId: number | undefined;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1000);
      }, 1000);
    } else if (timeLeft <= 0) {
      // Timer finished, switch phase
      if (phase === 'Work') {
        setPhase('Rest');
        setTimeLeft(restDuration * 60 * 1000);
        announcePhase('Rest');
      } else {
        setPhase('Work');
        setTimeLeft(workDuration * 60 * 1000);
        announcePhase('Work');
      }
    }

    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft, phase, workDuration, restDuration]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setPhase('Work');
    setTimeLeft(workDuration * 60 * 1000);
    window.speechSynthesis.cancel(); // Stop speaking on reset
  }, [workDuration]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      setIsRunning((prev) => !prev);
    } else if (event.code === 'Escape') {
      resetTimer();
    }
  }, [resetTimer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const formatTime = (timeInMs: number) => {
    const safeTime = Math.max(0, timeInMs);
    const minutes = Math.floor(safeTime / 60000);
    const seconds = Math.floor((safeTime % 60000) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className={`container ${isDarkMode ? 'dark' : 'light'}`} ref={containerRef}>
      <div className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      
      <div className={`timer-container ${!isRunning ? 'paused' : ''}`} style={{ width: radius * 2, height: radius * 2 }}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className="progress-ring"
        >
          <circle
            className="progress-ring__circle-bg"
            stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className="progress-ring__circle"
            stroke={isDarkMode ? "white" : "#1a1a1a"}
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s linear'
            }}
          />
        </svg>
        <div className="timer-content">
          <div className="phase-indicator" style={{ fontSize: `${fontSize * 0.4}rem` }}>{phase}</div>
          <div className="stopwatch" style={{ fontSize: `${fontSize}rem` }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
      
      <div className="controls-bar glass-panel bottom-controls">
        <div className="control-group">
          <label>Work: {workDuration} min</label>
          <input
            type="range"
            min="1"
            max="60"
            value={workDuration}
            onChange={(e) => {
              const val = Number(e.target.value);
              setWorkDuration(val);
              if (!isRunning && phase === 'Work') {
                setTimeLeft(val * 60 * 1000);
              }
            }}
            className="glass-slider"
          />
        </div>

        <div className="control-group">
          <label>Rest: {restDuration} min</label>
          <input
            type="range"
            min="1"
            max="30"
            value={restDuration}
            onChange={(e) => {
              const val = Number(e.target.value);
              setRestDuration(val);
              if (!isRunning && phase === 'Rest') {
                setTimeLeft(val * 60 * 1000);
              }
            }}
            className="glass-slider"
          />
        </div>
      </div>

      <div className="instructions">
        <p>Press <kbd>Space</kbd> to Pause/Resume</p>
        <p>Press <kbd>Esc</kbd> to Reset</p>
      </div>
    </div>
  );
}

export default App;
