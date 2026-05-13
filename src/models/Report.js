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
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index auto-deletes expired docs
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false,
  }
)

// Compound index for fast area + status queries
reportSchema.index({ area: 1, createdAt: -1 })

// Static method to find latest report for an area
reportSchema.statics.findLatestByArea = function (area) {
  return this.findOne({
    area: new RegExp(area, 'i'),
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })
}

// Static method to get all active reports
reportSchema.statics.findAllActive = function () {
  return this.find({
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })
}

const Report = mongoose.model('Report', reportSchema)

module.exports = { Report, STATUSES }