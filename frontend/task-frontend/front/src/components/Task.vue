<template>
  <div>
    <div class="text-lg flex flex-row justify-content-between flex-wrap" :class="taskColor">
      <div class="flex flex-row align-items-center mr-3">
        <i :class="['pi', icon, taskColor]" style="font-size: 1rem" />
        <div :class="['ml-2']">{{ label }}</div>
      </div>
      <div v-if="task?.progress && task?.state !== 'done'" class="w-8rem mr-3 flex-grow-1" style="max-width: 50vw">
        <ProgressBar :value="(100 * task.progress.current / task.progress.total).toFixed()" />
      </div>
      <div v-if="task?.retries?.length" class="mr-3">
        <i class="pi pi-replay" />
        {{ task.retries.length }} / {{ task.maxRetries }}
      </div>
      <div>{{ task?.state !== 'done' ? (task?.progress?.action || task?.state) : 'done' }}</div>
    </div>
    <div v-for="retry in task?.retries" class="ml-4 flex flex-row justify-content-between text-red-800">
      {{ retry.error }} at {{ d(retry.failedAt, 'shortestTime')}}
    </div>
<!--    <pre>{{ task.progress }}</pre>-->
    <div v-if="taskResultComponent && task.result" class="m-2">
      <component :is="taskResultComponent" :task="task" :result="task.result" :taskType="taskType" />
    </div>
    <div class="ml-4">
      <Task v-for="task in childTasks" :key="task.id" :task="task" :tasks="tasks" :taskTypes="taskTypes" />
    </div>
  </div>
</template>


<script setup>

  import { ref, onMounted, defineProps, toRefs, computed } from "vue"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  import { useActions, usePath, live } from '@live-change/vue3-ssr'
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
      required: true
    },
    taskTypes: {
      type: Object,
      default: () => ({})
    }
  })
  const { task, tasks, taskTypes } = toRefs(props)

  const taskId = computed(() => task.value.to || task.value.id)
  const taskType = computed(() => taskTypes.value[task.value.type || task.value.name] || {})

  const taskResultComponent = computed(() => taskType.value.resultComponent)

  const label = computed(() => {
    if(taskType.value.label) {
      if(typeof taskType.value.label == 'function') return taskType.value.label(task.value)
      return taskType.value.label
    }
    return task.value.name || task.value.type
  })

  const childTasks = computed(
    () => tasks.value.filter(m => m.causeType === "task_Task" && m.cause === taskId.value)
  )

  const icon = computed(() => {
    switch(task.value.state) {
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
    switch(task.value.state) {
      case 'failed': return 'text-red-600'
      default: {}
    }
  })

</script>


<style scoped>

</style>