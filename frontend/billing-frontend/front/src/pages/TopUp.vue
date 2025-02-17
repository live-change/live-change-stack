<template>
  <div class="w-full flex flex-col items-center">
    <div v-if="selectedTopUp" class="w-full lg:w-6 md:w-9 surface-card border-round shadow-1 p-3
                             flex flex-column align-items-center text-center">
      <div class="text-2xl font-semibold my-2">
        Top-up
        <CurrencyDisplay :value="selectedTopUp.value"
                         :currency="settings.currency" :denomination="settings.denomination" />
        for
        <CurrencyDisplay :value="selectedTopUp?.price" :currency="selectedTopUp.currency"
                         :denomination="priceDenomination" />
      </div>

      <div class="relative mt-6">
        <ProgressSpinner style="width: 400px; height: 400px; max-width: 90vw; max-height: 70vh" strokeWidth="1"
                         animationDuration="1s" aria-label="Connecting to payment gateway" />
        <div class="absolute w-full h-full top-0 left-0 flex items-center justify-center">
          <div class="text-lg w-40 text-center">
            Connecting to payment gateway...
          </div>
        </div>
      </div>


<!--
      <h1>{{ offer }}</h1>
      <h2>{{ anyTopUpPrice }}</h2>
      <pre>{{ billingClientConfig.topUpOffers }}</pre>-->
    </div>
    <NotFound v-else />
  </div>
</template>

<script setup>
  import ProgressSpinner from "primevue/progressspinner"

  import { CurrencyDisplay } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject, onMounted } from 'vue'

  import { NotFound } from '@live-change/url-frontend'

  import { startTopUp } from '../logic/topUp.js'

  const props = defineProps({
    value: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true
    }
  })
  const { value, price, currency } = toRefs(props)

  import { usePath, live, useClient, useApi } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()
  const api = useApi()

  const billingClientConfig = api.getServiceDefinition('billing')?.clientConfig

  const offer = computed(() => billingClientConfig?.topUpOffers
    ?.find(offer =>
      (offer.currency === currency.value) && (offer.price === +price.value) && (offer.value === +value.value)
    ))

  const anyTopUpPrice = computed(() => billingClientConfig?.anyTopUpPrices
    ?.find(price => price.currency === currency.value))

  const selectedTopUp = computed(() => offer.value || anyTopUpPrice.value)

  const workingZone = inject('workingZone')

  const billingPath = computed(() =>
    (path.billing.myUserBilling({}))
      .with(billing => path.balance.balance({
        ownerType: 'billing_Billing',
        owner: billing.id
      }).bind('balance'))
  )

  const [ billing ] = await Promise.all([
    live(billingPath)
  ])

  const billingSettings = inject('billingSettings', (billing) => ({
    currency: billingClientConfig?.currency ?? 'usd',
    denomination: billingClientConfig?.denomination ?? 100
  }))
  const settings = computed(() => billingSettings( billing ))

  const priceDenomination = computed(() =>
    billingClientConfig?.currencyDenomination[selectedTopUp.value?.currency]
    ?? billingClientConfig?.currencyDenomination.default
  )

  onMounted(() => {
    if(!selectedTopUp.value) return
    const topUp = selectedTopUp.value
    workingZone.addPromise('topUp', (async () => {
      const topUpResult = await startTopUp(topUp)
      console.log("TopUp", topUpResult)
      window.location.href = topUpResult.redirectUrl
    })())
  })

</script>

<style scoped>

</style>