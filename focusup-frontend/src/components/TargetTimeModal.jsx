import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Play, Square } from 'lucide-react'

export const TargetTimeModal = ({ open, elapsedSeconds, targetMinutes, onContinue, onEndSession }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Clock className="h-8 w-8 text-accent" />
              </div>

              <h3 className="text-xl font-bold text-ink">Target Time Reached!</h3>
              <p className="mt-2 text-sm text-ink/70">
                You studied for <span className="font-semibold text-ink">{formatTime(elapsedSeconds)}</span> of your{' '}
                <span className="font-semibold text-ink">{targetMinutes} min</span> target.
              </p>
              <p className="mt-1 text-sm text-ink/70">Great focus session!</p>

              <div className="mt-6 flex w-full flex-col gap-3">
                <button
                  onClick={onContinue}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand shadow-soft hover:scale-[1.02] transition-all"
                >
                  <Play className="h-4 w-4" />
                  Continue Studying
                </button>
                <button
                  onClick={onEndSession}
                  className="flex items-center justify-center gap-2 w-full rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink hover:bg-clay/50 transition-colors"
                >
                  <Square className="h-4 w-4" />
                  End Session
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
