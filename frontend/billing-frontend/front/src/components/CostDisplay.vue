<template>
  <div>
    <span class="mr-1">Cost:</span>
    <span :class="{
      'text-red-500': cost > available
    }">
      <CurrencyDisplay
        :value="cost"
        :currency="settings.currency"
        :denomination="settings.denomination" />
    </span>
    <span v-if="cost > available" class="text-red-500 text-sm"> (Insufficient funds)</span>
  </div>
</template>

<script setup>
  import { CurrencyDisplay } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject } from 'vue'

  const props = defineProps({
    cost: {
      type: Number,
      required: true
    }
  })
  const { cost } = toRefs(props)

  import { usePath, live, useClient, useApi } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()
  const api = useApi()

  const billingClientConfig = api.getServiceDefinition('billing')?.clientConfig

  const billingSettings  = inject('billingSettings', (billing) => ({
    currency: billingClientConfig?.currency ?? 'usd',
    denomination: billingClientConfig?.denomination ?? 100
  }))

  const billingPath = computed(() =>
    path.billing.myUserBilling({})
      .with(billing => path.balance.balance({
        ownerType: 'billing_Billing',
        owner: billing.id
      }).bind('balance'))
  )

  const [ billing ] = await Promise.all([
    live(billingPath)
  ])

  const settings = computed(() => billingSettings( billing ))

  const balance = computed(() => billing.value?.balance)
  const available = computed(() => balance.value?.available || 0)

</script>

<style scoped>

</style>