import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { groupAPI, contentAPI } from '../services/api'
import { useFocusStore } from '../store/useFocusStore'
import { useSessionTimer } from '../hooks/useSessionTimer'
import { toast } from 'react-hot-toast'
import { Users, Copy, Plus, LogOut, Trash2, Wifi, Upload, Link, Play, Timer, FileText, Video, Code, Send } from 'lucide-react'
import { socketService } from '../services/socket'

export const Groups = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { 
    groups, 
    onlineUsers, 
    joinGroupRoom, 
    leaveGroupRoom, 
    pushNotification,
    startSession,
    endSession,
    setCurrentSession,
    currentSessionId,
    user
  } = useFocusStore()
  
  const [localGroups, setLocalGroups] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState(null)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  
  // Chat states
  const [activeTab, setActiveTab] = useState('materials') // 'materials' | 'chat'
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  
  // Resource management states
  const [showAddResourceModal, setShowAddResourceModal] = useState(false)
  const [selectedGroupForResource, setSelectedGroupForResource] = useState(null)
  const [resourceType, setResourceType] = useState('pdf') // 'pdf', 'youtube', 'code'
  const [resourceTitle, setResourceTitle] = useState('')
  const [youtubeLink, setYoutubeLink] = useState('')
  const [codeNotes, setCodeNotes] = useState('')
  const [codeTitle, setCodeTitle] = useState('')
  
  // Study session states
  const [studyMode, setStudyMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [locatedResourceId, setLocatedResourceId] = useState(null)
  const [targetMinutes, setTargetMinutes] = useState(25)
  const [activeStudyGroup, setActiveStudyGroup] = useState(null)

  // Session timer hook
  useSessionTimer(currentSessionId, targetMinutes, () => {
    if (!currentSessionId) return
    endSession(currentSessionId, 'completed')
    toast.success('Study session completed! Focus score updated.')
    setStudyMode(false)
    setPreviewMode(false)
    setSelectedResource(null)
    setActiveStudyGroup(null)
  })

  // Memoized embed URL for selected content (same logic as Learn component)
  const embedUrl = useMemo(() => {
    if (!selectedResource) return ''
    if (selectedResource.type === 'youtube') {
      // Handle different YouTube URL formats
      let videoId = selectedResource.url
      if (selectedResource.url.includes('watch?v=')) {
        videoId = selectedResource.url.split('v=')[1]?.split('&')[0]
      } else if (selectedResource.url.includes('youtu.be/')) {
        videoId = selectedResource.url.split('youtu.be/')[1]?.split('?')[0]
      } else if (selectedResource.url.includes('/embed/')) {
        videoId = selectedResource.url.split('/embed/')[1]?.split('?')[0]
      }
      return `https://www.youtube.com/embed/${videoId}`
    }
    return selectedResource.url
  }, [selectedResource])

  useEffect(() => {
    fetchUserGroups()
  }, [])

  // Sync with global state groups
  useEffect(() => {
    setLocalGroups(groups)
  }, [groups])

  useEffect(() => {
    const openGroupId = location.state?.openGroupId
    const openResourceId = location.state?.openResourceId
    const locateOnly = Boolean(location.state?.locateOnly)
    const previewOnly = Boolean(location.state?.previewOnly)

    if (!openGroupId || !openResourceId || localGroups.length === 0) return

    const targetGroup = localGroups.find((group) => String(group._id) === String(openGroupId))
    if (!targetGroup) return

    const groupResources = Array.isArray(targetGroup.resources) ? targetGroup.resources : []
    const targetResource = groupResources.find(
      (resource) => String(resource.id || resource._id) === String(openResourceId)
    )
    if (!targetResource) return

    const normalizedType = (() => {
      const type = String(targetResource.type || '').toLowerCase()
      if (type === 'pdf' || type === 'youtube' || type === 'code') return type
      if (type === 'note') return 'code'
      const link = targetResource.link || targetResource.url || ''
      if (typeof link === 'string' && (link.includes('youtube.com') || link.includes('youtu.be'))) return 'youtube'
      return 'pdf'
    })()

    setSelectedGroupForDetails(targetGroup)
    setShowGroupDetails(true)

    if (locateOnly) {
      const resolvedResourceId = targetResource.id || targetResource._id
      setLocatedResourceId(String(resolvedResourceId))
      setSelectedResource(null)
      setActiveStudyGroup(targetGroup)
      setStudyMode(false)
      setPreviewMode(false)
      toast.success(`Located in Group "${targetGroup.name}" materials.`)
      setTimeout(() => {
        const target = document.getElementById(`group-resource-${resolvedResourceId}`)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 60)
      navigate('/groups', { replace: true, state: {} })
      return
    }

    setSelectedResource({
      ...targetResource,
      id: targetResource.id || targetResource._id,
      title: targetResource.title || targetResource.name || 'Untitled resource',
      type: normalizedType,
      url: targetResource.link || targetResource.url || '',
      notes: targetResource.content || targetResource.notes || '',
    })
    setActiveStudyGroup(targetGroup)
    setStudyMode(!previewOnly)
    setPreviewMode(previewOnly)

    navigate('/groups', { replace: true, state: {} })
  }, [location.state, localGroups, navigate])

  // Join group rooms for real-time communication
  useEffect(() => {
    localGroups.forEach(group => {
      if (group._id) {
        joinGroupRoom(group._id)
      }
    })

    // Cleanup function to leave rooms when component unmounts
    return () => {
      localGroups.forEach(group => {
        if (group._id) {
          leaveGroupRoom(group._id)
        }
      })
    }
  }, [localGroups, joinGroupRoom, leaveGroupRoom])

  // Chat socket listeners
  useEffect(() => {
    if (showGroupDetails && selectedGroupForDetails) {
      const handleNewMessage = (data) => {
        if (data.groupId === selectedGroupForDetails._id) {
          setChatMessages(prev => [...prev, data.message])
        }
      }
      socketService.onGroupMessageReceived(handleNewMessage)
      return () => {
        socketService.removeAllListeners('groupMessageReceived')
      }
    }
  }, [showGroupDetails, selectedGroupForDetails])

  // Helper function to check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId)
  }

  // Get updated focus score for online users
  const getLatestFocusScore = (userId, defaultScore) => {
    const onlineUser = onlineUsers.find(user => user.userId === userId)
    return onlineUser ? onlineUser.focusScore : defaultScore
  }

  const fetchUserGroups = async () => {
    setLoading(true)
    try {
      const response = await groupAPI.getUserGroups()
      if (response.success) {
        setLocalGroups(response.groups || [])
      }
    } catch (error) {
      console.error('Fetch groups error:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setLoading(true)
    try {
      const response = await groupAPI.createGroup({ name: groupName })
      if (response.success) {
        toast.success('Group created successfully!')
        setLocalGroups([...localGroups, response.group])
        setGroupName('')
        setShowCreateModal(false)
        joinGroupRoom(response.group._id)
      }
    } catch (error) {
      console.error('Create group error:', error)
      toast.error(error.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (e) => {
    e.preventDefault()
    const normalizedCode = groupCode.trim().toUpperCase().replace(/\s+/g, '')

    if (!normalizedCode) {
      toast.error('Please enter a group code')
      return
    }

    setLoading(true)
    try {
      const response = await groupAPI.joinGroupByCode({ code: normalizedCode })
      if (response.success) {
        toast.success('Joined group successfully!')
        setLocalGroups([...localGroups, response.group])
        setGroupCode('')
        setShowJoinModal(false)
        joinGroupRoom(response.group._id)
      }
    } catch (error) {
      console.error('Join group error:', error)
      toast.error(error.message || 'Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Group code copied!')
  }

  const openGroupDetails = (group) => {
    setSelectedGroupForDetails(group)
    setChatMessages(group.chatMessages || [])
    setActiveTab('materials')
    setShowGroupDetails(true)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedGroupForDetails || !user) return
    
    socketService.sendGroupMessage({
      groupId: selectedGroupForDetails._id,
      text: newMessage.trim(),
      senderId: user._id || user.id,
      senderName: user.name || user.username || 'User'
    })
    setNewMessage('')
  }

  const openAddResourceModal = (group) => {
    setSelectedGroupForResource(group)
    setShowAddResourceModal(true)
    setResourceType('pdf')
    setResourceTitle('')
    setYoutubeLink('')
    setCodeNotes('')
  }

  const startStudySession = (resource, group) => {
    setActiveStudyGroup(group)
    setSelectedResource(resource)
    setStudyMode(true)
    setPreviewMode(false)
    
    // Start the focus session timer
    const sessionId = Date.now().toString()
    startSession({
      id: sessionId,
      type: 'focus',
      targetMinutes: targetMinutes,
      startTime: Date.now(),
      status: 'active',
      groupId: group._id,
      resourceId: resource.id,
      contentId: resource.id,
      contentType: resource.type,
    })
    
    setCurrentSession(sessionId)
    toast.success(`Started ${targetMinutes}-minute study session!`)
  }

  const endStudySession = () => {
    if (currentSessionId) {
      endSession(currentSessionId, 'completed')
      setCurrentSession(null)
      toast.success('Study session completed! Focus score updated.')
    }
    setStudyMode(false)
    setPreviewMode(false)
    setSelectedResource(null)
    setActiveStudyGroup(null)
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return ''
    
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    const videoId = videoIdMatch?.[1]
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const renderPDFViewer = (content) => {
    if (!content) return null
    
    return (
      <iframe
        src={content}
        width="100%"
        height="600px"
        style={{ border: 'none' }}
        title="PDF Viewer"
      />
    )
  }

  const handleAddResource = async (e) => {
    e.preventDefault()
    
    if (!selectedGroupForResource) return
    
    let resourceData = {
      groupId: selectedGroupForResource._id,
      title: resourceTitle.trim(),
      type: resourceType
    }
    
    // Validate based on resource type
    if (resourceType === 'youtube') {
      if (!youtubeLink.trim()) {
        toast.error('Please enter a YouTube link')
        return
      }
      
      // Validate YouTube URL format
      const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/
      if (!youtubeRegex.test(youtubeLink.trim())) {
        toast.error('Please enter a valid YouTube URL')
        return
      }
      
      resourceData.link = youtubeLink.trim()
      resourceData.url = youtubeLink.trim()
    } else if (resourceType === 'code') {
      if (!resourceTitle.trim()) {
        toast.error('Please enter a title for the code resource')
        return
      }
      resourceData.content = codeNotes
      resourceData.notes = codeNotes
    } else if (resourceType === 'pdf') {
      const fileInput = document.getElementById('pdf-file')
      const file = fileInput?.files[0]
      
      if (!file) {
        toast.error('Please select a PDF file')
        return
      }
      
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB')
        return
      }

      // Upload the PDF to backend and then add as group resource
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', resourceTitle.trim() || file.name)

        const contentResp = await contentAPI.uploadFile(formData)
        if (contentResp.success) {
          resourceData.link = contentResp.content.url
          resourceData.url = contentResp.content.url
          resourceData.fileName = file.name
          resourceData.title = resourceTitle.trim() || file.name.replace('.pdf', '')
        } else {
          toast.error('Failed to upload file')
          return
        }
      } catch (err) {
        console.error('File upload failed:', err)
        toast.error('File upload failed')
        return
      }
    }
    
    setLoading(true)
    try {
      // Persist resource to backend
      const response = await groupAPI.addResource(selectedGroupForResource._id, resourceData)
      if (response.success) {
        // Update local groups state
        setLocalGroups(prev => prev.map(g => 
          g._id === selectedGroupForResource._id ? response.group : g
        ))
        if (selectedGroupForDetails?._id === selectedGroupForResource._id) {
          setSelectedGroupForDetails(response.group)
        }

        toast.success('Resource added successfully!')
        setShowAddResourceModal(false)
        // Reset form
        setResourceTitle('')
        setYoutubeLink('')
        setCodeNotes('')
      }
    } catch (error) {
      console.error('Add resource error:', error)
      toast.error('Failed to add resource')
    } finally {
      setLoading(false)
    }
  }

  const handleStartStudySession = (group, resource) => {
    if (!targetMinutes || targetMinutes <= 0) {
      toast.error('Please set a valid target time')
      return
    }
    
    const sessionId = startSession({ 
      contentId: resource.id, 
      contentType: resource.type,
      targetMinutes,
      groupId: group._id,
      resourceTitle: resource.title
    })
    
    setCurrentSession(sessionId)
    setStudyMode(true)
    setPreviewMode(false)
    setSelectedResource(resource)
    setActiveStudyGroup(group)
    toast.success('Study session started! Stay focused.')
  }

  const handleEndStudySession = () => {
    if (currentSessionId) {
      endSession(currentSessionId, 'completed')
    }
    setStudyMode(false)
    setPreviewMode(false)
    setSelectedResource(null)
    setActiveStudyGroup(null)
    toast.success('Study session completed!')
  }

  // Learn section-like handlers for group resources
  const handlePdfUpload = async (e, group) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    
    setLoading(true)
    try {
      // Upload file to backend (FormData)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)

      const contentResp = await contentAPI.uploadFile(formData)
      if (contentResp.success) {
        const content = contentResp.content
        const resourceData = {
          title: content.title,
          link: content.url,
          type: 'pdf'
        }

        const response = await groupAPI.addResource(group._id, resourceData)
        if (response.success) {
          // Update local groups state
          setLocalGroups(prev => prev.map(g => 
            g._id === group._id ? response.group : g
          ))
          // Update selected group for details if it's the same group
          if (selectedGroupForDetails?._id === group._id) {
            setSelectedGroupForDetails(response.group)
          }
          toast.success('PDF uploaded successfully! Ready for focus sessions.')
          // Reset file input
          e.target.value = ''
        }
      }
    } catch (error) {
      console.error('Upload PDF error:', error)
      toast.error(error.message || 'Failed to upload PDF')
    } finally {
      setLoading(false)
    }

  const handleYoutubeAdd = async (group) => {
    if (!youtubeLink.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }
    
    // Validate YouTube URL format
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/
    if (!youtubeRegex.test(youtubeLink.trim())) {
      toast.error('Please enter a valid YouTube URL')
      return
    }
    
    setLoading(true)
    try {
      const resourceData = {
        title: youtubeLink.trim(),
        link: youtubeLink.trim(),
        type: 'youtube'
      }
      
      const response = await groupAPI.addResource(group._id, resourceData)
      if (response.success) {
        // Update local groups state
        setLocalGroups(prev => prev.map(g => 
          g._id === group._id ? response.group : g
        ))
        // Update selected group for details if it's the same group
        if (selectedGroupForDetails?._id === group._id) {
          setSelectedGroupForDetails(response.group)
        }
        setYoutubeLink('')
        toast.success('YouTube video saved! Set a timer to start focus session.')
      }
    } catch (error) {
      console.error('Add YouTube error:', error)
      toast.error(error.message || 'Failed to add YouTube video')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeAdd = async (group) => {
    if (!codeTitle.trim()) {
      toast.error('Please enter a title for the code')
      return
    }
    
    setLoading(true)
    try {
      const resourceData = {
        title: codeTitle.trim(),
        content: codeNotes,
        type: 'code'
      }
      
      const response = await groupAPI.addResource(group._id, resourceData)
      if (response.success) {
        // Update local groups state
        setLocalGroups(prev => prev.map(g => 
          g._id === group._id ? response.group : g
        ))
        // Update selected group for details if it's the same group
        if (selectedGroupForDetails?._id === group._id) {
          setSelectedGroupForDetails(response.group)
        }
        setCodeTitle('')
        setCodeNotes('')
        toast.success('Code notes saved! Ready for focus tracking.')
      }
    } catch (error) {
      console.error('Add code error:', error)
      toast.error(error.message || 'Failed to add code notes')
    } finally {
      setLoading(false)
    }
  }

  const startGroupFocus = (group, resource) => {
    if (!targetMinutes || targetMinutes <= 0) {
      toast.error('Set a target time to start focus session.')
      return
    }
    
    if (!resource || !resource.id) {
      toast.error('Invalid resource selected.')
      return
    }
    
    const sessionId = startSession({ 
      contentId: resource.id, 
      contentType: resource.type,
      targetMinutes,
      groupId: group._id,
      resourceTitle: resource.title,
      resourceType: resource.type
    })
    
    setCurrentSession(sessionId)
    setStudyMode(true)
    setPreviewMode(false)
    setLocatedResourceId(null)
    setSelectedResource({
      ...resource,
      // Ensure we have the right URL field for display
      url: resource.link || resource.url,
      notes: resource.content || resource.notes
    })
    setActiveStudyGroup(group)
    toast.success(`Focus session started! Stay focused for ${targetMinutes} minutes.`, { 
      icon: '🎯',
      duration: 4000 
    })
  }
    setStudyMode(true)
    toast.success('Timer started. Stay active to grow your focus score.')
  }

  const stopGroupFocus = () => {
    if (currentSessionId) {
      endSession(currentSessionId, 'completed')
      toast.success('Focus session completed! Check your analytics.', { 
        icon: '📊',
        duration: 4000 
      })
    }
    setStudyMode(false)
    setPreviewMode(false)
    setSelectedResource(null)
    setActiveStudyGroup(null)
  }

  const deleteGroupResource = async (group, resource) => {
    const confirmed = window.confirm(`Remove "${resource.title}" from group materials?`)
    if (!confirmed) return
    
    setLoading(true)
    try {
      const response = await groupAPI.deleteResource(group._id, resource.id)
      
      if (response.success) {
        // Clean up blob URL if it's a PDF
        if (resource.type === 'pdf' && typeof resource.link === 'string' && resource.link.startsWith('blob:')) {
          URL.revokeObjectURL(resource.link)
        }
        
        // If the item being deleted is currently opened, close it
        if (selectedResource && selectedResource.id === resource.id) {
          setSelectedResource(null)
          setStudyMode(false)
          setActiveStudyGroup(null)
          if (currentSessionId) {
            endSession(currentSessionId, 'cancelled')
          }
        }
        
        // Update local groups state
        setLocalGroups(prev => prev.map(g => 
          g._id === group._id ? response.group : g
        ))
        
        // Update selected group for details if it's the same group
        if (selectedGroupForDetails?._id === group._id) {
          setSelectedGroupForDetails(response.group)
        }
        
        toast.success('Resource removed from group materials.')
      }
    } catch (error) {
      console.error('Delete resource error:', error)
      toast.error(error.message || 'Could not remove this item.')
    } finally {
      setLoading(false)
    }
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'youtube': return <Video className="w-5 h-5" />
      case 'code': return <Code className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getEmbedUrl = (resource) => {
    if (resource.type === 'youtube') {
      let videoId = ''
      
      // Handle different YouTube URL formats
      if (resource.url.includes('youtube.com/watch?v=')) {
        videoId = resource.url.split('v=')[1]?.split('&')[0]
      } else if (resource.url.includes('youtu.be/')) {
        videoId = resource.url.split('youtu.be/')[1]?.split('?')[0]
      } else if (resource.url.includes('youtube.com/embed/')) {
        videoId = resource.url.split('embed/')[1]?.split('?')[0]
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
      }
    }
    return resource.url
  }

  if (loading) {
    return (
      <DoodleBackground>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto"></div>
            <p className="mt-4 text-ink/60">Loading groups...</p>
          </div>
        </div>
      </DoodleBackground>
    )
  }

  return (
    <DoodleBackground>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold text-ink">My Groups</h2>
            <p className="mt-2 text-ink/70">Create groups or join existing ones to collaborate with others</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => setShowJoinModal(true)}
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 md:px-6 py-3 font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center"
            >
              <Plus className="w-5 h-5 mr-1 md:mr-2" />
              <span>Join Group</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-2xl bg-gradient-to-r from-teal-400 to-teal-600 px-4 md:px-6 py-3 font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center"
            >
              <Plus className="w-5 h-5 mr-1 md:mr-2" />
              <span>Create Group</span>
            </button>
          </div>
        </div>

        {/* Online Users Indicator */}
        {onlineUsers.length > 0 && (
          <div className="bg-white/80 rounded-3xl p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-ink">Online Users ({onlineUsers.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {onlineUsers.slice(0, 10).map((user) => (
                <div key={user.userId} className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-green-700">{user.username}</span>
                  <span className="text-teal-600 font-bold">{user.focusScore}</span>
                </div>
              ))}
              {onlineUsers.length > 10 && (
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                  +{onlineUsers.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localGroups.map((group) => (
            <div
              key={group._id}
              className="rounded-3xl bg-white/80 p-6 shadow-soft hover:shadow-medium transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-ink">{group.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(group.code)
                  }}
                  className="p-2 rounded-full bg-ink/10 hover:bg-ink/20 transition-colors"
                  title="Copy group code"
                >
                  <Copy className="w-4 h-4 text-ink/60" />
                </button>
              </div>

              <p className="text-sm text-ink/70 mb-4">{group.description || 'No description'}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider">Group Code</p>
                  <p className="text-lg font-mono font-bold text-teal">{group.code}</p>
                </div>

                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider">Members</p>
                  <p className="text-2xl font-bold text-ink">{group.members?.length || 0}</p>
                </div>
              </div>

              {group.members && group.members.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-ink/60 uppercase tracking-wider mb-2">Recent Members</p>
                  {group.members.slice(0, 3).map((member) => {
                    const userData = member.userId || member
                    const isOnline = isUserOnline(userData._id)
                    return (
                      <div key={member._id || userData._id} className="flex items-center gap-2 mb-1">
                        <div className="relative">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal to-blue flex items-center justify-center text-white text-xs font-bold">
                            {userData.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          {isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 border border-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-sm text-ink font-medium">{userData.name || userData.username}</span>
                        {isOnline && <Wifi className="w-3 h-3 text-green-500" />}
                      </div>
                    )
                  })}
                  {group.members.length > 3 && (
                    <p className="text-sm text-ink/60">+{group.members.length - 3} more</p>
                  )}
                </div>
              )}

              {/* Resources Section */}
              <div className="border-t border-ink/10 pt-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-ink/60 uppercase tracking-wider">Study Resources</p>
                  <button
                    onClick={() => openAddResourceModal(group)}
                    className="flex items-center gap-1 text-xs bg-teal-500 text-white px-2 py-1 rounded-full shadow-sm hover:bg-teal-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                
                {group.resources && group.resources.length > 0 ? (
                  <div className="space-y-2">
                    {group.resources.slice(0, 3).map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between bg-ink/5 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          {getResourceIcon(resource.type)}
                          <span className="text-sm text-ink font-medium">{resource.title}</span>
                        </div>
                        <button
                          onClick={() => handleStartStudySession(group, resource)}
                          className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Study
                        </button>
                      </div>
                    ))}
                    {group.resources.length > 3 && (
                      <p className="text-xs text-ink/60">+{group.resources.length - 3} more resources</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-ink/60 italic">No resources yet. Add PDFs, YouTube videos, or code notes!</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openGroupDetails(group)}
                  className="flex-1 rounded-2xl bg-ink/10 px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/20 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}

          {localGroups.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-ink/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-ink mb-2">No groups yet</h3>
              <p className="text-ink/70 mb-4">Create your first group or join an existing one to get started!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-2xl bg-gradient-to-r from-teal-400 to-teal-600 px-6 py-3 font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                Create Your First Group
              </button>
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-ink mb-6">Create New Group</h3>
              <form onSubmit={handleCreateGroup}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full rounded-2xl border border-ink/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal/50"
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-2xl border border-ink/20 px-4 py-3 font-semibold text-ink hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-teal-400 to-teal-600 px-4 py-3 font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-ink mb-6">Join Group</h3>
              <form onSubmit={handleJoinGroup}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-2">
                      Group Code
                    </label>
                    <input
                      type="text"
                      value={groupCode}
                        onChange={(e) => setGroupCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      className="w-full rounded-2xl border border-ink/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue/50 font-mono"
                      placeholder="Enter group code (e.g., CT4HXMAB)"
                      maxLength={8}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 rounded-2xl border border-ink/20 px-4 py-3 font-semibold text-ink hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || groupCode.length < 6}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Joining...' : 'Join Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Details Modal */}
        {showGroupDetails && selectedGroupForDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-2xl font-bold text-ink">{selectedGroupForDetails.name}</h3>
                <button
                  onClick={() => setShowGroupDetails(false)}
                  className="text-ink/50 hover:text-ink text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider mb-2">Group Code</p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-mono font-bold text-teal">{selectedGroupForDetails.code}</p>
                    <button
                      onClick={() => copyToClipboard(selectedGroupForDetails.code)}
                      className="p-2 rounded-full bg-teal/10 hover:bg-teal/20 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-teal" />
                    </button>
                  </div>
                </div>

                {/* Members */}
                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider mb-3">Members ({selectedGroupForDetails.members?.length || 0})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedGroupForDetails.members && selectedGroupForDetails.members.length > 0 ? (
                      selectedGroupForDetails.members.map((member) => {
                        const userData = member.userId || member
                        const isOnline = isUserOnline(userData._id)
                        const currentFocusScore = getLatestFocusScore(userData._id, userData.focusScore || 0)
                        
                        return (
                          <div key={member._id || userData._id} className="flex items-center justify-between p-3 rounded-xl bg-ink/5">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-blue flex items-center justify-center text-white font-bold">
                                  {userData.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                {isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-ink flex items-center gap-2">
                                  {userData.name}
                                  {isOnline && <Wifi className="w-4 h-4 text-green-500" />}
                                </p>
                                <p className="text-sm text-ink/60">@{userData.username || userData.email}</p>
                                {isOnline && <p className="text-xs text-green-600 font-medium">● Online</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-teal">{currentFocusScore}</p>
                              <p className="text-xs text-ink/60">Focus Score</p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-ink/60">No members yet</p>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-ink/10 mb-4">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                      activeTab === 'materials'
                        ? 'text-teal border-b-2 border-teal'
                        : 'text-ink/50 hover:text-ink/80'
                    }`}
                  >
                    Study Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                      activeTab === 'chat'
                        ? 'text-teal border-b-2 border-teal'
                        : 'text-ink/50 hover:text-ink/80'
                    }`}
                  >
                    Group Chat
                  </button>
                </div>

                {/* Learning Library Section */}
                {activeTab === 'materials' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-ink mb-1">Group Learning Library</h4>
                      <p className="text-sm text-ink/70">Upload PDFs or add YouTube links. Focus sessions always need a target timer.</p>
                    </div>
                  </div>

                  {/* Learning Interface - Same as Learn Section */}
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="rounded-3xl bg-white/85 p-5 shadow-soft">
                      <h5 className="text-lg font-semibold text-ink">Upload PDF</h5>
                      <p className="text-sm text-ink/70">Files stay local to this browser session.</p>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handlePdfUpload(e, selectedGroupForDetails)}
                        className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div className="rounded-3xl bg-white/85 p-5 shadow-soft">
                      <h5 className="text-lg font-semibold text-ink">Add YouTube link</h5>
                      <p className="text-sm text-ink/70">Videos open inside FocusUp so focus tracking works.</p>
                      <div className="mt-3 flex flex-col gap-2">
                        <input
                          value={youtubeLink}
                          onChange={(e) => setYoutubeLink(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm"
                        />
                        <button 
                          onClick={() => handleYoutubeAdd(selectedGroupForDetails)}
                          className="self-start rounded-full px-4 py-2 text-sm font-semibold text-sand shadow-soft bg-ink hover:bg-ink/90 transition-colors flex items-center gap-2"
                          disabled={loading || !youtubeLink.trim()}
                        >
                          <Video className="w-4 h-4" />
                          {loading ? 'Saving...' : 'Save Video'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="rounded-3xl bg-white/85 p-5 shadow-soft">
                      <h5 className="text-lg font-semibold text-ink">Coding study</h5>
                      <p className="text-sm text-ink/70">Track focused coding with notes or a snippet.</p>
                      <div className="mt-3 flex flex-col gap-2">
                        <input
                          value={codeTitle}
                          onChange={(e) => setCodeTitle(e.target.value)}
                          placeholder="Topic or challenge"
                          className="w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm"
                        />
                        <textarea
                          value={codeNotes}
                          onChange={(e) => setCodeNotes(e.target.value)}
                          placeholder="Notes, snippet, or TODOs"
                          className="h-24 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm font-mono"
                        />
                        <button 
                          onClick={() => handleCodeAdd(selectedGroupForDetails)}
                          className="self-start rounded-full px-4 py-2 text-sm font-semibold text-sand shadow-soft bg-ink hover:bg-ink/90 transition-colors flex items-center gap-2"
                          disabled={loading || !codeTitle.trim()}
                        >
                          <Code className="w-4 h-4" />
                          {loading ? 'Saving...' : 'Save Code Notes'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Your Materials Section - Same as Learn Section */}
                  <div className="rounded-3xl bg-white/80 p-5 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h5 className="text-lg font-semibold text-ink">Your group materials</h5>
                        <p className="text-sm text-ink/70">Everything starts empty. Add items above to begin.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-ink/70">Target (minutes)</label>
                        <input
                          type="number"
                          min={5}
                          value={targetMinutes}
                          onChange={(e) => setTargetMinutes(Number(e.target.value))}
                          className="w-24 rounded-2xl border border-ink/10 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    
                    {selectedGroupForDetails.resources && selectedGroupForDetails.resources.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedGroupForDetails.resources.map((resource) => (
                          <div
                            id={`group-resource-${resource.id || resource._id}`}
                            key={resource.id || resource._id}
                            className={`rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                              locatedResourceId === String(resource.id || resource._id)
                                ? 'border-teal-500 ring-2 ring-teal-200'
                                : 'border-ink/10'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="p-2 rounded-full bg-ink/10">
                                  {resource.type === 'pdf' && <FileText className="w-4 h-4 text-ink" />}
                                  {resource.type === 'youtube' && <Video className="w-4 h-4 text-red-600" />}
                                  {resource.type === 'code' && <Code className="w-4 h-4 text-blue-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-ink truncate" title={resource.title}>
                                    {resource.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-ink/60 capitalize">{resource.type}</span>
                                    <span className="rounded-full bg-teal/10 text-teal px-2 py-0.5 text-xs font-medium">
                                      Focus Ready
                                    </span>
                                    {locatedResourceId === String(resource.id || resource._id) && (
                                      <span className="rounded-full bg-teal/20 text-teal-800 px-2 py-0.5 text-xs font-semibold">
                                        Located from search
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteGroupResource(selectedGroupForDetails, resource)}
                                className="rounded-full border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 transition-colors"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => startGroupFocus(selectedGroupForDetails, resource)}
                              className="w-full rounded-full px-4 py-2 text-sm font-semibold text-sand shadow-soft bg-ink hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                              disabled={!targetMinutes || targetMinutes < 5}
                            >
                              <Play className="w-4 h-4" />
                              Start Learning ({targetMinutes}m)
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-clay/60 p-4 text-sm text-ink/70">
                        No content yet. Upload a PDF or add a YouTube link to start your first focus session.
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Chat Section */}
                {activeTab === 'chat' && (
                <div className="flex flex-col h-[500px] bg-ink/5 rounded-2xl border border-ink/10 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-ink/50 text-sm italic">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isMine = msg.senderId === (user._id || user.id)
                        return (
                          <div key={idx} className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                            <span className="text-xs text-ink/50 mb-1">{msg.senderName}</span>
                            <div className={`px-4 py-2 rounded-2xl ${isMine ? 'bg-teal-500 text-white rounded-br-sm' : 'bg-white border border-ink/10 text-ink rounded-bl-sm'}`}>
                              <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <span className="text-[10px] text-ink/40 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-ink/10 flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-ink/5 border border-ink/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 rounded-full bg-teal text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Add Resource Modal */}
        {showAddResourceModal && selectedGroupForResource && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-ink mb-6">Add Resource to {selectedGroupForResource.name}</h3>
              <form onSubmit={handleAddResource}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-2">Resource Type</label>
                    <select
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="w-full rounded-2xl border border-ink/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal/50"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="youtube">YouTube Video</option>
                      <option value="code">Code/Notes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-2">Title</label>
                    <input
                      type="text"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      className="w-full rounded-2xl border border-ink/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal/50"
                      placeholder="Resource title"
                      required={resourceType !== 'pdf'}
                    />
                  </div>

                  {resourceType === 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium text-ink/70 mb-2">PDF File</label>
                      <input
                        id="pdf-file"
                        type="file"
                        accept="application/pdf"
                        className="w-full rounded-2xl border border-ink/20 px-4 py-3"
                        required
                      />
                    </div>
                  )}

                  {resourceType === 'youtube' && (
                    <div>
                      <label className="block text-sm font-medium text-ink/70 mb-2">YouTube URL</label>
                      <input
                        type="url"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        className="w-full rounded-2xl border border-ink/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal/50"
                        placeholder="https://youtube.com/watch?v=..."
                        required
                      />
                    </div>
                  )}

                  {resourceType === 'code' && (
                    <div>
                      <label className="block text-sm font-medium text-ink/70 mb-2">Code/Notes</label>
                      <textarea
                        value={codeNotes}
                        onChange={(e) => setCodeNotes(e.target.value)}
                        className="w-full h-32 rounded-2xl border border-ink/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal/50 font-mono"
                        placeholder="Enter your code, notes, or study content..."
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddResourceModal(false)}
                    className="flex-1 rounded-2xl border border-ink/20 px-4 py-3 font-semibold text-ink hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-teal-400 to-teal-600 px-4 py-3 font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Resource'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Study Session Interface - Same as Learn Section */}
        {selectedResource && (studyMode || previewMode) && (
          <div className="rounded-3xl bg-white/90 p-5 shadow-soft mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">
                  {studyMode ? `Learning now in ${activeStudyGroup?.name}` : `Preview mode in ${activeStudyGroup?.name}`}
                </p>
                <h3 className="text-xl font-semibold text-ink">{selectedResource.title}</h3>
              </div>
              {studyMode ? (
                <button
                  onClick={stopGroupFocus}
                  className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                >
                  End session
                </button>
              ) : (
                <button
                  onClick={() => startGroupFocus(activeStudyGroup, selectedResource)}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand shadow-soft"
                >
                  Start focus study
                </button>
              )}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-sand shadow-inner">
              {selectedResource.type === 'youtube' ? (
                <iframe
                  title="YouTube"
                  src={embedUrl}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedResource.type === 'code' ? (
                <textarea
                  value={selectedResource.notes || ''}
                  readOnly
                  className="h-[520px] w-full bg-ink/5 p-4 font-mono text-sm text-ink"
                  aria-label="Code notes"
                />
              ) : (
                <embed src={embedUrl} type="application/pdf" className="h-[520px] w-full" />
              )}
            </div>
          </div>
        )}
      </div>
    </DoodleBackground>
  )
}