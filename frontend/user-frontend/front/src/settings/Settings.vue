<template>
  <div class="flex relative lg:static bg-surface-50 dark:bg-surface-950" 
       style="min-height: calc(100vh - 88px)">
    <div id="settings-menu" 
         class="bg-surface-0 dark:bg-surface-950 flex-shrink-0 absolute left-0 h-full
                top-0 z-1 border-r-1 border-r-surface-300 dark:border-r-surface-700 select-none
                hidden md:static md:block"
        style="width:280px">
      <SettingsMenu />
    </div>

    <div class="flex flex-col relative flex-auto">
      <div v-if="viewType === 'simple'" class="p-8 flex flex-col flex-auto items-center">
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