<template>
  <ModelList :service="serviceName" :model="modelName" class="w-full lg:w-8 md:w-11" />
</template>

<script setup>
  import ModelList from "../components/crud/ModelList.vue"

  import { ref, computed, onMounted, defineProps, toRefs } from 'vue'

  const props = defineProps({
    serviceName: {
      type: String,
      required: true,
    },
    modelName: {
      type: String,
      required: true,
    }
  })
  const { serviceName, modelName } = toRefs(props)

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

</script>

<style scoped>

</style>