import definition from './definition.js'

const {
  readerRoles = ['reader', 'speaker', 'vip', 'moderator', 'owner', 'member'],
  writerRoles = ['speaker', 'vip', 'moderator', 'owner'],
  messageWaitForEvents = false,
  messageSkipEmit = false,
  groupMessages = false
} = definition.config

definition.clientConfig = {
  readerRoles,
  writerRoles
}

const config = {
  readerRoles,
  writerRoles,
  messageWaitForEvents,
  messageSkipEmit,
  groupMessages
}

export default config
