<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl mb-4">Signed In</div>
      <p class="mt-0 p-0 line-height-3">Congratulations! You have successfully logged in to your account.</p>
      <div v-if="afterSignIn" class="flex flex-row justify-content-center align-items-center">
        <router-link :to="JSON.parse(afterSignIn)" class="no-underline">
          <Button label="Next" v-ripple />
        </router-link>
        <p class="ml-4" v-if="isMounted && redirectTime">
          Redirect in {{ pluralize('second', Math.ceil((redirectTime - currentTime) / 1000), true) }}...
        </p>
      </div>
      <div v-else>
        Return to <router-link to="/">index page</router-link>.
      </div>
    </div>
  </div>
</template>

<script setup>

  import Button from 'primevue/button'

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { computed, onUnmounted } from 'vue'
  import { currentTime } from "@live-change/frontend-base"

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import pluralize from 'pluralize'

  const afterSignIn = computed( () => isMounted.value && localStorage.redirectAfterSignIn )
  const redirectTime = ref()
  let timeout
  onMounted(() => {
    redirectTime.value = new Date(Date.now() + 10 * 1000)
    timeout = setTimeout(() => {
      if (afterSignIn.value) {
        localStorage.removeItem('redirectAfterSignIn')
        router.push(JSON.parse(afterSignIn.value))
      }
    }, redirectTime.value - currentTime.value)
  })
  onUnmounted(() => {
    clearTimeout(timeout)
  })

</script>

<style>

</style>
