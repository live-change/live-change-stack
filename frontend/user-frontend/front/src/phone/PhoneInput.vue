<template>
  <div class="flex flex-row align-items-center">
    <AutoComplete v-model="selectedCountry" dropdown optionLabel="dial_code" placeholder="+XX"
                  :suggestions="filteredCountries" @complete="searchCountry"
                  class="mr-2 w-14rem">
      <template #option="slotProps">
        <div class="flex align-items-center">
          <img :alt="slotProps.option.name"
               src="../../public/images/flag_placeholder.png"
               :class="`flag flag-${slotProps.option.code.toLowerCase()} mr-2`"
               style="width: 18px; height: 12.27px" />
          <div>{{ slotProps.option.name }}</div>
        </div>
      </template>
    </AutoComplete>
    <InputText v-model="rest" :disabled="!selectedCountry" class="w-full"
               pattern="[0-9 ]*" inputmode="numeric" ref="phoneInput"
               @keyup="e => e.target.value = e.target.value.replace(/[^0-9 ]/g, '')"/>
  </div>
</template>

<script setup>

  import AutoComplete from 'primevue/autocomplete'
  import InputText from 'primevue/inputtext'

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
    if(newValue.startsWith('+')) newValue = newValue.slice(1)
    const found = countries.find((country) => newValue.startsWith(country.dial_code))
    if(found) {
      selectedCountry.value = found
      if(phoneInput.value?.$el) {
        const el = phoneInput.value.$el
        //console.log("PHONE INPUT", el)
        setTimeout(() => {
          el.focus()
        }, 100)
      }
    }
  })
  watch(selectedCountry, (country, oldCountry) => {
    let full = value.value
    if(oldCountry && oldCountry !== country) {
      const oldCode = typeof oldCountry === 'object' ? oldCountry.dial_code.slice(1) : oldCountry.replace(/[^\d]/g, '')
      if(full.startsWith(oldCode)) {
        full = full.slice(oldCode.length)
      }
    }
    if(!country) return value.value = full
    const code = typeof country === 'object' ? country.dial_code.slice(1) : country.replace(/[^\d]/g, '')
    full = code + full.replace(/[^\d ]/g, '')
    value.value = full
  })


  const rest = computed({
    get: () => {
      const country = selectedCountry.value
      if(country) {
        const code = typeof country === 'object' ? country.dial_code.slice(1) : country.replace(/[^\d]/g, '')
        if(value.value.startsWith(code)) {
          return value.value.slice(code.length)
        } else {
          return value.value
        }
      } else {
        return value.value
      }
    },
    set: (rest) => {
      const country = selectedCountry.value
      if(country) {
        const code = typeof country === 'object' ? country.dial_code.slice(1) : country.replace(/[^\d]/g, '')
        value.value = code + rest.replace(/[^\d ]/g, '')
      } else {
        value.value = rest.replace(/[^\d ]/g, '')
      }
    }
  })

  const filteredCountries = ref(countries)

  function searchCountry(event) {
    const numbers = event.query.replace(/[^\d]/g, '')
    console.log("Search country", event.query, numbers, selectedCountry.value)
    if(selectedCountry.value !== null && typeof selectedCountry.value === 'object') selectedCountry.value = null
    filteredCountries.value = countries.filter((country) =>
      country.name.toLowerCase().startsWith(event.query.toLowerCase())
        || country.code.toLowerCase().startsWith(event.query.toLowerCase())
        || (numbers.length > 0 && country.dial_code.replace(/[^\d]/g, '').startsWith(numbers))
    )
    console.log("Found", filteredCountries.value)
  }

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