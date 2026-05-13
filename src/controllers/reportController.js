'use strict'

const reportService = require('../services/reportService')
const { capitalize, getTimeAgo, sanitizeArea } = require('../utils/helpers')
const { ValidationError } = require('../utils/errors')
const logger = require('../utils/logger')

const MESSAGES = {
  HELP: `👋 Welcome to *Naija Power Bot* ⚡

Here's how to use me:

*📍 Report no light:*
- no light - [area]
- no light for [area]
- [area] no light
- NEPA take light for [area]
- light don go for [area]
- [area] light don go
- no current for [area]
- [area] blackout
_Example: no light - Yaba_ or _Yaba no light_

*✅ Report light back:*
- light back - [area]
- up NEPA [area]
- [area] light don come back
- current don come for [area]
- nepa restore light for [area]
- [area] up NEPA
_Example: light back - Surulere_ or _Surulere up NEPA_

*🔍 Check an area:*
- any light in [area]?
- is there light in [area]?
- how far with [area]?
- wetin happen for [area]?
- how e be for [area]?
- e get light for [area]?
- [area] how far?
- [area] status?
- [area] get light?
- [area] any light?
- [area] check?
_Example: any light in Ikeja?_ or _Ikeja how far?_

*📋 See all active reports:*
_show all reports_

Reports expire after 6 hours automatically.
Thank you for keeping Nigeria powered! 🇳🇬`,

  NO_REPORT_FOUND: (area) =>
    `🤷 No recent reports for *${area}*.\n\nBe the first to report!\nSend: *"no light - ${area}"* or *"light back - ${area}"*`,

  REPORT_CREATED_NO_LIGHT: (area) =>
    `⚡ Reported *NO LIGHT* in *${area}*.\nReport expires in 6 hours. Thank you! 🙏`,

  REPORT_CREATED_LIGHT_BACK: (area) =>
    `✅ Reported *LIGHT BACK* in *${area}*.\nThank you for the update! 🙏`,

  STATUS_RESPONSE: (area, status, timeAgo) => {
    const emoji = status === 'no light' ? '❌' : '✅'
    const statusText = status === 'no light' ? 'NO LIGHT' : 'LIGHT BACK'
    return `${emoji} *${area}*\nStatus: *${statusText}*\nReported: ${timeAgo}`
  },

  NO_ACTIVE_REPORTS: `📭 No active reports at the moment.\n\nBe the first to report your area's power situation!`,

  ERROR: `⚠️ Something went wrong. Please try again in a moment.`,
}

/**
 * Handle incoming report of no light
 */
const handleNoLightReport = async (text, reportedBy) => {
  // Area at the END patterns
  const noLightEndPatterns = [
    /no\s+light\s*[-:\s]+(.+)/i,
    /no\s+electricity\s*[-:\s]+(.+)/i,
    /power\s+outage\s+(?:in|at|for)?\s*(.+)/i,
    /light\s+don\s+go\s+(?:for)?\s*(.+)/i,
    /light\s+go\s+(?:for)?\s*(.+)/i,
    /nepa\s+take\s+(?:light\s+)?(?:for)?\s*(.+)/i,
    /phcn\s+take\s+(?:light\s+)?(?:for)?\s*(.+)/i,
    /dem\s+don\s+take\s+(?:light\s+)?(?:for)?\s*(.+)/i,
    /they\s+take\s+(?:light\s+)?(?:in|at|for)?\s*(.+)/i,
    /no\s+light\s+for\s+(.+)/i,
    /light\s+never\s+come\s+(?:for|to)?\s*(.+)/i,
    /no\s+current\s+(?:for|in|at)?\s*(.+)/i,
    /current\s+don\s+go\s+(?:for)?\s*(.+)/i,
    /darkness\s+(?:for|in|at)?\s*(.+)/i,
    /no\s+power\s+(?:for|in|at)?\s*(.+)/i,
    /blackout\s+(?:for|in|at)?\s*(.+)/i,
  ]

  // Area at the FRONT patterns
  const noLightFrontPatterns = [
    /^(.+?)\s+no\s+light/i,                        // Yaba no light
    /^(.+?)\s+light\s+don\s+go/i,                  // Yaba light don go
    /^(.+?)\s+no\s+current/i,                      // Yaba no current
    /^(.+?)\s+no\s+electricity/i,                  // Yaba no electricity
    /^(.+?)\s+nepa\s+take/i,                       // Yaba NEPA take light
    /^(.+?)\s+phcn\s+take/i,                       // Yaba PHCN take light
    /^(.+?)\s+don\s+lose\s+power/i,               // Yaba don lose power
    /^(.+?)\s+dey\s+dark/i,                        // Yaba dey dark
    /^(.+?)\s+blackout/i,                          // Yaba blackout
    /^(.+?)\s+power\s+outage/i,                    // Yaba power outage
    /^(.+?)\s+light\s+never\s+come/i,             // Yaba light never come
  ]

  // Check end patterns first
  for (const pattern of noLightEndPatterns) {
    const match = text.match(pattern)
    if (match) {
      const area = capitalize(sanitizeArea(match[1]))
      if (!area || area.length < 2) throw new ValidationError('Please provide a valid area name.')
      if (area.length > 50) throw new ValidationError('Area name is too long. Please be more specific.')
      await reportService.createReport(area, reportService.STATUSES.NO_LIGHT, reportedBy)
      return MESSAGES.REPORT_CREATED_NO_LIGHT(area)
    }
  }

  // Check front patterns
  for (const pattern of noLightFrontPatterns) {
    const match = text.match(pattern)
    if (match) {
      const area = capitalize(sanitizeArea(match[1]))
      if (!area || area.length < 2) throw new ValidationError('Please provide a valid area name.')
      if (area.length > 50) throw new ValidationError('Area name is too long. Please be more specific.')
      await reportService.createReport(area, reportService.STATUSES.NO_LIGHT, reportedBy)
      return MESSAGES.REPORT_CREATED_NO_LIGHT(area)
    }
  }

  return null
}

