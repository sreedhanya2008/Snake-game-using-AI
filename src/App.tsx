import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, RotateCcw, MonitorPlay, Disc3 } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_DIRECTION = [0, -1]; // Moving Up
const GAME_SPEED = 120; // ms per frame

const SONGS = [
  {
    id: 1,
    title: "ERR_TRACK_0x01",
    artist: "SYS.ADMIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    primary: "cyan",
  },
  {
    id: 2,
    title: "NULL_PTR_BEATS",
    artist: "KERNEL_PANIC",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    primary: "fuchsia",
  },
  {
    id: 3,
    title: "MEM_LEAK_SYNTH",
    artist: "VOID_PTR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    primary: "cyan",
  }
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState([5, 5]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Direction needs a ref to prevent rapid rapid key presses causing self-collision
  const currentDirectionRef = useRef(INITIAL_DIRECTION);

  // Music Player State
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = SONGS[currentSongIndex];

  const generateFood = useCallback((currentSnake: number[][]) => {
    let newFood: number[];
    while (true) {
      newFood = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE)
      ];
      // eslint-disable-next-line
      if (!currentSnake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1])) {
         break;
      }
    }
    return newFood;
  }, []);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    currentDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    setFood(generateFood(INITIAL_SNAKE));
    if (!isPlaying) {
      setIsPlaying(true); // Start music when game plays
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameRunning) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      
      const prevDirection = currentDirectionRef.current;
      let newDirection = prevDirection;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (prevDirection[1] !== 1) newDirection = [0, -1];
          break;
        case 'ArrowDown':
        case 's':
          if (prevDirection[1] !== -1) newDirection = [0, 1];
          break;
        case 'ArrowLeft':
        case 'a':
          if (prevDirection[0] !== 1) newDirection = [-1, 0];
          break;
        case 'ArrowRight':
        case 'd':
          if (prevDirection[0] !== -1) newDirection = [1, 0];
          break;
      }
      
      setDirection(newDirection);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        currentDirectionRef.current = direction; // Update ref to last executed movement direction
        const head = prevSnake[0];
        const newHead = [head[0] + direction[0], head[1] + direction[1]];

        // Wall Collision
        if (
          newHead[0] < 0 || newHead[0] >= GRID_SIZE ||
          newHead[1] < 0 || newHead[1] >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        // Self Collision
        if (prevSnake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food Collision
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, food, gameOver, isGameRunning]);

  const handleGameOver = () => {
    setGameOver(true);
    setIsGameRunning(false);
    setHighScore(prev => Math.max(prev, score));
  };


  // Music Player logic
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error("Audio playback error (might need interaction):", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSongIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextSong = () => {
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
    setIsPlaying(true);
  };

  const prevSong = () => {
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
    setIsPlaying(true);
  };

  const handleEnded = () => nextSong();

  return (
    <div className="min-h-screen bg-black text-white font-vt text-xl flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden relative selection:bg-fuchsia-500 selection:text-black">
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-static pointer-events-none z-[49]"></div>
      <div className="absolute inset-0 scanlines pointer-events-none z-50 mix-blend-overlay opacity-60"></div>

      <audio
        ref={audioRef}
        src={currentSong.url}
        onEnded={handleEnded}
        preload="auto"
      />

      <div className="z-10 w-full max-w-5xl flex flex-col xl:flex-row items-center justify-between gap-12 sm:gap-16 animate-screen-tear">
        
        {/* Title & Stats */}
        <div className="flex flex-col gap-8 items-center w-full xl:w-1/3">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-digital text-shadow-glitch animate-glitch-jiggle uppercase m-0 leading-none text-white">
              SYS.VIPER
            </h1>
            <p className="text-cyan-400 text-2xl tracking-widest uppercase mt-6 bg-fuchsia-900/30 px-3 py-1 inline-block border-l-4 border-fuchsia-500">
              [ CORE_ACCESS_v9.0 ]
            </p>
          </div>

          <div className="flex w-full items-center justify-center gap-4 bg-black border-4 border-cyan-400 p-6 relative before:absolute before:-top-3 before:-left-3 before:w-6 before:h-6 before:bg-fuchsia-500 after:absolute after:-bottom-3 after:-right-3 after:w-6 after:h-6 after:bg-fuchsia-500">
            <div className="flex flex-col items-center w-1/2">
              <span className="text-xl text-fuchsia-500 uppercase tracking-widest mb-2 font-bold">INTEGRITY</span>
              <span className="text-5xl font-pixel text-cyan-400 text-shadow-glitch">{score}</span>
            </div>
            <div className="w-1 h-20 bg-fuchsia-500 shadow-[0_0_10px_#ff00ff]"></div>
            <div className="flex flex-col items-center w-1/2">
              <span className="text-xl text-fuchsia-500 uppercase tracking-widest mb-2 font-bold">MAX_THRUPUT</span>
              <span className="text-5xl font-pixel text-white text-shadow-glitch">{highScore}</span>
            </div>
          </div>
          
          {!isGameRunning && (
             <div className="mt-4 px-6 py-4 border-2 border-dashed border-cyan-400 text-center max-w-sm bg-black/80">
               <p className="text-2xl text-white leading-relaxed uppercase tracking-widest">
                 AWAITING INPUT: <br/>
                 <span className="text-fuchsia-500 font-pixel text-xl leading-10">WASD</span> // <span className="text-cyan-400 font-pixel text-xl leading-10">ARROWS</span>
               </p>
             </div>
          )}
        </div>

        {/* Game Stage */}
        <div className="relative w-full max-w-[450px] xl:w-1/3 flex justify-center">
          <div 
             className={`relative w-full aspect-square border-4 ${currentSong.primary === 'cyan' ? 'border-glitch' : 'border-glitch-alt'} bg-black grid overflow-hidden p-1`}
             style={{ 
               gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
               gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
             }}
          >
            {/* Render Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${index}-${segment[0]}-${segment[1]}`}
                  className={`
                    ${isHead ? 'bg-white z-10' : 'bg-cyan-400'}
                    border-2 ${isHead ? 'border-fuchsia-500' : 'border-black'}
                  `}
                  style={{
                    gridColumnStart: segment[0] + 1,
                    gridRowStart: segment[1] + 1,
                  }}
                />
              )
            })}
            
            {/* Render Food */}
            <div
              className="bg-fuchsia-500 border-2 border-cyan-400"
              style={{
                gridColumnStart: food[0] + 1,
                gridRowStart: food[1] + 1,
                animation: 'pulse 0.5s steps(2) infinite'
              }}
            />

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center">
                <button
                  onClick={startGame}
                  className="group block px-6 py-4 bg-cyan-400 text-black font-pixel text-xl uppercase tracking-widest transition-none hover:bg-fuchsia-500 hover:text-white border-4 border-black box-shadow-[4px_4px_0_0_#ff00ff]"
                  style={{ boxShadow: '4px 4px 0 0 #ff00ff' }}
                >
                  <span className="block animate-glitch-jiggle group-hover:animate-none">[ INITIATE ]</span>
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-6 text-center border-4 border-fuchsia-500" style={{boxShadow: 'inset 0 0 40px rgba(255,0,255,0.4)'}}>
                <h2 className="text-5xl font-digital text-fuchsia-500 mb-6 uppercase tracking-widest text-shadow-glitch animate-glitch-jiggle">FATAL_ERR</h2>
                <p className="text-cyan-400 mb-10 text-3xl font-pixel uppercase tracking-widest">PKT_DROP</p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-black text-white border-4 border-cyan-400 font-pixel text-lg uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-none focus:outline-none"
                  style={{ boxShadow: '4px 4px 0 0 #00ffff' }}
                >
                  &gt; RESTORE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Music Player */}
        <div className="w-full xl:w-1/3 flex flex-col items-center gap-6">
          <div className={`w-full max-w-[360px] bg-black p-6 border-4 ${currentSong.primary === 'cyan' ? 'border-cyan-400 shadow-[8px_8px_0_0_#ff00ff]' : 'border-fuchsia-500 shadow-[8px_8px_0_0_#00ffff]'}`}>
             
             <div className="relative z-10">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-16 h-16 bg-white border-4 border-black box-content flex items-center justify-center overflow-hidden relative shrink-0">
                    <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Glitch" className="absolute w-full h-full object-cover opacity-80 mix-blend-difference" alt="cover"/>
                    <Disc3 className={`relative z-10 w-10 h-10 ${currentSong.primary === 'cyan' ? 'text-fuchsia-500' : 'text-cyan-400'} ${isPlaying ? 'animate-[spin_1.5s_steps(4)_infinite]' : ''}`} />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h3 className="font-pixel text-sm text-white truncate max-w-[180px] leading-relaxed block overflow-hidden mb-3">{currentSong.title}</h3>
                    <p className={`text-2xl ${currentSong.primary === 'cyan' ? 'text-cyan-400' : 'text-fuchsia-500'} truncate uppercase`}>{currentSong.artist}</p>
                  </div>
                </div>

                {/* Scrubber visualization */}
                <div className="w-full h-6 bg-zinc-900 border-2 border-white mb-8 flex relative overflow-hidden">
                  {isPlaying ? (
                     <div className={`h-full ${currentSong.primary === 'cyan' ? 'bg-cyan-400' : 'bg-fuchsia-500'} w-2/3 opacity-90 transition-none`}></div>
                  ) : (
                     <div className="h-full bg-zinc-700 w-2/3"></div>
                  )}
                  {/* glitch artifacts on scrubber */}
                  {isPlaying && (
                    <>
                      <div className="absolute top-0 bottom-0 left-[60%] w-1 bg-white mix-blend-difference animate-[ping_0.5s_steps(2)_infinite]"></div>
                      <div className="absolute top-0 bottom-0 right-[20%] w-2 bg-white mix-blend-difference animate-[pulse_0.2s_steps(2)_infinite]"></div>
                    </>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={prevSong}
                    className="p-4 text-white border-4 border-transparent hover:border-white transition-none rounded-none bg-black active:bg-white active:text-black focus:outline-none"
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className={`w-20 h-20 flex items-center justify-center rounded-none border-4 bg-black active:invert transition-none focus:outline-none ${currentSong.primary === 'cyan' ? 'border-cyan-400 text-cyan-400' : 'border-fuchsia-500 text-fuchsia-500'}`}
                  >
                    {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current translate-x-1" />}
                  </button>
                  <button
                    onClick={nextSong}
                    className="p-4 text-white border-4 border-transparent hover:border-white transition-none rounded-none bg-black active:bg-white active:text-black focus:outline-none"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 text-fuchsia-500 font-pixel text-xs tracking-widest uppercase border-l-4 border-r-4 border-fuchsia-500 p-2 bg-black animate-pulse">
            <Volume2 className="w-4 h-4" /> AURAL OVERRIDE REQ
          </div>
        </div>

      </div>
    </div>
  );
}

