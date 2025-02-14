<template>
  <div class="w-full">
    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 text-xl mb-1">
      All balances:
    </div>
    <div v-for="balance in allBalances" class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border flex flex-row items-center mt-1">
      <div class="flex-1 flex-grow pl-4">
        {{ balance.owner }}
      </div>
      <div class="w-40">
        Amount: {{ balance.amount }}
      </div>
      <div class="w-40">
        Available: {{ balance.available }}
      </div>
      <div>
        <router-link :to="{ name: 'balance', params: { name: balance.owner }}" class="no-underline">
          <Button label="Open" icon="pi pi-star" />
        </router-link>
        <Button @click="() => deleteBalance(balance)" label="Delete" icon="pi pi-trash" severity="danger" />
      </div>
    </div>
    <div v-if="allBalances.length === 0" class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 flex flex-row">
      No balances found
    </div>
    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 mt-4">
      <div class="text-xl mb-2">Add balance</div>
      <command-form service="balanceTest" action="createBalance" v-slot="{ data }" reset-on-done>
        <div class="col-span-12 md:col-span-6 py-1">
          <div class="p-field mb-4">
            <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
              Name
            </label>
            <InputText id="name" type="text" class="w-full"
                       aria-describedby="name-help" :class="{ 'p-invalid': data.nameError }"
                       v-model="data.name" />
            <small v-if="data.nameError" id="name-help" class="p-error">{{ t(`errors.${data.nameError}`) }}</small>
          </div>
        </div>
        <Button label="Add balance" icon="pi pi-plus" type="submit" />
      </command-form>
    </div>
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

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

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
