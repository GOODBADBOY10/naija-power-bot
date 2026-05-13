'use strict'

const { handleMessage } = require('../controllers/reportController')
const { extractMessageText } = require('../utils/helpers')
const { checkRateLimit } = require('../utils/rateLimiter')
const logger = require('../utils/logger')

/**
 * Process incoming WhatsApp messages
 * @param {object} sock - WhatsApp socket instance
 * @param {object} messageData - Raw message data from baileys
 */
const processMessage = async (sock, messageData) => {
  const { messages } = messageData

  for (const msg of messages) {
    try {
      // Ignore messages sent by the bot itself
      if (msg.key.fromMe) continue

      // Ignore empty messages
      if (!msg.message) continue

      const from = msg.key.remoteJid
      const isGroup = from.endsWith('@g.us')
      const reportedBy = msg.key.participant || from

      // Only respond to direct messages, ignore groups
      if (isGroup) {
        logger.debug(`⏭️ Ignoring group message from ${from}`)
        continue
      }

      // Extract message text
      // Extract message text
      const text = extractMessageText(msg.message)
      if (!text) continue

      logger.debug(`📩 Message from ${from}: "${text}"`)

      // Check rate limit
      const { limited, message: limitMessage } = checkRateLimit(reportedBy)
      if (limited) {
        await sock.sendMessage(from, { text: limitMessage }, { quoted: msg })
        logger.warn(`🚫 Rate limited message from ${reportedBy}`)
        continue
      }

      // Get response from controller
      const response = await handleMessage(text, reportedBy)
      if (!response) continue

      // Send response back
      await sock.sendMessage(from, { text: response }, { quoted: msg })

      logger.debug(`📤 Response sent to ${from}`)
    } catch (error) {
      logger.error('Error processing message:', error)
    }
  }
}

module.exports = { processMessage }