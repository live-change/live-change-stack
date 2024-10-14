<template>
  {{ formatted }}
</template>

<script setup>

  import { defineProps, toRefs, computed, inject } from 'vue'

  const props = defineProps({
    value: {
      required: true
    },
    currency: {
      type: String,
      default: null
    },
    denomination: {
      type: String,
      default: null
    },
    i18nConfig: {
      type: Object,
      default: undefined
    },
    i18nDefaultConfig: {
      type: Object,
      default: () => ({ maximumFractionDigits: 2, notation: 'standard' })
    }
  })
  const { value, currency, denomination, i18nConfig, i18nDefaultConfig } = toRefs(props)

  import { useI18n } from 'vue-i18n'
  const { n } = useI18n()

  const currencyConfig = inject('currencyI18nConfig:'+currency, null)
  const defaultConfig = inject('currencyI18nConfig', null)

  const config = computed(() => i18nConfig ?? currencyConfig ?? defaultConfig ?? i18nDefaultConfig)

  const formatted = computed(() => {
    console.log('CurrencyDisplay', value.value, denomination.value, +value.value / +(denomination.value || config.value.denomination || 100))
    const text = n(
      +value.value / +(denomination.value || config.value.denomination || 100),
      currency.value ?? config.value.currency ?? 'usd',
      config.value
    )
    console.log("currency formatted", text)
    return text
  })

</script>

<style scoped>

</style>