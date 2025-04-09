<template>
    <div>
        Object picker!
    </div>
</template>

<script setup>
  import { defineProps, defineEmits, toRefs, ref, defineModel } from 'vue'

  const props = defineProps({
    definition: {
      type: Object
    },
    properties: {
      type: Object,
      default: () => ({})
    }
  })

  const model = defineModel({
    required: true
  })

  const { definition, properties } = toRefs(props)

  function matchingObjectsPath() {
    
  }

</script>

<style scoped>
</style>