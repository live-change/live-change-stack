<template>

</template>

<script setup>

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs } from 'vue'

  const props = defineProps({
    editor: {
      type: Object,
      required: true,
    },
    discardDraft: {
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
  const { editor, discardDraft, options, i18n } = toRefs(props)



</script>

<style scoped>

</style>