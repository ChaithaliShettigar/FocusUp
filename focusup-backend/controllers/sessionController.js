import Session from '../models/Session.js'
import User from '../models/User.js'
import { validateTargetMinutes } from '../utils/validators.js'

// Helper: compute streak from completed session dates
const computeStreak = async (userId) => {
  const sessions = await Session.find({ userId, status: 'completed' })
    .sort({ endTime: -1 })
    .select('endTime')
    .lean()

  if (sessions.length === 0) return 0

  const toDayKey = (d) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  }

  const today = toDayKey(new Date())
  const yesterday = toDayKey(new Date(Date.now() - 86400000))

  const uniqueDays = [...new Set(sessions.map((s) => toDayKey(s.endTime)))]

  if (!uniqueDays.includes(today) && !uniqueDays.includes(yesterday)) return 0

  let streak = 0
  let checkDate = uniqueDays.includes(today) ? new Date() : new Date(Date.now() - 86400000)

  for (const day of uniqueDays) {
    const expected = toDayKey(checkDate)
    if (day === expected) {
      streak++
      checkDate = new Date(checkDate.getTime() - 86400000)
    } else if (day < expected) {
      break
    }
  }

  return streak
}

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

    Object.assign(session, req.body)
    await session.save()

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

    const wasAlreadyCompleted = session.status === 'completed'

    session.status = status || 'completed'
    session.actualMinutes = actualMinutes !== undefined ? Number(actualMinutes) : session.actualMinutes
    session.tabSwitches = tabSwitches !== undefined ? Number(tabSwitches) : session.tabSwitches
    session.notes = notes || session.notes
    session.endTime = new Date()

    await session.save()

    // Update user stats atomically
    if (session.status === 'completed' && !wasAlreadyCompleted) {
      const streak = await computeStreak(req.user.id)

      await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalFocusMinutes: session.actualMinutes },
        $set: { streak },
      })
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

    // Reverse stats if session was completed
    if (session.status === 'completed') {
      const streak = await computeStreak(req.user.id)

      await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalFocusMinutes: -session.actualMinutes },
        $set: { streak },
      })
    }

    res.status(200).json({
      success: true,
      message: 'Session deleted',
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
