<template>
  <div class="w-full" style="max-width: 800px">
    <div class="surface-card border-round shadow-1 p-3">
      <div class="flex flex-row flex-wrap align-items-center">
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

    <div class="mt-2">
      <OperationsList ownerType="billing_Billing" :owner="billing.to ?? billing.id"
                      :currency="settings.currency" />
    </div>
  </div>
</template>

<script setup>
  import BillingBalance from '../components/BillingBalance.vue'

  import { CurrencyDisplay, OperationsList } from '@live-change/balance-frontend'

  import { defineProps, toRefs, computed, inject, provide, h } from 'vue'
  import { provideComponent } from '@live-change/vue3-components'

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

  provide('currencyI18nConfig:'+settings.value.currency, {
    ...inject('currencyI18nConfig:'+settings.value.currency, {}),
    currency: settings.value.currency,
    denomination: settings.value.denomination
  })

  provideComponent({
    name: 'balanceOperationCause',
    causeType: 'billing_TopUp'
  }, (props) => h('span', { class: 'font-semibold' }, 'Account top-up'))
</script>

<style scoped>

</style>