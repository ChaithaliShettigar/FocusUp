import Deadline from '../models/Deadline.js'
import Group from '../models/Group.js'

// Create a deadline
export const createDeadline = async (req, res) => {
  try {
    const { groupId } = req.params
    const { type, title, message, deadline, reminderInterval } = req.body

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    if (!title || !deadline) {
      return res.status(400).json({ message: 'Title and deadline are required' })
    }

    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: 'Invalid deadline date' })
    }

    const newDeadline = await Deadline.create({
      groupId,
      postedBy: req.user.id,
      type: type || 'assignment',
      title,
      message: message || '',
      deadline: deadlineDate,
      reminderInterval: reminderInterval || 60,
    })

    await newDeadline.populate('postedBy', 'name username email')

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('deadlineCreated', {
        deadline: newDeadline,
        postedBy: req.user.username,
      })
    }

    res.status(201).json({ success: true, deadline: newDeadline })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all deadlines for a group
export const getGroupDeadlines = async (req, res) => {
  try {
    const { groupId } = req.params

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    const deadlines = await Deadline.find({ groupId })
      .populate('postedBy', 'name username email')
      .populate('completedBy.userId', 'name username')
      .sort({ deadline: 1 })

    res.status(200).json({ success: true, deadlines })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update a deadline
export const updateDeadline = async (req, res) => {
  try {
    const { groupId, deadlineId } = req.params
    const { type, title, message, deadline, reminderInterval, isActive } = req.body

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    const existingDeadline = await Deadline.findById(deadlineId)
    if (!existingDeadline) {
      return res.status(404).json({ message: 'Deadline not found' })
    }

    if (existingDeadline.postedBy.toString() !== req.user.id) {
      const userMember = group.members.find((m) => m.userId.toString() === req.user.id)
      if (!userMember || userMember.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this deadline' })
      }
    }

    if (type) existingDeadline.type = type
    if (title) existingDeadline.title = title
    if (message !== undefined) existingDeadline.message = message
    if (deadline) existingDeadline.deadline = new Date(deadline)
    if (reminderInterval) existingDeadline.reminderInterval = reminderInterval
    if (isActive !== undefined) existingDeadline.isActive = isActive

    await existingDeadline.save()
    await existingDeadline.populate('postedBy', 'name username email')
    await existingDeadline.populate('completedBy.userId', 'name username')

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('deadlineUpdated', {
        deadline: existingDeadline,
        updatedBy: req.user.username,
      })
    }

    res.status(200).json({ success: true, deadline: existingDeadline })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete a deadline
export const deleteDeadline = async (req, res) => {
  try {
    const { groupId, deadlineId } = req.params

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    const existingDeadline = await Deadline.findById(deadlineId)
    if (!existingDeadline) {
      return res.status(404).json({ message: 'Deadline not found' })
    }

    if (existingDeadline.postedBy.toString() !== req.user.id) {
      const userMember = group.members.find((m) => m.userId.toString() === req.user.id)
      if (!userMember || userMember.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this deadline' })
      }
    }

    await Deadline.findByIdAndDelete(deadlineId)

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('deadlineDeleted', {
        deadlineId,
        deletedBy: req.user.username,
      })
    }

    res.status(200).json({ success: true, message: 'Deadline deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Mark deadline as completed by user
export const markDeadlineCompleted = async (req, res) => {
  try {
    const { groupId, deadlineId } = req.params

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    const deadline = await Deadline.findById(deadlineId)
    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' })
    }

    const alreadyCompleted = deadline.completedBy.some(
      (c) => c.userId.toString() === req.user.id
    )
    if (alreadyCompleted) {
      return res.status(400).json({ message: 'Already marked as completed' })
    }

    deadline.completedBy.push({ userId: req.user.id })
    await deadline.save()
    await deadline.populate('postedBy', 'name username email')
    await deadline.populate('completedBy.userId', 'name username')

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('deadlineCompleted', {
        deadline,
        completedBy: req.user.username,
      })
    }

    res.status(200).json({ success: true, deadline })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Unmark deadline completion
export const unmarkDeadlineCompleted = async (req, res) => {
  try {
    const { groupId, deadlineId } = req.params

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    const deadline = await Deadline.findById(deadlineId)
    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' })
    }

    deadline.completedBy = deadline.completedBy.filter(
      (c) => c.userId.toString() !== req.user.id
    )
    await deadline.save()
    await deadline.populate('postedBy', 'name username email')
    await deadline.populate('completedBy.userId', 'name username')

    res.status(200).json({ success: true, deadline })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Check and send reminders (called periodically)
export const checkDeadlinesForReminders = async (io) => {
  try {
    const now = new Date()
    const upcomingDeadlines = await Deadline.find({
      isActive: true,
      deadline: { $gt: now },
    })

    console.log(`🔍 Checking ${upcomingDeadlines.length} active deadlines for reminders...`)

    for (const dl of upcomingDeadlines) {
      const timeUntilDeadline = dl.deadline.getTime() - now.getTime()
      const reminderMs = dl.reminderInterval * 60 * 1000

      // If no reminder sent yet, or enough time has passed since last reminder
      const shouldSendReminder =
        !dl.lastReminderSentAt ||
        now.getTime() - dl.lastReminderSentAt.getTime() >= reminderMs

      if (shouldSendReminder && timeUntilDeadline <= reminderMs * 10) {
        const minutesLeft = Math.round(timeUntilDeadline / 60000)
        const hoursLeft = Math.round(timeUntilDeadline / 3600000 * 10) / 10

        let timeLabel
        if (minutesLeft < 60) {
          timeLabel = `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`
        } else {
          timeLabel = `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`
        }

        const group = await Group.findById(dl.groupId)
        if (!group) continue

        const memberIds = group.members.map((m) => m.userId.toString())

        console.log(`⏰ Sending reminder for "${dl.title}" to ${memberIds.length} members (${timeLabel} left)`)

        for (const memberId of memberIds) {
          if (io) {
            io.to(`user_${memberId}`).emit('deadlineReminder', {
              deadlineId: dl._id,
              title: dl.title,
              type: dl.type,
              timeLeft: timeLabel,
              deadline: dl.deadline,
              groupId: dl.groupId,
              groupName: group.name,
            })
          }
        }

        dl.lastReminderSentAt = now
        await dl.save()
      }
    }
  } catch (error) {
    console.error('Error checking deadlines for reminders:', error.message)
  }
}
