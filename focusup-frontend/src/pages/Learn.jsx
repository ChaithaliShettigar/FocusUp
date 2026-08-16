import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DoodleBackground } from '../components/DoodleBackground'
import { ConfirmModal } from '../components/ConfirmModal'
import { useFocusStore } from '../store/useFocusStore'
import { contentAPI } from '../services/api'

// PDF Viewer Component - loads PDF from server URL
const PdfViewer = ({ contentUrl, title }) => {
  if (!contentUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[520px] bg-clay/30">
        <p className="text-ink/70 mb-2">PDF not available.</p>
        <p className="text-ink/50 text-sm mb-4">Please re-upload the PDF file.</p>
      </div>
    )
  }

  return (
    <iframe
      src={contentUrl}
      title={title}
      className="h-[520px] w-full border-0"
    />
  )
}

// Inline target minutes input with local state to allow free typing
const TargetMinutesInput = ({ contentId, value, onUpdate }) => {
  const [localValue, setLocalValue] = useState(String(value || 25))
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value || 25))
    }
  }, [value, isFocused])

  const handleBlur = () => {
    setIsFocused(false)
    const num = parseInt(localValue, 10)
    const clamped = isNaN(num) || num < 1 ? 1 : num
    setLocalValue(String(clamped))
    if (clamped !== value) {
      onUpdate(contentId, clamped)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur()
  }

  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs text-ink/60">Target</label>
      <input
        type="number"
        min={1}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-16 rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs text-center focus:border-teal focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-outer-spin-button]:appearance-auto"
      />
      <span className="text-xs text-ink/60">min</span>
    </div>
  )
}

