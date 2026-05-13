'use strict'

const { initAuthCreds, BufferJSON, proto } = require('baileys')
const { Session } = require('../models/Session')
const logger = require('../utils/logger')

const SESSION_ID = 'naija-power-bot-session'

/**
 * Save auth state to MongoDB
 * @param {object} data
 * @param {string} key
 */
const writeData = async (data, key) => {
    try {
        const sessionId = `${SESSION_ID}-${key}`
        const serialized = JSON.stringify(data, BufferJSON.replacer)

        await Session.findOneAndUpdate(
            { sessionId },
            { data: serialized },
            { upsert: true, returnDocument: 'after' }
        )
    } catch (error) {
        logger.error(`Error saving session key ${key}:`, error)
    }
}

/**
 * Read auth state from MongoDB
 * @param {string} key
 * @returns {any}
 */
const readData = async (key) => {
    try {
        const sessionId = `${SESSION_ID}-${key}`
        const session = await Session.findOne({ sessionId })

        if (!session) return null

        return JSON.parse(session.data, BufferJSON.reviver)
    } catch (error) {
        logger.error(`Error reading session key ${key}:`, error)
        return null
    }
}

/**
 * Delete auth state from MongoDB
 * @param {string} key
 */
const removeData = async (key) => {
    try {
        const sessionId = `${SESSION_ID}-${key}`
        await Session.deleteOne({ sessionId })
    } catch (error) {
        logger.error(`Error deleting session key ${key}:`, error)
    }
}

/**
 * MongoDB-backed auth state for Baileys
 * Replaces useMultiFileAuthState with database storage
 */
const useMongoAuthState = async () => {
    // Load or initialize credentials
    let creds = await readData('creds')

    if (!creds) {
        creds = initAuthCreds()
        await writeData(creds, 'creds')
        logger.info('🔑 New auth credentials initialized')
    } else {
        logger.info('🔑 Auth credentials loaded from database')
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {}
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`)
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value)
                            }
                            data[id] = value
                        })
                    )
                    return data
                },
                set: async (data) => {
                    const tasks = []
                    for (const category of Object.keys(data)) {
                        for (const id of Object.keys(data[category])) {
                            const value = data[category][id]
                            const key = `${category}-${id}`
                            tasks.push(value ? writeData(value, key) : removeData(key))
                        }
                    }
                    await Promise.all(tasks)
                },
            },
        },
        saveCreds: async () => {
            await writeData(creds, 'creds')
        },
    }
}

module.exports = { useMongoAuthState }