<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl mb-6">Sign Out</div>
      <p class="mt-0 p-0 leading-normal">Signing out</p>
      <ProgressSpinner v-if="isMounted" class="m-4" />
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
      console.log("ROUTER", router)
      router.push({ name: 'user:signOutFinished' })
    })())
  }
</script>

<style>

</style>
