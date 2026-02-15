---
title: Email and SMS
---

# Email and SMS

Sending email and SMS is done by calling **triggers** on **email-service** and **phone-service**: **sendEmailMessage** and **sendPhoneMessage**. You pass a **message** id (for idempotency/logging), **content** (to, text, etc.), and optionally **render** so the service can render the body from a template. Rendering is often done in the **frontend** (browser) or in a shared render function; the server only receives the final content or render parameters. This section does not describe email/SMS template formats in detail.

## Sending email

Add **email** service to app.config. From your code (trigger or action), call:

```javascript
await triggerService({ service: 'email', type: 'sendEmailMessage' }, {
  message: messageId,   // optional; generated if omitted
  email: content,       // { to, text, subject?, html?, ... } (nodemailer-compatible)
  render: undefined     // optional: { ... } passed to email-service render
})
```

If **render** is provided, the email service calls its **renderEmail({ client, ...render })** to produce **content** (e.g. from a template and locale). Otherwise **content** must be provided with at least **to** and **text**. The service then uses nodemailer (config.smtp) to send and emits **sent** or **error** events (stored in SentEmail model).

## Sending SMS

Add **phone** service to app.config. From your code:

```javascript
await triggerService({ service: 'phone', type: 'sendPhoneMessage' }, {
  message: messageId,
  content: { text, to, from },
  render: undefined     // optional: passed to phone-service renderSms
})
```

If **render** is set, the phone service uses **renderSms(render)** to produce content. Otherwise **content** must have **text** and **to**. The service uses the configured provider (e.g. SMSAPI) to send and emits **sent** or **error** (stored in SentSms model).

## Rendering

- **Email**: The email-service **render** parameter is typically used to pass template name and variables; the actual HTML/text rendering may be implemented in the service (e.g. render.js) or prepared by the frontend and sent as ready **content**. This manual does not specify template syntax or layout.
- **SMS**: Similarly, **render** can drive template-based text; details of templates are not covered here.

## Configuration

- **email-service**: Configure **smtp** (e.g. in config.js or definition.config) for nodemailer transport.
- **phone-service**: Configure provider (e.g. **accessToken** or env **SMSAPI_ACCESS_TOKEN** for SMSAPI), and **from** for sender id where applicable.

Test addresses (e.g. @test.com for email, a test number for SMS) are often handled by the service without actually sending (log only and emit sent).
