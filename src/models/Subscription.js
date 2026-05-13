'use strict'

const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// One subscription per phone per area
subscriptionSchema.index({ phone: 1, area: 1 }, { unique: true })

// Find all active subscribers for an area
subscriptionSchema.statics.findSubscribers = function (area) {
  return this.find({
    area: new RegExp(`^${area}$`, 'i'),
    active: true,
  })
}

// Find all subscriptions for a phone number
subscriptionSchema.statics.findByPhone = function (phone) {
  return this.find({ phone, active: true })
}

const Subscription = mongoose.model('Subscription', subscriptionSchema)

module.exports = { Subscription }