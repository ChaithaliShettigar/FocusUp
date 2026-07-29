import mongoose from 'mongoose'

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['link', 'upload', 'note', 'pdf', 'youtube'],
      required: true,
    },
    url: {
      type: String,
      default: '',
    },
    filePath: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    tags: [String],
    category: {
      type: String,
      default: 'general',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    sharedWith: [mongoose.Schema.Types.ObjectId],
  },
  { timestamps: true }
)

export default mongoose.model('Content', contentSchema)
