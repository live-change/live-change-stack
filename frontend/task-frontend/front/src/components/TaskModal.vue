<template>
  <Dialog v-model:visible="visible" modal>
    <template #container="{ closeCallback }">
      <div class="surface-card border-round shadow-3 p-3 overflow-y-auto" style="max-height: 70vh">

        <div class="text-xl mb-2">
          Task <strong>{{ taskData?.name }}</strong> {{ taskData?.state }}
        </div>

        <div class="my-3">
          <Button icon="pi pi-times" label="Close" class="w-full" @click="close" />
        </div>

        <Task :task="taskData" :tasks="allTasks" :taskTypes="taskTypes" />

        <pre>{{ taskData }}</pre>
      </div>
    </template>
  </Dialog>
</template>

<script setup>

  import Task from './Task.vue'
  import Button from "primevue/button";

  import { ref, onMounted, defineProps, defineModel, toRefs, computed, watchEffect } from "vue"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

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

  const taskData = computed(() => allTasks.value && allTasks.value.find(m => (m.to ?? m.id) === taskId.value))

  const visible = defineModel('visible', {
    type: Boolean,
    default: false
  })


  const closeable = computed(() => taskData.value?.state === 'failed' || taskData.value?.state === 'done')

  function close() {
    visible.value = false
  }

  watchEffect(() => {
    if(!visible.value) return
    if(taskData.value?.state === 'failed') {
      toast.add({ severity: 'error', summary: 'Task failed', detail: taskData.value?.error })
    }
    if(taskData.value?.state === 'done') {
      toast.add({ severity: 'success', summary: 'Task done', life: 1500 })
      close()
    }
  })


</script>

<style scoped>

</style>