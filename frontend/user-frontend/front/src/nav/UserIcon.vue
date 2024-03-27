<template>
  <a v-ripple
     v-styleclass="{ selector: '@next', enterClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }"
     class="relative shadow-none">
      <span class="flex mx-0 px-3 align-items-center font-medium
         cursor-pointer transition-colors transition-duration-150 border-round">
        <Image v-if="myIdentification?.image" :image="myIdentification.image"
               class="mr-0 border-circle border-1 surface-border" style="width: 3rem; " />
        <img v-else-if="ownerType == 'session_Session'" src="/images/empty-user-photo.svg"
             class="mr-0 border-circle" style="width: 3rem;" />
        <img v-else :src="identiconUrl"
             class="mr-0 border-circle border-1 surface-border" style="width: 3rem;" />
      </span>

  </a>
  <div class="align-items-center flex-grow-1 justify-content-between hidden absolute w-full md:w-auto surface-overlay
       right-0 top-100 z-1 shadow-2">
    <loading-zone suspense>
      <template v-slot:loading>
        <div class="flex align-items-center justify-content-center top-0 left-0 notifications-loading">
          <ProgressSpinner animationDuration=".5s"/>
        </div>
      </template>
      <template v-slot:default="{ isLoading }">
        <working-zone>
          <template v-slot:working>
            <div class="fixed w-full h-full flex align-items-center justify-content-center top-0 left-0">
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
