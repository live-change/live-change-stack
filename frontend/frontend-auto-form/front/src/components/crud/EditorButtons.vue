<template>
  <div class="flex flex-col-reverse md:flex-row justify-between items-center">
    <div class="flex flex-col mt-2 md:mt-0">
      <div v-if="savingDraft" class="text-surface-500 dark:text-surface-300 mr-2 flex flex-row items-center">
        <i class="pi pi-spin pi-spinner mr-2" style="font-size: 1.23rem"></i>
        <span>Saving draft...</span>
      </div>
      <div v-else-if="draftChanged" class="text-sm text-surface-500 dark:text-surface-300 mr-2">
        Draft changed
      </div>
      <Message v-else-if="validationResult" severity="error" variant="simple" size="small" class="mr-2">
        Before saving, please correct the errors above.
      </Message>
      <div v-else-if="!changed" class="">
        No changes to save.
      </div>
    </div>
    <div class="flex flex-row">
      <slot name="submit" v-if="!validationResult">
        <div class="ml-2">
          <Button v-if="exists" type="submit" :label="'Save '+model.name" :disabled="!changed" icon="pi pi-save" />
          <Button v-else type="submit" :label="'Create '+model.name" :disabled="!changed" icon="pi pi-sparkles" />
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
    editor: {
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
  const { editor, resetButton, options, i18n } = toRefs(props)

  const draftEnabled = computed(() => !!editor.value.discardDraft)
  const model = computed(() => editor.value.model)

  const changed = computed(() => editor.value.changed.value)
  const exists = computed(() => !!editor.value.saved.value)
  const draftChanged = computed(() => editor.value.draftChanged?.value)
  const savingDraft = computed(() => editor.value.savingDraft?.value)
  const sourceChanged = computed(() => editor.value.sourceChanged?.value)
  const saving = computed(() => editor.value.saving?.value)
  const propertiesErrors = computed(() => editor.value.propertiesErrors?.value)
  
  const appContext = getCurrentInstance().appContext

  import { validateData } from "@live-change/vue3-components"
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