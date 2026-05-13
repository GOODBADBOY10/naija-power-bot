'use strict'

const mongoose = require('mongoose')

const STATUSES = Object.freeze({
  NO_LIGHT: 'no light',
  LIGHT_BACK: 'light back',
})

const reportSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(STATUSES),
        message: '{VALUE} is not a valid status',
      },
      required: [true, 'Status is required'],
    },
    reportedBy: {
      type: String,
      trim: true,
      default: 'anonymous',
    },
    firstReportedAt: {
      type: Date,
      default: null, // only set for 'no light' reports
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

reportSchema.index({ area: 1, createdAt: -1 })

reportSchema.statics.findLatestByArea = function (area) {
  return this.findOne({
    area: new RegExp(area, 'i'),
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })
}

reportSchema.statics.findAllActive = function () {
  return this.find({
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })
}

// Find the earliest active 'no light' report for an area
reportSchema.statics.findFirstNoLightReport = function (area) {
  return this.findOne({
    area: new RegExp(`^${area}$`, 'i'),
    status: STATUSES.NO_LIGHT,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: 1 }) // oldest first
}

const Report = mongoose.model('Report', reportSchema)

module.exports = { Report, STATUSES }