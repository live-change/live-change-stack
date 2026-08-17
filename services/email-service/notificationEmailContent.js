export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildPlainEmailContent({ to, notificationType, title, message, notification }) {
  const subject = title
    ? String(title)
    : `Notification: ${notificationType}`
  const lines = [
    message ? String(message) : `You have a new notification (${notificationType}).`,
    '',
    notification ? `Notification id: ${notification}` : null
  ].filter(line => line != null)
  const text = lines.join('\n')
  const html = `<div style="font-family:sans-serif;line-height:1.4">
  <h2 style="margin:0 0 12px">${escapeHtml(subject)}</h2>
  <p>${escapeHtml(lines[0] || '')}</p>
  ${notification ? `<p style="color:#666;font-size:12px">id: ${escapeHtml(String(notification))}</p>` : ''}
</div>`
  return { to, subject, text, html }
}
