'use strict'

const express = require('express')
const path = require('path')
const { Report } = require('./models/Report')
const { Subscription } = require('./models/Subscription')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 3000
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD

const app = express()
app.use(express.json())

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Naija Power Bot',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (req, res) => {
  res.send('⚡ Naija Power Bot is running!')
})

// ─── Auth Middleware ───────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const token = req.headers['x-dashboard-token'] || req.query.token
  if (token === DASHBOARD_PASSWORD) return next()
  res.status(401).json({ error: 'Unauthorized' })
}

// ─── Dashboard API ─────────────────────────────────────────────────────────────
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const now = new Date()
    const last24h = new Date(now - 24 * 60 * 60 * 1000)
    const last7days = new Date(now - 7 * 24 * 60 * 60 * 1000)

    // Active reports right now
    const activeReports = await Report.find({
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 })

    // Total reports last 24h
    const reportsLast24h = await Report.countDocuments({
      createdAt: { $gt: last24h },
    })

    // Total reports last 7 days
    const reportsLast7days = await Report.countDocuments({
      createdAt: { $gt: last7days },
    })

    // No light reports last 7 days
    const noLightLast7days = await Report.countDocuments({
      status: 'no light',
      createdAt: { $gt: last7days },
    })

    // Top 10 most affected areas (most no light reports)
    const topAffectedAreas = await Report.aggregate([
      { $match: { status: 'no light', createdAt: { $gt: last7days } } },
      { $group: { _id: '$area', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    // Area breakdown (active reports)
    const areaBreakdown = await Report.aggregate([
      { $match: { expiresAt: { $gt: now } } },
      {
        $group: {
          _id: '$area',
          status: { $last: '$status' },
          lastReported: { $max: '$createdAt' },
          firstReportedAt: { $min: '$firstReportedAt' },
          reportCount: { $sum: 1 },
        },
      },
      { $sort: { lastReported: -1 } },
    ])

    // Report trends last 7 days (group by day)
    const reportTrends = await Report.aggregate([
      { $match: { createdAt: { $gt: last7days } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ])

    // Peak hours (what hour of day gets most reports)
    const peakHours = await Report.aggregate([
      { $match: { createdAt: { $gt: last7days } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Average outage duration for areas currently without light
    const avgOutageDuration = activeReports
      .filter((r) => r.status === 'no light' && r.firstReportedAt)
      .map((r) => ({
        area: r.area,
        durationMs: now - new Date(r.firstReportedAt),
        durationHours: ((now - new Date(r.firstReportedAt)) / (1000 * 60 * 60)).toFixed(1),
      }))

    // Subscriber stats
    const totalSubscribers = await Subscription.countDocuments({ active: true })
    const uniqueSubscribers = await Subscription.distinct('phone', { active: true })

    const topSubscribedAreas = await Subscription.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$area', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.json({
      overview: {
        activeReports: activeReports.length,
        reportsLast24h,
        reportsLast7days,
        noLightLast7days,
        totalSubscribers,
        uniqueSubscribers: uniqueSubscribers.length,
        botUptime: process.uptime(),
        timestamp: now.toISOString(),
      },
      activeReports,
      areaBreakdown,
      topAffectedAreas,
      reportTrends,
      peakHours,
      avgOutageDuration,
      topSubscribedAreas,
    })
  } catch (error) {
    logger.error('Dashboard API error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

// ─── Serve Dashboard HTML ──────────────────────────────────────────────────────
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'))
})

// ─── Start Server ──────────────────────────────────────────────────────────────
const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`🌐 Health server running on port ${PORT}`)
  })
}

module.exports = { startServer }