<template>
   <h1>{{ offer}}</h1>
  <h2>{{ anyTopUpPrice }}</h2>
  <pre>{{ billingClientConfig.topUpOffers }}</pre>
</template>

<script setup>
  import { CurrencyDisplay } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject } from 'vue'

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


</script>

<style scoped>

</style>