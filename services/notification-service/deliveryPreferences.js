import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import { NotificationSetting } from './settings.js'
import {
  defaultChannelActive as defaultChannelActiveCore,
  resolveChannelActiveFromSetting
} from './deliveryPreferencesCore.js'

const config = definition.config

/**
 * @param {string} notificationType
 * @param {string} contactService e.g. 'email' | 'web'
 */
export function defaultChannelActive(notificationType, contactService) {
  return defaultChannelActiveCore(notificationType, contactService, config.defaultSettings)
}

/**
 * Whether a contact should receive a given notification type.
 *
 * @param {{
 *   userId: string,
 *   contactType: string,
 *   contactId: string,
 *   notificationType: string
 * }} args
 */
export async function isNotificationChannelActive({
  userId,
  contactType,
  contactId,
  notificationType
}) {
  if (!userId || !contactType || !contactId || !notificationType) return false

  const contactService = String(contactType).split('_')[0]
  const settingId = App.encodeIdentifier([
    contactType,
    contactId,
    notificationType,
    notificationType
  ])

  let setting = null
  try {
    setting = await NotificationSetting.get(settingId)
  } catch {
    setting = null
  }

  if (!setting) {
    const rows = await NotificationSetting.indexRangeGet(
      'byContact',
      [contactType, contactId],
      { limit: 64 }
    ) ?? []
    setting = rows.find(row =>
      String(row?.notification ?? '') === String(notificationType)
      || String(row?.notificationType ?? '') === String(notificationType)
    ) ?? null
  }

  return resolveChannelActiveFromSetting(
    setting,
    notificationType,
    contactService,
    config.defaultSettings
  )
}

/**
 * List user-owned contact rows for a contact service (email, web, …).
 *
 * @param {string} userId
 * @param {string} contactServiceName e.g. 'email'
 * @param {string} [modelName] defaults to capitalized service name (Email, Web)
 */
export async function listUserContacts(userId, contactServiceName, modelName) {
  if (!userId || !contactServiceName) return []
  const model = modelName
    || (contactServiceName[0].toUpperCase() + contactServiceName.slice(1))
  const table = `${contactServiceName}_${model}`
  try {
    const rows = await app.dao.get([
      'database',
      'indexRange',
      app.databaseName,
      `${table}_byUser`,
      {
        gte: JSON.stringify(userId) + ':',
        lte: JSON.stringify(userId) + '_\xFF\xFF\xFF\xFF',
        limit: 64
      }
    ])
    if (Array.isArray(rows) && rows.length && rows[0]?.to) {
      const objects = []
      for (const row of rows) {
        const obj = await app.dao.get([
          'database',
          'tableObject',
          app.databaseName,
          table,
          row.to
        ])
        if (obj) objects.push(obj)
      }
      return objects
    }
    return rows ?? []
  } catch {
    return []
  }
}

export { resolveChannelActiveFromSetting }
export { defaultChannelActiveCore }
