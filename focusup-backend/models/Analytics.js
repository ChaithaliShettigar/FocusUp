import mongoose from 'mongoose'

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    totalFocusTime: {
      type: Number,
      default: 0,
    },
    averageFocusScore: {
      type: Number,
      default: 0,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    longestSessionMinutes: {
      type: Number,
      default: 0,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    weeklyData: [
      {
        day: String,
        focusTime: Number,
        sessions: Number,
        avgScore: Number,
      },
    ],
    monthlyData: [
      {
        week: Number,
        focusTime: Number,
        sessions: Number,
        avgScore: Number,
      },
    ],
  },
  { timestamps: true }
)

// Index for faster queries
analyticsSchema.index({ userId: 1, date: -1 })

export default mongoose.model('Analytics', analyticsSchema)
