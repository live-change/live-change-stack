<template>
  <span>
    <CurrencyDisplay :value="value"
                     :i18nConfig="i18nConfig" :i18nDefaultConfig="i18nDefaultConfig"
                     :currency="settings.currency" :denomination="settings.denomination" />
  </span>
</template>

<script setup>
  import { CurrencyDisplay } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject } from 'vue'

  const props = defineProps({
    available: {
      type: Boolean,
      default: true
    },
    user: {
      type: String,
      default: null
    },
    i18nConfig: {
      type: Object,
      default: () => undefined
    },
    i18nDefaultConfig: {
      type: Object,
      default: () => undefined
    },
  })
  const { available, user, i18nConfig, i18nDefaultConfig } = toRefs(props)

  import { usePath, live, useClient, useApi } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()
  const api = useApi()

  const billingClientConfig = api.getServiceDefinition('billing')?.clientConfig

  const billingSettings = inject('billingSettings', (billing) => ({
    currency: billingClientConfig?.currency ?? 'usd',
    denomination: billingClientConfig?.denomination ?? 100
  }))

  const billingPath = computed(() =>
    (user.value ? path.billing.billing({ user }) : path.billing.myUserBilling({}))
      .with(billing => path.balance.ownerOwnedBalance({
        ownerType: 'billing_Billing',
        owner: billing.id
      }).bind('balance'))
  )

  const [ billing ] = await Promise.all([
    live(billingPath)
  ])

  const settings = computed(() => billingSettings( billing ))

  const value = computed(() => available.value
    ? billing?.value?.balance?.available ?? 0
    : billing?.value?.balance?.amount ?? 0
  )

</script>

<style scoped>

</style>