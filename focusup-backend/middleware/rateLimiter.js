// Rate limiter middleware for AI HelpBot
// Limits requests to prevent API abuse

const requestCounts = new Map()

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > 60000) {
      requestCounts.delete(key)
    }
  }
}, 60000)

export const aiRateLimiter = (maxRequests = 20, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.ip
    const now = Date.now()
    
    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, {
        count: 1,
        windowStart: now
      })
      return next()
    }
    
    const userData = requestCounts.get(userId)
    
    // Reset window if expired
    if (now - userData.windowStart > windowMs) {
      userData.count = 1
      userData.windowStart = now
      return next()
    }
    
    // Check if limit exceeded
    if (userData.count >= maxRequests) {
      const retryAfter = Math.ceil((userData.windowStart + windowMs - now) / 1000)
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
        retryAfter
      })
    }
    
    // Increment count
    userData.count++
    next()
  }
}

export default aiRateLimiter
