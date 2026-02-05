import definition from './definition.js'

const {
  feedbackTypes = ['feedback', 'delete', 'error'],
  readerRoles = ['admin', 'owner'],
  adminRoles = ['admin'],
  feedbackProperties = {},
  adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
} = definition.config

definition.clientConfig = {
  feedbackTypes,
  readerRoles,
  adminRoles,
  feedbackProperties,
  adminEmail
}

const config = {
  feedbackTypes,
  readerRoles,
  adminRoles,
  feedbackProperties,
  adminEmail
}

export default config
