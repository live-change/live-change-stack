<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl mb-6">Signed In</div>
      <p class="mt-0 p-0 leading-normal">
        Congratulations! You added offline access to your account. Now your account have access to:
        <ul>
          <li v-for="access in accessList">
            {{ access }}
          </li>
        </ul>
<!--        <pre>{{ offlineAccess }}</pre>-->
      </p>
      <div v-if="afterGoogleAccessGained" class="flex flex-row items-center">
        <router-link :to="afterGoogleAccessGained" class="no-underline">
          <Button label="Next" v-ripple />
        </router-link>
        <p class="ml-6" v-if="isMounted && redirectTime">
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

  import { computed } from 'vue'
  import { currentTime } from "@live-change/frontend-base"

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { usePath, live } from "@live-change/vue3-ssr"

  import pluralize from 'pluralize'

  const afterGoogleAccessGained = computed( () => isMounted.value && localStorage.afterGoogleAccessGained )
  let redirectTime
  onMounted(() => {
    redirectTime = new Date(Date.now() + 10 * 1000)
    setTimeout(() => {
      if (afterGoogleAccessGained.value) {
        localStorage.removeItem('afterGoogleAccessGained')
        router.push(afterGoogleAccessGained.value)
      }
    }, redirectTime - Date.now())
  })

  const path = usePath()
  const [ offlineAccess ] = await Promise.all([
    live(path.googleAuthentication.myUserOfflineAccess({}))
  ])

  const accessList = computed(() => offlineAccess.value.scopes.map(
    scope => scope.split('/').pop()
  ))
</script>

<style>

</style>
