// API configuration and service
const API_BASE_URL = 'http://localhost:5020/api'

// Helper to get auth token from localStorage
const getToken = () => localStorage.getItem('accessToken')
const getRefreshToken = () => localStorage.getItem('refreshToken')
const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken)
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
}
const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

// Generic API request handler with token refresh
async function apiRequest(endpoint, options = {}) {
  const token = getToken()
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const data = await response.json()

    // If token expired, try to refresh
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          setTokens(refreshData.accessToken, null)
          
          // Retry original request with new token
          config.headers.Authorization = `Bearer ${refreshData.accessToken}`
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config)
          return await retryResponse.json()
        } else {
          clearTokens()
          window.location.href = '/auth'
          throw new Error('Session expired. Please login again.')
        }
      }
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// ============ AUTH API ============

export const authAPI = {
  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    
    if (data.success) {
      setTokens(data.accessToken, data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    
    return data
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (data.success) {
      setTokens(data.accessToken, data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    
    return data
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      clearTokens()
    }
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me', { method: 'GET' })
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    })
  },

  deleteAccount: async (password, confirmDelete = true) => {
    const data = await apiRequest('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmDelete }),
    })
    
    if (data.success) {
      clearTokens()
    }
    
    return data
  },

  refreshToken: async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token available')
    
    const data = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then(res => res.json())
    
    if (data.success) {
      setTokens(data.accessToken, null)
    }
    
    return data
  },
}

// ============ PROFILE API ============

export const profileAPI = {
  getProfile: async () => {
    return await apiRequest('/profile', { method: 'GET' })
  },

  updateProfile: async (updates) => {
    return await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  updatePassword: async (currentPassword, newPassword, confirmPassword) => {
    return await apiRequest('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    })
  },

  togglePublicFocus: async () => {
    return await apiRequest('/profile/toggle-public-focus', { method: 'POST' })
  },

  deleteProfile: async (password, confirmDelete = true) => {
    const data = await apiRequest('/profile', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmDelete }),
    })
    
    if (data.success) {
      clearTokens()
    }
    
    return data
  },

  searchPublicProfiles: async (query) => {
    return await apiRequest(`/profile/search?query=${encodeURIComponent(query)}`, { method: 'GET' })
  },

  searchUsersByUsername: async (query) => {
    return await apiRequest(`/profile/search-users?query=${encodeURIComponent(query)}`, { method: 'GET' })
  },

  getPublicProfile: async (userId) => {
    return await apiRequest(`/profile/public/${userId}`, { method: 'GET' })
  },
}

// ============ GROUP API ============

export const groupAPI = {
  createGroup: async (groupData) => {
    return await apiRequest('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    })
  },

  getUserGroups: async () => {
    return await apiRequest('/groups', { method: 'GET' })
  },

  getGroup: async (groupId) => {
    return await apiRequest(`/groups/${groupId}`, { method: 'GET' })
  },

  joinGroup: async (groupData) => {
    return await apiRequest('/groups/join/code', {
      method: 'POST',
      body: JSON.stringify(groupData),
    })
  },

  joinGroupByCode: async (groupData) => {
    return await apiRequest('/groups/join/code', {
      method: 'POST',
      body: JSON.stringify(groupData),
    })
  },

  leaveGroup: async (groupId) => {
    return await apiRequest(`/groups/${groupId}/leave`, {
      method: 'POST',
    })
  },

  updateGroup: async (groupId, updates) => {
    return await apiRequest(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  deleteGroup: async (groupId) => {
    return await apiRequest(`/groups/${groupId}`, {
      method: 'DELETE',
    })
  },

  addMember: async (groupId, userId) => {
    return await apiRequest(`/groups/${groupId}/add-member`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  },

  addResource: async (groupId, resourceData) => {
    return await apiRequest(`/groups/${groupId}/resources`, {
      method: 'POST',
      body: JSON.stringify(resourceData),
    })
  },

  getGroupResources: async (groupId) => {
    return await apiRequest(`/groups/${groupId}/resources`, {
      method: 'GET',
    })
  },

  deleteResource: async (groupId, resourceId) => {
    return await apiRequest(`/groups/${groupId}/resources/${resourceId}`, {
      method: 'DELETE',
    })
  },

  removeMember: async (groupId, userId) => {
    return await apiRequest(`/groups/${groupId}/remove-member`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  },
}

// ============ AI HELPBOT API ============

export const aiAPI = {
  chat: async (message, sessionContext = null, conversationHistory = []) => {
    return await apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionContext, conversationHistory }),
    })
  },

  getMaterials: async () => {
    return await apiRequest('/ai/materials', { method: 'GET' })
  },
}

// ============ CONTENT API ============

export const contentAPI = {
  // Create new content (PDF, YouTube, Code)
  createContent: async (contentData) => {
    return await apiRequest('/content', {
      method: 'POST',
      body: JSON.stringify(contentData),
    })
  },

  // Upload a file (PDF) and create content
  uploadFile: async (formData) => {
    const token = getToken()
    const config = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Note: Do not set Content-Type for FormData
      },
      body: formData,
    }

    const response = await fetch(`${API_BASE_URL}/content/upload`, config)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Upload failed')
    return data
  },

  // Get all user's content
  getContent: async () => {
    return await apiRequest('/content', { method: 'GET' })
  },

  // Get single content by ID
  getSingleContent: async (contentId) => {
    return await apiRequest(`/content/${contentId}`, { method: 'GET' })
  },

  // Search content (PDFs, YouTube) by query
  searchContent: async (query) => {
    return await apiRequest(`/content/search?q=${encodeURIComponent(query)}`, { method: 'GET' })
  },

  // Update content
  updateContent: async (contentId, updates) => {
    return await apiRequest(`/content/${contentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete content
  deleteContent: async (contentId) => {
    return await apiRequest(`/content/${contentId}`, {
      method: 'DELETE',
    })
  },
}

// ============ HELPER FUNCTIONS ============

export const isAuthenticated = () => {
  return !!getToken()
}

export const getUserFromStorage = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export { clearTokens, setTokens, getToken }

