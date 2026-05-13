'use strict'

/**
 * Capitalize each word in a string
 * @param {string} str
 * @returns {string}
 */
const capitalize = (str) => {
  if (!str) return ''
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Get human-readable time ago string
 * @param {Date} date
 * @returns {string}
 */
const getTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)

  if (seconds < 60) return `${seconds} second(s) ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute(s) ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour(s) ago`

  const days = Math.floor(hours / 24)
  return `${days} day(s) ago`
}

/**
 * Calculate expiry date from now
 * @param {number} hours
 * @returns {Date}
 */
const getExpiryDate = (hours) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

/**
 * Extract text from a WhatsApp message object
 * @param {object} message
 * @returns {string}
 */
const extractMessageText = (message) => {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    ''
  ).trim()
}


/**
 * Sanitize and validate area name input
 * @param {string} area
 * @returns {string}
 */
const sanitizeArea = (area) => {
  if (!area) return ''

  return area
    .trim()
    .replace(/[<>{}[\]\\\/\*\$\(\)\|\^]/g, '') // remove special chars
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .substring(0, 50) // max 50 characters
}

module.exports = {
  capitalize,
  getTimeAgo,
  getExpiryDate,
  extractMessageText,
  sanitizeArea,
}