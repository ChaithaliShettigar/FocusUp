import Notification from '../models/Notification.js'

// Get all notifications for the current user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.status(200).json({ success: true, notifications })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Create a notification (used by server-side code)
export const createNotification = async (userId, message, type = 'info', data = null) => {
  try {
    return await Notification.create({ userId, message, type, data })
  } catch (error) {
    console.error('Error creating notification:', error.message)
    return null
  }
}

// Mark all notifications as read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    )
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Clear all notifications
export const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id })
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
