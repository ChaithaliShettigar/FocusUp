import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const quizzes = [
  {
    q: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n log n)'],
    correct: 1,
  },
  {
    q: 'JavaScript const declares a ___ binding.',
    options: ['Block-scoped', 'Function-scoped', 'Global only'],
    correct: 0,
  },
]

export const MiniBreak = ({ open, onClose }) => {
  const quiz = useMemo(() => quizzes[Math.floor(Math.random() * quizzes.length)], [])
  const [mode, setMode] = useState('quiz') // 'quiz' | 'game'
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null

  // Game state
  const [playing, setPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const arenaRef = useRef(null)
  const targetRef = useRef(null)

  useEffect(() => {
    if (!open) return
    // Reset state when opened
    setMode('quiz')
    setSelected(null)
    setResult(null)
    setPlaying(false)
    setScore(0)
    setTimeLeft(15)
  }, [open])

  // Simple moving target game: catch the star ✨
  useEffect(() => {
    if (!playing || mode !== 'game') return
    let moveTimer
    let countdown
    const moveTarget = () => {
      const arena = arenaRef.current
      const target = targetRef.current
      if (!arena || !target) return
      const rect = arena.getBoundingClientRect()
      const size = 42
      const x = Math.max(0, Math.random() * (rect.width - size))
      const y = Math.max(0, Math.random() * (rect.height - size))
      target.style.transform = `translate(${x}px, ${y}px)`
    }
    moveTarget()
    moveTimer = setInterval(moveTarget, 600)
    countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(moveTimer)
          clearInterval(countdown)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      clearInterval(moveTimer)
      clearInterval(countdown)
    }
  }, [playing, mode])

  const handleHit = () => {
    if (!playing || mode !== 'game' || timeLeft === 0) return
    setScore((s) => s + 1)
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
              <h3 className="text-lg font-semibold text-ink">Quick 2-min break</h3>
              <button onClick={onClose} className="rounded-full bg-clay px-2 text-xs font-bold text-ink">✕</button>
            </div>

            {/* Mode Switcher */}
            <div className="mt-3 inline-flex rounded-full bg-clay p-1 text-xs">
              <button
                className={`rounded-full px-3 py-1 font-semibold ${mode === 'quiz' ? 'bg-ink text-sand' : 'text-ink'}`}
                onClick={() => setMode('quiz')}
              >Quiz</button>
              <button
                className={`rounded-full px-3 py-1 font-semibold ${mode === 'game' ? 'bg-ink text-sand' : 'text-ink'}`}
                onClick={() => setMode('game')}
              >Game</button>
            </div>

            {mode === 'quiz' ? (
              <>
                <p className="mt-2 text-sm text-ink/70">Answer a tiny question. No penalties, just reset your focus.</p>
                <div className="mt-4 rounded-2xl bg-sand p-4">
                  <p className="font-semibold text-ink">{quiz.q}</p>
                  <div className="mt-2 space-y-2">
                    {quiz.options.map((opt, idx) => {
                      const isSelected = selected === idx
                      const isCorrect = idx === quiz.correct
                      const stateClass =
                        result && isCorrect ? 'border-green-400 bg-green-50' :
                        result && isSelected && !isCorrect ? 'border-red-300 bg-red-50' : 'border-ink/10'
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            if (result) return
                            setSelected(idx)
                            setResult(idx === quiz.correct ? 'correct' : 'wrong')
                          }}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${stateClass}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {result && (
                  <p className={`mt-3 text-sm font-semibold ${result === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                    {result === 'correct' ? 'Nice! Correct answer ✅' : 'Good try! The correct answer is highlighted.'}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink/70">Catch the ✨ as many times as you can in 15 seconds.</p>
                <div ref={arenaRef} className="relative mt-4 h-56 overflow-hidden rounded-2xl border border-ink/10 bg-sand">
                  <button
                    ref={targetRef}
                    onClick={handleHit}
                    className="absolute left-0 top-0 h-10 w-10 select-none rounded-full bg-white shadow flex items-center justify-center"
                    style={{ transform: 'translate(0px, 0px)' }}
                  >
                    ✨
                  </button>
                  {!playing && (
                    <div className="absolute inset-0 grid place-items-center">
                      <button onClick={() => { setPlaying(true); setScore(0); setTimeLeft(15) }} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand">Start</button>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-ink">
                  <span>Time: <span className="font-semibold">{timeLeft}s</span></span>
                  <span>Score: <span className="font-semibold">{score}</span></span>
                </div>
                {timeLeft === 0 && (
                  <div className="mt-2 text-sm text-ink/70">Great! You scored <span className="font-semibold text-ink">{score}</span>. Play again?</div>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
            >
              Back to focus
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
