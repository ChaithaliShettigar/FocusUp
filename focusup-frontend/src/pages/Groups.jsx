import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { ConfirmModal } from '../components/ConfirmModal'
import { groupAPI, contentAPI, deadlineAPI } from '../services/api'
import { socketService } from '../services/socket'
import { useFocusStore } from '../store/useFocusStore'
import { toast } from 'react-hot-toast'
import {
  Users, Copy, Plus, Trash2, Upload, Play, Square,
  FileText, Video, Code, Send, ArrowLeft, Search, UserPlus,
  LogOut, Clock, Calendar, CheckCircle2, AlertTriangle, Bell
} from 'lucide-react'

export const Groups = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    groups, onlineUsers, joinGroupRoom, leaveGroupRoom,
    startSession, endSession, setCurrentSession, currentSessionId, user,
    pushNotification, activeContentId, sessions
  } = useFocusStore()

  const activeSession = sessions.find(s => s.id === currentSessionId)

  const [localGroups, setLocalGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [activeTab, setActiveTab] = useState('materials')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupCode, setGroupCode] = useState('')

  // Resource states
  const [resourceTitle, setResourceTitle] = useState('')
  const [youtubeLink, setYoutubeLink] = useState('')
  const [codeTitle, setCodeTitle] = useState('')
  const [codeNotes, setCodeNotes] = useState('')
  const [targetMinutes, setTargetMinutes] = useState(25)
  const [materialTargets, setMaterialTargets] = useState({})
  const [viewingResource, setViewingResource] = useState(null)

  // Chat
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const chatEndRef = useRef(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [locatedResourceId, setLocatedResourceId] = useState(null)
  const [locatedMessageTimestamp, setLocatedMessageTimestamp] = useState(null)

  // Deadlines
  const [deadlines, setDeadlines] = useState([])
  const [showDeadlineForm, setShowDeadlineForm] = useState(false)
  const [deadlineTitle, setDeadlineTitle] = useState('')
  const [deadlineMessage, setDeadlineMessage] = useState('')
  const [deadlineType, setDeadlineType] = useState('assignment')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [reminderInterval, setReminderInterval] = useState(60)

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: null, danger: true })

  const openConfirm = (config) => {
    setConfirmConfig(config)
    setConfirmOpen(true)
  }

  const getMinDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  const getDefaultDeadlineDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  }

  useEffect(() => { fetchUserGroups() }, [])

  // Restore active session view after groups are loaded
  const hasRestoredGroupSession = useRef(false)
  useEffect(() => {
    if (hasRestoredGroupSession.current) return
    if (!currentSessionId || !activeContentId || localGroups.length === 0) return

    for (const group of localGroups) {
      const resource = (group.resources || []).find(r => r.id === activeContentId)
      if (resource) {
        setSelectedGroup(group)
        setViewingResource(resource)
        setChatMessages(group.chatMessages || [])
        hasRestoredGroupSession.current = true
        break
      }
    }
  }, [currentSessionId, activeContentId, localGroups])

  useEffect(() => {
    setLocalGroups(groups)
  }, [groups])

  // Auto-select group from navigation state
  useEffect(() => {
    const openGroupId = location.state?.openGroupId
    if (openGroupId && localGroups.length > 0) {
      const g = localGroups.find(grp => String(grp._id) === String(openGroupId))
      if (g) {
        setSelectedGroup(g)
        setChatMessages(g.chatMessages || [])
        // Switch to correct tab
        if (location.state?.openTab) {
          setActiveTab(location.state.openTab)
        }
        // Locate resource
        if (location.state?.openResourceId) {
          setLocatedResourceId(location.state.openResourceId)
          setTimeout(() => {
            const el = document.getElementById(`group-resource-${location.state.openResourceId}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
        // Locate message
        if (location.state?.openMessageTimestamp) {
          setLocatedMessageTimestamp(location.state.openMessageTimestamp)
          setTimeout(() => {
            const el = document.getElementById(`group-message-${location.state.openMessageTimestamp}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }
      navigate('/groups', { replace: true, state: {} })
    }
  }, [location.state, localGroups])

  // Join rooms
  useEffect(() => {
    localGroups.forEach(g => { if (g._id) joinGroupRoom(g._id) })
    return () => { localGroups.forEach(g => { if (g._id) leaveGroupRoom(g._id) }) }
  }, [localGroups])

  // Chat socket
  useEffect(() => {
    if (!selectedGroup) return

    // Load messages from server group data (MongoDB is source of truth)
    const serverMessages = selectedGroup.chatMessages || []
    setChatMessages(serverMessages)

    const handleMsg = (data) => {
      if (data.groupId === selectedGroup._id) {
        const incoming = data.message || data
        setChatMessages(prev => {
          // Deduplicate by timestamp + senderId + text
          const isDuplicate = prev.some(
            m => m.senderId === incoming.senderId && m.text === incoming.text &&
                 Math.abs(new Date(m.timestamp) - new Date(incoming.timestamp)) < 2000
          )
          if (isDuplicate) return prev
          return [...prev, { ...incoming, timestamp: incoming.timestamp || new Date().toISOString() }]
        })
      }
    }
    socketService.onGroupMessageReceived(handleMsg)
    return () => { socketService.off('groupMessageReceived', handleMsg) }
  }, [selectedGroup])

  // Deadline socket listeners
  useEffect(() => {
    if (!selectedGroup) return

    const handleDeadlineCreated = (data) => {
      setDeadlines(prev => {
        if (prev.some(d => d._id === data.deadline._id)) return prev
        return [...prev, data.deadline]
      })
      toast(`New deadline: ${data.deadline.title}`, { icon: '📅' })
    }

    const handleDeadlineUpdated = (data) => {
      setDeadlines(prev => prev.map(d => d._id === data.deadline._id ? data.deadline : d))
    }

    const handleDeadlineDeleted = (data) => {
      setDeadlines(prev => prev.filter(d => d._id !== data.deadlineId))
    }

    const handleDeadlineCompleted = (data) => {
      setDeadlines(prev => prev.map(d => d._id === data.deadline._id ? data.deadline : d))
    }

    const handleDeadlineReminder = (data) => {
      // Toast is handled by global listener in useFocusStore
    }

    socketService.onDeadlineCreated(handleDeadlineCreated)
    socketService.onDeadlineUpdated(handleDeadlineUpdated)
    socketService.onDeadlineDeleted(handleDeadlineDeleted)
    socketService.onDeadlineCompleted(handleDeadlineCompleted)
    socketService.onDeadlineReminder(handleDeadlineReminder)

    return () => {
      socketService.off('deadlineCreated', handleDeadlineCreated)
      socketService.off('deadlineUpdated', handleDeadlineUpdated)
      socketService.off('deadlineDeleted', handleDeadlineDeleted)
      socketService.off('deadlineCompleted', handleDeadlineCompleted)
      socketService.off('deadlineReminder', handleDeadlineReminder)
    }
  }, [selectedGroup])

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const fetchUserGroups = async () => {
    setLoading(true)
    try {
      const res = await groupAPI.getUserGroups()
      if (res.success) setLocalGroups(res.groups || [])
    } catch {
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) return toast.error('Enter a group name')
    setLoading(true)
    try {
      const res = await groupAPI.createGroup({ name: groupName })
      if (res.success) {
        toast.success('Group created!')
        setLocalGroups([...localGroups, res.group])
        setGroupName('')
        setShowCreateModal(false)
        joinGroupRoom(res.group._id)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (e) => {
    e.preventDefault()
    const code = groupCode.trim().toUpperCase().replace(/\s+/g, '')
    if (!code) return toast.error('Enter a group code')
    setLoading(true)
    try {
      const res = await groupAPI.joinGroupByCode({ code })
      if (res.success) {
        toast.success('Joined group!')
        setLocalGroups([...localGroups, res.group])
        setGroupCode('')
        setShowJoinModal(false)
        joinGroupRoom(res.group._id)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Group code copied!')
  }

  const isUserOnline = (userId) => onlineUsers.some(u => u.userId === userId)

  // ── Resource handlers ──
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedGroup) return
    if (file.type !== 'application/pdf') return toast.error('Only PDFs allowed')
    if (file.size > 10 * 1024 * 1024) return toast.error('Max 10MB')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', file.name)
      const cRes = await contentAPI.uploadFile(fd)
      if (cRes.success) {
        const rRes = await groupAPI.addResource(selectedGroup._id, {
          title: file.name, link: cRes.content.url, type: 'pdf'
        })
        if (rRes.success) {
          setSelectedGroup(rRes.group)
          setLocalGroups(prev => prev.map(g => g._id === selectedGroup._id ? rRes.group : g))
          toast.success('PDF uploaded!')
          e.target.value = ''
        }
      }
    } catch { toast.error('Upload failed') } finally { setLoading(false) }
  }

  const handleYoutubeAdd = async () => {
    if (!youtubeLink.trim()) return toast.error('Enter a YouTube URL')
    if (!selectedGroup) return
    setLoading(true)
    try {
      const res = await groupAPI.addResource(selectedGroup._id, {
        title: youtubeLink.trim(), link: youtubeLink.trim(), type: 'youtube'
      })
      if (res.success) {
        setSelectedGroup(res.group)
        setLocalGroups(prev => prev.map(g => g._id === selectedGroup._id ? res.group : g))
        setYoutubeLink('')
        pushNotification(`YouTube video added to ${selectedGroup.name}`, 'material')
        toast.success('Video added!')
      }
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const handleCodeAdd = async () => {
    if (!codeTitle.trim()) return toast.error('Enter a title')
    if (!selectedGroup) return
    setLoading(true)
    try {
      const res = await groupAPI.addResource(selectedGroup._id, {
        title: codeTitle.trim(), content: codeNotes, type: 'code'
      })
      if (res.success) {
        setSelectedGroup(res.group)
        setLocalGroups(prev => prev.map(g => g._id === selectedGroup._id ? res.group : g))
        setCodeTitle(''); setCodeNotes('')
        pushNotification(`Code notes added to ${selectedGroup.name}`, 'material')
        toast.success('Code notes added!')
      }
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const handleDeleteResource = async (resource) => {
    if (!selectedGroup) return
    openConfirm({
      title: 'Delete material',
      message: `Are you sure you want to remove "${resource.title}"?`,
      danger: true,
      onConfirm: async () => {
        setLoading(true)
        try {
          const res = await groupAPI.deleteResource(selectedGroup._id, resource.id)
          if (res.success) {
            setSelectedGroup(res.group)
            setLocalGroups(prev => prev.map(g => g._id === selectedGroup._id ? res.group : g))
            toast.success('Removed!')
          }
        } catch { toast.error('Failed') } finally { setLoading(false) }
      }
    })
  }

  const handleStartFocus = async (resource) => {
    const mins = materialTargets[resource.id] || targetMinutes || 25
    if (mins < 1) return toast.error('Set target time')
    const sid = await startSession({
      contentId: resource.id, contentType: resource.type,
      targetMinutes: mins, groupId: selectedGroup._id
    })
    setCurrentSession(sid)
    setViewingResource(resource)
    pushNotification(`Focus started on "${resource.title}" in ${selectedGroup.name} — ${mins} min`, 'focus')
    toast.success(`Focus started for ${mins} min!`)
  }

  const handleEndFocus = async () => {
    if (currentSessionId) {
      await endSession(currentSessionId, 'completed')
      toast.success('Session completed!')
    }
    setViewingResource(null)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedGroup || !user) return

    const msg = {
      senderId: user._id || user.id,
      senderName: user.name || user.username || 'User',
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    setChatMessages(prev => [...prev, msg])
    setNewMessage('')

    try {
      socketService.sendGroupMessage({
        groupId: selectedGroup._id,
        text: msg.text,
        senderId: msg.senderId,
        senderName: msg.senderName,
      })
    } catch {}
  }

  const handleExitGroup = async () => {
    if (!selectedGroup || !user) return
    openConfirm({
      title: 'Leave group',
      message: `Are you sure you want to leave "${selectedGroup.name}"?`,
      danger: true,
      onConfirm: async () => {
        setLoading(true)
        try {
          const res = await groupAPI.leaveGroup(selectedGroup._id)
          if (res.success) {
            toast.success('You left the group')
            socketService.leaveGroup(selectedGroup._id)
            setLocalGroups(prev => prev.filter(g => g._id !== selectedGroup._id))
            setSelectedGroup(null)
          }
        } catch (err) {
          toast.error(err.message || 'Failed to leave group')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return
    openConfirm({
      title: 'Delete group',
      message: `Are you sure you want to delete "${selectedGroup.name}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setLoading(true)
        try {
          const res = await groupAPI.deleteGroup(selectedGroup._id)
          if (res.success) {
            toast.success('Group deleted')
            socketService.leaveGroup(selectedGroup._id)
            setLocalGroups(prev => prev.filter(g => g._id !== selectedGroup._id))
            setSelectedGroup(null)
          }
        } catch (err) {
          toast.error(err.message || 'Failed to delete group')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const isGroupCreator = selectedGroup && user && (selectedGroup.createdBy?._id === user._id || selectedGroup.createdBy === user._id)

  // ── Deadline handlers ──
  const fetchDeadlines = async () => {
    if (!selectedGroup) return
    try {
      const res = await deadlineAPI.getGroupDeadlines(selectedGroup._id)
      if (res.success) setDeadlines(res.deadlines || [])
    } catch {}
  }

  useEffect(() => {
    if (selectedGroup) fetchDeadlines()
    else setDeadlines([])
    setShowDeadlineForm(false)
  }, [selectedGroup])

  const handleCreateDeadline = async (e) => {
    e.preventDefault()
    if (!deadlineTitle.trim()) return toast.error('Enter a title')
    if (!deadlineDate) return toast.error('Select a deadline date')
    if (!deadlineTime) return toast.error('Select a deadline time')
    if (!selectedGroup) return

    const [year, month, day] = deadlineDate.split('-').map(Number)
    const [hours, minutes] = deadlineTime.split(':').map(Number)
    const combined = new Date(year, month - 1, day, hours, minutes, 0, 0)
    if (isNaN(combined.getTime())) return toast.error('Invalid date/time')
    if (combined <= new Date()) return toast.error('Deadline must be in the future')

    setLoading(true)
    try {
      const res = await deadlineAPI.createDeadline(selectedGroup._id, {
        type: deadlineType,
        title: deadlineTitle.trim(),
        message: deadlineMessage.trim(),
        deadline: combined.toISOString(),
        reminderInterval,
      })
      if (res.success) {
        setDeadlineTitle('')
        setDeadlineMessage('')
        setDeadlineType('assignment')
        setDeadlineDate(getDefaultDeadlineDate())
        setDeadlineTime('23:59')
        setReminderInterval(60)
        setShowDeadlineForm(false)
        toast.success('Deadline created!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create deadline')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkCompleted = async (deadline) => {
    if (!selectedGroup) return
    const isCompleted = deadline.completedBy?.some(
      (c) => (c.userId?._id || c.userId) === (user._id || user.id)
    )
    try {
      const res = isCompleted
        ? await deadlineAPI.unmarkCompleted(selectedGroup._id, deadline._id)
        : await deadlineAPI.markCompleted(selectedGroup._id, deadline._id)
      if (res.success) {
        setDeadlines(prev => prev.map(d => d._id === deadline._id ? res.deadline : d))
        toast.success(isCompleted ? 'Unmarked as completed' : 'Marked as completed!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed')
    }
  }

  const handleDeleteDeadline = async (deadline) => {
    if (!selectedGroup) return
    openConfirm({
      title: 'Delete deadline',
      message: `Are you sure you want to delete deadline "${deadline.title}"?`,
      danger: true,
      onConfirm: async () => {
        try {
          const res = await deadlineAPI.deleteDeadline(selectedGroup._id, deadline._id)
          if (res.success) {
            setDeadlines(prev => prev.filter(d => d._id !== deadline._id))
            toast.success('Deadline deleted')
          }
        } catch (err) {
          toast.error(err.message || 'Failed')
        }
      }
    })
  }

  const getTimeRemaining = (deadlineDate) => {
    const now = new Date()
    const dl = new Date(deadlineDate)
    const diff = dl.getTime() - now.getTime()
    if (diff <= 0) return { expired: true, text: 'Expired' }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return { expired: false, text: `${days}d ${hours}h ${minutes}m`, urgent: days <= 1 }
    if (hours > 0) return { expired: false, text: `${hours}h ${minutes}m`, urgent: hours < 3 }
    return { expired: false, text: `${minutes}m`, urgent: true }
  }

  const deadlineTypeColors = {
    homework: 'bg-blue-100 text-blue-700 border-blue-200',
    project: 'bg-purple-100 text-purple-700 border-purple-200',
    announcement: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    test: 'bg-red-100 text-red-700 border-red-200',
    submission: 'bg-orange-100 text-orange-700 border-orange-200',
    assignment: 'bg-teal-100 text-teal-700 border-teal-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  const deadlineTypeIcons = {
    homework: '📚',
    project: '🚀',
    announcement: '📢',
    test: '📝',
    submission: '📤',
    assignment: '✏️',
    other: '📌',
  }

  const reminderOptions = [
    { value: 5, label: 'Every 5 min' },
    { value: 15, label: 'Every 15 min' },
    { value: 30, label: 'Every 30 min' },
    { value: 60, label: 'Every 1 hour' },
    { value: 120, label: 'Every 2 hours' },
    { value: 360, label: 'Every 6 hours' },
    { value: 1440, label: 'Every day' },
  ]

  const filteredGroups = localGroups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getResourceIcon = (type) => {
    if (type === 'pdf') return <FileText className="w-4 h-4" />
    if (type === 'youtube') return <Video className="w-4 h-4" />
    return <Code className="w-4 h-4" />
  }

  // ── LOADING ──
  if (loading && localGroups.length === 0) {
    return (
      <DoodleBackground>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal" />
        </div>
      </DoodleBackground>
    )
  }

  // ── MAIN LAYOUT ──
  return (
    <DoodleBackground>
      <div className="flex gap-0 h-[calc(100vh-120px)] rounded-3xl overflow-hidden bg-white/80 shadow-soft border border-white/70">

        {/* ── LEFT PANEL: Group List ── */}
        <div className={`flex flex-col border-r border-ink/10 ${selectedGroup ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96`}>
          {/* Header */}
          <div className="p-4 border-b border-ink/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-ink">Groups</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowJoinModal(true)}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors" title="Join Group">
                  <UserPlus className="w-4 h-4" />
                </button>
                <button onClick={() => setShowCreateModal(true)}
                  className="p-2 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors" title="Create Group">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-clay/50 border border-ink/10 text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          {/* Group List */}
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Users className="w-12 h-12 text-ink/20 mb-3" />
                <p className="text-sm text-ink/60">No groups yet</p>
                <button onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-sm font-semibold text-teal hover:underline">
                  Create your first group
                </button>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroup?._id === group._id
                const memberCount = group.members?.length || 0
                const resourceCount = group.resources?.length || 0
                return (
                  <button
                    key={group._id}
                    onClick={() => { setSelectedGroup(group); setChatMessages(group.chatMessages || []); setActiveTab('materials') }}
                    className={`w-full text-left p-4 border-b border-ink/5 hover:bg-clay/30 transition-colors ${isSelected ? 'bg-teal/10 border-l-4 border-l-teal' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal to-blue flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {group.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-ink truncate">{group.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-ink/50 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {memberCount}
                          </span>
                          <span className="text-xs text-ink/50 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {resourceCount}
                          </span>
                          <span className="text-xs font-mono text-teal">{group.code}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Group Details ── */}
        {selectedGroup ? (
          <div className={`flex-1 flex flex-col ${selectedGroup ? 'flex' : 'hidden md:flex'}`}>
            {/* Group Header */}
            <div className="flex items-center gap-2 p-3 border-b border-ink/10 bg-white/50 shrink-0">
              <button onClick={() => setSelectedGroup(null)}
                className="md:hidden p-1.5 rounded-full hover:bg-clay/50 transition-colors shrink-0">
                <ArrowLeft className="w-4 h-4 text-ink" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                {selectedGroup.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink truncate">{selectedGroup.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-teal">{selectedGroup.code}</span>
                  <button onClick={() => copyCode(selectedGroup.code)}
                    className="text-ink/40 hover:text-teal transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <button onClick={handleExitGroup}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
                  title="Exit Group">
                  <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exit</span>
                </button>
                {isGroupCreator && (
                  <button onClick={handleDeleteGroup}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    title="Delete Group">
                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
                {currentSessionId && (
                  <button onClick={handleEndFocus}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
                    <Square className="w-3.5 h-3.5" /> <span className="hidden sm:inline">End Focus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-ink/10 bg-white/30 shrink-0">
              {['materials', 'deadlines', 'members', 'chat'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab ? 'text-teal border-b-2 border-teal' : 'text-ink/50 hover:text-ink/80'
                  }`}>
                  {tab === 'deadlines' ? (
                    <span className="flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {tab}
                    </span>
                  ) : tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* ── MATERIALS TAB ── */}
              {activeTab === 'materials' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Upload Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-ink/15 hover:border-teal/50 bg-clay/20 cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-ink/40 mb-1" />
                      <span className="text-xs font-medium text-ink/60">Upload PDF</span>
                      <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                    </label>
                    <div className="flex flex-col p-4 rounded-2xl border border-ink/10 bg-clay/20">
                      <span className="text-xs font-medium text-ink/60 mb-2">YouTube Link</span>
                      <input value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)}
                        placeholder="https://youtube.com/..." className="text-xs rounded-lg border border-ink/10 px-2 py-1.5 mb-2 focus:outline-none focus:border-teal" />
                      <button onClick={handleYoutubeAdd} disabled={!youtubeLink.trim() || loading}
                        className="text-xs font-semibold text-sand bg-ink rounded-lg py-1.5 hover:bg-ink/90 disabled:opacity-40 transition-colors">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-col p-4 rounded-2xl border border-ink/10 bg-clay/20">
                      <span className="text-xs font-medium text-ink/60 mb-2">Code Notes</span>
                      <input value={codeTitle} onChange={(e) => setCodeTitle(e.target.value)}
                        placeholder="Title" className="text-xs rounded-lg border border-ink/10 px-2 py-1.5 mb-1 focus:outline-none focus:border-teal" />
                      <textarea value={codeNotes} onChange={(e) => setCodeNotes(e.target.value)}
                        placeholder="Notes or snippet..." rows={2}
                        className="text-xs rounded-lg border border-ink/10 px-2 py-1.5 mb-2 font-mono focus:outline-none focus:border-teal resize-none" />
                      <button onClick={handleCodeAdd} disabled={!codeTitle.trim() || loading}
                        className="text-xs font-semibold text-sand bg-ink rounded-lg py-1.5 hover:bg-ink/90 disabled:opacity-40 transition-colors">
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Materials List */}
                  {selectedGroup.resources && selectedGroup.resources.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGroup.resources.map((r) => {
                        const isViewing = viewingResource?.id === r.id && currentSessionId
                        const isLocated = locatedResourceId === r.id
                        return (
                          <div id={`group-resource-${r.id}`} key={r.id} className={`flex items-center gap-3 p-3 rounded-2xl bg-white border transition-all ${
                            isLocated ? 'border-yellow-400 ring-2 ring-yellow-200 shadow-md' : isViewing ? 'border-teal ring-2 ring-teal/20' : 'border-ink/10 hover:shadow-sm'
                          }`}>
                            <div className="p-2 rounded-xl bg-clay/50 shrink-0">
                              {getResourceIcon(r.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">{r.title}</p>
                              <p className="text-xs text-ink/50 capitalize">{r.type}</p>
                              {isLocated && (
                                <p className="mt-1 text-[11px] font-semibold text-yellow-600">Located from search</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={materialTargets[r.id] || 25}
                                  onChange={(e) => setMaterialTargets(prev => ({
                                    ...prev, [r.id]: Math.max(1, Number(e.target.value) || 25)
                                  }))}
                                  className="w-12 rounded-lg border border-ink/15 px-1.5 py-1 text-xs text-center focus:border-teal focus:outline-none"
                                />
                                <span className="text-[10px] text-ink/50">min</span>
                              </div>
                              {isViewing ? (
                                <button onClick={handleEndFocus}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
                                  <Square className="w-3 h-3" /> End
                                </button>
                              ) : (
                                <button onClick={() => handleStartFocus(r)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-ink text-sand text-xs font-semibold hover:bg-ink/90 transition-colors">
                                  <Play className="w-3 h-3" /> Focus
                                </button>
                              )}
                              <button onClick={() => handleDeleteResource(r)}
                                className="p-1.5 rounded-full hover:bg-red-50 text-ink/30 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="w-10 h-10 text-ink/20 mx-auto mb-2" />
                      <p className="text-sm text-ink/50">No materials yet. Add PDFs, videos, or code notes above.</p>
                    </div>
                  )}

                  {/* ── Material Viewer ── */}
                  {viewingResource && currentSessionId && (
                    <div className="mt-4 rounded-2xl border border-ink/10 bg-white overflow-hidden">
                      <div className="flex items-center justify-between p-3 border-b border-ink/10 bg-clay/30">
                        <div className="flex items-center gap-2 min-w-0">
                          {getResourceIcon(viewingResource.type)}
                          <div>
                            <p className="text-sm font-semibold text-ink truncate">{viewingResource.title}</p>
                            {activeSession && (
                              <p className="text-xs font-medium text-accent">
                                {(() => {
                                  const remaining = Math.max(0, (activeSession.targetMinutes || 25) * 60 - (activeSession.elapsedSeconds || 0))
                                  const mins = Math.floor(remaining / 60)
                                  const secs = remaining % 60
                                  return `Remaining: ${mins}:${secs.toString().padStart(2, '0')}`
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                        <button onClick={handleEndFocus}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
                          <Square className="w-3 h-3" /> End
                        </button>
                      </div>
                      {viewingResource.type === 'youtube' ? (
                        <iframe
                          title={viewingResource.title}
                          src={(() => {
                            const url = viewingResource.link || viewingResource.url || ''
                            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&\n?#]+)/)
                            return match ? `https://www.youtube.com/embed/${match[1]}` : url
                          })()}
                          className="aspect-video w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : viewingResource.type === 'code' ? (
                        <textarea
                          value={viewingResource.content || viewingResource.notes || ''}
                          readOnly
                          className="h-[400px] w-full bg-ink/5 p-4 font-mono text-sm text-ink"
                        />
                      ) : (
                        <iframe
                          src={viewingResource.link || viewingResource.url}
                          title={viewingResource.title}
                          className="h-[400px] w-full border-0"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── DEADLINES TAB ── */}
              {activeTab === 'deadlines' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                  {/* Add Deadline Button */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-ink">Deadlines</h4>
                    <button onClick={() => {
                      if (!showDeadlineForm) {
                        setDeadlineDate(getDefaultDeadlineDate())
                        setDeadlineTime('23:59')
                        setDeadlineType('assignment')
                        setReminderInterval(60)
                      }
                      setShowDeadlineForm(!showDeadlineForm)
                    }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 transition-colors shadow-sm">
                      <Plus className="w-4 h-4" /> Add Deadline
                    </button>
                  </div>

                  {/* Deadline Form */}
                  {showDeadlineForm && (
                    <form onSubmit={handleCreateDeadline} className="p-4 rounded-2xl border border-ink/10 bg-white space-y-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-teal" />
                        <span className="text-sm font-bold text-ink">New Deadline</span>
                      </div>

                      {/* Type selector */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(deadlineTypeColors).map((type) => (
                          <button key={type} type="button"
                            onClick={() => setDeadlineType(type)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              deadlineType === type
                                ? deadlineTypeColors[type] + ' ring-2 ring-offset-1 ring-teal'
                                : 'bg-clay/30 text-ink/50 border-ink/10 hover:bg-clay/50'
                            }`}>
                            {deadlineTypeIcons[type]} {type}
                          </button>
                        ))}
                      </div>

                      {/* Title */}
                      <input type="text" value={deadlineTitle} onChange={(e) => setDeadlineTitle(e.target.value)}
                        placeholder="Deadline title (e.g. Chapter 5 Homework)"
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50" />

                      {/* Message */}
                      <textarea value={deadlineMessage} onChange={(e) => setDeadlineMessage(e.target.value)}
                        placeholder="Description or instructions (optional)" rows={2}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 resize-none" />

                      {/* Date & Time */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-ink/50 mb-1 block">Deadline Date</label>
                          <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)}
                            min={getMinDate()}
                            className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50" />
                        </div>
                        <div>
                          <label className="text-xs text-ink/50 mb-1 block">Deadline Time</label>
                          <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)}
                            className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50" />
                        </div>
                      </div>

                      {/* Reminder interval */}
                      <div>
                        <label className="text-xs text-ink/50 mb-1 block flex items-center gap-1">
                          <Bell className="w-3 h-3" /> Remind every
                        </label>
                        <select value={reminderInterval} onChange={(e) => setReminderInterval(Number(e.target.value))}
                          className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50">
                          {reminderOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowDeadlineForm(false)}
                          className="flex-1 rounded-xl border border-ink/20 py-2 text-sm font-semibold text-ink hover:bg-clay/50">
                          Cancel
                        </button>
                        <button type="submit" disabled={loading || !deadlineTitle.trim() || !deadlineDate || !deadlineTime}
                          className="flex-1 rounded-xl bg-ink py-2 text-sm font-semibold text-sand hover:bg-ink/90 disabled:opacity-50">
                          {loading ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Deadlines List */}
                  {deadlines.length > 0 ? (
                    <div className="space-y-3">
                      {deadlines.map((dl) => {
                        const remaining = getTimeRemaining(dl.deadline)
                        const isCompleted = dl.completedBy?.some(
                          (c) => (c.userId?._id || c.userId) === (user._id || user.id)
                        )
                        const completedCount = dl.completedBy?.length || 0
                        const totalMembers = selectedGroup.members?.length || 1
                        const isPoster = (dl.postedBy?._id || dl.postedBy) === (user._id || user.id)

                        return (
                          <div key={dl._id} className={`p-4 rounded-2xl border bg-white transition-all ${
                            remaining.expired ? 'border-red-200 opacity-70' :
                            remaining.urgent ? 'border-orange-300 ring-1 ring-orange-200' :
                            'border-ink/10 hover:shadow-sm'
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="text-lg shrink-0">{deadlineTypeIcons[dl.type]}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-ink truncate">{dl.title}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${deadlineTypeColors[dl.type]}`}>
                                      {dl.type}
                                    </span>
                                    {isCompleted && (
                                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    )}
                                  </div>
                                  {dl.message && (
                                    <p className="text-xs text-ink/60 mt-1 line-clamp-2">{dl.message}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className={`flex items-center gap-1 text-xs font-medium ${
                                      remaining.expired ? 'text-red-500' : remaining.urgent ? 'text-orange-500' : 'text-ink/60'
                                    }`}>
                                      {remaining.expired ? (
                                        <AlertTriangle className="w-3 h-3" />
                                      ) : (
                                        <Clock className="w-3 h-3" />
                                      )}
                                      {remaining.text}
                                    </span>
                                    <span className="text-xs text-ink/40 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(dl.deadline).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                      })}
                                    </span>
                                    <span className="text-xs text-ink/40">
                                      by {dl.postedBy?.name || dl.postedBy?.username || 'Unknown'}
                                    </span>
                                  </div>
                                  {completedCount > 0 && (
                                    <p className="text-[10px] text-green-600 mt-1.5">
                                      ✓ {completedCount}/{totalMembers} completed
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => handleMarkCompleted(dl)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    isCompleted
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-clay/50 text-ink/60 hover:bg-clay hover:text-ink'
                                  }`}>
                                  <CheckCircle2 className="w-3 h-3" />
                                  {isCompleted ? 'Done' : 'Complete'}
                                </button>
                                {(isPoster || isGroupCreator) && (
                                  <button onClick={() => handleDeleteDeadline(dl)}
                                    className="p-1.5 rounded-full hover:bg-red-50 text-ink/30 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Clock className="w-10 h-10 text-ink/20 mx-auto mb-2" />
                      <p className="text-sm text-ink/50">No deadlines yet. Add one to keep the group on track!</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── MEMBERS TAB ── */}
              {activeTab === 'members' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-sm text-ink/50 mb-3">{selectedGroup.members?.length || 0} members</p>
                  <div className="space-y-2">
                    {selectedGroup.members?.map((member) => {
                      const u = member.userId || member
                      const online = isUserOnline(u._id)
                      return (
                        <div key={u._id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-ink/10">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-blue flex items-center justify-center text-white font-bold text-sm">
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-ink text-sm truncate">{u.name || u.username}</p>
                            <p className="text-xs text-ink/50">{online ? 'Online' : 'Offline'}</p>
                          </div>
                          <span className="text-sm font-bold text-teal">{u.focusScore || 0}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── CHAT TAB ── */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {chatMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-ink/40 text-sm italic">
                        No messages yet. Start chatting!
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isMine = msg.senderId === (user._id || user.id)
                        const isLocated = locatedMessageTimestamp === msg.timestamp
                        return (
                          <div id={`group-message-${msg.timestamp}`} key={i} className={`flex flex-col max-w-[75%] ${isMine ? 'ml-auto items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-ink/40 mb-0.5 px-1">{msg.senderName}</span>
                            <div className={`px-3 py-2 rounded-2xl text-sm ${
                              isLocated
                                ? 'bg-yellow-100 border-2 border-yellow-400 text-ink shadow-md'
                                : isMine ? 'bg-teal/20 text-ink rounded-br-sm' : 'bg-white border border-ink/10 text-ink rounded-bl-sm'
                            }`}>
                              {msg.text}
                            </div>
                            {isLocated && (
                              <span className="text-[10px] font-semibold text-yellow-600 mt-0.5 px-1">Located from search</span>
                            )}
                            <span className="text-[10px] text-ink/30 mt-0.5 px-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-ink/10 bg-white/50 flex items-center gap-2 shrink-0">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-clay/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                    <button type="submit" disabled={!newMessage.trim()}
                      className="p-2.5 rounded-full bg-ink text-sand hover:bg-ink/90 disabled:opacity-40 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No group selected */
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <Users className="w-16 h-16 text-ink/15 mx-auto mb-3" />
              <p className="text-ink/40 text-sm">Select a group to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Group Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-ink mb-4">Create Group</h3>
            <form onSubmit={handleCreateGroup}>
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name" className="w-full rounded-xl border border-ink/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50" />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-ink/20 py-2.5 text-sm font-semibold text-ink hover:bg-clay/50">Cancel</button>
                <button type="submit" disabled={loading || !groupName.trim()}
                  className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-semibold text-sand hover:bg-ink/90 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Join Group Modal ── */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-ink mb-4">Join Group</h3>
            <form onSubmit={handleJoinGroup}>
              <input type="text" value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                placeholder="Group code (e.g. ABCD1234)" maxLength={8}
                className="w-full rounded-xl border border-ink/20 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue/50" />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowJoinModal(false)}
                  className="flex-1 rounded-xl border border-ink/20 py-2.5 text-sm font-semibold text-ink hover:bg-clay/50">Cancel</button>
                <button type="submit" disabled={loading || groupCode.length < 6}
                  className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                  {loading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Delete"
        cancelText="Cancel"
        danger={confirmConfig.danger}
        onConfirm={() => { setConfirmOpen(false); confirmConfig.onConfirm?.() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </DoodleBackground>
  )
}
