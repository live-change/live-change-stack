<template>
  <div class="flex flex-row flex-wrap ">
    <div v-for="type in paddingTypes"
         class="flex flex-row align-items-center justify-content-start my-1"
         style="width: 5.6em">
      <label :for="'padding-'+type" class="mb-0 mr-1">{{ type }}</label>
      <InputNumber v-if="props.modelValue[type] !== undefined"
                   :inputId="'padding-'+type"
                   class="p-inputtext-sm"
                   inputStyle="max-width: 1.7em;"
                   :modelValue="props.modelValue[type]"
                   @update:modelValue="value => updatePadding(type, value)"
                   mode="decimal"
                   showButtons :min="-1" :max="8" />
      <Button v-else class="p-button p-button-icon-only p-button-rounded mr-0" icon="pi pi-plus"
              @click="ev => updatePadding(type, 1)" />
    </div>
  </div>
</template>

<script setup>
  import InputNumber from "primevue/inputnumber"
  import Button from "primevue/button"

  const props = defineProps({
    modelValue: {
      type: Object,
      default: () => ({})
    }
  })
  const emit = defineEmits(['update:modelValue'])

  const paddingTypes = ['all', 'x', 'y', 'l', 'r', 't', 'b']

  function updatePadding(type, value) {
    console.log("UPDATE PADDING", type, value)
    const newValue = { ...props.modelValue }
    if(value < 0) {
      delete newValue[type]
    } else {
      newValue[type] = value
    }
    emit('update:modelValue', newValue)
  }
</script>

<style scoped>

</style>
