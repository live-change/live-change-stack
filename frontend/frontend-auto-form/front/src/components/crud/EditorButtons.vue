<template>
  <div class="flex flex-column-reverse md:flex-row justify-content-between align-items-center mt-3">
    <div class="flex flex-column mt-2 md:mt-0">
      <div v-if="savingDraft" class="text-500 mr-2 flex flex-row align-items-center">
        <i class="pi pi-spin pi-spinner mr-2" style="font-size: 1.23rem"></i>
        <span>Saving draft...</span>
      </div>
      <div v-else-if="draftChanged" class="text-sm text-500 mr-2">
        Draft changed
      </div>
      <div v-else-if="validationResult" class="font-semibold p-error mr-2">
        Before saving, please correct the errors above.
      </div>
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

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs, getCurrentInstance } from 'vue'

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

  const appContext = getCurrentInstance().appContext

  import { validateData } from "@live-change/vue3-components"
  const validationResult = computed(() => {
    const currentValue = editor.value.value.value
    const validationResult = validateData(model.value, currentValue, 'validation', appContext,
      props.propName, props.rootValue, true)
    const softValidationResult = validateData(model.value, currentValue, 'softValidation', appContext,
      props.propName, props.rootValue, true)
    return validationResult || softValidationResult
  })

</script>

<style scoped>

</style>