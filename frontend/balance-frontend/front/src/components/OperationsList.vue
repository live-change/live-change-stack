<template>
  <RangeViewer :key="operationsKey" :pathFunction="operationsPathFunction"
               :canLoadTop="false" :canDropTop="false"
               :canLoadBottom="true" :canDropBottom="false"
               loadTopSensorSize="1500px" loadBottomSensorSize="1500px"
               dropTopSensorSize="1000px" dropBottomSensorSize="1000px">
    <template #empty>
      <div class="text-xl text-800 my-3 mx-3">
        No operations done yet...
      </div>
    </template>
    <template #default="{ item: operation }">
      <div class="surface-card shadow-1 border-round mb-1 flex flex-row align-items-center">
        <div class="flex-1 flex-grow pl-3 py-1">
          <slot name="operationCause">
            <pre>{{ operation.cause }}</pre>
          </slot>
        </div>
        <time class="w-15rem text-right pl-3 font-semibold mr-3"
              :datetime="operation.updatedAt ?? operation.createdAt">
          {{ d(operation.updatedAt ?? operation.createdAt, 'shortTime') }}
        </time>
        <div class="w-10rem text-right pl-3 font-semibold mr-3"
             :class="operation.change > 0 ? 'text-green-500' : 'text-red-500'">
          {{ operation.change > 0 ? '+' : '-' }} <CurrencyDisplay :value="Math.abs(operation.change)" />
        </div>
        <div class="w-10rem text-right pl-3 font-semibold mr-3">
          <CurrencyDisplay :value="operation.amountAfter" />
        </div>
      </div>
    </template>
  </RangeViewer>
</template>

<script setup>

  import { RangeViewer } from "@live-change/vue3-components"

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
    }
  })
  const { ownerType, owner, state } = toRefs(props)

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