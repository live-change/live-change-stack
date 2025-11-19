<template>
  <div class="w-full px-4 py-5">

    <AdminTopMenu />

    <div class="bg-surface-0 dark:bg-surface-900 p-3 shadow mb-1">
      <ActionForm
        service="cron"
        action="setSchedule" />

    </div>
    

    <div class="bg-surface-0 dark:bg-surface-900 p-3 shadow mb-1">
      <h3>{{ t('cron.schedules') }}</h3>
      <range-viewer :pathFunction="schedulesPathFunction" key="schedules"
                    :canLoadTop="false" :canDropBottom="false"
                    loadBottomSensorSize="3000px" dropBottomSensorSize="12000px">
        <template #empty>
          <div class="bg-surface-0 p-3 shadow text-center text-gray-500 text-lg">
            No schedules found...
          </div>
        </template>

        <template #default="{ item: schedule }">     
          <ScheduleCard :schedule="schedule" class="mt-1" />
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

  import AdminTopMenu from '../components/AdminTopMenu.vue'
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

  const schedulesPathFunction = computed(() => (range) => 
    path.cron.schedules({ ...reverseRange(range) })
      .with(schedule => path.cron.scheduleInfo({ schedule: schedule.id }).bind('info'))
      .with(schedule => path.cron.runState({ jobType: 'cron_Schedule', job: schedule.id }).bind('runState'))
      .with(schedule => path.task.tasksByCauseAndCreatedAt({ 
        causeType: 'cron_Schedule', cause: schedule.id, reverse: true, limit: 5 
      }).bind('tasks'))
  )

  const services = computed(() => Object.keys(api.metadata.api.value.services))



</script>
