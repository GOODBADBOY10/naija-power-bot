'use strict'

const http = require('http')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 3000

/**
 * Simple HTTP server to keep Render awake
 * and satisfy Render's port detection requirement
 */
const startServer = () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'ok',
        app: 'Naija Power Bot',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }))
      return
    }

    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('⚡ Naija Power Bot is running!')
      return
    }

    res.writeHead(404)
    res.end('Not found')
  })

  server.listen(PORT, () => {
    logger.info(`🌐 Health server running on port ${PORT}`)
  })

  server.on('error', (error) => {
    logger.error('Health server error:', error)
  })

  return server
}

module.exports = { startServer }