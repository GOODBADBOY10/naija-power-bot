'use strict'

const cron = require('node-cron')
const { Report } = require('../models/Report')
const logger = require('../utils/logger')

/**
 * Clean up expired reports every 30 minutes
 * MongoDB TTL index handles auto-expiry but this
 * is a safety net for any missed deletions
 */
const startExpireReportsJob = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      const result = await Report.deleteMany({
        expiresAt: { $lt: new Date() },
      })

      if (result.deletedCount > 0) {
        logger.info(`🧹 Expired reports cleaned up: ${result.deletedCount} removed`)
      }
    } catch (error) {
      logger.error('Error running expire reports job:', error)
    }
  })

  logger.info('✅ Expire reports cron job started')
}

module.exports = { startExpireReportsJob }