import Group from '../models/Group.js'
import User from '../models/User.js'

const normalizeResource = (resource, fallbackAddedBy = null) => {
  if (!resource) return null
  if (typeof resource === 'string') {
    return {
      id: resource,
      title: resource,
      link: '',
      type: 'link',
      content: '',
      addedBy: fallbackAddedBy,
      addedAt: new Date(),
    }
  }

  return {
    id: String(resource.id || Date.now()),
    title: String(resource.title || ''),
    link: String(resource.link || ''),
    type: String(resource.type || 'link'),
    content: String(resource.content || ''),
    addedBy: resource.addedBy || fallbackAddedBy,
    addedAt: resource.addedAt || new Date(),
  }
}

const normalizeResources = (group, fallbackAddedBy = null) => {
  if (!group) return group
  group.resources = Array.isArray(group.resources)
    ? group.resources.map((resource) => normalizeResource(resource, fallbackAddedBy)).filter(Boolean)
    : []
  return group
}

// Create group
export const createGroup = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' })
    }

    const group = await Group.create({
      name,
      description,
      createdBy: req.user.id,
      isPublic: isPublic || false,
      members: [{ userId: req.user.id, role: 'admin' }],
    })

    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    // Emit real-time event for group creation
    if (req.io) {
      req.io.emit('groupCreated', {
        group,
        createdBy: req.user.username
      })
    }

    res.status(201).json({
      success: true,
      group,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all groups for user
export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.user.id },
        { 'members.userId': req.user.id },
      ],
    })
      .populate('createdBy', 'name email username')
      .populate('members.userId', 'name email username focusScore')

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get single group
export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email username')
      .populate('members.userId', 'name email username focusScore')

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    res.status(200).json({
      success: true,
      group: normalizeResources(group, group.createdBy),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Join group by code
export const joinGroupByCode = async (req, res) => {
  try {
    const { code } = req.body

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ message: 'Group code is required' })
    }

    const normalizedCode = code.trim().toUpperCase()
    const group = await Group.findOne({ code: normalizedCode })

    if (!group) {
      return res.status(404).json({ message: 'Invalid group code. Group not found' })
    }

    // Check if user is already a member
    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group' })
    }

    // Add user to group
    group.members.push({ userId: req.user.id, role: 'member' })
    await group.save()

    // Populate after saving
    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    // Emit real-time event for group join
    if (req.io) {
      req.io.to(`group_${group._id}`).emit('memberJoinedGroup', {
        group,
        newMember: {
          userId: req.user.id,
          username: req.user.username,
          name: req.user.name,
          focusScore: req.user.focusScore
        }
      })
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined the group',
      group,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const groupId = req.params.id
    const userId = req.user.id

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex((m) => m.userId.toString() === userId)
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this group' })
    }

    // Prevent admin from leaving if they're the creator
    if (group.createdBy.toString() === userId && group.members[memberIndex].role === 'admin') {
      if (group.members.length > 1) {
        return res.status(400).json({ message: 'As the group creator, you must delete the group to leave it. Or transfer admin rights first.' })
      }
    }

    group.members.splice(memberIndex, 1)
    await group.save()

    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    // Emit real-time event for group leave
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('memberLeftGroup', {
        group,
        leftMember: {
          userId: userId,
          username: req.user.username
        }
      })
    }

    res.status(200).json({
      success: true,
      message: 'Successfully left the group',
      group,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Add member to group (admin only)
export const addMember = async (req, res) => {
  try {
    const { userId } = req.body
    const groupId = req.params.id

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if current user is admin
    const userMember = group.members.find((m) => m.userId.toString() === req.user.id)
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({ message: 'Only group admins can add members' })
    }

    // Check if user is already a member
    const isMember = group.members.some((m) => m.userId.toString() === userId)
    if (isMember) {
      return res.status(400).json({ message: 'User already in group' })
    }

    group.members.push({ userId, role: 'member' })
    await group.save()

    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    res.status(200).json({
      success: true,
      group: normalizeResources(group, group.createdBy),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Remove member from group
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.body
    const groupId = req.params.id

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if current user is admin
    const userMember = group.members.find((m) => m.userId.toString() === req.user.id)
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({ message: 'Only group admins can remove members' })
    }

    group.members = group.members.filter((m) => m.userId.toString() !== userId)
    await group.save()

    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    res.status(200).json({
      success: true,
      group: normalizeResources(group, group.createdBy),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update group
export const updateGroup = async (req, res) => {
  try {
    const groupId = req.params.id
    const { name, description, isPublic } = req.body

    let group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this group' })
    }

    if (name) group.name = name
    if (description) group.description = description
    if (isPublic !== undefined) group.isPublic = isPublic

    await group.save()

    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    res.status(200).json({
      success: true,
      group: normalizeResources(group, group.createdBy),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Add resource to group
export const addResource = async (req, res) => {
  try {
    // Log incoming body for easier debugging when things go wrong
    console.log('addResource request body:', req.body)

    let { title, link, url, type, content, notes } = req.body || {}
    const groupId = req.params.id

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if user is a member
    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    // Normalize and validate inputs
    title = title ? String(title).trim() : ''
    link = link ? String(link).trim() : ''
    url = url ? String(url).trim() : ''
    type = type ? String(type).trim() : 'link'
    content = (content === undefined || content === null) ? '' : String(content)
    notes = (notes === undefined || notes === null) ? '' : String(notes)

    if (!link && url) link = url
    if (!content && notes) content = notes

    if (!title && !link && type !== 'code') {
      return res.status(400).json({ message: 'Either title or link is required for a resource' })
    }

    const resource = {
      id: Date.now().toString(),
      title,
      link,
      type,
      content,
      addedBy: req.user.id,
      addedAt: new Date()
    }

    // Diagnostic logs to help detect schema mismatches
    try {
      console.log('Group resources before push:', Array.isArray(group.resources), group.resources?.length ?? 0)
      console.log('Group schema resource type:', Group.schema.path('resources')?.instance)
    } catch (diagErr) {
      console.error('Diagnostics failed:', diagErr)
    }

    // Rebuild resources with a consistent object shape before saving.
    group.resources = Array.isArray(group.resources)
      ? group.resources.map((resource) => normalizeResource(resource, group.createdBy)).filter(Boolean)
      : []
    group.resources.push(resource)
    try {
      await group.save()
    } catch (saveErr) {
      console.error('Failed to save group resources:', saveErr)
      console.error('Resource we tried to add:', resource)
      console.error('Group document snapshot (first 2 fields):', { _id: group._id, resourcesPreview: group.resources && group.resources.slice ? group.resources.slice(0,2) : group.resources })
      // Return a clearer error to the client
      return res.status(500).json({ message: saveErr.message })
    }

    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    // Emit real-time event for new resource
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('resourceAdded', {
        group,
        resource,
        addedBy: req.user.username
      })
    }

    res.status(201).json({
      success: true,
      group: normalizeResources(group, group.createdBy),
      resource
    })
  } catch (error) {
    console.error('addResource error:', error)
    res.status(500).json({ message: error.message })
  }
}

// Get group resources
export const getGroupResources = async (req, res) => {
  try {
    const groupId = req.params.id

    const group = await Group.findById(groupId)
      .populate('createdBy', 'name email username')
      .populate('members.userId', 'name email username focusScore')

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if user is a member
    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    res.status(200).json({
      success: true,
      resources: Array.isArray(group.resources)
        ? group.resources.map((resource) => normalizeResource(resource, group.createdBy)).filter(Boolean)
        : []
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete resource from group
export const deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params
    const groupId = req.params.id

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if user is a member
    const isMember = group.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' })
    }

    group.resources = Array.isArray(group.resources)
      ? group.resources.map((resource) => normalizeResource(resource, group.createdBy)).filter(Boolean)
      : []
    const resourceIndex = group.resources.findIndex((r) => String(r.id) === String(resourceId))
    if (resourceIndex === -1) {
      return res.status(404).json({ message: 'Resource not found' })
    }

    const resource = group.resources[resourceIndex]

    // Check if user is the one who added the resource or is admin
    const userMember = group.members.find((m) => m.userId.toString() === req.user.id)
    const isResourceOwner = resource.addedBy && resource.addedBy.toString() === req.user.id
    const isAdmin = userMember && userMember.role === 'admin'

    if (!isResourceOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete resources you added or be an admin' })
    }

    group.resources.splice(resourceIndex, 1)
    await group.save()

    await group.populate('createdBy', 'name email username')
    await group.populate('members.userId', 'name email username focusScore')

    // Emit real-time event for resource deletion
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('resourceDeleted', {
        group,
        resourceId,
        deletedBy: req.user.username
      })
    }

    res.status(200).json({
      success: true,
      group: normalizeResources(group, group.createdBy),
      message: 'Resource deleted successfully'
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete group
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await Group.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Group deleted',
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
