import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DoodleBackground } from '../components/DoodleBackground'
import { FocusScoreBadge, FocusScoreBadgeCompact } from '../components/FocusScoreBadge'
import { useFocusStore } from '../store/useFocusStore'
import { profileAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { Search as SearchIcon, Wifi } from 'lucide-react'

export const Search = () => {
  const { onlineUsers } = useFocusStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef(null)
  const suggestionsTimeoutRef = useRef(null)

  // Helper function to check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId)
  }

  // Get updated focus score for online users
  const getLatestFocusScore = (userId, defaultScore) => {
    const onlineUser = onlineUsers.find(user => user.userId === userId)
    return onlineUser ? onlineUser.focusScore : defaultScore
  }

  // Handle search input with debouncing for suggestions
  const handleSearchInputChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    setHasSearched(false)
    setSearchResults([])

    // Clear previous timeout
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current)
    }

    // Only fetch suggestions if query length is at least 1 character
    if (query.trim().length > 0) {
      setShowSuggestions(true)
      suggestionsTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await profileAPI.searchUsersByUsername(query)
          if (response.success) {
            setSuggestions(response.users || [])
          }
        } catch (error) {
          console.error('Suggestion fetch error:', error)
          setSuggestions([])
        }
      }, 300) // 300ms debounce
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = async (user) => {
    setSearchQuery(user.username)
    setShowSuggestions(false)
    setSuggestions([])
    
    // Load the full profile for this user
    await handleViewProfile(user._id)
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast.error('Please enter a search term')
      return
    }

    setLoading(true)
    setShowSuggestions(false)
    setHasSearched(true)
    try {
      const response = await profileAPI.searchPublicProfiles(searchQuery)
      if (response.success) {
        setSearchResults(response.users || [])
        if (response.users.length === 0) {
          toast.info('No users found with public focus scores')
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error(error.message || 'Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const handleViewProfile = async (userId) => {
    setLoadingProfile(true)
    try {
      const response = await profileAPI.getPublicProfile(userId)
      if (response.success) {
        setSelectedUser(response.user)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      toast.error(error.message || 'Failed to load profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <DoodleBackground>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-4xl font-bold text-ink">Find Users</h2>
          <p className="mt-2 text-ink/70">Search for students and faculty to view their focus scores</p>
        </div>

        {/* Search Section */}
        <div className="rounded-3xl bg-white/80 p-8 shadow-soft">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative" ref={searchInputRef}>
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-ink/10 bg-white focus:border-teal focus:outline-none text-ink placeholder-ink/40"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ink/10 rounded-2xl shadow-lg z-10 max-h-80 overflow-y-auto">
                  {suggestions.map((user) => {
                    const isOnline = isUserOnline(user._id)
                    const currentFocusScore = getLatestFocusScore(user._id, user.focusScore)
                    
                    return (
                      <button
                        key={user._id}
                        onClick={() => handleSuggestionClick(user)}
                        className="w-full text-left px-4 py-3 hover:bg-sand/30 border-b border-ink/5 last:border-b-0 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-blue flex items-center justify-center text-white font-bold text-xs">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 border border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-ink flex items-center gap-1">
                              {user.name}
                              {isOnline && <Wifi className="w-3 h-3 text-green-500" />}
                            </p>
                            <p className="text-sm text-ink/60">@{user.username}</p>
                          </div>
                        </div>
                        {currentFocusScore !== undefined && (
                          <div className="text-right">
                            <p className="font-bold text-teal text-sm">{currentFocusScore}</p>
                            <p className="text-xs text-ink/60">Score</p>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-teal-400 to-teal-600 px-8 py-3 font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Selected User Profile View */}
        {selectedUser && (
          <div className="rounded-3xl bg-white/80 p-8 shadow-soft">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-ink">Profile Details</h3>
                {isUserOnline(selectedUser._id) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Online</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-ink/50 hover:text-ink text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Focus Score Badge */}
              <div className="flex justify-center md:col-span-1">
                <FocusScoreBadge
                  score={getLatestFocusScore(selectedUser._id, selectedUser.focusScore || 0)}
                  size="medium"
                  showLabel={true}
                  showScore={true}
                />
              </div>

              {/* User Info */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider">Name</p>
                  <p className="text-2xl font-bold text-ink">{selectedUser.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-ink/60 uppercase tracking-wider">Username</p>
                    <p className="text-ink">@{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink/60 uppercase tracking-wider">Email</p>
                    <p className="text-ink break-all">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-ink/60 uppercase tracking-wider">Role</p>
                    <p className="text-ink capitalize">
                      {selectedUser.role === 'student' ? '🎓 Student' : '👨‍🏫 Faculty'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-ink/60 uppercase tracking-wider">Public Profile</p>
                    <p className="text-ink">{selectedUser.publicFocus ? '✓ Yes' : '✗ No'}</p>
                  </div>
                </div>

                {selectedUser.college && (
                  <div>
                    <p className="text-sm text-ink/60 uppercase tracking-wider">College/University</p>
                    <p className="text-ink">{selectedUser.college}</p>
                  </div>
                )}

                {selectedUser.department && (
                  <div>
                    <p className="text-sm text-ink/60 uppercase tracking-wider">Department</p>
                    <p className="text-ink">{selectedUser.department}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="rounded-2xl bg-sand/50 p-4">
                    <p className="text-sm text-ink/60">Total Focus Minutes</p>
                    <p className="text-2xl font-bold text-ink">{selectedUser.totalFocusMinutes || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-sand/50 p-4">
                    <p className="text-sm text-ink/60">Streak</p>
                    <p className="text-2xl font-bold text-ink">{selectedUser.streak || 0} days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && !selectedUser && (
          <div className="rounded-3xl bg-white/80 p-8 shadow-soft">
            {searchResults.length > 0 ? (
              <>
                <h3 className="text-xl font-bold text-ink mb-6">
                  Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleViewProfile(user._id)}
                      className="rounded-2xl border border-ink/10 bg-gradient-to-br from-sand/30 to-transparent p-6 hover:shadow-md cursor-pointer transition-all hover:border-teal/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-ink text-lg">{user.name}</h4>
                          <p className="text-sm text-ink/60">@{user.username || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {user.college && (
                          <p className="text-sm text-ink/70">
                            <span className="font-semibold">College:</span> {user.college}
                          </p>
                        )}
                        {user.department && (
                          <p className="text-sm text-ink/70">
                            <span className="font-semibold">Department:</span> {user.department}
                          </p>
                        )}
                        <p className="text-sm text-ink/70">
                          <span className="font-semibold">Role:</span>{' '}
                          {user.role === 'student' ? '🎓 Student' : '👨‍🏫 Faculty'}
                        </p>

                        <div className="pt-4 border-t border-ink/10 flex items-center justify-between">
                          <FocusScoreBadgeCompact score={user.focusScore || 0} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewProfile(user._id)
                            }}
                            disabled={loadingProfile}
                            className="text-sm rounded-full border border-teal px-4 py-2 text-teal hover:bg-teal/5 transition-all disabled:opacity-50"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-ink/70 text-lg">
                  No users found matching "{searchQuery}"
                </p>
                <p className="text-ink/50 text-sm mt-2">
                  Try searching for different name, email, or username. Users must have public focus enabled.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && searchResults.length === 0 && (
          <div className="rounded-3xl bg-gradient-to-br from-teal/10 to-blue/10 p-12 text-center shadow-soft">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-ink mb-2">Start Searching</h3>
            <p className="text-ink/70 max-w-md mx-auto">
              Search for other students and faculty members by name, email, or username to discover their focus scores and achievements. As you type, suggestions will appear!
            </p>
          </div>
        )}
      </div>
    </DoodleBackground>
  )
}
