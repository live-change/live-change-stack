import definition from './definition.js'
import crypto from 'crypto'

const {
  browserUrl,
  browserWebSocketDebuggerUrl,
  concurrency = 1,
  printAuthenticationKey = crypto.randomBytes(24).toString('hex'),
  ssrHost = process.env.SSR_HOST || '127.0.0.1',
  ssrPort = process.env.SSR_PORT || '8001'
} = definition.config

definition.clientConfig = {

}

const config = {
  browserUrl,
  browserWebSocketDebuggerUrl,
  concurrency,
  printAuthenticationKey,
  ssrHost,
  ssrPort
}

export default config
