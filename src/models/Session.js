'use strict'

const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: String, // stored as JSON string
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

const Session = mongoose.model('Session', sessionSchema)

module.exports = { Session }