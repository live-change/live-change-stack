<template>
  <pre data-headers>{{ JSON.stringify(metadata, null, '  ') }}</pre>
  <pre class="message" data-text>
    Hello! Enter authentication code: {{ code }}
    Or open authentication link: {{ linkAddress }}
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
    brandName, baseHref, brandSmsFrom
  } = api.metadata.config.value

  const metadata = {
    from: brandSmsFrom,
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