<template>
  <div class="w-full">

  </div>
</template>

<script setup>

  import InputText from "primevue/inputtext"

  import {
    defineProps, defineEmits, defineModel, toRefs, computed, watch, ref, watchEffect, onUnmounted,
    getCurrentInstance, unref
  } from 'vue'

  import { usePath, live, useClient, useActions, reverseRange, useTimeSynchronization } from '@live-change/vue3-ssr'
  const path = usePath()
  const actions = useActions()

  const allBalancesPath = computed(() => path.balanceTest.allBalances({}))

  const [allBalances] = await Promise.all([
    live(allBalancesPath)
  ])

  async function deleteBalance(balance) {
    await actions.balanceTest.deleteBalance({ name: balance.owner })
  }

</script>

<style scoped>

</style>
