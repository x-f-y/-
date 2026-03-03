/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = 'UP';
const SPEED_LEVELS = {
  EASY: 150,
  MEDIUM: 100,
  HARD: 60,
};

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [isPaused, setIsPaused] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(SPEED_LEVELS.MEDIUM);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastDirectionRef = useRef<Direction>(INITIAL_DIRECTION);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-high-score', score.toString());
    }
  }, [score, highScore]);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food is on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (isPaused || gameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      lastDirectionRef.current = direction;
      return newSnake;
    });
  }, [direction, food, generateFood, isPaused, gameOver]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, speed]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (lastDirectionRef.current !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (lastDirectionRef.current !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (lastDirectionRef.current !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (lastDirectionRef.current !== 'LEFT') setDirection('RIGHT'); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic text-emerald-500 uppercase">
            Neon Snake
          </h1>
          <p className="text-xs font-mono text-emerald-500/50 tracking-widest uppercase">
            System v2.0.4
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-amber-400">
            <Trophy size={16} />
            <span className="font-mono text-xl font-bold">{highScore}</span>
          </div>
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider">High Score</div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative group">
        {/* Score Overlay (Desktop) */}
        <div className="absolute -left-24 top-0 hidden md:flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Score</div>
            <div className="text-3xl font-mono font-bold text-emerald-400">{score}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Speed</div>
            <select 
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-transparent text-sm font-mono outline-none cursor-pointer"
            >
              <option value={SPEED_LEVELS.EASY} className="bg-[#1a1a1a]">Slow</option>
              <option value={SPEED_LEVELS.MEDIUM} className="bg-[#1a1a1a]">Normal</option>
              <option value={SPEED_LEVELS.HARD} className="bg-[#1a1a1a]">Fast</option>
            </select>
          </div>
        </div>

        {/* The Board */}
        <div 
          className="relative bg-[#111] border-2 border-white/5 rounded-xl overflow-hidden shadow-2xl shadow-emerald-500/10"
          style={{ 
            width: 'min(90vw, 400px)', 
            height: 'min(90vw, 400px)',
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 pointer-events-none opacity-5">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-white" />
            ))}
          </div>

          {/* Snake */}
          {snake.map((segment, i) => (
            <motion.div
              key={`${segment.x}-${segment.y}-${i}`}
              initial={false}
              animate={{
                gridColumnStart: segment.x + 1,
                gridRowStart: segment.y + 1,
              }}
              className={`
                rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.3)]
                ${i === 0 ? 'bg-emerald-400 z-10 scale-110' : 'bg-emerald-600'}
              `}
            />
          ))}

          {/* Food */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{
              gridColumnStart: food.x + 1,
              gridRowStart: food.y + 1,
            }}
            className="bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)]"
          />

          {/* Game Over / Pause Overlay */}
          <AnimatePresence>
            {(gameOver || isPaused) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                {gameOver ? (
                  <>
                    <h2 className="text-4xl font-black text-rose-500 mb-2 uppercase italic tracking-tighter">Game Over</h2>
                    <p className="text-white/60 mb-6 font-mono text-sm uppercase tracking-widest">Final Score: {score}</p>
                    <button 
                      onClick={resetGame}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-full transition-all active:scale-95"
                    >
                      <RefreshCw size={20} />
                      PLAY AGAIN
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-black text-emerald-500 mb-2 uppercase italic tracking-tighter">Paused</h2>
                    <p className="text-white/60 mb-6 font-mono text-sm uppercase tracking-widest">Press Space or Button to Resume</p>
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-full transition-all active:scale-95"
                    >
                      <Play size={20} />
                      RESUME
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Controls & Stats */}
      <div className="w-full max-w-md mt-8 grid grid-cols-2 gap-8 items-center">
        {/* Mobile Score */}
        <div className="md:hidden flex flex-col gap-2">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Score</div>
            <div className="text-2xl font-mono font-bold text-emerald-400">{score}</div>
          </div>
          <button 
            onClick={() => setIsPaused(p => !p)}
            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
            <span className="text-xs font-mono uppercase tracking-widest">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>

        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-2 ml-auto">
          <div />
          <button 
            onPointerDown={() => lastDirectionRef.current !== 'DOWN' && setDirection('UP')}
            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-emerald-500 active:text-black transition-colors"
          >
            <ChevronUp />
          </button>
          <div />
          <button 
            onPointerDown={() => lastDirectionRef.current !== 'RIGHT' && setDirection('LEFT')}
            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-emerald-500 active:text-black transition-colors"
          >
            <ChevronLeft />
          </button>
          <button 
            onPointerDown={() => lastDirectionRef.current !== 'UP' && setDirection('DOWN')}
            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-emerald-500 active:text-black transition-colors"
          >
            <ChevronDown />
          </button>
          <button 
            onPointerDown={() => lastDirectionRef.current !== 'LEFT' && setDirection('RIGHT')}
            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-emerald-500 active:text-black transition-colors"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] flex gap-8">
        <span>[ Arrow Keys to Move ]</span>
        <span>[ Space to Pause ]</span>
      </div>
    </div>
  );
}
