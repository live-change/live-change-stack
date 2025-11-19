<template>
  <div class="bg-surface-0 dark:bg-surface-900 px-3 py-1 shadow">
    <div class="flex flex-row justify-between items-center" v-if="scheduleData">
      <div class="flex flex-row items-center">
        <i class="pi pi-clock" style="font-size: 1rem" />
        <div class="ml-2">{{ scheduleData.description || scheduleData.id }}</div>
      </div>      
      <div class="flex flex-row items-center gap-4">
        <div class="text-sm">
          <strong>Last</strong>
          {{ lastRunDisplay }}
        </div>        
        <div class="text-sm">
          <strong>Next</strong>
          {{ nextRunDisplay }}
        </div>
        <div class="text-sm">
          Every {{ formatSchedule(scheduleData) }}
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
      <div class="grid grid-cols-1 gap-2 text-sm">
        <div><strong>Schedule:</strong> {{ formatSchedule(scheduleData) }}</div>
      </div>
      <div v-if="scheduleData.trigger" class="mt-2">
        <strong>Trigger:</strong>
        <div class="ml-2 text-sm">
          <div><strong>Name:</strong> {{ scheduleData.trigger.name }}</div>
          <div><strong>Service:</strong> {{ scheduleData.trigger.service || 'any' }}</div>
          <div v-if="scheduleData.trigger.properties">
            <strong>Properties:</strong>
            <pre class="text-xs bg-surface-100 dark:bg-surface-700 p-1 rounded mt-1">
              {{ JSON.stringify(scheduleData.trigger.properties, null, 2) }}
            </pre>
          </div>
        </div>
      </div>
      
      <!-- RunState for this Interval -->
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

      <div v-if="scheduleInfoData" class="mt-2 grid grid-cols-1 gap-1 text-sm">
        <div v-if="scheduleInfoData.lastRun">
          <strong>Last Run: </strong>
          <span :title="lastRunAbsolute || undefined">{{ lastRunDisplay }}</span>
        </div>
        <div v-if="scheduleInfoData.nextRun">
          <strong>Next Run: </strong>
          <span :title="nextRunAbsolute || undefined">{{ nextRunDisplay }}</span>
        </div>
      </div>

      <div v-if="tasksData?.length" class="mt-2">
        <strong>Last 5 Tasks:</strong>
        <div class="ml-2 text-sm">
          <div v-for="task in tasksData" :key="task.id">
            <TaskAdminCard :task="task" class="mt-1" />
          </div>
        </div>
      </div>

      <pre>{{ JSON.stringify(intervalData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import Button from 'primevue/button'
  import { usePath, live } from '@live-change/vue3-ssr'
  import { currentTime } from "@live-change/frontend-base"

  const props = defineProps({
    schedule: {
      type: Object,
      required: true
    }
  })

  const scheduleData = computed(() => props.schedule)
  const isExpanded = ref(false)

  function formatSchedule(schedule) {
    if (!ms) return 'N/A'
    
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }

  const runStateData = computed(() => scheduleData.value?.runState)

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

  const scheduleInfoData = computed(() => scheduleData.value?.info)


  function formatAbsoluteMoment(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString()
  }

  function formatRelativeMoment(timestamp) {
    if (!timestamp) return 'N/A'
    const target = new Date(timestamp).getTime()
    if (Number.isNaN(target)) return 'N/A'

    const diff = target - currentTime.value
    const absDiff = Math.abs(diff)
    const dayMs = 24 * 60 * 60 * 1000

    if (absDiff < dayMs) {
      const hourMs = 60 * 60 * 1000
      const minuteMs = 60 * 1000
      const hours = Math.floor(absDiff / hourMs)
      const minutes = Math.floor((absDiff % hourMs) / minuteMs)
      const seconds = Math.floor((absDiff % minuteMs) / 1000)
      const parts = []
      if (hours > 0) parts.push(`${hours}h`)
      if (minutes > 0) parts.push(`${minutes}m`)
      parts.push(`${seconds}s`)
      const relative = parts.join(' ')
      if (diff > 0) return `in ${relative}`
      if (diff < 0) return `${relative} ago`
      return 'now'
    }

    return new Date(target).toLocaleString()
  }

  const lastRunDisplay = computed(() => formatRelativeMoment(scheduleInfoData.value?.lastRun))
  const nextRunDisplay = computed(() => formatRelativeMoment(scheduleInfoData.value?.nextRun))
  const lastRunAbsolute = computed(() => formatAbsoluteMoment(scheduleInfoData.value?.lastRun))
  const nextRunAbsolute = computed(() => formatAbsoluteMoment(scheduleInfoData.value?.nextRun))

  const tasksData = computed(() => scheduleData.value?.tasks)
</script>
