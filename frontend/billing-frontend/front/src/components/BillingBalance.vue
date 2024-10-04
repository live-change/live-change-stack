<template>
  <div>
    <BalanceDisplay ownerType="billing_Billing" :owner="billing.id"
                    :currency="billingSettings.currency" :denomination="billingSettings.denomination"
                    :available="available" />
  </div>
</template>

<script setup>
  import { BalanceDisplay } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject } from 'vue'

  const props = defineProps({
    available: {
      type: Boolean,
      default: true
    },
    user: {
      type: String,
      default: null
    }
  })
  const { available, user } = toRefs(props)

  const billingSettings  = inject('billingSettings', (billing) => ({
    currency: 'usd',
    denomination: 2
  }))

  import { usePath, live, useClient } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()

  const billingPath = computed(() => (
    user.value ? path.billing.userOwnedBilling({ user }) : path.billing.myUserBilling({}))
  ).with(billing => path.balance.ownerOwnedBalance({
      ownerType: 'billing_Billing',
      owner: billing.id
    }).bind('balance'))

  const [ billing ] = await Promise.all([
    live(billingPath)
  ])

  const settings = computed(() => billingSettings( billing ))

</script>

<style scoped>

</style>