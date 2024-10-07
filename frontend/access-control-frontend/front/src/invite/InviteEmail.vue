<template>
  <pre data-headers>{{ JSON.stringify(metadata, null, '  ') }}</pre>
  <div data-html class="message m-6">
    <p class="text-lg">
      Hello!
    </p>
    <p>
      <span v-if="from?.name">
        Our user
        <strong>{{ from.name }}</strong>
      </span>
      <span v-else>One of our users</span>
       invited you to use {{ brandName }}'s {{ data.objectType }} by entering your email address.
    </p>
    <div v-if="data.message.trim().length > 0">
      <p>He left message for you:</p>
      <blockquote class="font-italic">{{ data.message }}</blockquote>
    </div>
    <p>
      if you already have an account, you can add this email to your account
      and the invitation will be linked to your account.
    </p>
    <p>
      Click the button below:
    </p>
    <div>
      <a :href="linkAddress" class="no-underline">
        <Button label="Confirm email" class="p-button-lg" />
      </a>
    </div>
    <p>
      Or copy this address to your browser address bar:<br>
      <a :href="linkAddress">
        {{ linkAddress }}
      </a>
    </p>
    <p>
      Let us know in case it's not for you.
    </p>
    <p>
      See you soon<br>
      {{ brandName }} Team
    </p>
    <img src="/images/logo128.png">
  </div>
  <pre class="message" data-text>
    Hello!

    {{ from?.name ? `Our user ${from?.name}` : 'One of our users' }} invited you to use X by entering your email address.

    Click link below or copy address to your browser address bar:

    {{ linkAddress }}

    Let us know in case it's not for you.

    See you soon
    {{ brandName }} Team
  </pre>
</template>

<script setup>
  import Button from "primevue/button"

  import { path, live, actions } from '@live-change/vue3-ssr'

  const { action, contact, json } = defineProps({
    contact: {
      type: String,
      required: true
    },
    json: {
      type: String,
      required: true
    }
  })

  const data = JSON.parse(json)

  const secrets = data.secrets
  const secretLink = secrets.find(secret => secret.type === 'link')

  const [ from ] = await Promise.all([
    live(path().userIdentification.sessionOrUserOwnedIdentification(
        { sessionOrUserType: data.fromType, sessionOrUser: data.from }))
  ])

  const brandName = ENV_BRAND_NAME

  const metadata = {
    from: `${ENV_BRAND_NAME} <admin@${ENV_BRAND_DOMAIN}>`,
    subject: `${from?.name ?? 'Our user'} invited you to ${data.objectType}`,
    to: contact
  }

  const linkAddress = ENV_BASE_HREF + '/link/' + secretLink.secret.secretCode

</script>

<style scoped>
  img {
    width: 100%;
    max-width: 100px;
  }
  .message {
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;
    color: #495057;
    font-weight: 400;
  }
  pre {
    border-top: 1px solid black;
    border-bottom: 1px solid black;
  }
</style>