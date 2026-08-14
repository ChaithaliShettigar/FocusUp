import User from '../models/User.js'
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { validateEmail, validatePassword, validateName } from '../utils/validators.js'
import mongoose from 'mongoose'

// Helper to check database connection
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1
}

// ============ REGISTER ============
export const register = async (req, res, next) => {
  try {
    // Check if database is connected
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service temporarily unavailable. Please check if MongoDB is running.',
        code: 'DATABASE_UNAVAILABLE'
      })
    }

    const { name, username, email, password, college, department, role, studentId } = req.body

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Name is required' 
      })
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Username is required' 
      })
    }

    const trimmedUsername = username.trim().toLowerCase()
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({ 
        success: false,
        message: 'Username must be between 3 and 20 characters' 
      })
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return res.status(400).json({ 
        success: false,
        message: 'Username can only contain letters, numbers, hyphens and underscores' 
      })
    }

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      })
    }

    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: 'Password is required' 
      })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character (@$!%?&)' 
      })
    }

    // Check if user exists by email
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists. Please use a different email.' 
      })
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: trimmedUsername })
    if (existingUsername) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists. Please use a different username.' 
      })
    }

    // Check if studentId already exists (if provided)
    if (studentId && studentId.trim()) {
      const existingStudentId = await User.findOne({ studentId: studentId.trim() })
      if (existingStudentId) {
        return res.status(400).json({ 
          success: false,
          message: 'Student ID already exists. Please use a different student ID.' 
        })
      }
    }

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      username: trimmedUsername,
      email: email.toLowerCase(),
      password,
      college: college || '',
      department: department || '',
      studentId: studentId ? studentId.trim() : '',
      role: role || 'student',
    })

    // Generate tokens
    const accessToken = generateToken(newUser._id)
    const refreshToken = generateRefreshToken(newUser._id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        college: newUser.college,
        department: newUser.department,
        studentId: newUser.studentId,
        role: newUser.role,
        publicFocus: newUser.publicFocus,
      },
    })
  } catch (error) {
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different ${field}.`
      })
    }
    
    next(error)
  }
}

// ============ LOGIN ============
export const login = async (req, res, next) => {
  try {
    // Check if database is connected
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service temporarily unavailable. Please check if MongoDB is running.',
        code: 'DATABASE_UNAVAILABLE'
      })
    }

    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      })
    }

    // Check for user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password)
    
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // Generate tokens
    const accessToken = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        college: user.college,
        department: user.department,
        studentId: user.studentId,
        role: user.role,
        focusScore: user.focusScore,
        streak: user.streak,
        publicFocus: user.publicFocus,
      },
    })
  } catch (error) {
    next(error)
  }
}

// ============ LOGOUT ============
export const logout = async (req, res, next) => {
  try {
    // In a real app, you would invalidate the refresh token here
    // This could be done by storing tokens in a blacklist or database
    // For now, we'll just send a success response
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
}

// ============ REFRESH TOKEN ============
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      })
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or expired'
      })
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      })
    }

    // Get user
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Rotate: issue BOTH new access and new refresh tokens
    const newAccessToken = generateToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    next(error)
  }
}

// ============ CHANGE PASSWORD ============
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword, confirmPassword } = req.body

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation'
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      })
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character (@$!%?&)'
      })
    }

    // Get user with password
    const user = await User.findById(userId).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check current password
    const isPasswordMatch = await user.matchPassword(currentPassword)
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    next(error)
  }
}

// ============ DELETE ACCOUNT ============
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { password, confirmDelete } = req.body

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      })
    }

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm account deletion'
      })
    }

    // Get user with password
    const user = await User.findById(userId).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Verify password
    const isPasswordMatch = await user.matchPassword(password)
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect. Account deletion failed.'
      })
    }

    // Delete user
    await User.findByIdAndDelete(userId)

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

// ============ GET CURRENT USER ============
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      user
    })
  } catch (error) {
    next(error)
  }
}
