<template>
  <div class="w-full">
    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl mb-4">Google Api Access</div>
      <p class="mt-0 p-0 line-height-3">
        Your current access:
      </p>
      <ul>
        <li v-for="scope in currentAccess">
          {{ scope.split('/').pop() }}
        </li>
      </ul>
      <p>
        We need access to additional scopes:
      </p>
      <ul>
        <li v-for="scope in additionalScopes">
          {{ scope.split('/').pop() }}
        </li>
      </ul>
      <p>
        Please click the button below to grant access.
      </p>
      <router-link
        :to="{ name: 'user:googleAuthScopes', params: {
          action: 'addOfflineAccessToken',
          accessType: 'offline',
          scopes: allScopes
        } }">
        <Button icon="pi pi-key" label="Google Authentication" />
      </router-link>
    </div>

  </div>
</template>

<script setup>

  import Button from 'primevue/button'

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { computed, toRefs } from 'vue'
  import { usePath, live } from "@live-change/vue3-ssr"

  const props = defineProps({
    scopes: {
      type: Array,
      required: true
    }
  })
  const { scopes } = toRefs(props)

  const path = usePath()
  const [ offlineAccess ] = await Promise.all([
    live(path.googleAuthentication.myUserOfflineAccess({}))
  ])

  const currentAccess = computed(() => offlineAccess.value.scopes)
  const additionalScopes = computed(() => scopes.value.filter(
    scope => !currentAccess.value.includes(scope)
  ))

  const allScopes = computed(() => [...currentAccess.value, ...additionalScopes.value])

</script>

<style>

</style>