/**
 * Handle incoming report of light back
 */
const handleLightBackReport = async (text, reportedBy) => {
  // Area at the END patterns
  const lightBackEndPatterns = [
    /light\s+(?:is\s+)?back\s*[-:\s]+(.+)/i,
    /light\s+don\s+come\s+back\s+(?:for)?\s*(.+)/i,
    /light\s+don\s+return\s+(?:for)?\s*(.+)/i,
    /up\s+nepa\s+(?:for)?\s*(.+)/i,
    /nepa\s+bring\s+(?:light\s+)?(?:for|back\s+to)?\s*(.+)/i,
    /light\s+(?:don\s+)?come\s+(?:back\s+)?(?:for|to)?\s*(.+)/i,
    /they\s+restore\s+(?:light\s+)?(?:in|at|for)?\s*(.+)/i,
    /power\s+restored\s+(?:in|at|for)?\s*(.+)/i,
    /electricity\s+(?:is\s+)?back\s+(?:in|at|for)?\s*(.+)/i,
    /current\s+don\s+come\s+(?:for)?\s*(.+)/i,
    /light\s+don\s+show\s+(?:for)?\s*(.+)/i,
    /nepa\s+(?:don\s+)?restore\s+(?:light\s+)?(?:for)?\s*(.+)/i,
  ]

  // Area at the FRONT patterns
  const lightBackFrontPatterns = [
    /^(.+?)\s+light\s+don\s+come\s+back/i,         // Yaba light don come back
    /^(.+?)\s+light\s+(?:is\s+)?back/i,            // Yaba light is back
    /^(.+?)\s+up\s+nepa/i,                         // Yaba up NEPA
    /^(.+?)\s+nepa\s+(?:don\s+)?restore/i,         // Yaba nepa don restore
    /^(.+?)\s+current\s+don\s+come/i,              // Yaba current don come
    /^(.+?)\s+light\s+don\s+show/i,               // Yaba light don show
    /^(.+?)\s+power\s+(?:is\s+)?restored/i,        // Yaba power restored
    /^(.+?)\s+electricity\s+(?:is\s+)?back/i,      // Yaba electricity is back
    /^(.+?)\s+light\s+don\s+return/i,             // Yaba light don return
    /^(.+?)\s+nepa\s+bring\s+light/i,             // Yaba nepa bring light
  ]

  // Check end patterns first
  for (const pattern of lightBackEndPatterns) {
    const match = text.match(pattern)
    if (match) {
      const area = capitalize(sanitizeArea(match[1]))
      if (!area || area.length < 2) throw new ValidationError('Please provide a valid area name.')
      if (area.length > 50) throw new ValidationError('Area name is too long. Please be more specific.')
      await reportService.createReport(area, reportService.STATUSES.LIGHT_BACK, reportedBy)
      return MESSAGES.REPORT_CREATED_LIGHT_BACK(area)
    }
  }

  // Check front patterns
  for (const pattern of lightBackFrontPatterns) {
    const match = text.match(pattern)
    if (match) {
      const area = capitalize(sanitizeArea(match[1]))
      if (!area || area.length < 2) throw new ValidationError('Please provide a valid area name.')
      if (area.length > 50) throw new ValidationError('Area name is too long. Please be more specific.')
      await reportService.createReport(area, reportService.STATUSES.LIGHT_BACK, reportedBy)
      return MESSAGES.REPORT_CREATED_LIGHT_BACK(area)
    }
  }

  return null
}

/**
 * Handle area power status check
 */
