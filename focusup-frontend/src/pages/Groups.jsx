import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { groupAPI, contentAPI } from '../services/api'
import { socketService } from '../services/socket'
import { useFocusStore } from '../store/useFocusStore'
import { toast } from 'react-hot-toast'
import {
  Users, Copy, Plus, Trash2, Upload, Play, Square,
  FileText, Video, Code, Send, ArrowLeft, Search, UserPlus
} from 'lucide-react'

export const Groups = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    groups, onlineUsers, joinGroupRoom, leaveGroupRoom,
    startSession, endSession, setCurrentSession, currentSessionId, user
  } = useFocusStore()

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

  useEffect(() => { fetchUserGroups() }, [])

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
    // Load saved messages for this group
    try {
      const saved = localStorage.getItem(`chat_${selectedGroup._id}`)
      if (saved) setChatMessages(JSON.parse(saved))
      else setChatMessages([])
    } catch { setChatMessages([]) }

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

  // Persist messages to localStorage
  useEffect(() => {
    if (selectedGroup && chatMessages.length > 0) {
      try {
        localStorage.setItem(`chat_${selectedGroup._id}`, JSON.stringify(chatMessages))
      } catch {}
    }
  }, [chatMessages, selectedGroup])

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
        toast.success('Code notes added!')
      }
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const handleDeleteResource = async (resource) => {
    if (!selectedGroup) return
    if (!window.confirm(`Remove "${resource.title}"?`)) return
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

  const handleStartFocus = (resource) => {
    const mins = materialTargets[resource.id] || targetMinutes || 25
    if (mins < 1) return toast.error('Set target time')
    const sid = startSession({
      contentId: resource.id, contentType: resource.type,
      targetMinutes: mins, groupId: selectedGroup._id
    })
    setCurrentSession(sid)
    setViewingResource(resource)
    toast.success(`Focus started for ${mins} min!`)
  }

  const handleEndFocus = () => {
    if (currentSessionId) {
      endSession(currentSessionId, 'completed')
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
            <div className="flex items-center gap-3 p-4 border-b border-ink/10 bg-white/50">
              <button onClick={() => setSelectedGroup(null)}
                className="md:hidden p-2 rounded-full hover:bg-clay/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-ink" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-blue flex items-center justify-center text-white font-bold shrink-0">
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
              {currentSessionId && (
                <button onClick={handleEndFocus}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                  <Square className="w-4 h-4" /> End Focus
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-ink/10 bg-white/30">
              {['materials', 'members', 'chat'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab ? 'text-teal border-b-2 border-teal' : 'text-ink/50 hover:text-ink/80'
                  }`}>
                  {tab}
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
                        return (
                          <div key={r.id} className={`flex items-center gap-3 p-3 rounded-2xl bg-white border transition-all ${
                            isViewing ? 'border-teal ring-2 ring-teal/20' : 'border-ink/10 hover:shadow-sm'
                          }`}>
                            <div className="p-2 rounded-xl bg-clay/50 shrink-0">
                              {getResourceIcon(r.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">{r.title}</p>
                              <p className="text-xs text-ink/50 capitalize">{r.type}</p>
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
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal text-white text-xs font-semibold hover:bg-teal-600 transition-colors">
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
                          <p className="text-sm font-semibold text-ink truncate">{viewingResource.title}</p>
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
                        return (
                          <div key={i} className={`flex flex-col max-w-[75%] ${isMine ? 'ml-auto items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-ink/40 mb-0.5 px-1">{msg.senderName}</span>
                            <div className={`px-3 py-2 rounded-2xl text-sm ${
                              isMine ? 'bg-teal/20 text-ink rounded-br-sm' : 'bg-white border border-ink/10 text-ink rounded-bl-sm'
                            }`}>
                              {msg.text}
                            </div>
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
                      className="p-2.5 rounded-full bg-teal text-white hover:bg-teal-600 disabled:opacity-40 transition-colors">
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
                  className="flex-1 rounded-xl bg-teal py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50">
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
    </DoodleBackground>
  )
}
