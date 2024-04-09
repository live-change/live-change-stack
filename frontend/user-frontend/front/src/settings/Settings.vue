<template>
  <div class="flex relative lg:static surface-ground" style="height: calc(100vh - 88px)">
    <div id="settings-menu" class="surface-section hidden flex-shrink-0 absolute left-0 h-full
       top-0 z-1 border-right-1 surface-border select-none md:static md:block" style="width:280px">
      <SettingsMenu />
    </div>

    <div class="flex flex-column relative flex-auto">
      <div v-if="viewType === 'simple'" class="p-5 flex flex-column flex-auto align-items-center">
        <router-view></router-view>
      </div>
      <template v-if="viewType === 'wide'">
        <router-view></router-view>
      </template>
    </div>
  </div>
</template>

<script setup>

  import SettingsMenu from "./SettingsMenu.vue"

  import { computed } from 'vue'

  import { useRoute } from 'vue-router'
  const route = useRoute()

  const viewType = computed(() => route.meta.viewType ?? 'simple' )

</script>

<style scoped>

</style>