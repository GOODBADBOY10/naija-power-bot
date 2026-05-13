'use strict'

const Joi = require('joi')

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  APP_NAME: Joi.string()
    .min(1)
    .default('Naija Power Bot'),

  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required()
    .description('MongoDB connection string'),

  SESSION_DIR: Joi.string()
    .min(1)
    .default('auth_info'),

  REPORT_EXPIRY_HOURS: Joi.number()
    .min(1)
    .max(24)
    .default(6)
    .description('Hours before a report expires'),

}).unknown()

const { error, value: env } = envSchema.validate(process.env)

if (error) {
  throw new Error(`❌ Invalid environment variables: ${error.message}`)
}

module.exports = {
  nodeEnv: env.NODE_ENV,
  appName: env.APP_NAME,
  mongoUri: env.MONGODB_URI,
  sessionDir: env.SESSION_DIR,
  reportExpiryHours: env.REPORT_EXPIRY_HOURS,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
}