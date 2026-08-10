import express from 'express'
import {
  getNotifications,
  markAllRead,
  clearAll,
} from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getNotifications)
router.put('/read', markAllRead)
router.delete('/clear', clearAll)

export default router
