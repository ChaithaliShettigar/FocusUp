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

// Calculate focus score before saving
sessionSchema.pre('save', function (next) {
  if (this.status === 'completed') {
    // Score based on completion and tab switches
    const completionBonus = 50
    const tabSwitchPenalty = this.tabSwitches * 2
    this.focusScore = Math.max(0, completionBonus - tabSwitchPenalty)
  }
  next()
})

export default mongoose.model('Session', sessionSchema)
