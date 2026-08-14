import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable. Generate a secure random secret and set it in your environment.');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('Missing JWT_REFRESH_SECRET environment variable. Generate a secure random secret and set it in your environment.');
}

const JWT_ALGORITHM = 'HS256'

export const generateToken = (id) => {
  return jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: process.env.JWT_EXPIRE || '30m',
  })
} 

export const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] })
  } catch (error) {
    return null
  }
}

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, { algorithms: [JWT_ALGORITHM] })
  } catch (error) {
    return null
  }
}
