<template>
  <div>
    <div v-if="selectedTopUp">
      <h1>{{ offer }}</h1>
      <h2>{{ anyTopUpPrice }}</h2>
      <pre>{{ billingClientConfig.topUpOffers }}</pre>
    </div>
    <NotFound v-else />
  </div>
</template>

<script setup>
  import { CurrencyDisplay } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject } from 'vue'

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

  onMounted(() => {
    const topUp = selectedTopUp.value
    workingZone.addPromise('topUp', async () => {
      await startTopUp(topUp)
    })
  })

</script>

<style scoped>

</style>