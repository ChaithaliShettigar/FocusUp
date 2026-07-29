import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable. Generate a secure random secret and set it in your environment.');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('Missing JWT_REFRESH_SECRET environment variable. Generate a secure random secret and set it in your environment.');
}

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
} 

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  } catch (error) {
    return null
  }
}