export const Learn = () => {
  const location = useLocation()
  const addContent = useFocusStore((s) => s.addContent)
  const contents = useFocusStore((s) => s.contents)
  const removeContent = useFocusStore((s) => s.removeContent)
  const updateContent = useFocusStore((s) => s.updateContent)
  const startSession = useFocusStore((s) => s.startSession)
  const endSession = useFocusStore((s) => s.endSession)
  const setCurrentSession = useFocusStore((s) => s.setCurrentSession)
  const pushNotification = useFocusStore((s) => s.pushNotification)
  const isAuthenticated = useFocusStore((s) => s.isAuthenticated)
  const activeContentId = useFocusStore((s) => s.activeContentId)
  const currentSessionId = useFocusStore((s) => s.currentSessionId)
  const sessions = useFocusStore((s) => s.sessions)
  const activeSession = sessions.find((s) => s.id === currentSessionId)

  const [selectedContent, setSelectedContent] = useState(null)
  const [previewOnlyOpen, setPreviewOnlyOpen] = useState(false)
  const [locatedContentId, setLocatedContentId] = useState(null)
  const [codeTitle, setCodeTitle] = useState('')
  const [codeNotes, setCodeNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const setContents = useFocusStore((s) => s.setContents)

  const handleUpdateTargetMinutes = (contentId, newMinutes) => {
    updateContent(contentId, { targetMinutes: newMinutes })
    contentAPI.updateContent(contentId, { targetMinutes: newMinutes }).catch(() => {})
  }

  // Restore active session after content is loaded
  const hasRestoredSession = React.useRef(false)
  
  useEffect(() => {
    // If there's an active session and content is loaded, restore the selected content
    if (!hasRestoredSession.current && activeContentId && contents.length > 0) {
      const activeContent = contents.find(c => c.id === activeContentId)
      if (activeContent) {
        console.log('Restoring active session for:', activeContent.title)
        setSelectedContent(activeContent)
        setPreviewOnlyOpen(false)
        hasRestoredSession.current = true
      }
    }
  }, [activeContentId, contents])

  // Fetch content from backend on mount - using ref to track if we've fetched
  const hasFetchedRef = React.useRef(false)
  
  useEffect(() => {
    const fetchContent = async () => {
      // Check if we have a token (user is logged in)
      const hasToken = !!localStorage.getItem('accessToken')
      
      // Skip if already fetched or no token
      if (hasFetchedRef.current || !hasToken) {
        console.log('Skip fetch - hasFetched:', hasFetchedRef.current, 'hasToken:', hasToken)
        return
      }
      
      console.log('Fetching content from backend...')
      setIsLoading(true)
      hasFetchedRef.current = true // Mark as fetched immediately to prevent double fetch
      
      try {
        const response = await contentAPI.getContent()
        console.log('Content API response:', response)
        if (response.success && response.content) {
          // Map backend content to frontend format
          const mappedContent = response.content.map(item => {
            // Determine the correct type
            let contentType = item.type
            if (item.type === 'link') {
              // Check if it's YouTube
              if (item.url?.includes('youtube') || item.url?.includes('youtu.be')) {
                contentType = 'youtube'
              } else {
                contentType = 'pdf'
              }
            } else if (item.type === 'note') {
              contentType = 'code'
            } else if (item.type === 'pdf') {
              contentType = 'pdf'
            } else if (item.type === 'youtube') {
              contentType = 'youtube'
            }
            
            return {
              id: item._id,
              title: item.title,
              type: contentType,
              url: item.url || '',
              notes: item.description || '',
              targetMinutes: item.targetMinutes || 25,
              filePath: item.filePath || '',
            }
          })
          console.log('Mapped content:', mappedContent)
          setContents(mappedContent)
        }
      } catch (error) {
        console.error('Failed to fetch content:', error)
        hasFetchedRef.current = false // Reset on error so it can retry
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchContent()
  }, [setContents])

  // Handle navigation from HelpBot with openContentId
  useEffect(() => {
    const openContentId = location.state?.openContentId
    const locateOnly = Boolean(location.state?.locateOnly)
    const previewOnly = Boolean(location.state?.previewOnly)

    if (openContentId && isAuthenticated) {
      const contentToOpen = contents.find(c => c.id === openContentId)
      if (contentToOpen) {
        if (locateOnly) {
          setSelectedContent(null)
          setPreviewOnlyOpen(false)
          setLocatedContentId(contentToOpen.id)
          toast.success(`Located in Learn materials: ${contentToOpen.title}`)
          setTimeout(() => {
            const target = document.getElementById(`learn-material-${contentToOpen.id}`)
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 60)
          window.history.replaceState({}, document.title)
          return
        }

        setSelectedContent(contentToOpen)
        setPreviewOnlyOpen(previewOnly)

        if (!previewOnly) {
          startSession({ contentId: contentToOpen.id, contentType: contentToOpen.type, targetMinutes: contentToOpen.targetMinutes || 25 }).then(id => {
            setCurrentSession(id)
          })
          toast.success(`Opening "${contentToOpen.title}"! Timer started.`)
        } else {
          toast.success(`Opened "${contentToOpen.title}" in preview mode.`)
        }

        // Clear the navigation state
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, contents, isAuthenticated, startSession, setCurrentSession])

  // Handle opening content by query params (from GlobalSearchBar)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const pdfId = params.get('pdf')
    const ytId = params.get('youtube')
    const openId = pdfId || ytId
    if (!openId) return

    let cancelled = false
    const openById = async () => {
      try {
        // Try to find the content locally first
        let contentToOpen = contents.find(c => c.id === openId)

        // If not present, fetch a single content item from the API
        if (!contentToOpen) {
          const resp = await contentAPI.getSingleContent(openId)
          if (resp && resp.success && resp.content) {
            const item = resp.content
            let contentType = item.type
            if (item.type === 'link') {
              if (item.url?.includes('youtube') || item.url?.includes('youtu.be')) contentType = 'youtube'
              else contentType = 'pdf'
            } else if (item.type === 'note') {
              contentType = 'code'
            } else if (item.type === 'youtube') {
              contentType = 'youtube'
            } else if (item.type === 'pdf') {
              contentType = 'pdf'
            }

            contentToOpen = {
              id: item._id,
              title: item.title,
              type: contentType,
              url: item.url || '',
              notes: item.description || '',
              targetMinutes: item.targetMinutes || 25,
              filePath: item.filePath || '',
            }

            // Add to local list so it shows up in UI
            addContent(contentToOpen)
          }
        }

        if (contentToOpen && !cancelled) {
          // Open the content without auto-starting a session
          setSelectedContent(contentToOpen)
          setPreviewOnlyOpen(true)
          // Clean up URL so repeated opens don't happen
          window.history.replaceState({}, document.title, '/learn')
        } else if (!cancelled) {
          toast.error('Could not find the content to open.')
          window.history.replaceState({}, document.title, '/learn')
        }
      } catch (err) {
        console.error('Failed to open content by id:', err)
        if (!cancelled) {
          toast.error('Could not open content.')
          window.history.replaceState({}, document.title, '/learn')
        }
      }
    }

    openById()
    return () => { cancelled = true }
  }, [location.search, contents, addContent])

  const handlePdf = async (e) => {
    if (!isAuthenticated) {
      toast.error('Sign up or login to upload PDFs.')
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('PDF too large. Max 50MB allowed.')
      e.target.value = ''
      return
    }
    
    setIsLoading(true)
    try {
      // Upload PDF file to server
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', file.name)
      
      const response = await contentAPI.uploadFile(fd)
      if (response.success && response.content) {
        addContent({ 
          id: response.content._id,
          title: file.name, 
          type: 'pdf', 
          url: response.content.url || '',
          targetMinutes: 25,
        })
        pushNotification(`PDF "${file.name}" added to your materials`, 'material')
        toast.success('PDF uploaded and saved to server!')
      }
    } catch (error) {
      console.error('Failed to save PDF:', error)
      toast.error('Failed to save PDF')
    } finally {
      setIsLoading(false)
      e.target.value = ''
    }
  }

  const handleYoutube = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Sign up or login to add YouTube links.')
      return
    }
    const link = e.target.youtube.value.trim()
    if (!link) return
    
    setIsLoading(true)
    try {
      // Extract video ID for title
      let videoId = ''
      if (link.includes('youtube.com/watch')) {
        // youtube.com/watch?v=VIDEO_ID
        try {
          const urlObj = new URL(link)
          videoId = urlObj.searchParams.get('v') || ''
        } catch {
          const match = link.match(/[?&]v=([a-zA-Z0-9_-]+)/)
          videoId = match ? match[1] : ''
        }
      } else if (link.includes('youtu.be/')) {
        // youtu.be/VIDEO_ID?si=XXX - extract ID before query params
        const match = link.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
        videoId = match ? match[1] : ''
      } else if (link.includes('youtube.com/shorts/')) {
        const match = link.match(/shorts\/([a-zA-Z0-9_-]+)/)
        videoId = match ? match[1] : ''
      }
      const title = videoId ? `YouTube Video: ${videoId}` : link
      
      const response = await contentAPI.createContent({
        title: title,
        type: 'youtube',
        url: link,
        targetMinutes: 25,
      })
      if (response.success) {
        addContent({ 
          id: response.content._id,
          title: title, 
          type: 'youtube', 
          url: link,
          targetMinutes: 25,
        })
        pushNotification(`YouTube video "${title}" added to your materials`, 'material')
        e.target.reset()
        toast.success('YouTube link saved!')
      }
    } catch (error) {
      console.error('Failed to save YouTube link:', error)
      toast.error('Failed to save YouTube link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCode = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Sign up or login to save coding study cards.')
      return
    }
    if (!codeTitle.trim()) return
    
    setIsLoading(true)
    try {
      const response = await contentAPI.createContent({
        title: codeTitle,
        type: 'note',
        description: codeNotes,
        targetMinutes: 25,
      })
      if (response.success) {
        addContent({ 
          id: response.content._id,
          title: codeTitle, 
          type: 'code', 
          notes: codeNotes,
          targetMinutes: 25,
        })
        pushNotification(`Code notes "${codeTitle}" added to your materials`, 'material')
        setCodeTitle('')
        setCodeNotes('')
        toast.success('Code practice saved!')
      }
    } catch (error) {
      console.error('Failed to save code card:', error)
      toast.error('Failed to save code card')
    } finally {
      setIsLoading(false)
    }
  }

  const startFocus = async (content) => {
    if (!isAuthenticated) {
      toast.error('Sign up or login to start a focus session.')
      return
    }
    const materialTarget = content.targetMinutes || 25
    if (!materialTarget || materialTarget <= 0) {
      toast.error('Set a target time to start.')
      return
    }
    const id = await startSession({ contentId: content.id, contentType: content.type, targetMinutes: materialTarget })
    setCurrentSession(id)
    setSelectedContent(content)
    setPreviewOnlyOpen(false)
    setLocatedContentId(null)
    pushNotification(`Focus session started for "${content.title}" — ${materialTarget} min`, 'focus')
    toast.success('Timer started. Stay active to grow your focus score.')
  }

  const stopFocus = async () => {
    const currentId = useFocusStore.getState().currentSessionId
    if (currentId) await endSession(currentId, 'completed')
    setPreviewOnlyOpen(true)
    setSelectedContent(null)
    toast('Session ended. Check analytics for insights.', { icon: '📊' })
  }

  const deleteMaterial = async (content) => {
    setPendingDelete(content)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmOpen(false)
    setIsLoading(true)
    const content = pendingDelete
    setPendingDelete(null)
    try {
      // Delete from backend
      if (content.id) {
        await contentAPI.deleteContent(content.id)
      }
      
      // If the item being deleted is currently opened, close it
      if (selectedContent && selectedContent.id === content.id) {
        setSelectedContent(null)
      }
      
      removeContent(content.id)
      toast.success('Removed from your materials.')
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('Could not remove this item.')
    } finally {
      setIsLoading(false)
    }
  }

  const embedUrl = useMemo(() => {
    if (!selectedContent) return ''
    if (selectedContent.type === 'youtube') {
      let videoId = ''
      const url = selectedContent.url || ''
      
      // Handle different YouTube URL formats:
      // 1. youtube.com/watch?v=VIDEO_ID
      // 2. youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?si=XXX
      // 3. youtube.com/shorts/VIDEO_ID
      // 4. youtube.com/embed/VIDEO_ID
      
      if (url.includes('youtube.com/watch')) {
        // Extract v= parameter using regex (safer than URL parsing)
        const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
        videoId = match ? match[1] : ''
      } else if (url.includes('youtu.be/')) {
        // Short URL format - extract ID before any query params
        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
        videoId = match ? match[1] : ''
      } else if (url.includes('youtube.com/shorts/')) {
        // Shorts format
        const match = url.match(/shorts\/([a-zA-Z0-9_-]+)/)
        videoId = match ? match[1] : ''
      } else if (url.includes('youtube.com/embed/')) {
        // Already embed format
        const match = url.match(/embed\/([a-zA-Z0-9_-]+)/)
        videoId = match ? match[1] : ''
      } else {
        // Fallback - try to extract any 11-char video ID pattern
        const match = url.match(/([a-zA-Z0-9_-]{11})/)
        videoId = match ? match[1] : ''
      }
      
      console.log('YouTube URL:', url, '-> Video ID:', videoId)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }
    return selectedContent.url
  }, [selectedContent])

  const isSelectedInActiveFocusSession = Boolean(
    selectedContent && currentSessionId && activeContentId === selectedContent.id
  )

  return (
    <DoodleBackground>
      <div className="flex flex-col gap-10">
        <div className="pb-2">
          <h2 className="text-3xl font-bold text-ink">Learning library</h2>
          <p className="text-ink/70 mt-1">Upload your PDFs or add YouTube links. Focus sessions always need a target timer.</p>
        </div>

        {!isAuthenticated && (
          <div className="rounded-3xl bg-clay/60 p-5 text-ink/80 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Sign up or login to add materials and start focus sessions.</p>
              </div>
              <Link to="/auth" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand">Go to Auth</Link>
            </div>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md flex flex-col justify-between transition-all duration-300">
            <div>
              <h3 className="text-xl font-bold text-ink">Upload PDF</h3>
              <p className="text-sm font-medium text-ink/70 mt-2">Upload PDFs to your secure cloud storage for focused studying.</p>
            </div>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdf}
              className="mt-6 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-teal focus:outline-none"
              disabled={!isAuthenticated}
            />
          </div>
          <form onSubmit={handleYoutube} className="group rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md flex flex-col justify-between transition-all duration-300">
            <div>
              <h3 className="text-xl font-bold text-ink">Add YouTube link</h3>
              <p className="text-sm font-medium text-ink/70 mt-2">Videos open inside FocusUp with automated focus tracking.</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <input
                name="youtube"
                placeholder="https://youtube.com/watch?v=..."
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-teal focus:outline-none"
                disabled={!isAuthenticated}
              />
              <button className={`self-start rounded-full px-6 py-2.5 text-sm font-bold text-sand shadow-sm transition-all ${!isAuthenticated ? 'bg-ink/50 cursor-not-allowed' : 'bg-ink hover:scale-105'}`} disabled={!isAuthenticated}>
                Save link
              </button>
            </div>
          </form>
          <form onSubmit={handleCode} className="group rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md flex flex-col justify-between transition-all duration-300">
            <div>
              <h3 className="text-xl font-bold text-ink">Coding study</h3>
              <p className="text-sm font-medium text-ink/70 mt-2">Track focused coding challenges with notes or code snippets.</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <input
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
                placeholder="Topic or challenge name"
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm focus:border-teal focus:outline-none"
                disabled={!isAuthenticated}
              />
              <textarea
                value={codeNotes}
                onChange={(e) => setCodeNotes(e.target.value)}
                placeholder="Notes, snippet, or TODOs"
                className="h-24 w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-mono focus:border-teal focus:outline-none"
                disabled={!isAuthenticated}
              />
              <button className={`self-start rounded-full px-6 py-2.5 text-sm font-bold text-sand shadow-sm transition-all ${!isAuthenticated ? 'bg-ink/50 cursor-not-allowed' : 'bg-ink hover:scale-105'}`} disabled={!isAuthenticated}>
                Save coding card
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl bg-white/80 hover:bg-white/95 p-8 shadow-soft hover:shadow-xl border border-white/70 backdrop-blur-md transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-ink">Your materials</h3>
              <p className="text-sm font-medium text-ink/70 mt-0.5">Everything starts empty. Add items above to begin.</p>
            </div>
          </div>
          {contents.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-clay/60 p-4 text-sm text-ink/70">
              No content yet. Upload a PDF or add a YouTube link to start your first focus session.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contents.map((c) => (
                <div
                  id={`learn-material-${c.id}`}
                  key={c.id}
                  className={`group rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${
                    locatedContentId === c.id
                      ? 'border-teal-500 ring-2 ring-teal-200'
                      : 'border-ink/10 hover:border-ink/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">{c.title}</p>
                      <p className="text-xs text-ink/60 mt-0.5 capitalize">{c.type}</p>
                      {locatedContentId === c.id && (
                        <p className="mt-1 text-[11px] font-semibold text-teal-700">Located from search</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        aria-label="Delete material"
                        title="Delete"
                        onClick={() => deleteMaterial(c)}
                        className="rounded-full border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <TargetMinutesInput
                      contentId={c.id}
                      value={c.targetMinutes || 25}
                      onUpdate={handleUpdateTargetMinutes}
                    />
                  </div>
                  <button
                    onClick={() => startFocus(c)}
                    className={`mt-3 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-sand shadow-soft transition-all ${!isAuthenticated ? 'bg-ink/50 cursor-not-allowed' : 'bg-ink hover:scale-[1.02]'}`}
                    disabled={!isAuthenticated}
                  >
                    Open & start focus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedContent && (
          <div className="rounded-3xl bg-white/90 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">
                  {isSelectedInActiveFocusSession ? 'Learning now' : 'Preview mode'}
                </p>
                <h3 className="text-xl font-semibold text-ink">{selectedContent.title}</h3>
                {isSelectedInActiveFocusSession && activeSession && (
                  <p className="mt-1 text-sm font-medium text-accent">
                    {(() => {
                      const remaining = Math.max(0, (activeSession.targetMinutes || 25) * 60 - (activeSession.elapsedSeconds || 0))
                      const mins = Math.floor(remaining / 60)
                      const secs = remaining % 60
                      return `Remaining: ${mins}:${secs.toString().padStart(2, '0')}`
                    })()}
                  </p>
                )}
              </div>
              {isSelectedInActiveFocusSession ? (
                <button
                  onClick={stopFocus}
                  className="rounded-full border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-clay/50 transition-colors"
                >
                  End session
                </button>
              ) : (
                <button
                  onClick={() => startFocus(selectedContent)}
                  className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-sand shadow-soft hover:scale-[1.02] transition-all"
                >
                  Start focus study
                </button>
              )}
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-sand shadow-inner">
              {selectedContent.type === 'youtube' ? (
                <iframe
                  title="YouTube"
                  src={embedUrl}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedContent.type === 'code' ? (
                <textarea
                  value={selectedContent.notes || ''}
                  readOnly
                  className="h-[520px] w-full bg-ink/5 p-4 font-mono text-sm text-ink"
                  aria-label="Code notes"
                />
              ) : (
                /* PDF viewer - loads from server URL */
                <PdfViewer contentUrl={selectedContent.url} title={selectedContent.title} />
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete material"
        message={`Are you sure you want to delete "${pendingDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null) }}
      />
    </DoodleBackground>
  )
}
