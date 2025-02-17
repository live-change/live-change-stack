<template>
  <div class="w-full flex flex-col items-center">
    <div v-if="topUp" class="w-full lg:w-6 md:w-9 surface-card border-round shadow-1 p-3
                             flex flex-column align-items-center text-center">
      <div class="text-2xl font-semibold my-2">
        Top-up
        <CurrencyDisplay :value="topUp.value"
                         :currency="settings.currency" :denomination="settings.denomination" />
        for
        <CurrencyDisplay :value="topUp?.price" :currency="topUp.currency" :denomination="priceDenomination" />
      </div>

      <div v-if="topUp?.state === 'created'" class="mt-6 text-lg">
        We are still waiting for payment confirmation.
      </div>
      <div v-if="topUp?.state === 'paid'" class="mt-6 text-lg">
        Your top-up is successful.
      </div>
      <div v-if="topUp?.state === 'refunded'" class="mt-6 text-lg">
        Your top-up is refunded.
      </div>
      <div v-if="topUp?.state === 'failed'" class="mt-6 text-lg">
        Your top-up is failed.
      </div>

      <div class="mt-4">Your current balance is <BillingBalance /></div>

      <router-link :to="{ name: 'billing:billing' }" class="mt-8 mb-4">
        <Button label="Back to billing" icon="pi pi-wallet" />
      </router-link>

    </div>
    <div v-else-if="topUp === null">
      <NotFound />
    </div>
  </div>
</template>

<script setup>
  import BillingBalance from '../components/BillingBalance.vue'

  import { CurrencyDisplay } from '@live-change/balance-frontend'
  import { NotFound } from "@live-change/url-frontend";

  import { defineProps, toRefs, computed, inject } from 'vue'

  const props = defineProps({
    encodedId: {
      type: String,
      required: true
    },
  })
  const { encodedId } = toRefs(props)

  const topUpId = computed(() => {
    return encodedId.value.replace(/\(/g, '[').replace(/\)/g, ']')
  })

  import { usePath, live, useClient, useApi } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()
  const api = useApi()

  const billingPath = computed(() =>
    (path.billing.myUserBilling({}))
      .with(billing => path.balance.balance({
        ownerType: 'billing_Billing',
        owner: billing.id
      }).bind('balance'))
  )

  const topUpPath = computed(() =>
    path.billing.topUp({
      topUp: topUpId.value
    })
  )

  const [ billing, topUp ] = await Promise.all([
    live(billingPath),
    live(topUpPath)
  ])

  const billingClientConfig = api.getServiceDefinition('billing')?.clientConfig
  const billingSettings = inject('billingSettings', (billing) => ({
    currency: billingClientConfig?.currency ?? 'usd',
    denomination: billingClientConfig?.denomination ?? 100
  }))
  const settings = computed(() => billingSettings( billing ))

  const priceDenomination = computed(() =>
    billingClientConfig?.currencyDenomination[topUp.value?.currency]
    ?? billingClientConfig?.currencyDenomination.default
  )

</script>

<style scoped>

</style>