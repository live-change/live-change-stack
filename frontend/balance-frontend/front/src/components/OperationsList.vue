<template>
  <RangeViewer :key="operationsKey" :pathFunction="operationsPathFunction"
               :canLoadTop="false" :canDropTop="false"
               :canLoadBottom="true" :canDropBottom="false"
               loadTopSensorSize="1500px" loadBottomSensorSize="1500px"
               dropTopSensorSize="1000px" dropBottomSensorSize="1000px">
    <template #empty>
      <div class="text-xl text-surface-800 dark:text-surface-50 my-4 mx-4">
        No operations done yet...
      </div>
    </template>
    <template #default="{ item: operation }">
      <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border mb-1 flex flex-row items-center">
        <div class="flex-1 grow pl-4 py-1" style="min-width: 10rem">
          <slot name="operationCause" v-bind="operation">
            <InjectComponent :request="{ name: 'balanceOperationCause', causeType: operation.causeType }"
                             :props="operation">
              <template #fallback>
                <pre>{{ operation.causeType + ':' + operation.cause }}</pre>
              </template>
            </InjectComponent>
          </slot>
        </div>
        <time class="w-40 text-right pl-4 font-medium mr-4"
              :datetime="operation.updatedAt ?? operation.createdAt">
          {{ d(operation.updatedAt ?? operation.createdAt, 'shortTime') }}
        </time>
        <div class="w-40 text-right pl-4 font-semibold mr-4"
             :class="operation.change > 0 ? 'text-green-500' : 'text-red-500'">
          {{ operation.change > 0 ? '+' : '-' }} <CurrencyDisplay :value="Math.abs(operation.change)" :currency="currency" />
        </div>
        <div class="w-40 text-right pl-4 font-semibold mr-4">
          <CurrencyDisplay :value="operation.amountAfter" :currency="currency" />
        </div>
      </div>
    </template>
  </RangeViewer>
</template>

<script setup>

  import { RangeViewer, InjectComponent } from "@live-change/vue3-components"

  import { defineProps, toRefs, computed } from 'vue'

  const props = defineProps({
    ownerType: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    state: {
      type: String,
      default: null
    },
    currency: {
      type: String,
      default: null
    }
  })
  const { ownerType, owner, state, currency } = toRefs(props)

  import { usePath, live, reverseRange } from '@live-change/vue3-ssr'
  const path = usePath()

  import { useI18n } from 'vue-i18n'
  import CurrencyDisplay from './CurrencyDisplay.vue'
  const { d, n } = useI18n()

  function operationsPathFunction(range) {
    return path.balance.operationsByBalance({
      ...reverseRange(range),
      balance: `${JSON.stringify(ownerType.value)}:${JSON.stringify(owner.value)}`,
      state: state.value
    })
  }

  const operationsKey = computed(() => `${ownerType.value}:${owner.value}:${state.value}`)


</script>

<style scoped>

</style>