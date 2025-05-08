<template>
  <div class="flex flex-col-reverse md:flex-row justify-between items-center">
    <div class="flex flex-col mt-2 md:mt-0">
      <div v-if="savingDraft" class="text-surface-500 dark:text-surface-300 mr-2 flex flex-row items-center">
        <i class="pi pi-spin pi-spinner mr-2" style="font-size: 1.23rem"></i>
        <span>Executing...</span>
      </div>
      <div v-else-if="draftChanged" class="text-sm text-surface-500 dark:text-surface-300 mr-2">
        Draft changed
      </div>
      <Message v-else-if="validationResult" severity="error" variant="simple" size="small" class="mr-2">
        Before running, please correct the errors above.
      </Message>
    </div>
    <div class="flex flex-row">
      <slot name="submit" v-if="!validationResult">
        <div class="ml-2">
          <Button 
            type="submit"
            :label="submitting === true ? 'Executing...' : 'Execute'" 
            :icon="submitting === true ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
            :disabled="submitting"
          />         
        </div>
      </slot>
      <slot name="reset" v-if="resetButton">
        <div>
          <Button type="reset" label="Reset" class="ml-2" :disabled="!changed" icon="pi pi-eraser"/>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>

  import Message from "primevue/message"

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs, getCurrentInstance, unref } from 'vue'

  const props = defineProps({
    actionFormData: {
      type: Object,
      required: true,
    },
    resetButton: {
      type: Boolean,
      required: true,
    },
    options: {
      type: Object,
      default: () => ({})
    },
    i18n: {
      type: String,
      default: ''
    }
  })
  const { actionFormData, resetButton, options, i18n } = toRefs(props)

  const changed = computed(() => unref(actionFormData).changed.value)
  const draftChanged = computed(() => unref(actionFormData).draftChanged?.value)
  const savingDraft = computed(() => unref(actionFormData).savingDraft?.value)
  const submitting = computed(() => unref(actionFormData).submitting?.value)
  const propertiesErrors = computed(() => unref(actionFormData).propertiesErrors?.value)


  const validationResult = computed(() => {
    const errors = propertiesErrors.value
    if(errors && Object.keys(errors).length > 0) {
      return errors
    }
    return null
  })

</script>

<style scoped>

</style>