<template>
  <div class="mb-6 p-4 border border-surface-200 dark:border-surface-700 rounded-border">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-medium m-0">{{ t('notifications.webPushTitle') }}</h2>
        <p class="text-sm text-surface-500 mt-1 mb-0">
          {{ t('notifications.webPushHint') }}
        </p>
        <p v-if="error" class="text-sm text-red-500 mt-2 mb-0">{{ error }}</p>
        <p v-else-if="status" class="text-sm text-surface-500 mt-2 mb-0">{{ status }}</p>
      </div>
      <div class="flex gap-2 shrink-0">
        <Button
          v-if="!subscribed"
          :label="t('notifications.webPushEnable')"
          icon="pi pi-bell"
          size="small"
          :loading="busy"
          :disabled="!supported"
          @click="subscribe"
        />
        <Button
          v-else
          :label="t('notifications.webPushDisable')"
          icon="pi pi-bell-slash"
          size="small"
          severity="secondary"
          outlined
          :loading="busy"
          @click="unsubscribe"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import Button from 'primevue/button'
  import { computed, onMounted, ref } from 'vue'
  import { api as useApi } from '@live-change/vue3-ssr'
  import { useI18n } from 'vue-i18n'

  const api = useApi()
  const { t } = useI18n()

  const busy = ref(false)
  const error = ref('')
  const status = ref('')
  const subscribed = ref(false)
  const currentEndpoint = ref('')

  const supported = computed(() =>
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
  )

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    const output = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
    return output
  }

  async function ensureServiceWorker() {
    const reg = await navigator.serviceWorker.register('/sw-web-push.js')
    await navigator.serviceWorker.ready
    return reg
  }

  async function refreshState() {
    if (!supported.value) {
      status.value = t('notifications.webPushUnsupported')
      return
    }
    const reg = await navigator.serviceWorker.getRegistration('/sw-web-push.js')
    const sub = await reg?.pushManager?.getSubscription()
    subscribed.value = Boolean(sub)
    currentEndpoint.value = sub?.endpoint || ''
  }

  async function subscribe() {
    busy.value = true
    error.value = ''
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        error.value = t('notifications.webPushPermissionDenied')
        return
      }
      const { vapidPublicKey } = await api.command(['web', 'getVapidPublicKey'], {})
      if (!vapidPublicKey) {
        error.value = t('notifications.webPushNotConfigured')
        return
      }
      const reg = await ensureServiceWorker()
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
      }
      const json = sub.toJSON()
      await api.command(['web', 'subscribeWebPush'], {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        userAgent: navigator.userAgent
      })
      subscribed.value = true
      currentEndpoint.value = json.endpoint
      status.value = t('notifications.webPushEnabled')
    } catch (err) {
      error.value = err?.message ?? String(err)
    } finally {
      busy.value = false
    }
  }

  async function unsubscribe() {
    busy.value = true
    error.value = ''
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw-web-push.js')
      const sub = await reg?.pushManager?.getSubscription()
      const endpoint = sub?.endpoint || currentEndpoint.value
      if (sub) await sub.unsubscribe()
      if (endpoint) {
        await api.command(['web', 'unsubscribeWebPush'], { endpoint })
      }
      subscribed.value = false
      currentEndpoint.value = ''
      status.value = t('notifications.webPushDisabled')
    } catch (err) {
      error.value = err?.message ?? String(err)
    } finally {
      busy.value = false
    }
  }

  onMounted(() => {
    refreshState().catch(() => {})
  })
</script>
