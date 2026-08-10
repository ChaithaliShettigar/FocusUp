import dotenv from 'dotenv'

dotenv.config()

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import fs from 'fs'
import { connectDB } from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import Group from './models/Group.js'

// Ensure uploads folder exists and serve it as static
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)

// Routes
import authRoutes from './routes/auth.js'
import sessionRoutes from './routes/sessions.js'
import groupRoutes from './routes/groups.js'
import contentRoutes from './routes/content.js'
import analyticsRoutes from './routes/analytics.js'
import profileRoutes from './routes/profile.js'
import aiRoutes from './routes/ai.js'
import deadlineRoutes from './routes/deadlines.js'
import notificationRoutes from './routes/notifications.js'
import { checkDeadlinesForReminders } from './controllers/deadlineController.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}))

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir))

// Make io available in req object
app.use((req, res, next) => {
  req.io = io
  next()
})

// Connect to Database
connectDB()

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/groups', deadlineRoutes)
app.use('/api/notifications', notificationRoutes)

// Error handling middleware
app.use(errorHandler)

// Socket.IO connection handling
const activeUsers = new Map() // Track online users
const userRooms = new Map() // Track which rooms users are in

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`)

  // Handle user authentication
  socket.on('authenticate', (userData) => {
    if (userData && userData.userId) {
      activeUsers.set(socket.id, userData)
      socket.userId = userData.userId
      socket.username = userData.username
      
      // Join user to personal room for direct messages
      socket.join(`user_${userData.userId}`)
      
      console.log(`✅ User authenticated: ${userData.username} (${userData.userId})`)
      
      // Broadcast to all users that this user is online
      socket.broadcast.emit('userOnline', {
        userId: userData.userId,
        username: userData.username,
        focusScore: userData.focusScore
      })
    }
  })

  // Handle joining group rooms
  socket.on('joinGroup', (groupId) => {
    socket.join(`group_${groupId}`)
    
    if (!userRooms.has(socket.userId)) {
      userRooms.set(socket.userId, new Set())
    }
    userRooms.get(socket.userId).add(`group_${groupId}`)
    
    console.log(`👥 User ${socket.username} joined group ${groupId}`)
    
    // Notify other group members
    socket.to(`group_${groupId}`).emit('userJoinedGroup', {
      userId: socket.userId,
      username: socket.username,
      groupId
    })
  })

  // Handle leaving group rooms
  socket.on('leaveGroup', (groupId) => {
    socket.leave(`group_${groupId}`)
    
    if (userRooms.has(socket.userId)) {
      userRooms.get(socket.userId).delete(`group_${groupId}`)
    }
    
    console.log(`👋 User ${socket.username} left group ${groupId}`)
    
    // Notify other group members
    socket.to(`group_${groupId}`).emit('userLeftGroup', {
      userId: socket.userId,
      username: socket.username,
      groupId
    })
  })

  // Handle real-time group updates
  socket.on('groupUpdate', (data) => {
    socket.to(`group_${data.groupId}`).emit('groupUpdated', data)
  })

  // Handle group chat messages
  socket.on('sendGroupMessage', async (data) => {
    const { groupId, text, senderId, senderName } = data
    if (!groupId || !text || !senderId) return

    try {
      const group = await Group.findById(groupId)
      if (group) {
        const newMessage = { senderId, senderName, text, timestamp: new Date() }
        group.chatMessages.push(newMessage)
        await group.save()
        
        const savedMessage = group.chatMessages[group.chatMessages.length - 1]
        
        // Broadcast to everyone in the room, including sender
        io.to(`group_${groupId}`).emit('groupMessageReceived', {
          groupId,
          groupName: group.name,
          message: savedMessage
        })
      }
    } catch (error) {
      console.error('Error saving group message:', error)
    }
  })

  // Handle focus score updates
  socket.on('focusScoreUpdate', (data) => {
    // Broadcast to all connected users
    socket.broadcast.emit('userFocusScoreUpdated', {
      userId: data.userId,
      focusScore: data.focusScore,
      username: data.username
    })
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`)
    
    const userData = activeUsers.get(socket.id)
    if (userData) {
      // Broadcast to all users that this user is offline
      socket.broadcast.emit('userOffline', {
        userId: userData.userId,
        username: userData.username
      })
      
      // Clean up user data
      activeUsers.delete(socket.id)
      if (userRooms.has(userData.userId)) {
        userRooms.delete(userData.userId)
      }
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 5010

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🔌 Socket.IO ready for real-time communication`)

  // Schedule deadline reminder checks every 30 seconds
  setInterval(() => {
    checkDeadlinesForReminders(io)
  }, 30 * 1000)
})

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error.message)
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or use a different one.`)
  }
  process.exit(1)
})

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message)
  server.close(() => process.exit(1))
})
