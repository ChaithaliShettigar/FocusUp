import { create } from 'zustand'
import { getUserFromStorage, isAuthenticated as checkAuth } from '../services/api'
import { socketService } from '../services/socket'

// Lightweight id helper
const makeId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9)

// Load/save active session to localStorage for persistence
const loadActiveSession = () => {
  try {
    const data = localStorage.getItem('activeSession')
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const saveActiveSession = (session) => {
  try {
    if (session) {
      localStorage.setItem('activeSession', JSON.stringify(session))
    } else {
      localStorage.removeItem('activeSession')
    }
  } catch {}
}

const defaultFocusPreferences = {
  tabSwitchInterventionEnabled: true,
  tabSwitchInterventionStudyOnly: true,
}

const loadFocusPreferences = () => {
  try {
    const raw = localStorage.getItem('focusPreferences')
    if (!raw) return defaultFocusPreferences
    return { ...defaultFocusPreferences, ...JSON.parse(raw) }
  } catch {
    return defaultFocusPreferences
  }
}

const saveFocusPreferences = (preferences) => {
  try {
    localStorage.setItem('focusPreferences', JSON.stringify(preferences))
  } catch {}
}

const initialUser = {
  name: '',
  email: '',
  college: '',
  department: '',
  role: 'student',
  publicFocus: false,
  studentId: '',
}

// Load user from localStorage on initialization
const loadStoredUser = () => {
  const storedUser = getUserFromStorage()
  return storedUser || initialUser
}

export const useFocusStore = create((set, get) => ({
  user: loadStoredUser(),
  isAuthenticated: checkAuth(),
  language: 'en',
  focusScore: 0,
  streak: 0,
  contents: [], // uploads and links
  groups: [], // created or joined groups
  sessions: [], // focus sessions
  notifications: [],
  tabSwitches: 0,
  focusPreferences: loadFocusPreferences(),
  currentSessionId: loadActiveSession()?.sessionId || null,
  activeContentId: loadActiveSession()?.contentId || null, // Content being studied
  onlineUsers: [], // Track online users across tabs/browsers
  realtimeGroups: [], // Track real-time group updates

  setLanguage: (lng) => set({ language: lng }),
  setUser: (payload) => {
    const updatedUser = { ...get().user, ...payload }
    // Update localStorage when user changes
    if (Object.keys(payload).length > 0) {
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
    set({ user: updatedUser })
  },
  setAuthenticated: (flag) => {
    set({ isAuthenticated: !!flag })
    
    if (flag) {
      // Connect to socket when authenticated
      const user = get().user
      socketService.connect({
        userId: user._id,
        username: user.username,
        focusScore: get().focusScore
      })
      
      // Set up real-time event listeners
      get().setupRealtimeListeners()
    } else {
      // Disconnect socket when logged out
      socketService.disconnect()
      set({
        onlineUsers: [],
        realtimeGroups: [],
        contents: [],
        groups: [],
        sessions: [],
        currentSessionId: null,
        activeContentId: null,
      })
    }
  },
  togglePublicFocus: () => set({ user: { ...get().user, publicFocus: !get().user.publicFocus } }),

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

  // Set all contents (used when loading from backend)
  setContents: (contents) => set({ contents }),

  addContent: (content) =>
    set({ contents: [...get().contents, { ...content, id: content.id || makeId(), createdAt: Date.now() }] }),

  updateContent: (contentId, updates) =>
    set({
      contents: get().contents.map((c) => (c.id === contentId ? { ...c, ...updates } : c)),
    }),

  removeContent: (contentId) =>
    set((state) => {
      const filtered = state.contents.filter((c) => c.id !== contentId)
      // If the current session is tied to removed content, clear current session reference
      const current = state.sessions.find((s) => s.id === state.currentSessionId)
      const shouldClearSession = current && current.contentId === contentId && current.status !== 'active'
      return {
        contents: filtered,
        currentSessionId: shouldClearSession ? null : state.currentSessionId,
      }
    }),

  addGroup: (group) =>
    set({ groups: [...get().groups, { ...group, id: makeId(), members: [], resources: [], leaderboard: [] }] }),

  joinGroup: (groupId, memberName) =>
    set({
      groups: get().groups.map((g) =>
        g.id === groupId && !g.members.includes(memberName)
          ? { ...g, members: [...g.members, memberName] }
          : g
      ),
    }),

  addResourceToGroup: (groupId, resource) =>
    set({
      groups: get().groups.map((g) =>
        g.id === groupId ? { ...g, resources: [...g.resources, { ...resource, id: makeId() }] } : g
      ),
    }),

  startSession: ({ contentId, targetMinutes, contentType, resourceType, groupId }) => {
    const matchedContent = get().contents.find((c) => c.id === contentId)
    const resolvedContentType = contentType || resourceType || matchedContent?.type || null

    const session = {
      id: makeId(),
      contentId,
      contentType: resolvedContentType,
      targetMinutes,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      activeSeconds: 0,
      idleSeconds: 0,
      tabSwitches: 0,
      status: 'active',
      targetReached: false,
      ...(groupId ? { groupId } : {}),
    }
    // Save to localStorage for persistence across refresh/navigation
    saveActiveSession({ sessionId: session.id, contentId, targetMinutes, startedAt: session.startedAt })
    set({ sessions: [...get().sessions, session], currentSessionId: session.id, activeContentId: contentId })
    return session.id
  },

  updateSession: (sessionId, updates) =>
    set({
      sessions: get().sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
    }),

  endSession: (sessionId, status = 'completed') => {
    const sessions = get().sessions.map((s) => (s.id === sessionId ? { ...s, status } : s))
    const finished = sessions.find((s) => s.id === sessionId)
    let scoreDelta = 0
    if (finished) {
      const completion = finished.elapsedSeconds / (finished.targetMinutes * 60 || 1)
      const activityRatio = finished.activeSeconds / (finished.elapsedSeconds || 1)
      const distractionPenalty = finished.tabSwitches * 2 + finished.idleSeconds / 30
      scoreDelta = Math.max(0, Math.round(100 * completion * activityRatio - distractionPenalty))
    }
    // Clear persisted session when ending
    saveActiveSession(null)
    set({
      sessions,
      focusScore: Math.max(0, get().focusScore + scoreDelta),
      streak: status === 'completed' ? get().streak + 1 : get().streak,
      currentSessionId: status === 'active' ? sessionId : null,
      activeContentId: status === 'active' ? get().activeContentId : null,
    })
  },

  logActivity: (sessionId, { type = 'active', delta = 1 }) => {
    set({
      sessions: get().sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              elapsedSeconds: s.elapsedSeconds + delta,
              activeSeconds: type === 'active' ? s.activeSeconds + delta : s.activeSeconds,
              idleSeconds: type === 'idle' ? s.idleSeconds + delta : s.idleSeconds,
            }
          : s
      ),
    })
  },

  addTabSwitch: (sessionId) => {
    set({ tabSwitches: get().tabSwitches + 1 })
    if (!sessionId) return
    set({
      sessions: get().sessions.map((s) =>
        s.id === sessionId ? { ...s, tabSwitches: s.tabSwitches + 1 } : s
      ),
    })
  },

  setFocusPreference: (key, value) => {
    const nextPreferences = {
      ...get().focusPreferences,
      [key]: value,
    }
    saveFocusPreferences(nextPreferences)
    set({ focusPreferences: nextPreferences })
  },

  resetFocusPreferences: () => {
    saveFocusPreferences(defaultFocusPreferences)
    set({ focusPreferences: defaultFocusPreferences })
  },

  pushNotification: (message) =>
    set({ notifications: [...get().notifications.slice(-3), { id: makeId(), message }] }),

  // Real-time functionality
  setupRealtimeListeners: () => {
    // Listen for online users
    socketService.onUserOnline((userData) => {
      const currentUsers = get().onlineUsers
      if (!currentUsers.find(u => u.userId === userData.userId)) {
        set({ onlineUsers: [...currentUsers, userData] })
      }
    })

    // Listen for offline users
    socketService.onUserOffline((userData) => {
      set({ 
        onlineUsers: get().onlineUsers.filter(u => u.userId !== userData.userId)
      })
    })

    // Listen for focus score updates
    socketService.onUserFocusScoreUpdated((data) => {
      set({
        onlineUsers: get().onlineUsers.map(u => 
          u.userId === data.userId 
            ? { ...u, focusScore: data.focusScore }
            : u
        )
      })
      
      // Show notification for focus score updates
      get().pushNotification(`${data.username} updated their focus score to ${data.focusScore}!`)
    })

    // Listen for group creation
    socketService.onGroupCreated((data) => {
      get().pushNotification(`${data.createdBy} created a new group: ${data.group.name}`)
    })

    // Listen for group members joining
    socketService.onMemberJoinedGroup((data) => {
      get().pushNotification(`${data.newMember.username} joined ${data.group.name}`)
      
      // Update groups if we're in this group
      set({
        groups: get().groups.map(g => 
          g._id === data.group._id ? data.group : g
        )
      })
    })

    // Listen for group members leaving
    socketService.onMemberLeftGroup((data) => {
      get().pushNotification(`${data.leftMember.username} left ${data.group.name}`)
      
      // Update groups if we're in this group
      set({
        groups: get().groups.map(g => 
          g._id === data.group._id ? data.group : g
        )
      })
    })

    // Listen for general group updates
    socketService.onGroupUpdated((data) => {
      set({
        groups: get().groups.map(g => 
          g._id === data.groupId ? { ...g, ...data.updates } : g
        )
      })
    })
  },

  // Socket actions
  joinGroupRoom: (groupId) => {
    socketService.joinGroup(groupId)
  },

  leaveGroupRoom: (groupId) => {
    socketService.leaveGroup(groupId)
  },

  updateFocusScoreRealtime: () => {
    const user = get().user
    const focusScore = get().focusScore
    
    socketService.updateFocusScore({
      userId: user._id,
      username: user.username,
      focusScore: focusScore
    })
  },

  // Update focus score and broadcast the change
  updateFocusScore: (newScore) => {
    set({ focusScore: newScore })
    get().updateFocusScoreRealtime()
  },
}))
