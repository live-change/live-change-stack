<template>
  <div v-if="additionalScopes.length > 0" class="w-full flex flex-row justify-content-center">
    <div class="surface-card border-round shadow-2 p-4 w-30rem">
      <div class="text-900 font-medium mb-3 text-xl mb-4">Google API Access</div>
      <div v-if="currentAccess.length > 0">
        <p class="mt-0 p-0 line-height-3">
          You are currently granting us access to the following Google API features:
        </p>
        <ul>
          <li v-for="scope in currentAccess">
            {{ scope.split('/').pop() }}
          </li>
        </ul>
      </div>
      <div>
        <p>
          To use this feature, you need to grant us access to the Google APIs listed below:
        </p>
        <ul>
          <li v-for="scope in additionalScopes" class="font-semibold text-gray-700">
            {{ scope.split('/').pop().toUpperCase() }} API
          </li>
        </ul>
        <p>
          Click the button below to go to the Google page where you can grant access.
        </p>
      </div>
      <router-link
        @click="handleClick"
        :to="{ name: 'user:googleAuthScopes', params: {
          action: 'addOfflineAccessToken',
          accessType: 'offline',
          scopes: allScopes
        } }">
        <Button icon="pi pi-key" label="Google Authentication" />
      </router-link>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>

  import Button from 'primevue/button'

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { computed, toRefs } from 'vue'
  import { usePath, live } from "@live-change/vue3-ssr"

  import { useRoute } from "vue-router"
  const route = useRoute()

  const savedRoute = route.fullPath

  const props = defineProps({
    scopes: {
      type: Array,
      required: true
    },
    saveRoute:{
      type: Boolean,
      default: false
    }
  })
  const { scopes, saveRoute } = toRefs(props)

  const path = usePath()
  const [ offlineAccess ] = await Promise.all([
    live(path.googleAuthentication.myUserOfflineAccess({}))
  ])

  const currentAccess = computed(() => offlineAccess.value?.scopes ?? [])
  const additionalScopes = computed(() => scopes.value.filter(
    scope => !currentAccess.value.includes(scope)
  ))

  const allScopes = computed(() => [...currentAccess.value, ...additionalScopes.value])

  function handleClick() {
    if(saveRoute.value) {
      localStorage.afterGoogleAccessGained = savedRoute
    }
  }

</script>

<style>

</style>
