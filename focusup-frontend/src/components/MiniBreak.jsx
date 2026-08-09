import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const GAME_DURATION = 20

const games = ['catchStar', 'whackMole', 'colorMatch', 'memoryFlip']

const gameNames = {
  catchStar: 'Catch the Stars',
  whackMole: 'Whack-a-Mole',
  colorMatch: 'Color Match',
  memoryFlip: 'Memory Flip',
}

const gameEmojis = {
  catchStar: '⭐',
  whackMole: '🔨',
  colorMatch: '🎨',
  memoryFlip: '🃏',
}

// ── Catch the Stars ──
function CatchStarGame({ onDone }) {
  const [playing, setPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const arenaRef = useRef(null)
  const targetRef = useRef(null)

  useEffect(() => {
    if (!playing) return
    let moveTimer, countdown
    const move = () => {
      const arena = arenaRef.current
      const t = targetRef.current
      if (!arena || !t) return
      const r = arena.getBoundingClientRect()
      t.style.transform = `translate(${Math.random() * (r.width - 40)}px, ${Math.random() * (r.height - 40)}px)`
    }
    move()
    moveTimer = setInterval(move, 500)
    countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(moveTimer); clearInterval(countdown); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { clearInterval(moveTimer); clearInterval(countdown) }
  }, [playing])

  useEffect(() => { if (timeLeft === 0 && playing) onDone(score) }, [timeLeft])

  return (
    <>
      <p className="mt-2 text-sm text-ink/70">Click the ⭐ as it moves around!</p>
      <div ref={arenaRef} className="relative mt-4 h-56 overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <button
          ref={targetRef}
          onClick={() => playing && timeLeft > 0 && setScore(s => s + 1)}
          className="absolute left-0 top-0 flex h-10 w-10 select-none items-center justify-center rounded-full bg-white shadow text-xl"
        >⭐</button>
        {!playing && (
          <div className="absolute inset-0 grid place-items-center">
            <button onClick={() => { setPlaying(true); setScore(0); setTimeLeft(GAME_DURATION) }} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-sand">Start</button>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-ink">
        <span>Time: <span className="font-semibold">{timeLeft}s</span></span>
        <span>Score: <span className="font-semibold">{score}</span></span>
      </div>
    </>
  )
}

// ── Whack-a-Mole ──
function WhackMoleGame({ onDone }) {
  const [playing, setPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [activeHole, setActiveHole] = useState(-1)

  useEffect(() => {
    if (!playing) return
    let moleTimer, countdown
    moleTimer = setInterval(() => {
      setActiveHole(Math.floor(Math.random() * 9))
      setTimeout(() => setActiveHole(-1), 600)
    }, 700)
    countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(moleTimer); clearInterval(countdown); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { clearInterval(moleTimer); clearInterval(countdown) }
  }, [playing])

  useEffect(() => { if (timeLeft === 0 && playing) onDone(score) }, [timeLeft])

  return (
    <>
      <p className="mt-2 text-sm text-ink/70">Click the 🔴 before it hides!</p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!playing || timeLeft === 0) return
              if (activeHole === i) { setScore(s => s + 1); setActiveHole(-1) }
            }}
            className={`h-16 rounded-xl border-2 text-2xl flex items-center justify-center transition-all ${
              activeHole === i
                ? 'border-red-400 bg-red-50 scale-110 cursor-pointer'
                : 'border-ink/10 bg-clay/40'
            }`}
          >
            {activeHole === i ? '🔴' : ''}
          </button>
        ))}
      </div>
      {!playing && (
        <button onClick={() => { setPlaying(true); setScore(0); setTimeLeft(GAME_DURATION) }} className="mt-4 w-full rounded-full bg-ink px-5 py-2 text-sm font-semibold text-sand">Start</button>
      )}
      <div className="mt-3 flex items-center justify-between text-sm text-ink">
        <span>Time: <span className="font-semibold">{timeLeft}s</span></span>
        <span>Score: <span className="font-semibold">{score}</span></span>
      </div>
    </>
  )
}

