import jwt from 'jsonwebtoken'
import { verifyRefreshToken } from '../utils/jwt.js'

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
      next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' })
      }
      return res.status(401).json({ message: 'Token is not valid' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const verifyRefresh = (token) => {
  return verifyRefreshToken(token)
}
