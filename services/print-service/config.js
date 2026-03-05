import definition from './definition.js'
import crypto from 'crypto'

const {
  browserUrl,
  browserWebSocketDebuggerUrl,
  browserHost,
  browserPort = 9222,
  // how many screenshots and pdf prints can run in parallel
  concurrency = 4,
  printAuthenticationKey = crypto.randomBytes(24).toString('hex'),
  ssrUrl = definition.config.browser?.ssrUrl,
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
