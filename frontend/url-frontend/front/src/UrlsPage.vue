<template>
  <div class="w-full sm:w-12 md:w-9 lg:w-7 surface-card p-4 shadow-2 border-round">
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">
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
