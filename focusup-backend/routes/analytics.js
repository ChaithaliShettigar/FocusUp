import express from 'express'
import { getAnalytics, getDailyAnalytics } from '../controllers/analyticsController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getAnalytics)
router.get('/daily', getDailyAnalytics)

export default router
