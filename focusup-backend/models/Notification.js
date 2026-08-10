import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'deadline', 'group', 'warning', 'success'],
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, read: 1 })

export default mongoose.model('Notification', notificationSchema)
