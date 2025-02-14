<template>
  <div class="w-full">
    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 mb-1">
      <div class="text-xl">Balance: {{ balance.owner }}</div>
      <div>
        Amount:
        <BalanceDisplay :available="false" ownerType="balanceTest_balance" :owner="name" />
      </div>
      <div>
        Available:
        <BalanceDisplay :available="true" ownerType="balanceTest_balance" :owner="name" />
      </div>
    </div>
    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 text-xl mb-1 mt-2 text-xl">
      Operations:
    </div>
    <div v-if="startedOperations.length === 0" class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 mb-1">
      No operations started
    </div>
    <div v-for="operation of startedOperations"
         class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border mb-1 flex flex-row items-center">
      <div class="flex-1 flex-grow pl-4">
        {{ operation.cause }}
      </div>
      <div class="w-60 text-right pl-4 font-semibold mr-4">
        {{ operation.createdAt }}
      </div>
      <div class="w-40 text-right pl-4 font-semibold mr-4"
           :class="operation.change > 0 ? 'text-green-500' : 'text-red-500'">
        {{ operation.change > 0 ? '+' : '-' }} <CurrencyDisplay :value="Math.abs(+operation.change)" />
      </div>
      <Button label="Finish" icon="pi pi-check" severity="success"
              @click="actions.balanceTest.finishOperation({ balance: balance.id, operation: operation.id })" />
      <Button label="Cancel" icon="pi pi-cross" severity="warning"
              @click="actions.balanceTest.cancelOperation({ balance: balance.id, operation: operation.id })" />

    </div>

    <div class="flex flex-row">
      <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 text-xl mt-4 flex-1">
        <div class="text-xl mb-2">Start operation</div>
        <command-form service="balanceTest" action="startOperation"
                      :parameters="{ balance: balance.id }"
                      v-slot="{ data }" reset-on-done>
          <div class="col-span-12 md:col-span-6 py-1">
            <div class="p-field mb-4">
              <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                Name
              </label>
              <InputText id="name" type="text" class="w-full"
                         aria-describedby="email-help" :class="{ 'p-invalid': data.nameError }"
                         v-model="data.name" />
              <small v-if="data.nameError" id="email-help" class="p-error">
                {{ t(`errors.${data.nameError}`) }}
              </small>
            </div>
          </div>
          <div class="col-span-12 md:col-span-6 py-1">
            <div class="p-field mb-4">
              <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                Change
              </label>
              <InputNumber id="name" type="text" class="w-full" :min="-1000000" :max="1000000" showButtons :step="1000"
                         aria-describedby="email-help" :class="{ 'p-invalid': data.changeError }"
                         v-model="data.change" />
              <small v-if="data.changeError" id="email-help" class="p-error">
                {{ t(`errors.${data.changeError}`) }}
              </small>
            </div>
          </div>
          <Button label="Start operation" icon="pi pi-plus" type="submit" />
        </command-form>
      </div>
      <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 text-xl mt-4 flex-1 ml-2">
        <div class="text-xl mb-2">Do instant operation</div>
        <command-form service="balanceTest" action="doOperation"
                      :parameters="{ balance: balance.id }"
                      v-slot="{ data }" reset-on-done>
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
          <div class="col-span-12 md:col-span-6 py-1">
            <div class="p-field mb-4">
              <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                Change
              </label>
              <InputNumber id="name" type="text" class="w-full" :min="-1000000" :max="1000000" showButtons :step="1000"
                           aria-describedby="change-help" :class="{ 'p-invalid': data.changeError }"
                           v-model="data.change" />
              <small v-if="data.changeError" id="change-help" class="p-error">{{ t(`errors.${data.changeError}`) }}</small>
            </div>
          </div>
          <Button label="Do operation" icon="pi pi-plus" type="submit" />
        </command-form>
      </div>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 text-xl mb-1 mt-2 text-xl">
      Finished operations:
    </div>
    <OperationsList ownerType="balanceTest_balance" :owner="name" state="finished" />

<!--    <div v-if="finishedOperations.length === 0" class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 mb-1">
      No operations finished
    </div>
    <div v-for="operation of finishedOperations"
         class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border mb-1 flex flex-row items-center">
      <div class="flex-1 flex-grow pl-4 py-1">
        {{ operation.cause }}
      </div>
      <div class="w-60 text-right pl-4 font-semibold mr-4">
        {{ operation.updatedAt ?? operation.createdAt }}
      </div>
      <div class="w-40 text-right pl-4 font-semibold mr-4"
           :class="operation.change > 0 ? 'text-green-500' : 'text-red-500'">
        {{ operation.change > 0 ? '+' : '-' }} {{ Math.abs(operation.change) }}
      </div>
      <div class="w-40 text-right pl-4 font-semibold mr-4">
        {{ operation.amountAfter }}
      </div>
    </div>-->

  </div>
</template>

<script setup>

  import InputText from "primevue/inputtext"
  import BalanceDisplay from './components/BalanceDisplay.vue'
  import OperationsList from './components/OperationsList.vue'
  import CurrencyDisplay from './components/CurrencyDisplay.vue'

  import {
    defineProps, defineEmits, defineModel, toRefs, computed, watch, ref, watchEffect, onUnmounted,
    getCurrentInstance, unref,
  } from 'vue'

  const props = defineProps({
    name: {
      type: String,
      required: true
    }
  })
  const { name } = toRefs(props)

  import { usePath, live, useClient, useActions, reverseRange, useTimeSynchronization } from '@live-change/vue3-ssr'
  const path = usePath()
  const actions = useActions()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const balancePath = computed(() => path.balance.balance({
    ownerType: 'balanceTest_balance',
    owner: name.value
  }))
  const startedOperationsPath = computed(() => path.balance.operationsByBalance({
    balance: `"balanceTest_balance":${JSON.stringify(name.value)}`,
    state: 'started',
    reverse: true,
  }))
  const finishedOperationsPath = computed(() => path.balance.operationsByBalance({
    balance: `"balanceTest_balance":${JSON.stringify(name.value)}`,
    state: 'finished',
    reverse: true,
  }))

  const [balance, startedOperations, finishedOperations] = await Promise.all([
    live(balancePath),
    live(startedOperationsPath),
    live(finishedOperationsPath)
  ])

</script>

<style scoped>

</style>
