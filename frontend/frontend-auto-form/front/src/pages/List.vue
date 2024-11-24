<template>
  <div class="w-full lg:w-8 md:w-11">
    <div class="surface-card p-3 shadow-1 border-round">
      List
    </div>
  </div>
</template>

<script setup>

  import { ref, computed, onMounted, defineProps, toRefs } from 'vue'

  const props = defineProps({
    serviceName: {
      type: String,
      required: true,
    },
    modelName: {
      type: String,
      required: true,
    },
    identifiers: {
      type: Array,
      default: []
    }
  })
  const { serviceName } = toRefs(props)

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()




</script>

<style scoped>

</style>