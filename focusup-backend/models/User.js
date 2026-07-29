import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must not exceed 20 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    college: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    studentId: {
      type: String,
      default: '',
      sparse: true,
    },
    role: {
      type: String,
      enum: ['student', 'faculty'],
      default: 'student',
    },
    publicFocus: {
      type: Boolean,
      default: false,
    },
    focusScore: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    totalFocusMinutes: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'es', 'fr', 'de'],
      default: 'en',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcryptjs.genSalt(10)
    this.password = await bcryptjs.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password)
}

export default mongoose.model('User', userSchema)
