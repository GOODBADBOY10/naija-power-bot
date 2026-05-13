'use strict'

const mongoose = require('mongoose')
const logger = require('../utils/logger')
const { mongoUri, nodeEnv } = require('./env')

const MONGOOSE_OPTIONS = {
  autoIndex: nodeEnv !== 'production',
}

let isConnected = false

const connectDatabase = async () => {
  if (isConnected) {
    logger.debug('Using existing database connection')
    return
  }

  try {
    const connection = await mongoose.connect(mongoUri, MONGOOSE_OPTIONS)
    isConnected = true
    logger.info(`✅ MongoDB connected: ${connection.connection.host}`)
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false
  logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...')
})

mongoose.connection.on('reconnected', () => {
  isConnected = true
  logger.info('✅ MongoDB reconnected')
})

mongoose.connection.on('error', (error) => {
  logger.error('❌ MongoDB connection error:', error)
  isConnected = false
})

// Graceful shutdown
const disconnectDatabase = async () => {
  if (!isConnected) return

  try {
    await mongoose.connection.close()
    isConnected = false
    logger.info('✅ MongoDB connection closed gracefully')
  } catch (error) {
    logger.error('❌ Error closing MongoDB connection:', error)
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
}