<template>
  {{ formatted }}
</template>

<script setup>

  import { defineProps, toRefs, computed, inject } from 'vue'

  const props = defineProps({
    value: {
      type: Number,
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
      default: () => {}
    }
  })
  const { value, currency, denomination, i18nConfig, i18nDefaultConfig } = toRefs(props)

  import { n } from 'vue-i18n'

  const currencyConfig = inject('currencyI18nConfig:'+currency, null)
  const defaultConfig = inject('currencyI18nConfig', null)

  const config = computed(() => i18nConfig ?? currencyConfig ?? defaultConfig ?? i18nDefaultConfig)

  const formatted = computed(() => {
    return n(
      value.value / (denomination.value ?? config.value.denomination ?? 100),
      currency.value ?? config.value.currency ?? 'USD',
      config.value
    )
  })

</script>

<style scoped>

</style>