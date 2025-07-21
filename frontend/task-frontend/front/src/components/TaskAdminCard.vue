<template>
  <div class="bg-surface-0 dark:bg-surface-900 px-3 py-1 shadow">
    <div class="flex flex-row justify-between items-center" v-if="taskData">
      <div class="flex flex-row items-center">
        <i :class="['pi', icon, taskColor]" style="font-size: 1rem" />
        <div class="ml-2">{{ taskData.name }}</div>
        <div v-if="taskData.state === 'failed'" class="ml-2 text-red-600 dark:text-red-400">
          {{ taskData.retries[taskData.retries.length - 1]?.error }}
        </div>
      </div>      
      <div class="flex flex-row items-center gap-4">
        <div v-if="taskData.retries?.length" >
          <i class="pi pi-replay" />
          {{ taskData.retries.length }} / {{ taskData.maxRetries }}
        </div>
        <time :datetime="taskData.createdAt">
          {{ d(locale.localTime(new Date(taskData.createdAt)), 'shortTime') }}
        </time>
        <Button 
          :icon="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" 
          @click="isExpanded = !isExpanded"
          text
          rounded
        />
      </div>
    </div>
    
    <div v-if="isExpanded">
      <!-- <TaskAdminDetails :task="task" :tasks="tasks" :taskTypes="taskTypes" /> -->
      <TaskAdminDetails :task="task" :taskTypes="taskTypes" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import Button from 'primevue/button'
  import TaskAdminDetails from './TaskAdminDetails.vue'

  import { useLocale } from "@live-change/vue3-components"
  const locale = useLocale()

  import { useI18n } from 'vue-i18n'
  const { d } = useI18n()

  const props = defineProps({
    task: {
      type: Object,
      required: true
    },
 /*    tasks: {
      type: Array,
      default: () => []
    }, */
    taskTypes: {
      type: Object,
      default: () => ({})
    }
  })

  /* const taskId = computed(() => props.task?.to || props.task?.id || props.task) */

  const taskData = computed(() => props.task)//s.find(t => t.to === taskId.value || t.id === taskId.value))

  const isExpanded = ref(false)

  const icon = computed(() => {
    switch(props.task?.state) {
      case 'created': return 'pi-sparkles'
      case 'waiting': return 'pi-hourglass pi-spin'
      case 'running': return 'pi-play'
      case 'working': return 'pi-spin pi-spinner'
      case 'done': return 'pi-check'
      case 'failed': return 'pi-exclamation-triangle'
      case 'retrying': return 'pi-replay'
      default: return 'pi-question'
    }
  })

  const taskColor = computed(() => {
    switch(props.task?.state) {
      case 'failed': return 'text-red-600'
      default: return ''
    }
  })
</script>