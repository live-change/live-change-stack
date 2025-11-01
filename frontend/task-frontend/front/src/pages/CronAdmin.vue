<template>
  <div class="w-full">

    <ActionForm
      service="cron"
      action="setInterval"
      :parameters="intervalParameters"
      @done="handleActionDone" />
    

    <div class="bg-surface-0 dark:bg-surface-900 p-3 shadow mb-1">
      <h3>{{ t('cron.intervals') }}</h3>
      <range-viewer :pathFunction="intervalsPathFunction" :key="JSON.stringify(intervalsPathConfig)"
                    :canLoadTop="false" :canDropBottom="false"
                    loadBottomSensorSize="3000px" dropBottomSensorSize="12000px">
        <template #empty>
          <div class="bg-surface-0 p-3 shadow text-center text-gray-500 text-lg">
            No intervals found...
          </div>
        </template>

        <template #default="{ item: interval }">     
          <IntervalCard :interval="interval" class="mt-1" />
        </template>
      </range-viewer>
    </div>
    
  </div>
</template>

<script setup>
  
  import ScheduleCard from '../components/ScheduleCard.vue'
  import IntervalCard from '../components/IntervalCard.vue'
  import Select from 'primevue/select'
  import InputText from 'primevue/inputtext'
  import InputNumber from 'primevue/inputnumber'
  import Dropdown from 'primevue/dropdown'
  import Button from 'primevue/button'


  import { ActionForm } from '@live-change/frontend-auto-form'

  import { useI18n } from 'vue-i18n'    
  const { t } = useI18n()

  import { ref, computed } from 'vue'
  import { RangeViewer } from "@live-change/vue3-components"

  import { inject } from 'vue'
  const workingZone = inject('workingZone')

  import { usePath, live, useClient, useActions, reverseRange, useApi } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()
  const actions = useActions()
  const api = useApi()

  const taskType = ref('all')

  // Available test tasks
  const taskOptions = ref([
    { label: 'Build Shelter', value: 'buildShelter' },
    { label: 'Get Wood', value: 'getWood' },
    { label: 'Cut Wood', value: 'cutWood' },
    { label: 'Make Planks', value: 'makePlanks' },
    { label: 'Build Wall', value: 'buildWall' },
    { label: 'Build Roof', value: 'buildRoof' }
  ])

  const schedulesPathFunction = computed(() => (range) => 
    path.cron.schedules({ ...reverseRange(range) })
  )

  const intervalsPathFunction = computed(() => (range) => 
    path.cron.intervals({ ...reverseRange(range) })
  )

  const services = computed(() => Object.keys(api.metadata.api.value.services))



</script>
