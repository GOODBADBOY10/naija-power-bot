'use strict'

const http = require('http')
const https = require('https')
const logger = require('../utils/logger')

const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`
const PING_INTERVAL = 10 * 60 * 1000 // every 10 minutes

/**
 * Ping the app's health endpoint to prevent Render from sleeping
 */
const pingServer = () => {
  const url = `${APP_URL}/health`
  const client = url.startsWith('https') ? https : http

  const req = client.get(url, (res) => {
    logger.debug(`💓 Keep-alive ping sent → Status: ${res.statusCode}`)
  })

  req.on('error', (error) => {
    logger.warn(`⚠️ Keep-alive ping failed: ${error.message}`)
  })

  req.end()
}

/**
 * Start the keep-alive job
 */
const startKeepAliveJob = () => {
  // Wait 1 minute after startup before first ping
  setTimeout(() => {
    pingServer()
    setInterval(pingServer, PING_INTERVAL)
  }, 60 * 1000)

  logger.info('💓 Keep-alive job started (pings every 10 minutes)')
}

module.exports = { startKeepAliveJob }