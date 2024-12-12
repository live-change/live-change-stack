<template>
  <pre data-headers>{{ JSON.stringify(metadata, null, '  ') }}</pre>
  <div data-html class="message m-6">
    <p class="text-lg">
      Hello!
    </p>
    <p>
      You are trying to reset password to your account.
      In order to confirm that, please enter secret code:
    </p>
    <p class="text-3xl font-medium">{{ code }}</p>
    <p>
      Or click the button below:
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
      Let us know in case it's not you.
    </p>
    <p>
      See you soon<br>
      {{ brandName }} Team
    </p>
    <img src="/images/logo128.png">
  </div>
  <pre class="message" data-text>
    Hello!

    You are trying to reset password to your account.
    In order to confirm that, please enter secret code:
    {{ code }}

    Or please click link below or copy address to your browser address bar:

    {{ linkAddress }}

    Let us know in case it's not you.

    See you soon
    {{ brandName }} Team
  </pre>
</template>

<script setup>
  import Button from "primevue/button"

  const { action, contact, json } = defineProps({
    action: {
      type: String,
      required: true
    },
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
  const secretCode = secrets.find(secret => secret.type === 'code')

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  const {
    brandName, brandDomain, baseHref
  } = api.metadata.config.value

  const metadata = {
    from: `${brandName} <admin@${brandDomain}>`,
    subject: 'Confirm your email address.',
    to: contact
  }

  import { useRouter } from 'vue-router'
  const router = useRouter()
  const linkAddress = baseHref + router.resolve({
    name: 'user:link',
    params: {
      secretCode: secretLink.secret.secretCode
    }
  }).href

  const code = secretCode.secret.secretCode

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