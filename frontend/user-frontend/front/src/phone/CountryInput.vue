<template>
  <div class="country-input relative inline-flex w-full items-center mr-2">
    <img
      v-if="selectedCountry?.code"
      :alt="selectedCountry.name"
      src="../../public/images/flag_placeholder.png"
      :class="`flag flag-${selectedCountry.code.toLowerCase()} country-input-flag`"
    />
    <AutoComplete
      v-model="selectedCountry"
      dropdown
      optionLabel="name"
      :suggestions="filteredCountries"
      :class="['w-full', { 'country-input-with-flag': !!selectedCountry?.code }]"
      @complete="searchCountry"
    >
      <template #option="slotProps">
        <div class="flex items-center">
          <img
            :alt="slotProps.option.name"
            src="../../public/images/flag_placeholder.png"
            :class="`flag flag-${slotProps.option.code.toLowerCase()} mr-2`"
            style="width: 18px; height: 12.27px"
          />
          <div>{{ slotProps.option.name }}</div>
        </div>
      </template>
    </AutoComplete>
  </div>
</template>

<script setup>

  import AutoComplete from 'primevue/autocomplete'

  import countries from '../utils/countries.js'

  import { defineProps, defineModel, ref, computed, watch } from 'vue'
  import { usePath, live } from '@live-change/vue3-ssr'

  const value = defineModel({
    type: String,
    required: true
  })

  const props = defineProps({
    id: {
      type: String,
      required: true
    },
    countries: {
      type: Array,
      default: null
    },
  })

  const availableCountries = computed(() => {
    if (!props.countries || props.countries.length === 0) {
      return countries
    }
    const allowedCodes = props.countries.map(code => code.toUpperCase())
    return countries.filter((country) =>
      allowedCodes.includes(country.code.toUpperCase())
    )
  })

  const selectedCountry = ref()

  function syncFromModel(code) {
    if (!code) {
      selectedCountry.value = null
      return
    }
    const found = availableCountries.value.find(
      (country) => code.toLowerCase() === country.code.toLowerCase()
    )
    if (found && selectedCountry.value?.code !== found.code) {
      selectedCountry.value = found
    }
  }

  watch(value, syncFromModel, { immediate: true })

  watch(selectedCountry, (country) => {
    const next = country ? country.code.toLowerCase() : null
    if (value.value !== next) value.value = next
  })

  const filteredCountries = ref(availableCountries.value)
  function searchCountry(event) {
    if (!event) return
    const numbers = event.query.replace(/[^\d]/g, '')
    filteredCountries.value = availableCountries.value.filter((country) =>
      country.name.toLowerCase().startsWith(event.query.toLowerCase())
        || country.code.toLowerCase().startsWith(event.query.toLowerCase())
        || (numbers.length > 0 && country.dial_code.replace(/[^\d]/g, '').startsWith(numbers))
    )
  }

  const path = usePath()
  const geoIpPath = path.geoIp.myCountry({})
  const myCountry = await live(geoIpPath)

  if (!value.value && !selectedCountry.value && myCountry.value) {
    selectedCountry.value = availableCountries.value.find(
      c => c.code.toLowerCase() === myCountry.value.toLowerCase()
    )
  }

  watch(() => props.countries, () => {
    filteredCountries.value = availableCountries.value
    syncFromModel(value.value)
  }, { deep: true })

</script>


<style scoped lang="scss">
  @use "../utils/flags.scss";

  .country-input-flag {
    position: absolute;
    left: 0.75rem;
    z-index: 1;
    width: 18px;
    height: 12.27px;
    pointer-events: none;
  }

  :deep(.country-input-with-flag .p-inputtext) {
    padding-left: 2.25rem;
  }
</style>
