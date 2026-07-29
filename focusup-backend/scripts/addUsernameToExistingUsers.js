// This script adds default usernames to existing users who don't have one
// Run this script once to migrate existing user data

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find all users without a username
    const usersWithoutUsername = await User.find({ username: { $exists: false } })
    console.log(`Found ${usersWithoutUsername.length} users without username`)

    // Update each user with a generated username based on their name
    for (let i = 0; i < usersWithoutUsername.length; i++) {
      const user = usersWithoutUsername[i]
      let generatedUsername = user.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '')
      
      // Make sure username is unique
      let counter = 1
      let originalUsername = generatedUsername
      while (await User.findOne({ username: generatedUsername })) {
        generatedUsername = `${originalUsername}${counter}`
        counter++
      }

      user.username = generatedUsername
      await user.save()
      console.log(`Updated user ${user.name} with username: ${generatedUsername}`)
    }

    console.log('Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateUsers()
