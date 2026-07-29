import User from '../models/User.js'
import { validatePassword } from '../utils/validators.js'

// ============ GET PROFILE ============
export const getProfile = async (req, res, next) => {
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
      user,
    })
  } catch (error) {
    next(error)
  }
}

// ============ UPDATE PROFILE ============
export const updateProfile = async (req, res, next) => {
  try {
    const { name, college, department, language, avatar, publicFocus, studentId } = req.body

    // Validation
    const updateData = {}
    
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty'
        })
      }
      updateData.name = name.trim()
    }

    if (college !== undefined) updateData.college = college || ''
    if (department !== undefined) updateData.department = department || ''
    if (language !== undefined) updateData.language = language
    if (avatar !== undefined) updateData.avatar = avatar
    if (publicFocus !== undefined) updateData.publicFocus = publicFocus

    // Check if studentId is being updated and if it already exists
    if (studentId !== undefined) {
      const trimmedStudentId = studentId ? studentId.trim() : ''
      const user = await User.findById(req.user.id)
      
      // Only check for duplicates if studentId is different from current
      if (trimmedStudentId && trimmedStudentId !== user.studentId) {
        const existingStudent = await User.findOne({ 
          studentId: trimmedStudentId,
          _id: { $ne: req.user.id }
        })
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'Student ID already exists. Please use a different student ID.'
          })
        }
      }
      updateData.studentId = trimmedStudentId
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
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

// ============ UPDATE PASSWORD ============
export const updatePassword = async (req, res, next) => {
  try {
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

    const user = await User.findById(req.user.id).select('+password')

    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      })
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

// ============ TOGGLE PUBLIC FOCUS ============
export const togglePublicFocus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    user.publicFocus = !user.publicFocus
    await user.save()

    res.status(200).json({
      success: true,
      message: `Public focus ${user.publicFocus ? 'enabled' : 'disabled'}`,
      publicFocus: user.publicFocus,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        publicFocus: user.publicFocus,
        focusScore: user.focusScore
      }
    })
  } catch (error) {
    next(error)
  }
}

// ============ DELETE PROFILE ============
export const deleteProfile = async (req, res, next) => {
  try {
    const { password, confirmDelete } = req.body

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete profile'
      })
    }

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm profile deletion'
      })
    }

    const user = await User.findById(req.user.id).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Verify password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect. Profile deletion failed.'
      })
    }

    // Delete user
    await User.findByIdAndDelete(req.user.id)

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

// ============ SEARCH PUBLIC PROFILES ============
export const searchPublicProfiles = async (req, res, next) => {
  try {
    const { query } = req.query

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      })
    }

    const searchTerm = query.trim()

    // Search for users with public focus or public profiles
    const users = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
      ],
      publicFocus: true,
    }).select('name email username college department role focusScore streak avatar')
      .limit(50)

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    })
  } catch (error) {
    next(error)
  }
}

// ============ SEARCH USERS BY USERNAME ============
export const searchUsersByUsername = async (req, res, next) => {
  try {
    const { query } = req.query

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      })
    }

    const searchTerm = query.trim()

    // Search for users by username with case-insensitive partial match
    const users = await User.find({
      username: { $regex: `^${searchTerm}`, $options: 'i' }
    }).select('name email username college department role focusScore avatar')
      .limit(20)

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    })
  } catch (error) {
    next(error)
  }
}

// ============ GET PUBLIC PROFILE ============
export const getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
      .select('name email username college department role focusScore streak totalFocusMinutes avatar publicFocus')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if user has public focus enabled
    if (!user.publicFocus) {
      return res.status(403).json({
        success: false,
        message: 'This user has not made their focus score public'
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
}

