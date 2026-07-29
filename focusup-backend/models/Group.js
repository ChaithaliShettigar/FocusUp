import mongoose from 'mongoose'

// Helper function to generate unique 8-character code
function generateGroupCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      default: generateGroupCode,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resources: [
      new mongoose.Schema(
        {
          id: { type: String, required: true },
          title: { type: String, default: '' },
          link: { type: String, default: '' },
          type: { type: String, default: 'link' },
          content: { type: String, default: '' },
          addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          addedAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
    ],
    leaderboard: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        focusScore: Number,
        totalMinutes: Number,
        rank: Number,
      },
    ],
    chatMessages: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        senderName: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Group', groupSchema)
