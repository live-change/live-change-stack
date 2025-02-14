import definition from './definition.js'
import crypto from 'crypto'

const {
  browserUrl,
  browserWebSocketDebuggerUrl,
  browserHost,
  browserPort = 9222,
  concurrency = 1,
  printAuthenticationKey = crypto.randomBytes(24).toString('hex'),
  ssrUrl = process.env.SSR_URL || 'http://localhost:8001'
} = definition.config

definition.clientConfig = {

}

const config = {
  browserUrl,
  browserWebSocketDebuggerUrl,
  browserHost,
  browserPort,
  concurrency,
  printAuthenticationKey,
  ssrUrl
}

export default config
