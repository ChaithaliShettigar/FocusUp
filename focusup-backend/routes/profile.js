import express from 'express'
import {
  getProfile,
  updateProfile,
  updatePassword,
  togglePublicFocus,
  deleteProfile,
  searchPublicProfiles,
  searchUsersByUsername,
  getPublicProfile,
} from '../controllers/profileController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Public routes (no authentication needed)
router.get('/search', searchPublicProfiles)
router.get('/search-users', searchUsersByUsername)
router.get('/public/:userId', getPublicProfile)

// Protected routes
router.use(protect)

router.get('/', getProfile)
router.put('/', updateProfile)
router.put('/password', updatePassword)
router.post('/toggle-public-focus', togglePublicFocus)
router.delete('/', deleteProfile)

export default router
