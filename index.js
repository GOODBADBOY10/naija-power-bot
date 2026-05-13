'use strict'

require('dotenv').config()

const { connectDatabase, disconnectDatabase } = require('./src/config/database')
const { startBot } = require('./src/bot')
const { startExpireReportsJob } = require('./src/jobs/expireReports')
const logger = require('./src/utils/logger')
const { appName, nodeEnv } = require('./src/config/env')

logger.info(`🚀 Starting ${appName} in ${nodeEnv} mode...`)

const bootstrap = async () => {
  try {
    // 1. Connect to database
    await connectDatabase()

    // 2. Start cron jobs
    startExpireReportsJob()

    // 3. Start WhatsApp bot
    await startBot()

    logger.info(`✅ ${appName} is fully up and running!`)
  } catch (error) {
    logger.error('❌ Failed to bootstrap application:', error)
    process.exit(1)
  }
}

// Graceful shutdown handlers
const shutdown = async (signal) => {
  logger.info(`⚠️ ${signal} received. Shutting down gracefully...`)

  try {
    await disconnectDatabase()
    logger.info('✅ Shutdown complete.')
    process.exit(0)
  } catch (error) {
    logger.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('❌ Unhandled Rejection:', reason)
  process.exit(1)
})

bootstrap()