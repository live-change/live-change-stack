---
title: Notification channels
---

# Notification channels (in-app, email, web push)

In-app notifications are created by the **`notify`** trigger on **notification-service**. Email and web push listen to **`notificationCreated`** and deliver according to **NotificationSetting** (per contact × notification type).

```
trigger(notify)
  → Notification row (sessionOrUserItem)
  → trigger(notificationCreated)
       → email-service (SMTP)
       → web-service (VAPID web push)
```

## App config

Auth services (`passwordAuthentication`, `messageAuthentication`, `accessControl`) use **auth** contact types only (`email`, optionally `phone`). Do **not** put `web` there — it has no auth validator and is not a login contact.

`web` belongs only on **notification** `contactTypes` (delivery channels / browser endpoints).

```js
// Auth / invites
const contactTypes = ['email']

// Notification delivery only — includes web push endpoints (not auth contacts).
// TODO: replace overloaded notification.contactTypes with proper channel kinds
// (contact vs device/endpoint) instead of treating web_Web like email_Email.
const notificationContactTypes = ['email', 'web']

{
  name: 'notification',
  contactTypes: notificationContactTypes,
  notificationTypes: ['example_TestNotification', 'ops_MaintenanceNeeded'],
  fields: {
    title: { type: String },
    message: { type: String },
    task: { type: String },
    blockedType: { type: String },
    blocked: { type: String }
  },
  defaultSettings: [
    { notificationType: 'ops_MaintenanceNeeded', contactService: 'email', active: true },
    { notificationType: 'ops_MaintenanceNeeded', contactService: 'web', active: true }
  ]
},
{
  name: 'web',
  path: '@live-change/web-service',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
}
```

`notification.contactTypes` must include `web` for browser push settings UI (`myUserWebs`).

## Creating a notification

```js
await trigger({ type: 'notify' }, {
  sessionOrUserType: 'user_User',
  sessionOrUser: userId,
  notificationType: 'ops_MaintenanceNeeded',
  title: 'Maintenance needed',
  message: 'Device offline',
  task: maintenanceTaskId,
  blockedType: 'deviceManager_Device',
  blocked: deviceId
})
```

Session-scoped notifications (`session_Session`) stay in-app only (no email/push).

## Preferences

Model **NotificationSetting** (`propertyOfAny` contact + notification type).

- Missing row → **enabled** (opt-out), unless `defaultSettings` says otherwise
- Settings UI: user-frontend **Notifications settings** (toggles per contact) — same effective default as delivery (`resolveChannelActiveFromSetting` / `defaultSettings`)
- Helper / trigger: `isNotificationChannelActive` on notification-service

## Delivery state

On `Notification`:

| Field | Values |
|-------|--------|
| `emailState` | `pending` \| `sent` \| `error` |
| `webPushState` | `pending` \| `sent` \| `error` |

Marked via triggers `markNotificationsEmailed` / `markNotificationsWebPushed` (or `setNotificationChannelState`).

## Email

`@live-change/email-service` implements `notificationCreated`:

1. Load user emails (`email_Email`)
2. Check preference per address
3. `sendEmailMessage` with plain text/html (no SSR required)
4. Mark emailed

`checkEmailNotificationState` re-sends pending (`emailState != sent`) for a user — no digests in v1.

Addresses ending in `@test.com` use the existing test SMTP path (no real send).

## Web push

`@live-change/web-service` (service name **`web`**, model **`Web`**):

| Piece | Role |
|-------|------|
| `Web` userItem | Push subscription (`endpoint`, `p256dh`, `auth`) |
| `subscribeWebPush` / `unsubscribeWebPush` | CRUD from browser |
| `getVapidPublicKey` | Client bootstrap |
| `sendWebPushMessage` | `web-push` library |
| `notificationCreated` | Same preference pattern as email |

### VAPID keys

```bash
npx web-push generate-vapid-keys
# export VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
```

### Frontend

- Panel on notifications settings: subscribe / unsubscribe
- Service worker: `/sw-web-push.js` (copy into app `front/public/`)
- Register type UI in `notificationTypes` map (user-frontend)

### TODO task assignments (bot-server)

Assigning a task (`todo_setOrUpdateTaskAssignment` create) fires `changeTodo_TaskAssignment`, which picks `notificationType` from `todo.taskAssignmentNotifications.byModuleType` (`module:type` key) or `defaultType` (`todo_TaskAssigned`). Mapped `null` skips notify. Payload always includes `task` + `todoList` for the in-app task link.

## Related

- [Email and SMS](/server/17-email-and-sms.html) — low-level `sendEmailMessage` / `sendPhoneMessage`
- [App config](/server/02-app-config.html) — `contactTypes`
