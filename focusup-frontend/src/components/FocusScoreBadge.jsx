import { memo } from 'react'

/**
 * Calculates the focus score level and returns emoji and label
 * @param {number} score - The focus score (0-100)
 * @returns {object} - { emoji, label, level, color }
 */
export const getFocusScoreLevelInfo = (score) => {
  const numScore = Number(score) || 0

  if (numScore >= 80) {
    return {
      emoji: '🔥',
      label: 'Legendary Focus',
      level: 'legendary',
      color: 'from-red-400 to-orange-400',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
    }
  } else if (numScore >= 60) {
    return {
      emoji: '⭐',
      label: 'Great Focus',
      level: 'great',
      color: 'from-yellow-400 to-amber-400',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
    }
  } else if (numScore >= 40) {
    return {
      emoji: '✨',
      label: 'Good Focus',
      level: 'good',
      color: 'from-blue-400 to-cyan-400',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
    }
  } else if (numScore >= 20) {
    return {
      emoji: '🌙',
      label: 'Okay Focus',
      level: 'okay',
      color: 'from-purple-400 to-pink-400',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
    }
  } else {
    return {
      emoji: '🌱',
      label: 'Building Focus',
      level: 'beginner',
      color: 'from-green-400 to-emerald-400',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
    }
  }
}

/**
 * FocusScoreBadge Component
 * Displays an attractive emoji badge with focus score information
 */
export const FocusScoreBadge = memo(({ score = 0, size = 'medium', showLabel = true, showScore = true }) => {
  const scoreInfo = getFocusScoreLevelInfo(score)

  // Size variants
  const sizeClasses = {
    small: 'w-16 h-16 text-3xl',
    medium: 'w-24 h-24 text-5xl',
    large: 'w-32 h-32 text-7xl',
  }

  const labelClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }

  const scoreClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Emoji Badge with Glow Effect */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Glow background */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${scoreInfo.color} opacity-20 blur-xl`}></div>

        {/* Main badge container */}
        <div
          className={`relative w-full h-full flex items-center justify-center rounded-full border-2 ${scoreInfo.borderColor} ${scoreInfo.bgColor} shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-default`}
        >
          {/* Emoji */}
          <div className="select-none drop-shadow-lg">{scoreInfo.emoji}</div>
        </div>

        {/* Pulse animation border for Legendary */}
        {scoreInfo.level === 'legendary' && (
          <div className="absolute inset-0 rounded-full border-2 border-red-400 opacity-75 animate-pulse"></div>
        )}
      </div>

      {/* Label and Score */}
      <div className="text-center">
        {showLabel && (
          <p className={`font-bold ${scoreInfo.textColor} ${labelClasses[size]}`}>
            {scoreInfo.label}
          </p>
        )}
        {showScore && (
          <p className={`font-bold bg-gradient-to-r ${scoreInfo.color} bg-clip-text text-transparent ${scoreClasses[size]}`}>
            {Math.round(score)}/100
          </p>
        )}
      </div>
    </div>
  )
})

FocusScoreBadge.displayName = 'FocusScoreBadge'

/**
 * Compact inline badge for use in lists and tables
 */
export const FocusScoreBadgeCompact = memo(({ score = 0 }) => {
  const scoreInfo = getFocusScoreLevelInfo(score)

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white shadow-sm hover:shadow-md transition-shadow">
      <span className="text-xl">{scoreInfo.emoji}</span>
      <span className={`text-sm font-semibold ${scoreInfo.textColor}`}>
        {Math.round(score)}
      </span>
    </div>
  )
})

FocusScoreBadgeCompact.displayName = 'FocusScoreBadgeCompact'
