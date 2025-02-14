<template>
  <div class="flex flex-row w-full justify-evenly">
    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border px-4 py-1">

      <div>
        <h2>Built shelters</h2>
        <pre>{{ shelters }}</pre>
      </div>

      <command-form service="testTasks" action="buildShelter" reset-on-done v-slot="{ data, definition }"
                    @done="handleStarted">
<!--        <pre>{{ definition.properties }}</pre>
        <pre>{{ data }}</pre>-->

        <div class="text text-xl">
          Size:
        </div>
        <div class="pl-2">
          <div class="flex flex-row items-center">
            <label for="role" class="mr-2 w-20 text-right">Width:</label>
            <InputNumber v-model="data.size.width" mode="decimal"
                         showButtons :min="3" :max="9" />
          </div>
          <div class="flex flex-row items-center">
            <label for="role" class="mr-2 w-20 text-right">Height:</label>
            <InputNumber v-model="data.size.height" mode="decimal" showButtons :min="3" :max="9" />
          </div>
          <div class="flex flex-row items-center">
            <label for="role" class="mr-2 w-20 text-right">Length:</label>
            <InputNumber v-model="data.size.length" mode="decimal" showButtons :min="3" :max="9" />
          </div>

          <div class="flex flex-row items-center">
            <label for="role" class="mr-2 w-20">Wood type:</label>
            <Dropdown id="role" class="w-56" v-model="data.woodType" placeholder="Select a Wood type"
                      :options="definition.properties.woodType.options" />
          </div>

          <div class="text-right">
            <Button type="submit" icon="pi pi-play" label="Build" class="mt-2" />
          </div>
        </div>

      </command-form>
    </div>
<!--    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border px-4 py-1">
      <h2>Root</h2>
      <pre>{{ tasksRoot }}</pre>
      <h2>Tasks</h2>
      <Task v-for="task in rootTasks" :key="task.id" :task="task" :tasks="tasks" :task-types="taskTypes" />
    </div>-->
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { usePath, live } from '@live-change/vue3-ssr'
  import { useRouter } from 'vue-router'

  const path = usePath()

  const router = useRouter()

  const [ shelters ] = await Promise.all([
    live(path.testTasks.shelters({})),
  ])

  function handleStarted({ parameters, result }) {
    console.log("Started", parameters, result)
    router.push({ name: 'progress', params: { action: result.cause }})
  }

</script>

<style scoped>

</style>
