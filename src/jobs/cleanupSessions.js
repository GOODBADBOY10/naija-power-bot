'use strict'

const cron = require('node-cron')
const { Session } = require('../models/Session')
const logger = require('../utils/logger')

/**
 * Clean up old pre-keys and other accumulated session keys
 * Keeps the last 200 pre-keys, deletes the rest
 */
const cleanupOldPreKeys = async () => {
  try {
    logger.info('🧹 Running session cleanup job...')

    const preKeys = await Session.find({
      sessionId: { $regex: /^naija-power-bot-session-pre-key-/ }
    }).sort({ sessionId: 1 })

    const KEEP_LAST = 200
    if (preKeys.length > KEEP_LAST) {
      const toDelete = preKeys.slice(0, preKeys.length - KEEP_LAST)
      const idsToDelete = toDelete.map((k) => k._id)

      const result = await Session.deleteMany({ _id: { $in: idsToDelete } })
      logger.info(`🗑️ Deleted ${result.deletedCount} old pre-keys. Kept ${KEEP_LAST}.`)
    } else {
      logger.info(`✅ Pre-keys within limit (${preKeys.length}). No cleanup needed.`)
    }
  } catch (error) {
    logger.error('❌ Session cleanup job failed:', error)
  }
}

/**
 * Start the session cleanup cron job
 * Runs every Sunday at midnight
 */
const startSessionCleanupJob = () => {
  cron.schedule('0 0 * * 0', cleanupOldPreKeys, {
    timezone: 'Africa/Lagos',
  })
  logger.info('🧹 Session cleanup cron job started (Sundays at midnight)')
}

module.exports = { startSessionCleanupJob }