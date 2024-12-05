import definition from './definition.js'
import crypto from 'crypto'

const {
  browserUrl,
  browserWebSocketDebuggerUrl,
  concurrency = 1,
  printAuthenticationKey = crypto.randomBytes(24).toString('hex'),
  ssrUrl = process.env.SSR_URL || 'http://localhost:8001'
} = definition.config

definition.clientConfig = {

}

const config = {
  browserUrl,
  browserWebSocketDebuggerUrl,
  concurrency,
  printAuthenticationKey,
  ssrUrl
}

export default config
