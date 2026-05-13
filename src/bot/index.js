'use strict'

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('baileys')
const { useMongoAuthState } = require('../services/authService')
const { Boom } = require('@hapi/boom')
const { Session } = require('../models/Session')
const logger = require('../utils/logger')
const { processMessage } = require('./messageHandler')

let retryCount = 0
const MAX_RETRIES = 5

/**
 * Clear session from MongoDB
 */
const clearSession = async () => {
  try {
    await Session.deleteMany({})
    logger.info('🗑️ Session cleared from database')
  } catch (err) {
    logger.error('Error clearing session:', err)
  }
}

/**
 * Initialize and start the WhatsApp bot
 */
const startBot = async () => {
  try {
    const { version, isLatest } = await fetchLatestBaileysVersion()
    logger.info(`📦 Baileys version: ${version.join('.')} | Latest: ${isLatest}`)

    const { state, saveCreds } = await useMongoAuthState()

    const sock = makeWASocket({
      version,
      browser: Browsers.ubuntu('Chrome'),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, {
          level: 'silent',
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
          child: () => ({
            level: 'silent',
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            fatal: () => {},
            child: () => ({}),
          }),
        }),
      },
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: (obj) => logger.warn(typeof obj === 'object' ? JSON.stringify(obj) : obj),
        error: (obj) => logger.error(typeof obj === 'object' ? JSON.stringify(obj) : obj),
        fatal: (obj) => logger.error(typeof obj === 'object' ? JSON.stringify(obj) : obj),
        child: () => ({
          level: 'silent',
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
          child: () => ({}),
        }),
      },
      getMessage: async () => ({ conversation: '' }),
    })

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds)

    // Handle connection updates
    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      // Show QR code link clearly in logs
      if (qr) {
        const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`
        console.log('\n==================== SCAN QR CODE ====================')
        console.log('Open this link in your browser and scan with WhatsApp:')
        console.log(qrLink)
        console.log('======================================================\n')
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        logger.warn(`⚠️ Connection closed. Status code: ${statusCode}`)

        if (shouldReconnect && retryCount < MAX_RETRIES) {
          retryCount++
          const delay = Math.min(1000 * 2 ** retryCount, 30000)
          logger.info(`🔄 Reconnecting in ${delay / 1000}s... (Attempt ${retryCount}/${MAX_RETRIES})`)
          setTimeout(startBot, delay)
        } else if (retryCount >= MAX_RETRIES) {
          logger.error(`❌ Max retries (${MAX_RETRIES}) reached. Please restart manually.`)
          process.exit(1)
        } else {
          // Logged out — clear session and restart to show new QR
          logger.warn('⚠️ Logged out. Clearing session and restarting...')
          await clearSession()
          retryCount = 0
          logger.info('🔄 Restarting in 3s to generate new QR code...')
          setTimeout(startBot, 3000)
        }
      }

      if (connection === 'open') {
        retryCount = 0
        logger.info('✅ WhatsApp bot connected and ready!')
      }
    })

    // Handle incoming messages
    sock.ev.on('messages.upsert', (messageData) => {
      processMessage(sock, messageData)
    })

    return sock
  } catch (error) {
    logger.error('❌ Failed to start bot:', error)

    if (retryCount < MAX_RETRIES) {
      retryCount++
      const delay = Math.min(1000 * 2 ** retryCount, 30000)
      logger.info(`🔄 Retrying in ${delay / 1000}s...`)
      setTimeout(startBot, delay)
    } else {
      logger.error('❌ Max retries reached. Exiting.')
      process.exit(1)
    }
  }
}

module.exports = { startBot }


// 'use strict'
// const {
//   default: makeWASocket,
//   DisconnectReason,
//   fetchLatestBaileysVersion,
//   makeCacheableSignalKeyStore,
//   Browsers,
// } = require('baileys')
// const { useMongoAuthState } = require('../services/authService')
// const { Boom } = require('@hapi/boom')
// const qrcode = require('qrcode-terminal')
// const logger = require('../utils/logger')
// const { processMessage } = require('./messageHandler')
// const { sessionDir } = require('../config/env')

// let retryCount = 0
// const MAX_RETRIES = 5

// /**
//  * Initialize and start the WhatsApp bot
//  */
// const startBot = async () => {
//   try {
//     const { version, isLatest } = await fetchLatestBaileysVersion()
//     logger.info(`📦 Baileys version: ${version.join('.')} | Latest: ${isLatest}`)

//     // const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH)
//     const { state, saveCreds } = await useMongoAuthState()

//     const sock = makeWASocket({
//       version,
//       browser: Browsers.ubuntu('Chrome'),
//       auth: {
//         creds: state.creds,
//         keys: makeCacheableSignalKeyStore(state.keys, {
//           level: 'silent',
//           trace: () => { },
//           debug: () => { },
//           info: () => { },
//           warn: () => { },
//           error: () => { },
//           fatal: () => { },
//           child: () => ({
//             level: 'silent',
//             trace: () => { },
//             debug: () => { },
//             info: () => { },
//             warn: () => { },
//             error: () => { },
//             fatal: () => { },
//             child: () => ({}),
//           }),
//         }),
//       },
//       printQRInTerminal: false,
//       logger: {
//         level: 'silent',
//         trace: () => { },
//         debug: () => { },
//         info: () => { },
//         warn: (obj) => logger.warn(typeof obj === 'object' ? JSON.stringify(obj) : obj),
//         error: (obj) => logger.error(typeof obj === 'object' ? JSON.stringify(obj) : obj),
//         fatal: (obj) => logger.error(typeof obj === 'object' ? JSON.stringify(obj) : obj),
//         child: () => ({
//           level: 'silent',
//           trace: () => { },
//           debug: () => { },
//           info: () => { },
//           warn: () => { },
//           error: () => { },
//           fatal: () => { },
//           child: () => ({}),
//         }),
//       },
//       getMessage: async () => ({ conversation: '' }),
//     })

//     // Save credentials on update
//     sock.ev.on('creds.update', saveCreds)

//     // Handle connection updates
//     sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
//       // Show QR code in terminal
//       if (qr) {
//         qrcode.generate(qr, { small: true, scale: 1 })
//         logger.info('📱 Scan the QR code above with your WhatsApp')
//         logger.info(`🌐 Or open this link in your browser to scan:\nhttps://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`)
//       }

//       if (connection === 'close') {
//         const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
//         const shouldReconnect = statusCode !== DisconnectReason.loggedOut

//         logger.warn(`⚠️ Connection closed. Status code: ${statusCode}`)

//         if (shouldReconnect && retryCount < MAX_RETRIES) {
//           retryCount++
//           const delay = Math.min(1000 * 2 ** retryCount, 30000) // exponential backoff max 30s
//           logger.info(`🔄 Reconnecting in ${delay / 1000}s... (Attempt ${retryCount}/${MAX_RETRIES})`)
//           setTimeout(startBot, delay)
//         } else if (retryCount >= MAX_RETRIES) {
//           logger.error(`❌ Max retries (${MAX_RETRIES}) reached. Please restart the bot manually.`)
//           process.exit(1)
//         } else {
//           logger.error('❌ Logged out. Delete the auth_info folder and restart.')
//           process.exit(0)
//         }
//       }

//       if (connection === 'open') {
//         retryCount = 0 // reset retry count on successful connection
//         logger.info('✅ WhatsApp bot connected and ready!')
//       }
//     })

//     // Handle incoming messages
//     sock.ev.on('messages.upsert', (messageData) => {
//       processMessage(sock, messageData)
//     })

//     return sock
//   } catch (error) {
//     logger.error('❌ Failed to start bot:', error)

//     if (retryCount < MAX_RETRIES) {
//       retryCount++
//       const delay = Math.min(1000 * 2 ** retryCount, 30000)
//       logger.info(`🔄 Retrying in ${delay / 1000}s...`)
//       setTimeout(startBot, delay)
//     } else {
//       logger.error('❌ Max retries reached. Exiting.')
//       process.exit(1)
//     }
//   }
// }

// module.exports = { startBot }