<template>
  <AutoComplete v-model="selectedCountry" dropdown optionLabel="name"
                :suggestions="filteredCountries" @complete="searchCountry"
                class="mr-2">
    <template #option="slotProps">
      <div class="flex items-center">
        <img :alt="slotProps.option.name"
             src="../../public/images/flag_placeholder.png"
             :class="`flag flag-${slotProps.option.code.toLowerCase()} mr-2`"
             style="width: 18px; height: 12.27px" />
        <div>{{ slotProps.option.name }}</div>
      </div>
    </template>
  </AutoComplete>
</template>

<script setup>

  import AutoComplete from 'primevue/autocomplete'

  import countries from '../utils/countries.js'

  import { defineProps, defineModel, toRefs, ref, computed, watch } from 'vue'

  const phoneInput = ref()

  const value = defineModel({
    type: String,
    required: true
  })

  const props = defineProps({
    id: {
      type: String,
      required: true
    },
  })

  const selectedCountry = ref()
  watch(value, (newValue) => {
    if(!newValue) return
    const found = countries.find((country) => newValue.startsWith(country.name))
    if(found) selectedCountry.value = found
  })

  const filteredCountries = ref(countries)
  function searchCountry(event) {
    if(!event) return
    const numbers = event.query.replace(/[^\d]/g, '')
    console.log("Search country", event.query, numbers, selectedCountry.value)
    filteredCountries.value = countries.filter((country) =>
      country.name.toLowerCase().startsWith(event.query.toLowerCase())
        || country.code.toLowerCase().startsWith(event.query.toLowerCase())
        || (numbers.length > 0 && country.dial_code.replace(/[^\d]/g, '').startsWith(numbers))
    )
    console.log("Found", filteredCountries.value)
  }

  watch(selectedCountry, (country) => {
    value.value = country?.name || country
  })

  import { usePath, live } from '@live-change/vue3-ssr'
  const path = usePath()
  const geoIpPath = path.geoIp.myCountry({})

  const myCountry = await live(geoIpPath)

  if(selectedCountry.value == null) {
    selectedCountry.value = countries.find(c => c.code.toLowerCase() === myCountry.value.toLowerCase())
  }

</script>


<style scoped lang="scss">
  @use "../utils/flags.scss";
</style>