<template>
  <pre data-headers>{{ JSON.stringify(metadata, null, '  ') }}</pre>
  <div data-html class="message m-12">
    <p class="text-lg">
      {{ t('emailTemplates.hello') }}
    </p>
    <p>
      {{ t('emailTemplates.connect.description') }}
    </p>
    <p class="text-3xl font-medium">{{ code }}</p>
    <p>
      {{ t('emailTemplates.clickButtonBelow') }}
    </p>
    <div>
      <a :href="linkAddress" class="no-underline">
        <Button :label="t('emailTemplates.confirmEmail')" class="p-button-lg cursor-pointer" />
      </a>
    </div>
    <p>
      {{ t('emailTemplates.copyAddressInstruction') }}<br>
      <a :href="linkAddress">
        {{ linkAddress }}
      </a>
    </p>
    <p>
      {{ t('emailTemplates.letUsKnow') }}
    </p>
    <p>
      {{ t('emailTemplates.seeYouSoon') }}<br>
      {{ t('emailTemplates.teamSignature', { brandName }) }}
    </p>
    <img src="/images/logo128.png">
  </div>
  <pre class="message" data-text>
    {{ t('emailTemplates.hello') }}

    {{ t('emailTemplates.connect.textDescription') }}
    {{ code }}

    {{ t('emailTemplates.clickLinkInstruction') }}

    {{ linkAddress }}

    {{ t('emailTemplates.letUsKnow') }}

    {{ t('emailTemplates.seeYouSoon') }}
    {{ t('emailTemplates.teamSignature', { brandName }) }}
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

  const owner = { sessionOrUserType: 'user_User', sessionOrUser: data.user }
  import { useLocale } from "@live-change/vue3-components"
  const locale = useLocale()
  const localePromise = locale.getOtherOwnerLocale(owner)
  await Promise.all([localePromise])
  import { useI18n } from 'vue-i18n'
  const { locale: i18nLocale, t } = useI18n()
  if(locale.localeRef.value?.language) i18nLocale.value = locale.localeRef.value?.language

  import { useHead } from '@vueuse/head'
  useHead({ htmlAttrs: { class: 'email-rendering' } })

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  const {
    brandName, brandDomain, baseHref
  } = api.metadata.config.value

  const metadata = {
    from: `${brandName} <admin@${brandDomain}>`,
    subject: t('emailTemplates.connect.subject'),
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