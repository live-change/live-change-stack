<template>
  <div class="w-full sm:w-9 md:w-8 lg:w-6 surface-card p-4 shadow-2 border-round">
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">
        Access Control
      </div>
    </div>

    <AccessControl :objectType="objectType" :object="object" />
  </div>
</template>

<script>

  import AccessControl from "./configuration/AccessControl.vue"

  const {
    object, objectType
  } = defineProps({
    object: {
      type: String,
      default: 'example_Example'
    },
    objectType: {
      type: String,
      default: 'one'
    }
  })

</script>

<style scoped>

</style>
