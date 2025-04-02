<template>
  <a v-ripple
     v-styleclass="{ selector: '@next', enterFromClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }"
     class="relative shadow-none b shrink-0">
      <span class="flex mx-0 px-3 align-items-center font-medium justify-content-center
         cursor-pointer transition-colors transition-duration-150 border-round">
        <Image v-if="myIdentification?.image" :image="myIdentification.image" width="56" height="56"
               class="mr-0 rounded-full border-1 border-surface-400 dark:border-surface-600 object-cover w-12 max-w-none" />
        <img v-else-if="ownerData[0] === 'session_Session'" src="/images/empty-user-photo.svg" width="56" height="56"
             class="mr-0 rounded-full border-1 border-surface-400 dark:border-surface-600 w-12 max-w-none" />
        <img v-else :src="identiconUrl" width="56" height="56"
             class="mr-0 rounded-full border-1 border-surface-400 dark:border-surface-600 w-12 max-w-none" />
      </span>
  </a>
  <div class="align-items-center flex-grow-1 justify-content-between hidden absolute w-full md:w-auto
              bg-surface-0 dark:bg-surface-950 dark:border-1 dark:border-surface-800
              right-0 top-full z-5 shadow">
    <loading-zone suspense>
      <template v-slot:loading>
        <div class="flex items-center justify-center top-0 left-0 notifications-loading">
          <ProgressSpinner animationDuration=".5s"/>
        </div>
      </template>
      <template v-slot:default="{ isLoading }">
        <working-zone>
          <template v-slot:working>
            <div class="fixed w-full h-full flex items-center justify-center top-0 left-0">
              <ProgressSpinner animationDuration=".5s"/>
            </div>
          </template>
          <template v-slot:default="{ isWorking }">
            <div :style="(isWorking || isLoading) ? 'filter: blur(4px)' : ''" class="working-blur">
              <UserMenu />
            </div>
          </template>
        </working-zone>
      </template>
    </loading-zone>
  </div>
</template>

<script setup>
  import { Image } from "@live-change/image-frontend"
  import ProgressSpinner from "primevue/progressspinner"
  import UserMenu from "./UserMenu.vue"

  import { ref, computed, onMounted, toRefs } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { usePath, live, useClient } from '@live-change/vue3-ssr'

  const client = useClient()

  const ownerData = computed(
    () => client.value.user
      ? ['user_User', client.value.user]
      : ['session_Session', client.value.session]
  )

  const identiconUrl = computed(
    () => `/api/identicon/jdenticon/${ownerData.value[0]}:${ownerData.value[1]}/28.svg`
  )

  const path = usePath()

  const [ myIdentification ] = await Promise.all([
    live(path.userIdentification.myIdentification())
  ])

</script>

<style>

</style>
