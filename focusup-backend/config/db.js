import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    // Try multiple connection options
    const connectionStrings = [
      process.env.MONGODB_URI,
      'mongodb://localhost:27017/focusup',
      'mongodb://127.0.0.1:27017/focusup'
    ].filter(Boolean)
    
    let connected = false
    
    for (const mongoUri of connectionStrings) {
      try {
        const conn = await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000, // 5 second timeout
        })
        console.log(`✅ MongoDB connected: ${conn.connection.host}`)
        connected = true
        break
      } catch (err) {
        console.log(`❌ Failed to connect to ${mongoUri}: ${err.message}`)
      }
    }
    
    if (!connected) {
      console.log(`⚠️  No database connection established`)
      console.log(`ℹ️  Server will continue running for demonstration purposes`)
      console.log(`ℹ️  To fix: Install MongoDB locally or set up MongoDB Atlas`)
    }
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`)
    console.log(`ℹ️  Server will continue without database connection for demonstration`)
  }
}
