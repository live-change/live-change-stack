<template>
  <div class="flex flex-row justify-content-between align-items-center mt-3">
    <div class="flex flex-column">
      <div v-if="draftChanged" class="text-sm text-500 mr-2">
        Draft changed
      </div>
      <div v-if="savingDraft" class="text-500 mr-2">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <span>Saving draft...</span>
      </div>
      <div v-if="validationResult" class="font-semibold p-error mr-2">
        Before saving, please correct the errors above.
      </div>
    </div>
    <div class="flex flex-row">
      <slot name="submit" v-if="!validationResult">
        <div v-if="changed" class="ml-2">
          <Button type="submit" label="Save" class="" icon="pi pi-save" />
        </div>
        <div v-else class="flex flex-row align-items-center ml-2">
          <div class="mr-2">
            No changes to save.
          </div>
          <Button type="submit" label="Save" class="" icon="pi pi-save" disabled />
        </div>
      </slot>
      <slot name="reset" v-if="resetButton">
        <div v-if="changed">
          <Button label="Reset" class="ml-2" icon="pi pi-eraser" @click="editor.reset" />
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