import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusStore } from '../store/useFocusStore'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { aiAPI } from '../services/api'

const WELCOME_MESSAGE = {
  sender: 'bot',
  text: '👋 Hi! I\'m your AI Study Buddy! I can help you:\n\n📚 Find study materials in your library & groups\n💡 Explain any topic you\'re learning\n🎯 Give motivation & study tips\n😄 Tell jokes to keep you energized!\n\nWhat would you like help with?'
}

const STORAGE_KEY = 'helpbot_chat_history'
const POS_KEY = 'helpbot_position'
const SIZE_KEY = 'helpbot_size'

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const saveHistory = (history) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)) } catch {}
}

const loadPosition = () => {
  try {
    const raw = localStorage.getItem(POS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const loadSize = () => {
  try {
    const raw = localStorage.getItem(SIZE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const truncate = (str, len) => str.length > len ? str.slice(0, len) + '...' : str

const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 520
const MIN_WIDTH = 280
const MIN_HEIGHT = 350
const MAX_WIDTH = 900
const MAX_HEIGHT = 800
const RESIZE_HANDLE = 8

export const HelpBot = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [voice, setVoice] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const savedPos = loadPosition()
  const savedSize = loadSize()
  const [position, setPosition] = useState(() => ({
    x: savedPos?.x ?? window.innerWidth - DEFAULT_WIDTH - 24,
    y: savedPos?.y ?? window.innerHeight - DEFAULT_HEIGHT - 24
  }))
  const [size, setSize] = useState(() => ({
    w: savedSize?.w ?? DEFAULT_WIDTH,
    h: savedSize?.h ?? DEFAULT_HEIGHT
  }))

  const [chatHistory, setChatHistory] = useState(() => {
    const saved = loadHistory()
    return saved.length > 0 ? saved : [{ id: generateId(), title: 'New Chat', messages: [WELCOME_MESSAGE], createdAt: Date.now() }]
  })
  const [activeChatId, setActiveChatId] = useState(() => chatHistory[0]?.id)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatRef = useRef(null)

  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const resizeRef = useRef({ resizing: false, edge: '', startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 })

  const contents = useFocusStore((s) => s.contents)
  const groups = useFocusStore((s) => s.groups)
  const language = useFocusStore((s) => s.language)
  const currentSessionId = useFocusStore((s) => s.currentSessionId)
  const sessions = useFocusStore((s) => s.sessions)
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const currentContent = currentSession ? contents.find(c => c.id === currentSession.contentId) : null

  const activeChat = chatHistory.find(c => c.id === activeChatId)
  const messages = activeChat?.messages || [WELCOME_MESSAGE]

  useEffect(() => { i18n.changeLanguage(language) }, [language, i18n])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (open && !showHistory) inputRef.current?.focus()
  }, [open, showHistory])

  useEffect(() => {
    if (!maximized && open) {
      try { localStorage.setItem(POS_KEY, JSON.stringify(position)) } catch {}
    }
  }, [position, maximized, open])

  useEffect(() => {
    if (!maximized && open) {
      try { localStorage.setItem(SIZE_KEY, JSON.stringify(size)) } catch {}
    }
  }, [size, maximized, open])

  const prevAuthRef = useRef(isAuthenticated)
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      const fresh = [{ id: generateId(), title: 'New Chat', messages: [WELCOME_MESSAGE], createdAt: Date.now() }]
      setChatHistory(fresh)
      setActiveChatId(fresh[0].id)
      setShowHistory(false)
      setInput('')
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated])

  const updateMessages = useCallback((updater) => {
    setChatHistory(prev => {
      const updated = prev.map(chat => {
        if (chat.id !== activeChatId) return chat
        const newMessages = typeof updater === 'function' ? updater(chat.messages) : updater
        const firstUserMsg = newMessages.find(m => m.sender === 'user')
        return { ...chat, messages: newMessages, title: firstUserMsg ? truncate(firstUserMsg.text, 35) : chat.title }
      })
      saveHistory(updated)
      return updated
    })
  }, [activeChatId])

  const speak = (text) => {
    if (!voice || !window.speechSynthesis) return
    const cleanText = text.replace(/[^\w\s.,!?'-]/g, '').replace(/\*\*/g, '')
    const utter = new SpeechSynthesisUtterance(cleanText)
    utter.lang = language.startsWith('es') ? 'es-ES' : 'en-US'
    window.speechSynthesis.speak(utter)
  }

  const handleMaterialClick = (material) => {
    if (material.groupId) {
      navigate(`/groups?groupId=${material.groupId}&resourceId=${material.contentId || material.id}`)
    } else if (material.contentId) {
      navigate('/learn', { state: { openContentId: material.contentId } })
    }
    updateMessages(prev => [...prev, { sender: 'bot', text: `🚀 Opening "${material.title}"! Happy studying! 📖` }])
  }

  const handleNewChat = () => {
    const newChat = { id: generateId(), title: 'New Chat', messages: [WELCOME_MESSAGE], createdAt: Date.now() }
    setChatHistory(prev => { const next = [newChat, ...prev]; saveHistory(next); return next })
    setActiveChatId(newChat.id)
    setShowHistory(false)
  }

  const handleDeleteChat = (chatId) => {
    setChatHistory(prev => {
      const next = prev.filter(c => c.id !== chatId)
      if (next.length === 0) {
        const fresh = { id: generateId(), title: 'New Chat', messages: [WELCOME_MESSAGE], createdAt: Date.now() }
        next.push(fresh)
        setActiveChatId(fresh.id)
      } else if (activeChatId === chatId) {
        setActiveChatId(next[0].id)
      }
      saveHistory(next)
      return next
    })
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMessage = { sender: 'user', text: input }
    updateMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)

    if (!isAuthenticated) {
      updateMessages(prev => [...prev, { sender: 'bot', text: '🔐 Please log in to use the AI HelpBot! I need access to your library and groups to help you find study materials.' }])
      setIsLoading(false)
      return
    }

    try {
      const sessionContext = currentContent ? {
        contentTitle: currentContent.title,
        contentType: currentContent.type,
        targetMinutes: currentSession?.targetMinutes
      } : null

      const currentMsgs = chatHistory.find(c => c.id === activeChatId)?.messages || []
      const response = await aiAPI.chat(userInput, sessionContext, currentMsgs.slice(-20))

      if (response.success) {
        const aiResponse = response.response
        const botMessage = { sender: 'bot', text: aiResponse.text, materials: aiResponse.materials || [], type: aiResponse.type }
        updateMessages(prev => [...prev, botMessage])
        speak(aiResponse.text)
      } else {
        console.warn('AI chat returned unsuccessful:', response.message)
        throw new Error(response.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('AI Chat Error:', error)
      const searchIntentRegex = /\b(find|search|where is|do i have|looking for|i want|show me|any pdf|pdf on|youtube tutorial|tutorial|find me|where can i find)\b/i
      let botMessage
      if (searchIntentRegex.test(userInput)) {
        botMessage = handleLocalSearch(userInput)
      } else {
        botMessage = { sender: 'bot', text: '🤖 I\'m having trouble connecting to my AI brain right now. Please try again in a moment!', materials: [] }
      }
      updateMessages(prev => [...prev, botMessage])
      speak(botMessage.text)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalSearch = (query) => {
    const lower = query.toLowerCase()
    const contentMatches = contents.filter(c => c.title?.toLowerCase().includes(lower) || c.type?.toLowerCase().includes(lower)).map(c => ({ title: c.title, type: c.type, location: 'Your Library', contentId: c.id }))
    const groupMatches = groups.flatMap(g => (g.resources || []).filter(r => r.title?.toLowerCase().includes(lower) || r.type?.toLowerCase().includes(lower)).map(r => ({ title: r.title, type: r.type || 'link', location: `Group: ${g.name}`, contentId: r.id, groupId: g._id || g.id })))
    const allMatches = [...contentMatches, ...groupMatches]
    if (allMatches.length > 0) return { sender: 'bot', text: `📚 Found ${allMatches.length} material(s) matching "${query}"! Click to start learning:`, materials: allMatches }
    return { sender: 'bot', text: `🔍 I couldn't find "${query}" in your library or groups. Try:\n\n• Adding it to your Learn section\n• Asking a group member to share it\n• Or ask me to explain the topic! 💡` }
  }

  const handleQuickAction = (actionInput) => setInput(actionInput)

  const handleResetPosition = () => {
    const x = window.innerWidth - DEFAULT_WIDTH - 24
    const y = window.innerHeight - DEFAULT_HEIGHT - 24
    setPosition({ x, y })
    setSize({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT })
  }

  const handleDragStart = (e) => {
    if (maximized) return
    e.preventDefault()
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y }
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    const onMove = (ev) => {
      if (!dragRef.current.dragging) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - size.w, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 80, dragRef.current.origY + dy))
      })
    }
    const onUp = () => {
      dragRef.current.dragging = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleResizeStart = (e, edge) => {
    if (maximized) return
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { resizing: true, edge, startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y, origW: size.w, origH: size.h }
    const cursorMap = { top: 'ns-resize', bottom: 'ns-resize', left: 'ew-resize', right: 'ew-resize', 'top-left': 'nwse-resize', 'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize', 'bottom-right': 'nwse-resize' }
    document.body.style.cursor = cursorMap[edge]
    document.body.style.userSelect = 'none'
    const onMove = (ev) => {
      if (!resizeRef.current.resizing) return
      const dx = ev.clientX - resizeRef.current.startX
      const dy = ev.clientY - resizeRef.current.startY
      const { edge: e, origX: ox, origY: oy, origW: ow, origH: oh } = resizeRef.current
      let newX = ox, newY = oy, newW = ow, newH = oh

      if (e.includes('right')) newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, ow + dx))
      if (e.includes('left')) {
        newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, ow - dx))
        newX = ox + (ow - newW)
      }
      if (e.includes('bottom')) newH = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, oh + dy))
      if (e.includes('top')) {
        newH = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, oh - dy))
        newY = oy + (oh - newH)
      }
      newX = Math.max(0, Math.min(window.innerWidth - newW, newX))
      newY = Math.max(0, Math.min(window.innerHeight - 80, newY))
      setPosition({ x: newX, y: newY })
      setSize({ w: newW, h: newH })
    }
    const onUp = () => {
      resizeRef.current.resizing = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const MaterialCard = ({ material }) => (
    <button onClick={() => handleMaterialClick(material)} className="flex items-center gap-2 w-full text-left p-2 rounded-xl bg-white/80 hover:bg-accent/20 border border-ink/10 transition-all hover:scale-[1.02] shadow-sm">
      <span className="text-lg">{material.type === 'pdf' ? '📄' : material.type === 'youtube' ? '🎬' : '📎'}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-ink text-sm truncate">{material.title}</div>
        <div className="text-xs text-ink/60">📍 {material.location}</div>
        {material.description && <div className="text-xs text-ink/50 truncate mt-0.5">{material.description}</div>}
        {material.tags && material.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {material.tags.slice(0, 3).map((tag, i) => (<span key={i} className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded-full">{tag}</span>))}
          </div>
        )}
      </div>
      {material.url ? (
        <a href={material.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent font-bold text-xs hover:underline">Link ↗</a>
      ) : (
        <span className="text-accent font-bold text-xs">Open →</span>
      )}
    </button>
  )

  const quickActions = [
    { label: '😄 Joke', input: 'Tell me a funny study joke' },
    { label: '💪 Motivate', input: 'I need motivation to study' },
    { label: '📚 Materials', input: 'What study materials do I have?' },
    { label: '❓ Help', input: 'How do I use FocusUp?' },
  ]

  const formatTime = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const resizeEdges = ['top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right']
  const resizeCursorMap = { top: 'ns-resize', bottom: 'ns-resize', left: 'ew-resize', right: 'ew-resize', 'top-left': 'nwse-resize', 'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize', 'bottom-right': 'nwse-resize' }
  const resizeStyleMap = {
    top:    { top: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: 'ns-resize' },
    bottom: { bottom: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: 'ns-resize' },
    left:   { top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, left: 0, width: RESIZE_HANDLE, cursor: 'ew-resize' },
    right:  { top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, right: 0, width: RESIZE_HANDLE, cursor: 'ew-resize' },
    'top-left':     { top: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'nwse-resize' },
    'top-right':    { top: 0, right: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'nesw-resize' },
    'bottom-left':  { bottom: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'nesw-resize' },
    'bottom-right': { bottom: 0, right: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'nwse-resize' },
  }

  return (
    <div className="fixed inset-0 z-40 pointer-events-none" style={{ position: 'fixed' }}>
      <AnimatePresence>
        {open && !maximized && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto flex flex-col border border-ink/10 bg-white/95 shadow-2xl backdrop-blur-lg overflow-hidden rounded-2xl"
            style={{ position: 'absolute', left: position.x, top: position.y, width: size.w, height: size.h }}
          >
            {/* Resize handles */}
            {resizeEdges.map(edge => (
              <div
                key={edge}
                className="absolute z-50"
                style={resizeStyleMap[edge]}
                onMouseDown={(e) => handleResizeStart(e, edge)}
              />
            ))}

            {/* Header - drag handle */}
            <div
              className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-accent via-leaf to-accent px-4 py-3 text-white shrink-0"
              onMouseDown={handleDragStart}
              style={{ cursor: 'grab' }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowHistory(h => !h) }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="rounded-full bg-white/20 hover:bg-white/30 p-1.5 transition-colors cursor-pointer"
                  title="Chat History"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <span className="text-2xl select-none">🤖</span>
                <div className="select-none">
                  <div className="font-bold">{showHistory ? 'Chat History' : 'AI Study Buddy'}</div>
                  <div className="text-xs opacity-80">{showHistory ? `${chatHistory.length} conversation(s)` : 'Powered by Gemini'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                {!showHistory && (
                  <button onClick={handleNewChat} className="rounded-full bg-white/20 hover:bg-white/30 p-1.5 transition-colors cursor-pointer" title="New Chat">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
                <button onClick={() => setMaximized(m => !m)} className="rounded-full bg-white/20 hover:bg-white/30 p-1.5 transition-colors cursor-pointer" title={maximized ? 'Restore' : 'Maximize'}>
                  {maximized ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  )}
                </button>
                <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 hover:bg-white/30 px-2 py-1 text-xs font-bold transition-colors cursor-pointer">✕</button>
              </div>
            </div>

            {/* Content area */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto scroll-hide">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-ink/50 text-sm">
                    <span className="text-3xl mb-2">💬</span>
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  chatHistory.map(chat => (
                    <div key={chat.id} className={`group flex items-center gap-3 px-4 py-3 border-b border-ink/5 hover:bg-clay/30 transition-colors ${chat.id === activeChatId ? 'bg-accent/10' : ''}`}>
                      <button onClick={() => { setActiveChatId(chat.id); setShowHistory(false) }} className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm text-ink truncate">{chat.title}</div>
                        <div className="text-xs text-ink/50 mt-0.5">{formatTime(chat.createdAt)} · {chat.messages.length} message(s)</div>
                      </button>
                      <button onClick={() => handleDeleteChat(chat.id)} className="opacity-0 group-hover:opacity-100 rounded-full bg-red-100 hover:bg-red-200 text-red-500 p-1.5 transition-all cursor-pointer" title="Delete chat">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-hide">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[85%]">
                        <div className={`rounded-2xl px-3 py-2 shadow-sm whitespace-pre-wrap ${m.sender === 'bot' ? 'bg-gradient-to-br from-clay/60 to-clay/40 text-ink' : 'bg-gradient-to-br from-ink to-ink/90 text-sand'}`}>
                          {m.text}
                        </div>
                        {m.materials && m.materials.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {m.materials.map((material, mIdx) => (<MaterialCard key={mIdx} material={material} />))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-clay/60 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-ink/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-ink/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-ink/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-sm text-ink/70">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick actions */}
                <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
                  {quickActions.map((action, idx) => (
                    <button key={idx} onClick={() => handleQuickAction(action.input)} className="text-xs px-2 py-1 rounded-full bg-clay/50 hover:bg-clay text-ink/80 hover:text-ink transition-colors">
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 px-4 pb-3 shrink-0">
                  <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask me anything..." disabled={isLoading} className="flex-1 rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50" />
                  <button onClick={handleSend} disabled={isLoading || !input.trim()} className="rounded-2xl bg-gradient-to-r from-ink to-ink/90 px-4 py-2.5 text-sm font-semibold text-sand shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? '...' : 'Send'}
                  </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 pb-4 text-xs text-ink/70 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-colors">
                    <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} className="h-4 w-4 rounded accent-accent" />
                    🔊 Voice replies
                  </label>
                  {currentContent && (
                    <div className="flex items-center gap-1 text-accent">
                      <span>📖</span>
                      <span className="truncate max-w-[120px]">{currentContent.title}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Maximized mode */}
      <AnimatePresence>
        {open && maximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-accent via-leaf to-accent px-6 py-4 text-white shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowHistory(h => !h)} className="rounded-full bg-white/20 hover:bg-white/30 p-2 transition-colors cursor-pointer" title="Chat History">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <span className="text-3xl">🤖</span>
                <div>
                  <div className="font-bold text-lg">{showHistory ? 'Chat History' : 'AI Study Buddy'}</div>
                  <div className="text-xs opacity-80">{showHistory ? `${chatHistory.length} conversation(s)` : 'Powered by Gemini'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!showHistory && (
                  <button onClick={handleNewChat} className="rounded-full bg-white/20 hover:bg-white/30 p-2 transition-colors cursor-pointer" title="New Chat">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
                <button onClick={handleResetPosition} className="rounded-full bg-white/20 hover:bg-white/30 p-2 transition-colors cursor-pointer" title="Reset window position">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                </button>
                <button onClick={() => setMaximized(false)} className="rounded-full bg-white/20 hover:bg-white/30 p-2 transition-colors cursor-pointer" title="Restore down">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                </button>
                <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-2 text-sm font-bold transition-colors cursor-pointer">✕</button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
              {showHistory ? (
                <div className="flex-1 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-ink/50 text-sm">
                      <span className="text-3xl mb-2">💬</span>
                      <p>No conversations yet</p>
                    </div>
                  ) : (
                    chatHistory.map(chat => (
                      <div key={chat.id} className={`group flex items-center gap-3 px-6 py-4 border-b border-ink/5 hover:bg-clay/30 transition-colors ${chat.id === activeChatId ? 'bg-accent/10' : ''}`}>
                        <button onClick={() => { setActiveChatId(chat.id); setShowHistory(false) }} className="flex-1 text-left min-w-0">
                          <div className="font-medium text-ink truncate">{chat.title}</div>
                          <div className="text-xs text-ink/50 mt-0.5">{formatTime(chat.createdAt)} · {chat.messages.length} message(s)</div>
                        </button>
                        <button onClick={() => handleDeleteChat(chat.id)} className="opacity-0 group-hover:opacity-100 rounded-full bg-red-100 hover:bg-red-200 text-red-500 p-1.5 transition-all cursor-pointer" title="Delete chat">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scroll-hide">
                    {messages.map((m, idx) => (
                      <div key={idx} className={`flex ${m.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                        <div className="max-w-[70%]">
                          <div className={`rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap ${m.sender === 'bot' ? 'bg-gradient-to-br from-clay/60 to-clay/40 text-ink' : 'bg-gradient-to-br from-ink to-ink/90 text-sand'}`}>
                            {m.text}
                          </div>
                          {m.materials && m.materials.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {m.materials.map((material, mIdx) => (<MaterialCard key={mIdx} material={material} />))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-clay/60 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-ink/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-ink/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-ink/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-sm text-ink/70">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="px-6 pb-3 flex gap-2 flex-wrap shrink-0">
                    {quickActions.map((action, idx) => (
                      <button key={idx} onClick={() => handleQuickAction(action.input)} className="text-xs px-3 py-1.5 rounded-full bg-clay/50 hover:bg-clay text-ink/80 hover:text-ink transition-colors">
                        {action.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 px-6 pb-4 shrink-0">
                    <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask me anything..." disabled={isLoading} className="flex-1 rounded-2xl border border-ink/10 bg-white px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50" />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="rounded-2xl bg-gradient-to-r from-ink to-ink/90 px-6 py-3 text-base font-semibold text-sand shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? '...' : 'Send'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-6 pb-5 text-sm text-ink/70 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-colors">
                      <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} className="h-4 w-4 rounded accent-accent" />
                      🔊 Voice replies
                    </label>
                    {currentContent && (
                      <div className="flex items-center gap-1 text-accent">
                        <span>📖</span>
                        <span className="truncate max-w-[200px]">{currentContent.title}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)} className="pointer-events-auto group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-ink via-ink/95 to-ink px-5 py-3.5 text-sm font-semibold text-sand shadow-lg hover:shadow-xl transition-all hover:scale-105" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
        <span className="text-xl">🤖</span>
        <span>AI Study Buddy</span>
        <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] group-hover:bg-accent/50 transition-colors">✨ AI</span>
        {messages.length === 1 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></span>
        )}
      </button>
    </div>
  )
}
