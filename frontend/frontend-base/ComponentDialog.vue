<template>
  <loading-zone suspense>
    <template v-slot:loading>
      <div class="fixed w-full h-full flex align-items-center justify-content-center top-0 left-0">
        <ProgressSpinner animationDuration=".5s"/>
      </div>
    </template>
    <template v-slot:default="{ isLoading }">
      <working-zone>
        <template v-slot:working>
          <div class="fixed w-full h-full flex align-items-center justify-content-center top-0 left-0">
            <ProgressSpinner animationDuration=".5s"/>
          </div>
        </template>
        <template v-slot:default="{ isWorking }">
          <ProgressBar v-if="isLoading || isWorking" mode="indeterminate" class="absolute w-full" style="height: .2em" />
          <component :is="component" v-bind="props" @update:modelValue="value => data = value" @close="handleClose" />
        </template>
      </working-zone>
    </template>
  </loading-zone>
</template>

<script setup>

  import { inject, ref } from 'vue'

  import ProgressSpinner from 'primevue/progressspinner'
  import ProgressBar from 'primevue/progressspinner'


  const data = ref()

  const dialogRef = inject('dialogRef')

  const { component, props } = dialogRef.value.data

  function handleClose() {
    dialogRef.value.close(data)
  }

</script>

<style scoped>

</style>
