/* global self, clients */
self.addEventListener('push', (event) => {
  let payload = { title: 'Notification', body: '', data: {} }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    try {
      payload.body = event.data?.text() || ''
    } catch {
      // ignore
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Notification', {
      body: payload.body || '',
      data: payload.data || {},
      icon: '/favicon.ico'
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification?.data || {}
  const path = data.url || data.path || '/notifications'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate?.(path)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(path)
    })
  )
})
