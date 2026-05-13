'use strict'

const { Report, STATUSES } = require('../models/Report')
const { DatabaseError } = require('../utils/errors')
const { getExpiryDate } = require('../utils/helpers')
const { reportExpiryHours } = require('../config/env')
const { sendLightBackAlerts, sendNoLightAlerts } = require('./alertService')
const logger = require('../utils/logger')

/**
 * Create a new power outage report
 * @param {string} area
 * @param {string} status
 * @param {string} reportedBy
 * @returns {Promise<object>}
 */
const createReport = async (area, status, reportedBy = 'anonymous') => {
  try {
    const expiresAt = getExpiryDate(reportExpiryHours)

    const report = await Report.create({
      area,
      status,
      reportedBy,
      expiresAt,
    })

    logger.info(`📝 New report created — Area: ${area}, Status: ${status}`)

    // Trigger alerts to subscribers
    if (status === STATUSES.LIGHT_BACK) {
      sendLightBackAlerts(area).catch((err) =>
        logger.error('Error sending light back alerts:', err)
      )
    } else if (status === STATUSES.NO_LIGHT) {
      sendNoLightAlerts(area).catch((err) =>
        logger.error('Error sending no light alerts:', err)
      )
    }

    return report
  } catch (error) {
    logger.error('Error creating report:', error)
    throw new DatabaseError('Failed to save report. Please try again.')
  }
}

/**
 * Get the latest active report for an area
 * @param {string} area
 * @returns {Promise<object|null>}
 */
const getLatestReport = async (area) => {
  try {
    const report = await Report.findLatestByArea(area)
    return report
  } catch (error) {
    logger.error(`Error fetching report for area ${area}:`, error)
    throw new DatabaseError('Failed to fetch report. Please try again.')
  }
}

/**
 * Get all active reports
 * @returns {Promise<Array>}
 */
const getAllActiveReports = async () => {
  try {
    const reports = await Report.findAllActive()
    return reports
  } catch (error) {
    logger.error('Error fetching all active reports:', error)
    throw new DatabaseError('Failed to fetch reports. Please try again.')
  }
}

/**
 * Get report count for an area
 * @param {string} area
 * @returns {Promise<number>}
 */
const getReportCountByArea = async (area) => {
  try {
    return await Report.countDocuments({
      area: new RegExp(area, 'i'),
      expiresAt: { $gt: new Date() },
    })
  } catch (error) {
    logger.error(`Error counting reports for area ${area}:`, error)
    throw new DatabaseError('Failed to count reports.')
  }
}

module.exports = {
  createReport,
  getLatestReport,
  getAllActiveReports,
  getReportCountByArea,
  STATUSES,
}