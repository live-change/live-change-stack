<template>
  <div class="bg-surface-0 dark:bg-surface-900 px-3 py-1 shadow">
    <div class="flex flex-row justify-between items-center" v-if="scheduleData">
      <div class="flex flex-row items-center">
        <i class="pi pi-calendar" style="font-size: 1rem" />
        <div class="ml-2">{{ scheduleData.description || scheduleData.id }}</div>
      </div>      
      <div class="flex flex-row items-center gap-4">
        <div class="text-sm">
          {{ formatSchedule(scheduleData) }}
        </div>
        <Button 
          :icon="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" 
          @click="isExpanded = !isExpanded"
          text
          rounded
        />
      </div>
    </div>
    
    <div v-if="isExpanded" class="mt-2 p-2 bg-surface-50 dark:bg-surface-800 rounded">
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div><strong>Minute:</strong> {{ scheduleData.minute || '*' }}</div>
        <div><strong>Hour:</strong> {{ scheduleData.hour || '*' }}</div>
        <div><strong>Day:</strong> {{ scheduleData.day || '*' }}</div>
        <div><strong>Day of Week:</strong> {{ scheduleData.dayOfWeek || '*' }}</div>
        <div><strong>Month:</strong> {{ scheduleData.month || '*' }}</div>
      </div>
      <div v-if="scheduleData.trigger" class="mt-2">
        <strong>Trigger:</strong>
        <div class="ml-2 text-sm">
          <div><strong>Name:</strong> {{ scheduleData.trigger.name }}</div>
          <div><strong>Service:</strong> {{ scheduleData.trigger.service || 'any' }}</div>
          <div v-if="scheduleData.trigger.properties">
            <strong>Properties:</strong>
            <pre class="text-xs bg-surface-100 dark:bg-surface-700 p-1 rounded mt-1">{{ JSON.stringify(scheduleData.trigger.properties, null, 2) }}</pre>
          </div>
        </div>
      </div>
      
      <!-- RunState for this Schedule -->
      <div v-if="runStateData" class="mt-2">
        <strong>Current Run State:</strong>
        <div class="ml-2 text-sm p-2 bg-surface-100 dark:bg-surface-700 rounded">
          <div class="flex items-center">
            <i :class="['pi', runStateIcon, runStateColor]" style="font-size: 1rem" />
            <span class="ml-2">{{ runStateData.state }}</span>
          </div>
          <div v-if="runStateData.tasks?.length" class="mt-1">
            <i class="pi pi-list" />
            {{ runStateData.tasks.length }} task{{ runStateData.tasks.length > 1 ? 's' : '' }}
          </div>
          <div v-if="runStateData.startedAt" class="mt-1">
            <strong>Started At:</strong> {{ new Date(runStateData.startedAt).toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import Button from 'primevue/button'
  import { usePath, live } from '@live-change/vue3-ssr'

  const props = defineProps({
    schedule: {
      type: Object,
      required: true
    }
  })

  const scheduleData = computed(() => props.schedule)
  const isExpanded = ref(false)
  const runStateData = ref(null)
  const path = usePath()

  // Watch for schedule changes and fetch run state
  watch(() => props.schedule?.id, async (newId) => {
    if (newId) {
      try {
        // Get the run state for this specific schedule
        const runStatePath = path.cron_RunState.to(['cron_Schedule', newId])
        runStateData.value = await live(runStatePath)
      } catch (error) {
        console.error('Error fetching run state:', error)
        runStateData.value = null
      }
    }
  }, { immediate: true })

  function formatSchedule(schedule) {
    const parts = []
    if (schedule.minute !== undefined && schedule.minute !== null) parts.push(schedule.minute)
    else parts.push('*')
    
    if (schedule.hour !== undefined && schedule.hour !== null) parts.push(schedule.hour)
    else parts.push('*')
    
    if (schedule.day !== undefined && schedule.day !== null) parts.push(schedule.day)
    else parts.push('*')
    
    if (schedule.month !== undefined && schedule.month !== null) parts.push(schedule.month)
    else parts.push('*')
    
    if (schedule.dayOfWeek !== undefined && schedule.dayOfWeek !== null) parts.push(schedule.dayOfWeek)
    else parts.push('*')
    
    return parts.join(' ')
  }

  const runStateIcon = computed(() => {
    switch(runStateData.value?.state) {
      case 'running': return 'pi-play'
      case 'waiting': return 'pi-hourglass pi-spin'
      default: return 'pi-question'
    }
  })

  const runStateColor = computed(() => {
    switch(runStateData.value?.state) {
      case 'running': return 'text-blue-600'
      case 'waiting': return 'text-orange-600'
      default: return ''
    }
  })
</script>
