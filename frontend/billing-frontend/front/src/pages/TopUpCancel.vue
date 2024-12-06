<template>
  <div class="w-full flex flex-column align-items-center">
    <div v-if="topUp" class="w-full lg:w-6 md:w-9 surface-card border-round shadow-1 p-3
                             flex flex-column align-items-center text-center">
      <div class="text-2xl font-semibold my-2">
        Canceled top-up
        <CurrencyDisplay :value="topUp.value"
                         :currency="settings.currency" :denomination="settings.denomination" />
        for
        <CurrencyDisplay :value="topUp?.price" :currency="topUp.currency" :denomination="priceDenomination" />
      </div>

      <div class="mt-4 text-lg">
        You have canceled the top-up.
      </div>

      <div class="mt-3">Your current balance is <BillingBalance /></div>

      <div class="flex flex-row justify-content-center align-items-center mt-4 mb-1 flex-wrap">
        <router-link :to="{ name: 'billing:topUp', params: {
                                  value: topUp.value, price: topUp.price, currency: topUp.currency
                              } }" class="mx-2">
          <Button label="Retry to-up" icon="pi pi-wallet" severity="primary" />
        </router-link>
        <router-link :to="{ name: 'billing:billing' }" class="mx-2">
          <Button label="Back to billing" icon="pi pi-wallet" severity="secondary" />
        </router-link>
      </div>

      <Divider align="center" class="mt-4 mb-2">
        <span class="text-600 font-normal text-sm">OR</span>
      </Divider>

      <div v-for="offer of billingClientConfig.topUpOffers" :key="'offer'+JSON.stringify(offer)">
        <router-link :to="{ name: 'billing:topUp', params: {
                                  value: offer.value, price: offer.price, currency: offer.currency
                              } }"
                     class="flex flex-row no-underline hover:underline my-1">
          <span class="mr-1">Add</span>
          <CurrencyDisplay class="font-semibold"
                           :value="offer.value" :currency="settings.currency" :denomination="settings.denomination" />
          <span class="mx-1">for</span>
          <CurrencyDisplay class="font-medium"
                           :value="offer.price" :currency="offer.currency" :denomination="offer.denomination" />
        </router-link>
      </div>

    </div>
    <div v-else-if="topUp === null">
      <NotFound />
    </div>
  </div>
</template>

<script setup>
  import BillingBalance from '../components/BillingBalance.vue'

  import Divider from "primevue/divider"
  import Button from "primevue/button"

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

  const billingClientConfig = api.getServiceDefinition('billing')?.clientConfig
  const billingSettings = inject('billingSettings', (billing) => ({
    currency: billingClientConfig?.currency ?? 'usd',
    denomination: billingClientConfig?.denomination ?? 100
  }))

  const priceDenomination = computed(() =>
    billingClientConfig?.currencyDenomination[topUp.value?.currency]
    ?? billingClientConfig?.currencyDenomination.default
  )

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

  const settings = computed(() => billingSettings( billing ))

</script>

<style scoped>

</style>