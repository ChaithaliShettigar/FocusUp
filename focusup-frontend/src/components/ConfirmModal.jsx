import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

export const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-ink">{title}</h3>
              {message && (
                <p className="mt-2 text-sm text-ink/70">{message}</p>
              )}

              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink hover:bg-clay/50 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:scale-[1.02] ${
                    danger
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-ink hover:bg-ink/90'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
