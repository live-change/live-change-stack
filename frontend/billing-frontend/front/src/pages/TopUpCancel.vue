<template>
  <div class="w-full flex flex-col items-center">
    <div v-if="topUp" class="w-full lg:w-6 md:w-9 surface-card border-round shadow-1 p-3
                             flex flex-column align-items-center text-center">
      <div class="text-2xl font-semibold my-2">
        {{ t('billing.canceledTopUp') }}
        <CurrencyDisplay :value="topUp.value"
                         :currency="settings.currency" :denomination="settings.denomination" />
        for
        <CurrencyDisplay :value="topUp?.price" :currency="topUp.currency" :denomination="priceDenomination" />
      </div>

      <div class="mt-6 text-lg">
        {{ t('billing.topUpCanceled') }}
      </div>

      <div class="mt-4">{{ t('billing.currentBalance') }} <BillingBalance /></div>

      <div class="flex flex-row justify-center items-center mt-6 mb-1 flex-wrap">
        <router-link :to="{ name: 'billing:topUp', params: {
                                  value: topUp.value, price: topUp.price, currency: topUp.currency
                              } }" class="mx-2">
          <Button :label="t('billing.retryTopUp')" icon="pi pi-wallet" severity="primary" />
        </router-link>
        <router-link :to="{ name: 'billing:billing' }" class="mx-2">
          <Button :label="t('billing.backToBilling')" icon="pi pi-wallet" severity="secondary" />
        </router-link>
      </div>

      <Divider align="center" class="mt-6 mb-2">
        <span class="text-surface-600 dark:text-surface-200 font-normal text-sm">{{ t('common.or') }}</span>
      </Divider>

      <div v-for="offer of billingClientConfig.topUpOffers" :key="'offer'+JSON.stringify(offer)">
        <router-link :to="{ name: 'billing:topUp', params: {
                                  value: offer.value, price: offer.price, currency: offer.currency
                              } }"
                     class="flex flex-row no-underline hover:underline my-1">
          <span class="mr-1">{{ t('billing.add') }}</span>
          <CurrencyDisplay class="font-semibold"
                           :value="offer.value" :currency="settings.currency" :denomination="settings.denomination" />
          <span class="mx-1">{{ t('billing.for') }}</span>
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
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

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