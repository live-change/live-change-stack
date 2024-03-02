<template>
  <node-view-wrapper>
    <Image :image="image" width="100" dom-resize="width" class="w-full" />
  </node-view-wrapper>
</template>

<script setup>

  import { inject, computed, onUnmounted } from 'vue'
  import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
  import { imageUploads, Image } from "@live-change/image-frontend";

  const upload = computed(() => {
    return imageUploads.value.find(upload => upload.id == props.image)
  })

  const props = defineProps(nodeViewProps)
  const image = computed(() => props.node.attrs.image )

  const form = inject('form', null)
  if(form) {
    const barrier = async () => {
      if(upload.value) await upload.value.upload()
    }
    form.addBarrier('', barrier)
    onUnmounted(() => {
      form.removeBarrier('', barrier)
    })
  }

</script>

<style scoped>

</style>
