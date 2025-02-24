import definition from './definition.js'
import crypto from 'crypto'

// Helper function to get value with fallback
const getValue = (configValue, envValue, defaultValue) => 
  configValue ?? envValue ?? defaultValue

// Helper function to convert value to number
const getNumberValue = (configValue, envValue, defaultValue) => 
  +(getValue(configValue, envValue, defaultValue))

// Browser configuration
const browser = {
  url: getValue(definition.config.browser?.url, process.env.BROWSER_URL),
  webSocketDebuggerUrl: getValue(
    definition.config.browser?.webSocketDebuggerUrl, 
    process.env.BROWSER_WEBSOCKET_DEBUGGER_URL
  ),
  host: getValue(definition.config.browser?.host, process.env.BROWSER_HOST),
  port: getNumberValue(definition.config.browser?.port, process.env.BROWSER_PORT, 9222),
  concurrency: getNumberValue(definition.config.browser?.concurrency, process.env.BROWSER_CONCURRENCY, 1),
  renderAuthenticationKey: getValue(
    definition.config.browser?.renderAuthenticationKey, 
    null, 
    crypto.randomBytes(24).toString('hex')
  ),
}

// SMTP configuration
const smtp = {
  host: getValue(definition.config.smtp?.host, process.env.SMTP_HOST),
  port: getNumberValue(definition.config.smtp?.port, process.env.SMTP_PORT, 587),
  auth: {
    user: getValue(definition.config.smtp?.user, process.env.SMTP_USER),
    pass: getValue(definition.config.smtp?.password, process.env.SMTP_PASSWORD),
  },
  // deduce secure from port, include all secure ports  
  secure: getValue(definition.config.smtp?.secure, [465, 587, 2525].includes(definition.config.smtp?.port)),
  ignoreTLS: getValue(definition.config.smtp?.ignoreTLS, undefined),
}

const renderMethod = getValue(definition.config.renderMethod, process.env.EMAIL_RENDER_METHOD, 'juice')

definition.clientConfig = {}

const config = { 
  browser, 
  smtp,
  renderMethod,
  ssrUrl: getValue(
    definition.config.browser?.ssrUrl, 
    process.env.SSR_URL, 
    'http://localhost:8001'
  )
}

export default config