<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl mb-4">Sign Out</div>
      <p class="mt-0 p-0 line-height-3">Signing out</p>
      <ProgressSpinner v-if="isMounted" class="m-3" />
    </div>
  </div>
</template>

<script setup>
  import ProgressSpinner from "primevue/progressspinner"

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { actions, useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  import { inject } from 'vue'
  import { useRouter } from 'vue-router'
  const router = useRouter()

  const workingZone = inject('workingZone')

  const { signOut } = actions().user

  if(typeof window != 'undefined') {
    workingZone.addPromise('signOut', (async () => {
      await signOut({})
      while(api.client.value.user) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      router.push({ name: 'user:signOutFinished' })
    })())
  }
</script>

<style>

</style>
