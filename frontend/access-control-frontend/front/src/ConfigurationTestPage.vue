<template>
  <div class="w-full sm:w-9/12 md:w-8/12 lg:w-6/12 bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
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
