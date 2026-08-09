import mongoose from 'mongoose'

const deadlineSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['homework', 'project', 'announcement', 'test', 'submission', 'assignment', 'other'],
      default: 'assignment',
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide a deadline date'],
    },
    reminderInterval: {
      type: Number,
      default: 60,
      min: 1,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    completedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
)

deadlineSchema.index({ groupId: 1, deadline: 1 })
deadlineSchema.index({ groupId: 1, isActive: 1 })

export default mongoose.model('Deadline', deadlineSchema)
