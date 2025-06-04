<template>
  <div>
    <div class="text-lg flex flex-row justify-between flex-wrap items-center" :class="taskColor">
      <div class="flex flex-row items-center mr-4">
        <i :class="['pi', icon, taskColor]" style="font-size: 1rem" />
        <div :class="['ml-2']">{{ label }}</div>
      </div>
      <div v-if="taskData?.progress && taskData?.state !== 'done'" class="w-32 mr-4 grow" style="max-width: 50vw">
        <ProgressBar :value="Math.floor((100 * taskData.progress.current / taskData.progress.total))" />
      </div>
      <div v-if="taskData?.retries?.length && taskData.retries.length < taskData.maxRetries" class="mr-4">
        <i class="pi pi-replay" />
        {{ taskData.retries.length }} / {{ taskData.maxRetries }}
      </div>
      <div>{{ taskData?.state !== 'done' ? (taskData?.progress?.action || taskData?.state) : 'done' }}</div>
    </div>
    <div v-for="retry in taskData?.retries" class="ml-6 flex flex-row justify-between text-red-800">
      {{ retry.error }} at {{ d(retry.failedAt, 'shortestTime')}}
    </div>
    <div v-if="taskResultComponent && taskData.result" class="m-2">
      <component :is="taskResultComponent" :task="taskData" :result="taskData.result" :taskType="taskType" />
    </div>
    <div class="ml-6">
      <Task v-for="task in childTasks" :key="taskId" :task="task" :tasks="allTasks" :taskTypes="taskTypes" />
    </div>
  </div>
</template>


<script setup>

  import ProgressBar from "primevue/progressbar"

  import { ref, onMounted, defineProps, toRefs, computed } from "vue"

  import { useActions, usePath, live } from '@live-change/vue3-ssr'
  const path = usePath()
  const actions = useActions()

  import { useI18n } from 'vue-i18n'
  const { t, tm, rt, n, d } = useI18n()

  const props = defineProps({
    task: {
      type: Object,
      required: true
    },
    tasks: {
      type: Array,
      default: undefined
    },
    taskTypes: {
      type: Object,
      default: () => ({})
    }
  })
  const { task, tasks, taskTypes } = toRefs(props)

  const taskId = computed(() => task.value?.to || task.value?.id || task.value)

  const loadedTasksPath = computed(() => tasks.value ? null : (taskId.value ? path.task.tasksByRoot({
    root: taskId.value,
    rootType: 'task_Task'
  }) : null))

  const [ loadedTasks ] = await Promise.all([
    live(loadedTasksPath)
  ])
  
  const allTasks = computed(() => tasks.value || loadedTasks.value)

  const taskData = computed(() => 
    typeof task.value === 'object' 
      ? task.value
      : (allTasks.value && allTasks.value.find(m => (m.to ?? m.id) === taskId.value))
  )

  const taskType = computed(() => taskTypes.value[taskData.value?.type || taskData.value?.name] || {})

  const taskResultComponent = computed(() => taskType.value.resultComponent)

  const label = computed(() => {
    if(taskType.value.label) {
      if(typeof taskType.value.label == 'function') return taskType.value.label(taskData.value)
      return taskType.value.label
    }
    return taskData.value?.name || taskData.value?.type
  })

  const childTasks = computed(
    () => allTasks.value
      ? allTasks.value.filter(m => m.causeType === "task_Task" && m.cause === taskId.value)
      : []
  )

  const icon = computed(() => {
    switch(taskData.value?.state) {
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
    console.log("TD", taskData.value, "AT", allTasks.value)
    console.trace('taskColor', taskData.value)
    switch(taskData.value?.state) {
      case 'failed': return 'text-red-600'
      default: {}
    }
  })

</script>


<style scoped>

</style>