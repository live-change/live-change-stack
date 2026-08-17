import definition from './definition.js'

const {
  vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
} = definition.config || {}

definition.clientConfig = {
  vapidPublicKey
}

export default {
  vapidPublicKey,
  vapidPrivateKey,
  vapidSubject
}
