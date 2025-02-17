<template>
  <div class="w-full sm:w-full md:w-9/12 lg:w-7/12 bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
        Urls
      </div>
    </div>
    <LimitedAccess v-slot="{ authorized }" :objectType="targetType" :object="target" :requiredRoles="requiredRoles">
      <Urls v-if="authorized" :targetType="targetType" :target="target" />
    </LimitedAccess>
  </div>
</template>

<script setup>
  import Urls from "./components/Urls.vue"
  import { useApi, serviceDefinition } from '@live-change/vue3-ssr'
  import { LimitedAccess } from '@live-change/access-control-frontend'

  const api = useApi()
  const requiredRoles = serviceDefinition('url').actions.takeUrl.accessControl.roles

  const { target, targetType } = defineProps({
    target: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true
    }
  })
</script>

<style scoped>

</style>
