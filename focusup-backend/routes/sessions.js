import express from 'express'
import {
  createSession,
  getSessions,
  getSession,
  updateSession,
  endSession,
  deleteSession,
} from '../controllers/sessionController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.route('/').post(createSession).get(getSessions)
router.route('/:id').get(getSession).put(updateSession).delete(deleteSession)
router.put('/:id/end', endSession)

export default router
