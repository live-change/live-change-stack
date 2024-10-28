<template>
  <div class="w-full lg:w-6 md:w-9">
    <div class="surface-card border-round shadow-1 p-3">
      <div class="flex flex-row flex-wrap">
        <div class="flex-1">
          <div>
            <div class="text-lg">
              Available Funds:
            </div>
            <div class="text-2xl text-800 font-semibold">
              <BillingBalance />
            </div>
          </div>
          <div v-if="availableDifferent">
            <span class="text-xs">
              All funds:
            </span>
            <span class="text-sm" >
              <BillingBalance :available="false" />
            </span>
          </div>
        </div>
        <div class="flex-1">
          <div v-for="offer of billingClientConfig.topUpOffers" :key="'offer'+JSON.stringify(offer)">
            <router-link :to="{ name: 'billing:topUp', params: {
                                  value: offer.value, price: offer.price, currency: offer.currency
                              } }"
                         class="flex flex-row no-underline hover:underline">
              <span class="mr-1">Add</span>
              <CurrencyDisplay class="font-semibold"
                :value="offer.value" :currency="settings.currency" :denomination="settings.denomination" />
              <span class="mx-1">for</span>
              <CurrencyDisplay class="font-medium"
                :value="offer.price" :currency="offer.currency" :denomination="offer.denomination" />
            </router-link>
          </div>
<!--          <div v-if="billingClientConfig.anyTopUpPrices?.length">
            {{billingClientConfig.anyTopUpPrices}}
              TODO: currency input
          </div>-->

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import BillingBalance from '../components/BillingBalance.vue'

  import { CurrencyDisplay } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject } from 'vue'

  const props = defineProps({
    user: {
      type: String,
      default: null
    }
  })
  const { user } = toRefs(props)

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
    (user.value ? path.billing.userOwnedBilling({ user }) : path.billing.myUserBilling({}))
      .with(billing => path.balance.ownerOwnedBalance({
        ownerType: 'billing_Billing',
        owner: billing.id
      }).bind('balance'))
  )

  const [ billing ] = await Promise.all([
    live(billingPath)
  ])

  const availableDifferent = computed(() => billing.value?.balance?.available !== billing.value?.balance?.all)

  const settings = computed(() => billingSettings( billing ))
</script>

<style scoped>

</style>