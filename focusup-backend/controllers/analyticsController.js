import Analytics from '../models/Analytics.js'
import Session from '../models/Session.js'

// Get analytics for user
export const getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const sessions = await Session.find({
      userId: req.user.id,
      status: 'completed',
      endTime: { $gte: startDate },
    })

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          totalSessions: 0,
          totalFocusTime: 0,
          averageFocusScore: 0,
          longestSession: 0,
        },
      })
    }

    const totalSessions = sessions.length
    const totalFocusTime = sessions.reduce((sum, s) => sum + s.actualMinutes, 0)
    const averageFocusScore =
      sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length
    const longestSession = Math.max(...sessions.map((s) => s.actualMinutes))
    const totalTabSwitches = sessions.reduce((sum, s) => sum + s.tabSwitches, 0)
    const totalTargetTime = sessions.reduce((sum, s) => sum + s.targetMinutes, 0)

    res.status(200).json({
      success: true,
      analytics: {
        totalSessions,
        totalFocusTime,
        totalTargetTime,
        averageFocusScore: Math.round(averageFocusScore),
        longestSession,
        totalTabSwitches,
        sessions: sessions.map((s) => ({
          id: s._id,
          date: s.startTime,
          duration: s.actualMinutes,
          targetMinutes: s.targetMinutes,
          focusScore: s.focusScore,
          subject: s.subject,
        })),
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get daily analytics
export const getDailyAnalytics = async (req, res) => {
  try {
    const days = 7
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const startOfDay = new Date()
      startOfDay.setDate(startOfDay.getDate() - i)
      startOfDay.setUTCHours(0, 0, 0, 0)

      const endOfDay = new Date(startOfDay)
      endOfDay.setUTCHours(23, 59, 59, 999)

      const sessions = await Session.find({
        userId: req.user.id,
        status: 'completed',
        endTime: { $gte: startOfDay, $lte: endOfDay },
      })

      const totalTime = sessions.reduce((sum, s) => sum + s.actualMinutes, 0)
      const avgScore =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length
          : 0

      data.push({
        date: startOfDay.toISOString().split('T')[0],
        focusTime: totalTime,
        sessions: sessions.length,
        avgScore: Math.round(avgScore),
      })
    }

    res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
