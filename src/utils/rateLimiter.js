'use strict'

const logger = require('./logger')

/**
 * Simple in-memory rate limiter
 * Tracks message count per phone number per time window
 */

const WINDOW_MS = 60 * 1000 // 1 minute window
const MAX_MESSAGES = 10 // max 10 messages per minute per user
const BLOCK_DURATION_MS = 5 * 60 * 1000 // block for 5 minutes if exceeded

const userWindows = new Map() // { phone: { count, windowStart } }
const blockedUsers = new Map() // { phone: blockedUntil }

/**
 * Check if a user is rate limited
 * @param {string} phone
 * @returns {{ limited: boolean, message?: string }}
 */
const checkRateLimit = (phone) => {
  const now = Date.now()

  // Check if user is blocked
  if (blockedUsers.has(phone)) {
    const blockedUntil = blockedUsers.get(phone)

    if (now < blockedUntil) {
      const minutesLeft = Math.ceil((blockedUntil - now) / 60000)
      return {
        limited: true,
        message: `⛔ You are sending too many messages. Please wait ${minutesLeft} minute(s) before trying again.`,
      }
    } else {
      // Block expired, remove it
      blockedUsers.delete(phone)
      userWindows.delete(phone)
    }
  }

  // Get or create window for user
  if (!userWindows.has(phone)) {
    userWindows.set(phone, { count: 1, windowStart: now })
    return { limited: false }
  }

  const window = userWindows.get(phone)
  const windowAge = now - window.windowStart

  // Reset window if expired
  if (windowAge > WINDOW_MS) {
    userWindows.set(phone, { count: 1, windowStart: now })
    return { limited: false }
  }

  // Increment count
  window.count++

  // Check if limit exceeded
  if (window.count > MAX_MESSAGES) {
    blockedUsers.set(phone, now + BLOCK_DURATION_MS)
    userWindows.delete(phone)
    logger.warn(`🚫 Rate limit exceeded for ${phone}. Blocked for 5 minutes.`)
    return {
      limited: true,
      message: `⛔ Too many messages! You have been blocked for 5 minutes. Please slow down.`,
    }
  }

  return { limited: false }
}

/**
 * Clean up expired entries every 10 minutes
 * Prevents memory leak from inactive users
 */
setInterval(() => {
  const now = Date.now()

  for (const [phone, window] of userWindows.entries()) {
    if (now - window.windowStart > WINDOW_MS * 2) {
      userWindows.delete(phone)
    }
  }

  for (const [phone, blockedUntil] of blockedUsers.entries()) {
    if (now > blockedUntil) {
      blockedUsers.delete(phone)
    }
  }
}, 10 * 60 * 1000)

module.exports = { checkRateLimit }