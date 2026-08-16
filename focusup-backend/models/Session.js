import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentId: {
      type: String,
      default: null,
    },
    subject: {
      type: String,
      default: 'General',
    },
    targetMinutes: {
      type: Number,
      required: [true, 'Please provide target minutes'],
      min: 1,
    },
    actualMinutes: {
      type: Number,
      default: 0,
    },
    tabSwitches: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'abandoned'],
      default: 'active',
    },
    focusScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

// Calculate focus score before saving (0-100 scale)
sessionSchema.pre('save', function (next) {
  if (this.status === 'completed') {
    const completionRatio = Math.min(1, this.actualMinutes / (this.targetMinutes || 1))
    const baseScore = completionRatio * 60
    const tabSwitchPenalty = Math.min(30, this.tabSwitches * 3)
    const durationBonus = completionRatio >= 1 ? 10 : 0
    this.focusScore = Math.max(0, Math.min(100, Math.round(baseScore - tabSwitchPenalty + durationBonus)))
  }
  next()
})

export default mongoose.model('Session', sessionSchema)
