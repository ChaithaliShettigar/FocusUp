import express from 'express'
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  changePassword, 
  deleteAccount, 
  getMe 
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/refresh-token', refreshToken)
router.post('/logout', logout)

// Protected routes
router.use(protect)
router.get('/me', getMe)
router.post('/change-password', changePassword)
router.delete('/account', deleteAccount)

export default router
