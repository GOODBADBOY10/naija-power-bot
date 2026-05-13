'use strict'

const { getSubscribers } = require('./subscriptionService')
const logger = require('../utils/logger')

let sockInstance = null

/**
 * Register the WhatsApp socket instance
 * so alert service can send messages
 * @param {object} sock
 */
const registerSocket = (sock) => {
  sockInstance = sock
  logger.info('🔌 Alert service socket registered')
}

/**
 * Send light back alerts to all subscribers of an area
 * @param {string} area
 * @param {string} reportedAt
 */
const sendLightBackAlerts = async (area, reportedAt) => {
  if (!sockInstance) {
    logger.warn('⚠️ Alert service: no socket instance registered')
    return
  }

  try {
    const subscribers = await getSubscribers(area)

    if (!subscribers.length) {
      logger.debug(`📭 No subscribers for area: ${area}`)
      return
    }

    logger.info(`📢 Sending light back alerts for ${area} to ${subscribers.length} subscriber(s)`)

    const message = `💡 *LIGHT ALERT!*\n\n✅ Light is back in *${area}*!\nReported just now.\n\n_You received this because you subscribed to ${area} alerts._\nSend *unsubscribe ${area}* to stop alerts.`

    // Send alerts concurrently but with a small delay between each
    // to avoid WhatsApp rate limiting
    for (const subscriber of subscribers) {
      try {
        const jid = subscriber.phone.includes('@')
          ? subscriber.phone
          : `${subscriber.phone}@s.whatsapp.net`

        await sockInstance.sendMessage(jid, { text: message })
        logger.debug(`📤 Alert sent to ${subscriber.phone} for ${area}`)

        // Small delay between messages to avoid spam detection
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (err) {
        logger.error(`Error sending alert to ${subscriber.phone}:`, err)
      }
    }

    logger.info(`✅ Alerts sent for ${area}`)
  } catch (error) {
    logger.error('Error sending light back alerts:', error)
  }
}

/**
 * Send no light alerts to all subscribers of an area
 * @param {string} area
 */
const sendNoLightAlerts = async (area) => {
  if (!sockInstance) {
    logger.warn('⚠️ Alert service: no socket instance registered')
    return
  }

  try {
    const subscribers = await getSubscribers(area)

    if (!subscribers.length) {
      logger.debug(`📭 No subscribers for area: ${area}`)
      return
    }

    logger.info(`📢 Sending no light alerts for ${area} to ${subscribers.length} subscriber(s)`)

    const message = `⚡ *POWER ALERT!*\n\n❌ Light has gone in *${area}*!\nReported just now.\n\n_You received this because you subscribed to ${area} alerts._\nSend *unsubscribe ${area}* to stop alerts.`

    for (const subscriber of subscribers) {
      try {
        const jid = subscriber.phone.includes('@')
          ? subscriber.phone
          : `${subscriber.phone}@s.whatsapp.net`

        await sockInstance.sendMessage(jid, { text: message })
        logger.debug(`📤 No-light alert sent to ${subscriber.phone} for ${area}`)

        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (err) {
        logger.error(`Error sending no-light alert to ${subscriber.phone}:`, err)
      }
    }

    logger.info(`✅ No-light alerts sent for ${area}`)
  } catch (error) {
    logger.error('Error sending no light alerts:', error)
  }
}

module.exports = {
  registerSocket,
  sendLightBackAlerts,
  sendNoLightAlerts,
}