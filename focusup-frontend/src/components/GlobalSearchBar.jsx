import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { contentAPI, groupAPI, isAuthenticated } from '../services/api'

const QUERY_KEY = 'globalSearchQuery'
const RESULTS_KEY = 'globalSearchResults'

const normalizeMaterialType = (item) => {
  const type = String(item?.type || '').toLowerCase()
  if (type === 'pdf' || type === 'youtube') return type
  const link = item?.url || item?.link || ''
  if (typeof link === 'string' && (link.includes('youtube.com') || link.includes('youtu.be'))) return 'youtube'
  return 'pdf'
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState(() => sessionStorage.getItem(QUERY_KEY) || '')
  const [results, setResults] = useState(() => {
    try {
      const saved = sessionStorage.getItem(RESULTS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showDropdown, setShowDropdown] = useState(() => {
    const q = sessionStorage.getItem(QUERY_KEY)
    return !!(q && q.trim().length > 0)
  })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const debounceTimeout = useRef(null)

  const saveResults = (items) => {
    setResults(items)
    try { sessionStorage.setItem(RESULTS_KEY, JSON.stringify(items)) } catch {}
  }

  const clearSaved = () => {
    setResults([])
    setShowDropdown(false)
    sessionStorage.removeItem(QUERY_KEY)
    sessionStorage.removeItem(RESULTS_KEY)
  }

  const searchContent = useCallback(async (q) => {
    setLoading(true)
    try {
      const [contentRes, groupsRes] = await Promise.all([
        contentAPI.getContent(),
        groupAPI.getUserGroups(),
      ])

      const searchTerm = q.trim().toLowerCase()

      const learnMaterials = (contentRes?.content || [])
        .map((item) => ({
          id: `learn-${item._id}`,
          source: 'learn',
          contentId: item._id,
          title: item.title || 'Untitled material',
          type: normalizeMaterialType(item),
        }))
        .filter((item) => item.title.toLowerCase().includes(searchTerm))

      const groupMaterials = (groupsRes?.groups || []).flatMap((group) => {
        const groupName = group?.name || 'Group'
        const resources = Array.isArray(group?.resources) ? group.resources : []
        return resources
          .map((resource, index) => {
            const resourceId = resource?.id || resource?._id || `${group._id}-r-${index}`
            const resourceTitle = resource?.title || resource?.name || 'Untitled resource'
            return {
              id: `group-${group._id}-${resourceId}`,
              source: 'group',
              groupId: group._id,
              groupName,
              resourceId,
              title: resourceTitle,
              type: normalizeMaterialType(resource),
            }
          })
          .filter((item) => {
            const combined = `${item.title} ${item.groupName}`.toLowerCase()
            return combined.includes(searchTerm)
          })
      })

      const groupMessages = (groupsRes?.groups || []).flatMap((group) => {
        const groupName = group?.name || 'Group'
        const messages = Array.isArray(group?.chatMessages) ? group.chatMessages : []
        return messages
          .filter((msg) => msg.text && msg.text.toLowerCase().includes(searchTerm))
          .slice(-5)
          .map((msg) => ({
            id: `msg-${group._id}-${msg._id || msg.timestamp}`,
            source: 'message',
            groupId: group._id,
            groupName,
            senderName: msg.senderName || 'Unknown',
            text: msg.text,
            timestamp: msg.timestamp,
          }))
      })

      const all = [...learnMaterials, ...groupMaterials, ...groupMessages]
      saveResults(all)
      setShowDropdown(true)
    } catch (err) {
      console.error('Search error:', err)
      saveResults([])
      setShowDropdown(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(QUERY_KEY)
    if (saved && saved.trim().length > 0 && isAuthenticated()) {
      searchContent(saved)
    }
  }, [searchContent])

  const handleInput = (e) => {
    const value = e.target.value
    setQuery(value)
    if (value.trim().length > 0) {
      sessionStorage.setItem(QUERY_KEY, value)
    } else {
      clearSaved()
      setShowDropdown(true)
      return
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    if (value.trim().length === 0) {
      return
    }

    if (!isAuthenticated()) {
      saveResults([])
      setShowDropdown(true)
      return
    }
    debounceTimeout.current = setTimeout(() => {
      searchContent(value)
    }, 350)
  }

  const handleResultClick = (item) => {
    clearSaved()
    if (inputRef.current) inputRef.current.blur()

    if (item.source === 'learn') {
      navigate('/learn', { state: { openContentId: item.contentId, locateOnly: true } })
      return
    }

    if (item.source === 'group' || item.source === 'message') {
      navigate('/groups', {
        state: {
          openGroupId: item.groupId,
          openResourceId: item.resourceId || null,
          openMessageTimestamp: item.timestamp || null,
          openTab: item.source === 'message' ? 'chat' : 'materials',
          locateOnly: true,
        },
      })
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="relative w-full max-w-xs">
      <div className="flex items-center bg-white border border-clay/60 rounded-full px-3 py-1 shadow-sm">
        <Search className="h-4 w-4 text-ink/60 mr-2" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Search study materials & messages..."
          value={query}
          onChange={handleInput}
          onFocus={() => query && setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (query.trim()) searchContent(query)
            }
          }}
        />
      </div>
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-clay/60 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-clay/30 flex items-center gap-2"
                onClick={(e) => { e.preventDefault(); handleResultClick(item) }}
              >
                {item.source === 'message' ? (
                  <>
                    <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink/90 text-xs">{item.senderName}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {item.groupName} › Chat
                        </span>
                        <span className="text-[10px] text-ink/40 ml-auto shrink-0">{formatTime(item.timestamp)}</span>
                      </div>
                      <p className="text-xs text-ink/60 truncate mt-0.5">{item.text}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-ink/90">{item.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-teal/15 text-teal-700">
                      {item.source === 'group' ? `${item.groupName} › Resources` : 'Learn'}
                    </span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded bg-clay/40 text-ink/60">
                      {item.type === 'pdf' ? 'PDF' : 'YouTube'}
                    </span>
                  </>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-xs text-ink/60">
              {loading ? 'Searching...' : (!isAuthenticated() ? 'Login to search your saved materials' : (query.trim() ? 'No results found' : 'Start searching'))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
