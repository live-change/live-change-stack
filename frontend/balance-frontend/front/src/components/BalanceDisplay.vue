<template>
  <CurrencyDisplay
    :value="value"
    :currency="currency"
    :denomination="denomination"
    :i18nConfig="i18nConfig"
    :i18nDefaultConfig="i18nDefaultConfig" />
</template>

<script setup>
  import { defineProps, toRefs, computed, inject } from 'vue'
  import DefaultCurrencyDisplay from './CurrencyDisplay.vue'

  import { injectComponent } from '@live-change/vue3-components'
  const CurrencyDisplay = injectComponent({
    name: 'CurrencyDisplay',
    type: 'currency'
  }, DefaultCurrencyDisplay)

  const props = defineProps({
    ownerType: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    currency: {
      type: String,
      default: null
    },
    denomination: {
      type: Number,
      default: null
    },
    i18nConfig: {
      type: Object,
      default: () => undefined
    },
    i18nDefaultConfig: {
      type: Object,
      default: () => undefined
    },
    available: {
      type: Boolean,
      default: true
    }
  })

  const { ownerType, owner, currency, denomination, i18nConfig, i18nDefaultConfig, available } = toRefs(props)

  import { usePath, live, useClient, useActions, reverseRange, useTimeSynchronization } from '@live-change/vue3-ssr'
  const path = usePath()

  const balancePath = computed(() => path.balance.balance({
    ownerType: ownerType.value,
    owner: owner.value
  }))

  const [balance] = await Promise.all([
    live(balancePath)
  ])

  const value = computed(() => available.value
    ? balance.value?.available ?? 0
    : balance.value?.amount ?? 0
  )

</script>

<style scoped>

</style>