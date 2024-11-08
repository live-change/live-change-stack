<template>
  <div>
    <h1>
      {{ topUpId }}
    </h1>
    <pre>
      {{ topUp }}
    </pre>
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

</script>

<style scoped>

</style>