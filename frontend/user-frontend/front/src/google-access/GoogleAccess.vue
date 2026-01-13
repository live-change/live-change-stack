<template>
  <div v-if="additionalScopes.length > 0" class="w-full flex flex-row justify-center">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6 w-[30rem]">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl mb-6">{{ t('googleAccess.title') }}</div>
      <div v-if="currentAccess.length > 0">
        <p class="mt-0 p-0 leading-normal">
          {{ t('googleAccess.currentAccess') }}
        </p>
        <ul>
          <li v-for="scope in currentAccess">
            {{ scope.split('/').pop() }}
          </li>
        </ul>
      </div>
      <div>
        <p>
          {{ t('googleAccess.needAccess') }}
        </p>
        <ul>
          <li v-for="scope in additionalScopes" class="font-semibold text-gray-700">
            {{ scope.split('/').pop().toUpperCase() }} API
          </li>
        </ul>
        <p>
          {{ t('googleAccess.clickButton') }}
        </p>
      </div>
      <router-link
        @click="handleClick"
        :to="{ name: 'user:googleAuthScopes', params: {
          action: 'addOfflineAccessToken',
          accessType: 'offline',
          scopes: allScopes
        } }">
        <Button icon="pi pi-key" :label="t('googleAccess.authenticationButton')" />
      </router-link>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>

  import Button from 'primevue/button'

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { computed, toRefs } from 'vue'
  import { usePath, live } from "@live-change/vue3-ssr"

  import { useRoute } from "vue-router"
  const route = useRoute()

  const savedRoute = {
    name: route.name,
    params: route.params,
    query: route.query,
    hash: route.hash
  }

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
      localStorage.afterGoogleAccessGained = JSON.stringify(savedRoute)
    }
  }

</script>

<style>

</style>
