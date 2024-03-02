<template>
  <a v-ripple
     @click="showUserMenu"
     class="static w-auto w-full surface-overlay left-0 top-100 z-1 shadow-none p-ripple">
    <ul class="list-none p-0 m-0 flex align-items-center select-none flex-row border-top-none">
      <li class="border-top-none">
        <span class="flex p-0 px-3 align-items-center hover:surface-100 font-medium border-round
           cursor-pointer transition-colors transition-duration-150 p-ripple">
          <Image v-if="myIdentification?.image" :image="myIdentification.image"
                 class="mr-0 border-circle border-1 surface-border" style="width: 38px; height: 38px" />
          <img v-else-if="ownerType == 'session_Session'" src="/images/empty-user-photo.svg"
               class="mr-0 border-circle" style="width: 38px; height: 38px" />
          <img v-else :src="identiconUrl"
               class="mr-0 border-circle border-1 surface-border" style="width: 38px; height: 38px" />
        </span>
      </li>
    </ul>
  </a>
  <OverlayPanel v-if="isMounted" ref="overlayPanel" class="notifications-panel">
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
  </OverlayPanel>
</template>

<script setup>
  import { Image } from "@live-change/image-frontend"
  import OverlayPanel from 'primevue/overlaypanel'
  import ProgressSpinner from "primevue/progressspinner"
  import UserMenu from "./UserMenu.vue"

  import { ref, computed, onMounted } from 'vue'
  const overlayPanel = ref()

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  function showUserMenu(event) {
    overlayPanel.value.toggle(event)
  }

  import { path, live, actions } from '@live-change/vue3-ssr'
  import { client as useClient } from '@live-change/vue3-ssr'
  import { toRefs } from '@vueuse/core'

  const client = useClient()

  const ownerData = computed(
    () => client.value.user
      ? ['user_User', client.value.user]
      : ['session_Session', client.value.session]
  )

  const [ownerType, owner] = toRefs(ownerData)

  const identiconUrl = computed( () => `/api/identicon/jdenticon/${ownerType.value}:${owner.value}/28.svg` )

  const [ myIdentification ] = await Promise.all([
    live(path().userIdentification.myIdentification())
  ])

</script>

<style>

</style>
