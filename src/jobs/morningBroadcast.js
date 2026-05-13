'use strict'

const cron = require('node-cron')
const { getAllActiveReports } = require('../services/reportService')
const { Subscription } = require('../models/Subscription')
const { getOutageDuration, getTimeAgo } = require('../utils/helpers')
const logger = require('../utils/logger')

/**
 * Build the morning broadcast message
 */
const buildBroadcastMessage = (reports) => {
  const lines = reports.map((r) => {
    const emoji = r.status === 'no light' ? '❌' : '✅'
    const statusText = r.status === 'no light' ? 'No light' : 'Light back'
    const duration = r.status === 'no light' && r.firstReportedAt
      ? ` — without light for *${getOutageDuration(r.firstReportedAt)}*`
      : ` (${getTimeAgo(r.createdAt)})`
    return `${emoji} *${r.area}* — ${statusText}${duration}`
  })

  return `☀️ *Good morning! Here's the power situation across Nigeria:*\n\n${lines.join('\n')}\n\n_Send "show all reports" for full details_`
}

/**
 * Send morning broadcast to all active subscribers
 */
const sendMorningBroadcast = async (sock) => {
  try {
    logger.info('📢 Running morning broadcast job...')

    const reports = await getAllActiveReports()

    if (!reports.length) {
      logger.info('📭 No active reports. Skipping morning broadcast.')
      return
    }

    // Get all unique active subscribers
    const subscribers = await Subscription.find({ active: true }).distinct('phone')

    if (!subscribers.length) {
      logger.info('📭 No subscribers. Skipping morning broadcast.')
      return
    }

    const message = buildBroadcastMessage(reports)

    let sent = 0
    let failed = 0

    for (const phone of subscribers) {
      try {
        await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message })
        sent++
        // Small delay to avoid WhatsApp rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        logger.error(`Failed to send broadcast to ${phone}:`, error)
        failed++
      }
    }

    logger.info(`📢 Morning broadcast done — Sent: ${sent}, Failed: ${failed}`)
  } catch (error) {
    logger.error('❌ Morning broadcast job failed:', error)
  }
}

/**
 * Start the morning broadcast cron job
 * Runs every day at 7:00 AM Nigeria time (UTC+1)
 */
const startMorningBroadcastJob = (sock) => {
  cron.schedule('0 6 * * *', () => sendMorningBroadcast(sock), {
    timezone: 'Africa/Lagos',
  })
  logger.info('📢 Morning broadcast cron job started (7:00 AM daily)')
}

module.exports = { startMorningBroadcastJob }