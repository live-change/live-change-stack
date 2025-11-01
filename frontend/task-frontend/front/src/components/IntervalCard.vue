<template>
  <div class="bg-surface-0 dark:bg-surface-900 px-3 py-1 shadow">
    <div class="flex flex-row justify-between items-center" v-if="intervalData">
      <div class="flex flex-row items-center">
        <i class="pi pi-clock" style="font-size: 1rem" />
        <div class="ml-2">{{ intervalData.description || intervalData.id }}</div>
      </div>      
      <div class="flex flex-row items-center gap-4">
        <div class="text-sm">
          Every {{ formatInterval(intervalData.interval) }}
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
        <div><strong>Interval:</strong> {{ formatInterval(intervalData.interval) }} ({{ intervalData.interval }}ms)</div>
        <div v-if="intervalData.wait"><strong>Wait:</strong> {{ formatInterval(intervalData.wait) }} ({{ intervalData.wait }}ms)</div>
      </div>
      <div v-if="intervalData.trigger" class="mt-2">
        <strong>Trigger:</strong>
        <div class="ml-2 text-sm">
          <div><strong>Name:</strong> {{ intervalData.trigger.name }}</div>
          <div><strong>Service:</strong> {{ intervalData.trigger.service || 'any' }}</div>
          <div v-if="intervalData.trigger.properties">
            <strong>Properties:</strong>
            <pre class="text-xs bg-surface-100 dark:bg-surface-700 p-1 rounded mt-1">{{ JSON.stringify(intervalData.trigger.properties, null, 2) }}</pre>
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
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import Button from 'primevue/button'
  import { usePath, live } from '@live-change/vue3-ssr'

  const props = defineProps({
    interval: {
      type: Object,
      required: true
    }
  })

  const intervalData = computed(() => props.interval)
  const isExpanded = ref(false)
  const runStateData = ref(null)
  const path = usePath()

  // Watch for interval changes and fetch run state
  watch(() => props.interval?.id, async (newId) => {
    if (newId) {
      try {
        // Get run state for this specific interval
        const runStatePath = path.cron_RunState.to(['cron_Interval', newId])
        runStateData.value = await live(runStatePath)
      } catch (error) {
        console.error('Error fetching run state:', error)
        runStateData.value = null
      }
    }
  }, { immediate: true })

  function formatInterval(ms) {
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
