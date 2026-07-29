import express from 'express'
import { protect } from '../middleware/auth.js'
import { aiRateLimiter } from '../middleware/rateLimiter.js'
import { chatWithAI, getUserMaterials } from '../controllers/aiController.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// AI Chat endpoint with rate limiting (20 requests per minute)
router.post('/chat', aiRateLimiter(20, 60000), chatWithAI)

// Get user's materials for search suggestions
router.get('/materials', getUserMaterials)

export default router
