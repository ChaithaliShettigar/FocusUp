import Session from '../models/Session.js'
import User from '../models/User.js'
import { validateTargetMinutes } from '../utils/validators.js'

// Create a new session
export const createSession = async (req, res) => {
  try {
    const { contentId, subject, targetMinutes } = req.body

    if (!validateTargetMinutes(targetMinutes)) {
      return res.status(400).json({ message: 'Invalid target minutes' })
    }

    const session = await Session.create({
      userId: req.user.id,
      contentId,
      subject: subject || 'General',
      targetMinutes,
      status: 'active',
    })

    res.status(201).json({
      success: true,
      session,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all sessions for user
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get single session
export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this session' })
    }

    res.status(200).json({
      success: true,
      session,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update session
export const updateSession = async (req, res) => {
  try {
    let session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this session' })
    }

    session = await Session.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      session,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// End session
export const endSession = async (req, res) => {
  try {
    const { status, actualMinutes, tabSwitches, notes } = req.body

    let session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    session.status = status || 'completed'
    session.actualMinutes = actualMinutes || session.actualMinutes
    session.tabSwitches = tabSwitches || session.tabSwitches
    session.notes = notes || session.notes
    session.endTime = new Date()

    await session.save()

    // Update user stats
    if (session.status === 'completed') {
      const user = await User.findById(req.user.id)
      user.totalFocusMinutes += session.actualMinutes
      user.focusScore += session.focusScore
      await user.save()
    }

    res.status(200).json({
      success: true,
      session,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete session
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await Session.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Session deleted',
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
