export function buildWebPushPayload({ notificationType, title, message, notification, data }) {
  const body = message
    ? String(message)
    : `You have a new notification (${notificationType}).`
  return {
    title: title ? String(title) : `Notification: ${notificationType}`,
    body,
    data: {
      notificationType: String(notificationType ?? ''),
      notification: notification != null ? String(notification) : null,
      ...(data && typeof data === 'object' ? data : {})
    }
  }
}
