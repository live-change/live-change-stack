<template>
  <pre data-headers>{{ JSON.stringify(metadata, null, '  ') }}</pre>
  <div data-html class="message m-12">
    <p class="text-lg">
      {{ t('emailTemplates.hello') }}
    </p>
    <p>
      {{ t('emailTemplates.feedbackReceived.description', { type: t(`emailTemplates.feedbackReceived.types.${feedbackType}`) }) }}
    </p>
    <div class="feedback-content">
      <p class="font-medium">{{ t('emailTemplates.feedbackReceived.contentLabel') }}: </p>
      <p class="bg-gray-100 p-4 rounded">{{ data.content }}</p>
    </div>
    <div v-if="data.email || userEmails.length > 0" class="feedback-contact mt-4">
      <p class="font-medium">{{ t('emailTemplates.feedbackReceived.contactLabel') }}: </p>
      <ul class="list-none pl-0">
        <li v-if="data.email">
          <strong>{{ t('emailTemplates.feedbackReceived.userProvidedEmailLabel') }}: </strong> 
          <a :href="'mailto:' + data.email">{{ data.email }}</a>
        </li>
        <li v-for="contact in userEmails" :key="contact.email">
          <strong>{{ t('emailTemplates.feedbackReceived.userContactLabel') }}: </strong> 
          <a :href="'mailto:' + contact.email">{{ contact.email }}</a>
        </li>
      </ul>
    </div>
    <div class="feedback-details mt-4">
      <p class="font-medium">{{ t('emailTemplates.feedbackReceived.detailsLabel') }}:</p>
      <ul class="list-none pl-0">
        <li><strong>{{ t('emailTemplates.feedbackReceived.typeLabel') }}:</strong> {{ t(`emailTemplates.feedbackReceived.types.${feedbackType}`) }}</li>
        <li><strong>{{ t('emailTemplates.feedbackReceived.ipLabel') }}:</strong> {{ data.ip }}</li>
        <li><strong>{{ t('emailTemplates.feedbackReceived.sessionLabel') }}:</strong> {{ data.session }}</li>
        <li><strong>{{ t('emailTemplates.feedbackReceived.userAgentLabel') }}:</strong> {{ data.userAgent }}</li>
        <li v-if="data.trace"><strong>{{ t('emailTemplates.feedbackReceived.traceLabel') }}:</strong> <code style="white-space: pre-wrap; display: block; background: #f5f5f5; padding: 0.5rem; margin-top: 0.5rem;">{{ data.trace }}</code></li>
      </ul>
    </div>
    <p>
      {{ t('emailTemplates.seeYouSoon') }}<br>
      {{ t('emailTemplates.teamSignature', { brandName }) }}
    </p>
    <img src="/images/logo128.png">
  </div>
  <pre class="message" data-text>{{ textVersion }}</pre>
</template>

<script setup>
  const { contact, json } = defineProps({
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

  import { useI18n } from 'vue-i18n'
  const { locale: i18nLocale, t } = useI18n()

  import { useHead } from '@vueuse/head'
  useHead({ htmlAttrs: { class: 'email-rendering' } })

  import { useApi, live, usePath } from '@live-change/vue3-ssr'
  const api = useApi()

  const {
    brandName, brandDomain
  } = api.metadata.config.value

  const feedbackType = data.type || 'feedback'
  const subjectKey = `emailTemplates.feedbackReceived.subject.${feedbackType}`
  
  const userEmailsPath = usePath().email.userEmails({ user: data.user })

  import { useLocale } from "@live-change/vue3-components"
  const locale = useLocale()
  const localePromise = locale.getOtherUserOrSessionLocale(data.user, data.client?.session)

  const [userEmails, _] = await Promise.all([live(userEmailsPath), localePromise])
  if(locale.getLanguage()) i18nLocale.value = locale.getLanguage()

  console.log('userEmails', userEmails.value)

  // Determine replyTo - prefer user-provided email, then first user contact
  const replyToEmail = data.email || (userEmails.value.length > 0 ? userEmails.value[0].email : null)

  const metadata = {
    from: `${brandName} <admin@${brandDomain}>`,
    subject: t(subjectKey),
    to: contact,
    ...(replyToEmail ? { replyTo: replyToEmail } : {})
  }

  import { computed } from 'vue'
  const textVersion = computed(() => {
    const lines = [
      t('emailTemplates.hello'),
      '',
      t('emailTemplates.feedbackReceived.textDescription', { type: t(`emailTemplates.feedbackReceived.types.${feedbackType}`) }),
      '',
      t('emailTemplates.feedbackReceived.contentLabel') + ':',
      data.content,
      ''
    ]
    
    // Add contact information
    if (data.email || userEmails.value.length > 0) {
      lines.push(t('emailTemplates.feedbackReceived.contactLabel') + ':')
      if (data.email) {
        lines.push(t('emailTemplates.feedbackReceived.userProvidedEmailLabel') + ': ' + data.email)
      }
      userEmails.value.forEach(contact => {
        lines.push(t('emailTemplates.feedbackReceived.userContactLabel') + ': ' + contact.email)
      })
      lines.push('')
    }
    
    lines.push(
      t('emailTemplates.feedbackReceived.detailsLabel') + ':',
      t('emailTemplates.feedbackReceived.typeLabel') + ': ' + t(`emailTemplates.feedbackReceived.types.${feedbackType}`),
      t('emailTemplates.feedbackReceived.ipLabel') + ': ' + data.ip,
      t('emailTemplates.feedbackReceived.sessionLabel') + ': ' + data.session,
      t('emailTemplates.feedbackReceived.userAgentLabel') + ': ' + data.userAgent
    )
    if (data.trace) {
      lines.push(t('emailTemplates.feedbackReceived.traceLabel') + ': ' + data.trace)
    }
    lines.push('', t('emailTemplates.seeYouSoon'), t('emailTemplates.teamSignature', { brandName }))
    return lines.join('\n')
  })

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