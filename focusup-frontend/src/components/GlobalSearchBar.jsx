import { useState, useRef } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { contentAPI, groupAPI, isAuthenticated } from '../services/api'

const normalizeMaterialType = (item) => {
  const type = String(item?.type || '').toLowerCase()
  if (type === 'pdf' || type === 'youtube' || type === 'code') return type
  if (type === 'note') return 'code'
  const link = item?.url || item?.link || ''
  if (typeof link === 'string' && (link.includes('youtube.com') || link.includes('youtu.be'))) return 'youtube'
  return 'pdf'
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const debounceTimeout = useRef(null)

  const handleInput = (e) => {
    const value = e.target.value
    setQuery(value)
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    if (value.trim().length === 0) {
      setResults([])
      setShowDropdown(true) // show empty state so users see "Start searching"
      return
    }

    // If user is not authenticated, show a helpful message instead of trying to call protected endpoint
    if (!isAuthenticated()) {
      setResults([])
      setShowDropdown(true)
      return
    }
    debounceTimeout.current = setTimeout(() => {
      searchContent(value)
    }, 350)
  }

  const searchContent = async (q) => {
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

      setResults([...learnMaterials, ...groupMaterials])
      setShowDropdown(true)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
      setShowDropdown(true)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (item) => {
    setShowDropdown(false)
    setQuery('')
    // remove focus from input to avoid accidental keyboard interactions
    if (inputRef.current) inputRef.current.blur()

    if (item.source === 'learn') {
      navigate('/learn', { state: { openContentId: item.contentId, locateOnly: true } })
      return
    }

    if (item.source === 'group') {
      navigate('/groups', {
        state: {
          openGroupId: item.groupId,
          openResourceId: item.resourceId,
          locateOnly: true,
        },
      })
    }
  }

  return (
    <div className="relative w-full max-w-xs">
      <div className="flex items-center bg-white border border-clay/60 rounded-full px-3 py-1 shadow-sm">
        <Search className="h-4 w-4 text-ink/60 mr-2" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Search saved study materials..."
          value={query}
          onChange={handleInput}
          onFocus={() => query && setShowDropdown(true)}
          onKeyDown={(e) => {
            // Prevent Enter from submitting any surrounding forms (avoid full page reload)
            if (e.key === 'Enter') {
              e.preventDefault()
              if (query.trim()) searchContent(query)
            }
          }}
        />
      </div>
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-clay/60 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-clay/30 flex items-center gap-2"
                onClick={(e) => { e.preventDefault(); handleResultClick(item) }}
              >
                <span className="font-semibold text-ink/90">{item.title}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-teal/15 text-teal-700">
                  {item.source === 'group' ? `Group: ${item.groupName}` : 'Learn'}
                </span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded bg-clay/40 text-ink/60">
                  {item.type === 'pdf' ? 'PDF' : item.type === 'youtube' ? 'YouTube' : 'Code'}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-xs text-ink/60">
              {loading ? 'Searching...' : (!isAuthenticated() ? 'Login to search your saved materials' : (query.trim() ? 'No saved materials found' : 'Start searching'))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
