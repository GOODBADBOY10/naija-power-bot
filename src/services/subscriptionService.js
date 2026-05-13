'use strict'

const { Subscription } = require('../models/Subscription')
const { DatabaseError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Subscribe a phone number to an area
 * @param {string} phone
 * @param {string} area
 * @returns {Promise<object>}
 */
const subscribe = async (phone, area) => {
  try {
    // Use findOneAndUpdate with upsert to avoid duplicates
    const subscription = await Subscription.findOneAndUpdate(
      { phone, area: new RegExp(`^${area}$`, 'i') },
      { phone, area, active: true },
      { upsert: true, new: true }
    )

    logger.info(`🔔 New subscription — Phone: ${phone}, Area: ${area}`)
    return subscription
  } catch (error) {
    logger.error('Error creating subscription:', error)
    throw new DatabaseError('Failed to subscribe. Please try again.')
  }
}

/**
 * Unsubscribe a phone number from an area
 * @param {string} phone
 * @param {string} area
 * @returns {Promise<boolean>}
 */
const unsubscribe = async (phone, area) => {
  try {
    const result = await Subscription.findOneAndUpdate(
      { phone, area: new RegExp(`^${area}$`, 'i') },
      { active: false },
      { new: true }
    )

    if (!result) return false

    logger.info(`🔕 Unsubscribed — Phone: ${phone}, Area: ${area}`)
    return true
  } catch (error) {
    logger.error('Error unsubscribing:', error)
    throw new DatabaseError('Failed to unsubscribe. Please try again.')
  }
}

/**
 * Get all active subscriptions for a phone number
 * @param {string} phone
 * @returns {Promise<Array>}
 */
const getSubscriptions = async (phone) => {
  try {
    return await Subscription.findByPhone(phone)
  } catch (error) {
    logger.error('Error fetching subscriptions:', error)
    throw new DatabaseError('Failed to fetch subscriptions.')
  }
}

/**
 * Get all active subscribers for an area
 * @param {string} area
 * @returns {Promise<Array>}
 */
const getSubscribers = async (area) => {
  try {
    return await Subscription.findSubscribers(area)
  } catch (error) {
    logger.error('Error fetching subscribers:', error)
    throw new DatabaseError('Failed to fetch subscribers.')
  }
}

/**
 * Unsubscribe a phone from all areas
 * @param {string} phone
 * @returns {Promise<number>}
 */
const unsubscribeAll = async (phone) => {
  try {
    const result = await Subscription.updateMany(
      { phone },
      { active: false }
    )
    logger.info(`🔕 Unsubscribed all — Phone: ${phone}`)
    return result.modifiedCount
  } catch (error) {
    logger.error('Error unsubscribing all:', error)
    throw new DatabaseError('Failed to unsubscribe from all areas.')
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  getSubscriptions,
  getSubscribers,
  unsubscribeAll,
}