// ── Color Match ──
function ColorMatchGame({ onDone }) {
  const [playing, setPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [targetColor, setTargetColor] = useState('')
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState(null)

  const colors = [
    { name: 'Red', bg: '#ef4444' },
    { name: 'Blue', bg: '#3b82f6' },
    { name: 'Green', bg: '#22c55e' },
    { name: 'Yellow', bg: '#eab308' },
    { name: 'Purple', bg: '#a855f7' },
    { name: 'Orange', bg: '#f97316' },
  ]

  const generateRound = () => {
    const correct = colors[Math.floor(Math.random() * colors.length)]
    let opts = [correct]
    while (opts.length < 3) {
      const c = colors[Math.floor(Math.random() * colors.length)]
      if (!opts.find(o => o.name === c.name)) opts.push(c)
    }
    setTargetColor(correct.name)
    setOptions(opts.sort(() => Math.random() - 0.5))
    setFeedback(null)
  }

  useEffect(() => {
    if (!playing) return
    generateRound()
    const countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(countdown); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(countdown)
  }, [playing])

  useEffect(() => { if (timeLeft === 0 && playing) onDone(score) }, [timeLeft])

  const handleGuess = (name) => {
    if (feedback || timeLeft === 0) return
    if (name === targetColor) {
      setScore(s => s + 1)
      setFeedback('correct')
    } else {
      setFeedback('wrong')
    }
    setTimeout(() => generateRound(), 400)
  }

  return (
    <>
      <p className="mt-2 text-sm text-ink/70">Click the matching color name!</p>
      <div className="mt-4 rounded-2xl bg-sand p-4 text-center">
        <p className="text-sm text-ink/60">Click the button that is:</p>
        <p className="text-2xl font-bold text-ink mt-1">{targetColor}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {options.map((c) => (
          <button
            key={c.name}
            onClick={() => handleGuess(c.name)}
            className="h-14 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:scale-105"
            style={{ backgroundColor: c.bg }}
          >
            {c.name}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`mt-2 text-center text-sm font-semibold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
          {feedback === 'correct' ? '+1 Correct!' : 'Wrong!'}
        </p>
      )}
      {!playing && (
        <button onClick={() => { setPlaying(true); setScore(0); setTimeLeft(GAME_DURATION) }} className="mt-4 w-full rounded-full bg-ink px-5 py-2 text-sm font-semibold text-sand">Start</button>
      )}
      <div className="mt-3 flex items-center justify-between text-sm text-ink">
        <span>Time: <span className="font-semibold">{timeLeft}s</span></span>
        <span>Score: <span className="font-semibold">{score}</span></span>
      </div>
    </>
  )
}

// ── Memory Flip ──
function MemoryFlipGame({ onDone }) {
  const [playing, setPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [score, setScore] = useState(0)

  const emojis = ['🐶', '🐱', '🦊', '🐸', '🐵', '🐼', '🦁', '🐻']

  const initGame = () => {
    const picked = emojis.slice(0, 6)
    const pairs = [...picked, ...picked].sort(() => Math.random() - 0.5)
    setCards(pairs.map((e, i) => ({ id: i, emoji: e })))
    setFlipped([])
    setMatched([])
    setScore(0)
  }

  useEffect(() => {
    if (!playing) return
    initGame()
    const countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(countdown); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(countdown)
  }, [playing])

  useEffect(() => { if (timeLeft === 0 && playing) onDone(score) }, [timeLeft])

  const handleFlip = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id) || timeLeft === 0) return
    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        setMatched(m => [...m, a, b])
        setScore(s => s + 1)
        setFlipped([])
      } else {
        setTimeout(() => setFlipped([]), 500)
      }
    }
  }

  return (
    <>
      <p className="mt-2 text-sm text-ink/70">Match the pairs of emojis!</p>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {cards.map((c) => {
          const isFlipped = flipped.includes(c.id) || matched.includes(c.id)
          const isMatched = matched.includes(c.id)
          return (
            <button
              key={c.id}
              onClick={() => handleFlip(c.id)}
              className={`h-14 rounded-xl text-2xl flex items-center justify-center transition-all ${
                isMatched ? 'bg-green-100 border-2 border-green-300' :
                isFlipped ? 'bg-white border-2 border-ink/30 scale-105' :
                'bg-clay/60 border-2 border-ink/10 hover:bg-clay'
              }`}
            >
              {isFlipped ? c.emoji : '?'}
            </button>
          )
        })}
      </div>
      {!playing && (
        <button onClick={() => { setPlaying(true); setScore(0); setTimeLeft(GAME_DURATION); initGame() }} className="mt-4 w-full rounded-full bg-ink px-5 py-2 text-sm font-semibold text-sand">Start</button>
      )}
      <div className="mt-3 flex items-center justify-between text-sm text-ink">
        <span>Time: <span className="font-semibold">{timeLeft}s</span></span>
        <span>Pairs: <span className="font-semibold">{score}/6</span></span>
      </div>
    </>
  )
}

// ── Main Component ──
export const MiniBreak = ({ open, onClose }) => {
  const [currentGame, setCurrentGame] = useState(null)
  const [finalScore, setFinalScore] = useState(null)

  useEffect(() => {
    if (open) {
      setCurrentGame(games[Math.floor(Math.random() * games.length)])
      setFinalScore(null)
    }
  }, [open])

  const handleGameDone = (score) => {
    setFinalScore(score)
  }

  const handlePlayAgain = () => {
    setCurrentGame(games[Math.floor(Math.random() * games.length)])
    setFinalScore(null)
  }

  const renderGame = () => {
    switch (currentGame) {
      case 'catchStar': return <CatchStarGame onDone={handleGameDone} />
      case 'whackMole': return <WhackMoleGame onDone={handleGameDone} />
      case 'colorMatch': return <ColorMatchGame onDone={handleGameDone} />
      case 'memoryFlip': return <MemoryFlipGame onDone={handleGameDone} />
      default: return null
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">
                {gameEmojis[currentGame]} {gameNames[currentGame]}
              </h3>
              <button onClick={onClose} className="rounded-full bg-clay px-2 text-xs font-bold text-ink">✕</button>
            </div>

            {finalScore !== null ? (
              <div className="mt-6 text-center">
                <p className="text-4xl font-bold text-ink">{finalScore}</p>
                <p className="text-sm text-ink/70 mt-1">
                  {currentGame === 'memoryFlip' ? 'pairs matched' : 'points scored'}
                </p>
                <p className="text-sm text-ink/60 mt-3">Nice break! Ready to get back to focus?</p>
                <div className="mt-4 flex gap-3">
                  <button onClick={handlePlayAgain} className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-clay/50 transition-colors">
                    Play another
                  </button>
                  <button onClick={onClose} className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-sand">
                    Back to focus
                  </button>
                </div>
              </div>
            ) : (
              <>
                {renderGame()}
                <button
                  onClick={onClose}
                  className="mt-4 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
                >
                  Back to focus
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
