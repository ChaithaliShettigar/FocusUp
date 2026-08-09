import express from 'express'
import {
  createDeadline,
  getGroupDeadlines,
  updateDeadline,
  deleteDeadline,
  markDeadlineCompleted,
  unmarkDeadlineCompleted,
} from '../controllers/deadlineController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.route('/:groupId/deadlines').post(createDeadline).get(getGroupDeadlines)
router.put('/:groupId/deadlines/:deadlineId', updateDeadline)
router.delete('/:groupId/deadlines/:deadlineId', deleteDeadline)
router.post('/:groupId/deadlines/:deadlineId/complete', markDeadlineCompleted)
router.post('/:groupId/deadlines/:deadlineId/uncomplete', unmarkDeadlineCompleted)

export default router