const handleAreaCheck = async (text) => {
  // Area at the END patterns
  const checkEndPatterns = [
    /any\s+light\s+in\s+(.+?)(?:\?|$)/i,              // any light in Yaba?
    /is\s+there\s+light\s+in\s+(.+?)(?:\?|$)/i,       // is there light in Yaba?
    /how\s+far\s+with\s+(.+?)(?:\?|$)/i,              // how far with Yaba?
    /light\s+for\s+(.+?)(?:\?|$)/i,                   // light for Yaba?
    /check\s+light\s+in\s+(.+?)(?:\?|$)/i,            // check light in Yaba?
    /status\s+of\s+(.+?)(?:\?|$)/i,                   // status of Yaba?
    /wetin\s+happen\s+for\s+(.+?)(?:\?|$)/i,          // wetin happen for Yaba?
    /how\s+e\s+be\s+for\s+(.+?)(?:\?|$)/i,            // how e be for Yaba?
    /dem\s+get\s+light\s+for\s+(.+?)(?:\?|$)/i,       // dem get light for Yaba?
    /e\s+get\s+light\s+for\s+(.+?)(?:\?|$)/i,         // e get light for Yaba?
    /they\s+get\s+light\s+(?:in|at|for)\s+(.+?)(?:\?|$)/i, // they get light in Yaba?
    /power\s+situation\s+(?:in|at|for)\s+(.+?)(?:\?|$)/i,  // power situation in Yaba?
    /nepa\s+situation\s+(?:in|at|for)\s+(.+?)(?:\?|$)/i,   // nepa situation in Yaba?
    /current\s+dey\s+(?:for)?\s*(.+?)(?:\?|$)/i,      // current dey for Yaba?
  ]

  // Area at the FRONT patterns
  const checkFrontPatterns = [
    /^(.+?)\s+how\s+far(?:\?|$)/i,                    // Yaba how far?
    /^(.+?)\s+status(?:\?|$)/i,                       // Yaba status?
    /^(.+?)\s+light\s+status(?:\?|$)/i,               // Yaba light status?
    /^(.+?)\s+wetin\s+happen(?:\?|$)/i,               // Yaba wetin happen?
    /^(.+?)\s+how\s+e\s+be(?:\?|$)/i,                // Yaba how e be?
    /^(.+?)\s+get\s+light(?:\?|$)/i,                  // Yaba get light?
    /^(.+?)\s+any\s+light(?:\?|$)/i,                  // Yaba any light?
    /^(.+?)\s+dey\s+get\s+light(?:\?|$)/i,            // Yaba dey get light?
    /^(.+?)\s+nepa\s+situation(?:\?|$)/i,             // Yaba nepa situation?
    /^(.+?)\s+power\s+situation(?:\?|$)/i,            // Yaba power situation?
    /^(.+?)\s+current\s+dey(?:\?|$)/i,               // Yaba current dey?
    /^(.+?)\s+check(?:\?|$)/i,                        // Yaba check?
  ]

  // Check end patterns first
  for (const pattern of checkEndPatterns) {
    const match = text.match(pattern)
    if (match) {
      const area = capitalize(sanitizeArea(match[1]))
      if (!area || area.length < 2) throw new ValidationError('Please provide a valid area name.')
      if (area.length > 50) throw new ValidationError('Area name is too long. Please be more specific.')
      const report = await reportService.getLatestReport(area)
      if (!report) return MESSAGES.NO_REPORT_FOUND(area)
      return MESSAGES.STATUS_RESPONSE(area, report.status, getTimeAgo(report.createdAt))
    }
  }

  // Check front patterns
  for (const pattern of checkFrontPatterns) {
    const match = text.match(pattern)
    if (match) {
      const area = capitalize(sanitizeArea(match[1]))
      if (!area || area.length < 2) throw new ValidationError('Please provide a valid area name.')
      if (area.length > 50) throw new ValidationError('Area name is too long. Please be more specific.')
      const report = await reportService.getLatestReport(area)
      if (!report) return MESSAGES.NO_REPORT_FOUND(area)
      return MESSAGES.STATUS_RESPONSE(area, report.status, getTimeAgo(report.createdAt))
    }
  }

  return null
}

/**
 * Handle show all active reports
 */
const handleShowAllReports = async (text) => {
  const match = text.match(/show\s+all\s+reports/i)
  if (!match) return null

  const reports = await reportService.getAllActiveReports()

  if (!reports.length) return MESSAGES.NO_ACTIVE_REPORTS

  const reportLines = reports
    .slice(0, 15) // limit to 15 reports max per message
    .map((r) => {
      const emoji = r.status === 'no light' ? '❌' : '✅'
      return `${emoji} *${r.area}* — ${r.status} (${getTimeAgo(r.createdAt)})`
    })
    .join('\n')

  return `📋 *Active Power Reports*\n\n${reportLines}\n\n_Last updated: ${new Date().toLocaleTimeString('en-NG')}_`
}

/**
 * Main message router — tries each handler in order
 */
const handleMessage = async (text, reportedBy) => {
  try {
    const normalizedText = text.trim().toLowerCase()

    const result =
      (await handleNoLightReport(normalizedText, reportedBy)) ||
      (await handleLightBackReport(normalizedText, reportedBy)) ||
      (await handleAreaCheck(normalizedText)) ||
      (await handleShowAllReports(normalizedText)) ||
      MESSAGES.HELP

    return result
  } catch (error) {
    logger.error('Error handling message:', error)

    if (error.isOperational) return `⚠️ ${error.message}`
    return MESSAGES.ERROR
  }
}

module.exports = { handleMessage }