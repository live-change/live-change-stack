<template>
  <div>
    <h1>
      {{ topUpId }}
    </h1>
    <pre>
      {{ billing }}
    </pre>
  </div>
</template>

<script setup>
  import { defineProps, toRefs, computed } from 'vue'

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
      .with(billing => path.balance.ownerOwnedBalance({
        ownerType: 'billing_Billing',
        owner: billing.id
      }).bind('balance'))
      .with(billing => path.billing.billingOwnedTopUps({
        billing: billing.id,
        gte: topUpId.value,
        lte: topUpId.value
      }).bind('topUps'))
  )

  const [ billing ] = await Promise.all([
    live(billingPath)
  ])

</script>

<style scoped>

</style>