import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusStore } from '../store/useFocusStore'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { aiAPI } from '../services/api'

export const HelpBot = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [voice, setVoice] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: '👋 Hi! I\'m your AI Study Buddy! I can help you:\n\n📚 Find study materials in your library & groups\n💡 Explain any topic you\'re learning\n🎯 Give motivation & study tips\n😄 Tell jokes to keep you energized!\n\nWhat would you like help with?' 
    },
  ])
  const messagesEndRef = useRef(null)
  
  const contents = useFocusStore((s) => s.contents)
  const groups = useFocusStore((s) => s.groups)
  const language = useFocusStore((s) => s.language)
  const currentSessionId = useFocusStore((s) => s.currentSessionId)
  const sessions = useFocusStore((s) => s.sessions)
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)

  // Get current session context
  const currentSession = sessions.find(s => s.id === currentSessionId)
  const currentContent = currentSession ? contents.find(c => c.id === currentSession.contentId) : null

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = (text) => {
    if (!voice || !window.speechSynthesis) return
    // Clean text of emojis and markdown for speech
    const cleanText = text.replace(/[^\w\s.,!?'-]/g, '').replace(/\*\*/g, '')
    const utter = new SpeechSynthesisUtterance(cleanText)
    utter.lang = language.startsWith('es') ? 'es-ES' : 'en-US'
    window.speechSynthesis.speak(utter)
  }

  // Handle clicking on a material to navigate and learn
  const handleMaterialClick = (material) => {
    if (material.groupId) {
      // Navigate to groups page with the specific resource
      navigate(`/groups?groupId=${material.groupId}&resourceId=${material.contentId || material.id}`)
    } else if (material.contentId) {
      // Navigate to learn page and set active content
      navigate('/learn', { state: { openContentId: material.contentId } })
    }
    
    // Add a message about navigation
    setMessages(prev => [...prev, {
      sender: 'bot',
      text: `🚀 Opening "${material.title}"! Happy studying! 📖`
    }])
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = { sender: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)

    // Check if user is authenticated
    if (!isAuthenticated) {
      const botMessage = { 
        sender: 'bot', 
        text: '🔐 Please log in to use the AI HelpBot! I need access to your library and groups to help you find study materials.' 
      }
      setMessages(prev => [...prev, botMessage])
      setIsLoading(false)
      return
    }

    try {
      // Prepare session context if user is in a study session
      const sessionContext = currentContent ? {
        contentTitle: currentContent.title,
        contentType: currentContent.type,
        targetMinutes: currentSession?.targetMinutes
      } : null

      // Call AI API
      const response = await aiAPI.chat(userInput, sessionContext, messages.slice(-20))
      
      if (response.success) {
        const aiResponse = response.response
        
        // Add bot message
        const botMessage = { 
          sender: 'bot', 
          text: aiResponse.text,
          materials: aiResponse.materials || [],
          type: aiResponse.type
        }
        setMessages(prev => [...prev, botMessage])
        speak(aiResponse.text)
      } else {
        // server returned an error payload (rate limit, missing key, etc.)
        console.warn('AI chat returned unsuccessful:', response.message)
        throw new Error(response.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('AI Chat Error:', error)

      // if the query clearly looks like a material search, still try local search
      const searchIntentRegex = /\b(find|search|where is|do i have|looking for|i want|show me|any pdf|pdf on|youtube tutorial|tutorial|find me|where can i find)\b/i
      let botMessage
      if (searchIntentRegex.test(userInput)) {
        botMessage = handleLocalSearch(userInput)
      } else {
        // general AI failure message
        botMessage = {
          sender: 'bot',
          text: `🤖 I'm having trouble connecting to my AI brain right now. Please try again in a moment!`,
          materials: []
        }
      }

      setMessages(prev => [...prev, botMessage])
      speak(botMessage.text)
    } finally {
      setIsLoading(false)
    }
  }

  // Local fallback search
  const handleLocalSearch = (query) => {
    const lower = query.toLowerCase()
    
    // Search in contents
    const contentMatches = contents.filter(c =>
      c.title?.toLowerCase().includes(lower) || 
      c.type?.toLowerCase().includes(lower)
    ).map(c => ({
      title: c.title,
      type: c.type,
      location: 'Your Library',
      contentId: c.id
    }))

    // Search in group resources
    const groupMatches = groups.flatMap(g => 
      (g.resources || []).filter(r =>
        r.title?.toLowerCase().includes(lower) ||
        r.type?.toLowerCase().includes(lower)
      ).map(r => ({
        title: r.title,
        type: r.type || 'link',
        location: `Group: ${g.name}`,
        contentId: r.id,
        groupId: g._id || g.id
      }))
    )

    const allMatches = [...contentMatches, ...groupMatches]

    if (allMatches.length > 0) {
      return {
        sender: 'bot',
        text: `📚 Found ${allMatches.length} material(s) matching "${query}"! Click to start learning:`,
        materials: allMatches
      }
    }

    return {
      sender: 'bot',
      text: `🔍 I couldn't find "${query}" in your library or groups. Try:\n\n• Adding it to your Learn section\n• Asking a group member to share it\n• Or ask me to explain the topic! 💡`
    }
  }

  // Quick action handler
  const handleQuickAction = (actionInput) => {
    setInput(actionInput)
  }

  // Render material card with description and tags
  const MaterialCard = ({ material }) => (
    <button
      onClick={() => handleMaterialClick(material)}
      className="flex items-center gap-2 w-full text-left p-2 rounded-xl bg-white/80 hover:bg-accent/20 border border-ink/10 transition-all hover:scale-[1.02] shadow-sm"
    >
      <span className="text-lg">
        {material.type === 'pdf' ? '📄' : 
         material.type === 'youtube' ? '🎬' : 
         material.type === 'code' ? '💻' : '📎'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-ink text-sm truncate">{material.title}</div>
        <div className="text-xs text-ink/60">📍 {material.location}</div>
        {material.description && (
          <div className="text-xs text-ink/50 truncate mt-0.5">{material.description}</div>
        )}
        {material.tags && material.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {material.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {material.url ? (
        <a 
          href={material.url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-accent font-bold text-xs hover:underline"
        >
          Link ↗
        </a>
      ) : (
        <span className="text-accent font-bold text-xs">Open →</span>
      )}
    </button>
  )

  // Quick action buttons
  const quickActions = [
    { label: '😄 Joke', input: 'Tell me a funny study joke' },
    { label: '💪 Motivate', input: 'I need motivation to study' },
    { label: '📚 Materials', input: 'What study materials do I have?' },
    { label: '❓ Help', input: 'How do I use FocusUp?' },
  ]

  return (
    <div className="fixed bottom-6 right-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-3 w-[360px] rounded-3xl border border-ink/10 bg-white/95 shadow-xl backdrop-blur-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-accent via-leaf to-accent px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-bold">AI Study Buddy</div>
                  <div className="text-xs opacity-80">Powered by Gemini</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/20 hover:bg-white/30 px-2 py-1 text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-3 scroll-hide">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-3 py-2 shadow-sm whitespace-pre-wrap ${
                        m.sender === 'bot' 
                          ? 'bg-gradient-to-br from-clay/60 to-clay/40 text-ink' 
                          : 'bg-gradient-to-br from-ink to-ink/90 text-sand'
                      }`}
                    >
                      {m.text}
                    </div>
                    
                    {/* Material cards */}
                    {m.materials && m.materials.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {m.materials.map((material, mIdx) => (
                          <MaterialCard key={mIdx} material={material} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
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
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.input)}
                  className="text-xs px-2 py-1 rounded-full bg-clay/50 hover:bg-clay text-ink/80 hover:text-ink transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 pb-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="rounded-2xl bg-gradient-to-r from-ink to-ink/90 px-4 py-2.5 text-sm font-semibold text-sand shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>

            {/* Footer options */}
            <div className="flex items-center justify-between px-4 pb-4 text-xs text-ink/70">
              <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-colors">
                <input
                  type="checkbox"
                  checked={voice}
                  onChange={(e) => setVoice(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
                🔊 Voice replies
              </label>
              {currentContent && (
                <div className="flex items-center gap-1 text-accent">
                  <span>📖</span>
                  <span className="truncate max-w-[120px]">{currentContent.title}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-ink via-ink/95 to-ink px-5 py-3.5 text-sm font-semibold text-sand shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <span className="text-xl">🤖</span>
        <span>AI Study Buddy</span>
        <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] group-hover:bg-accent/50 transition-colors">
          ✨ AI
        </span>
        
        {/* Notification dot for new users */}
        {messages.length === 1 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></span>
        )}
      </button>
    </div>
  )
}
