<template>
  <div class="w-full lg:w-8/12 md:w-11/12">

    <ModelView :service="serviceName" :model="modelName" :id="id" />

  </div>
</template>

<script setup>

  import ModelView from "../components/crud/ModelView.vue"

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
    id: {
      type: String,
      required: true,
    }
  })
  const { serviceName, modelName, id } = toRefs(props)

</script>

<style scoped>

</style>