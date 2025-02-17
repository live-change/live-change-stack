<template>
  <node-view-wrapper>
    <ComponentEditor v-bind="{
      ...attrs, class: ['relative', editorClass]
    }">
      <node-view-content :class="[editorContentClass]" />
      <div class="absolute top-0 right-0 pr-6 max-h-0 items-center z-50 edit-buttons ">
        <Button icon="pi pi-eye"
                :class="[
                  'p-button p-button-icon-only p-button-rounded mr-0',
                  selectedEditor != 'style' ? 'p-button-success' : 'p-button-secondary'
                ]"
                style="transform: scale(0.8)"
                @click="(event) => toggleEditor('style', event)" />
        <Button icon="pi pi-cog"
                :class="[
                  'p-button p-button-icon-only p-button-rounded mr-0',
                  selectedEditor != 'settings' ? 'p-button-warning' : 'p-button-secondary'
                ]"
                style="transform: scale(0.8)"
                @click="(event) => toggleEditor('settings', event)"/>
        <Button icon="pi pi-trash"
                class="p-button p-button-icon-only p-button-rounded p-button-danger"
                style="transform: scale(0.8)"
                @click="() => props.deleteNode()" />
      </div>
      <div class="absolute pointer-events-none border-2 border-dashed z-9"
           :class="selectedEditor == 'style' ? 'border-blue-400' : 'border-yellow-400'"
           style="top: -10px; left: -10px; width: auto; height: auto; right: -10px; bottom: -10px"
           v-if="selectedEditor"></div>
    </ComponentEditor>
  </node-view-wrapper>
</template>

<script setup>
  import Button from "primevue/button"

  import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
  import components from "./components.js";

  import { inject, computed, getCurrentInstance } from "vue"

  const props = defineProps(nodeViewProps)

  const is = computed(() => props.node.attrs.is)
  const attrs = computed(() => props.node.attrs.attrs)

  const component = computed(() => components[props.node.attrs.is])

  const ComponentEditor = computed(() => component.value.editor)

  const uid = getCurrentInstance().uid

  const nodeControl = computed(() => ({
    uid,
    updateAttributes: props.updateAttributes,
    deleteNode: props.deleteNode,
    is: props.node.attrs.is,
    attrs: props.node.attrs.attrs
  }))

  const editorControl = inject("componentEditorControl")

  function toggleEditor(type, event) {
    editorControl.toggleEditor(type, nodeControl, event)
  }

  const selectedEditor = computed(() =>{
    console.log('EC', editorControl.componentControl.value?.nodeControl?.value.uid, uid)
    return editorControl.componentControl.value?.nodeControl?.value?.uid === uid
      ? editorControl.componentControl.value?.type
      : null
  })

  const editorClass = computed(() => [
    component.value.editorClass
      ? component.value.editorClass(attrs.value)
      : attrs.value.class,
    { 'selected-component-editor': selectedEditor.value },
    { 'selected-component-editor-style': selectedEditor.value == 'style' },
    { 'selected-component-editor-settings': selectedEditor.value == 'settings' }
  ])
  const editorContentClass = computed(() => [
    component.value.editorContentClass
      ? component.value.editorContentClass(attrs.value)
      : 'content',
    { 'selected-component-editor-content': selectedEditor.value },
    { 'selected-component-editor-content-style': selectedEditor.value == 'style' },
    { 'selected-component-editor-content-settings': selectedEditor.value == 'settings' }
  ])

</script>

<style lang="scss">
  .edit-buttons {
    display: none;
  }
  .show-edit-buttons .edit-buttons {
    display: flex;
  }
  .selected-component-editor-content-settings {
    & > [data-slot] {
      border: 1px dashed orangered;
      &::before {
        content: 'slot: ' attr(data-slot) ;
        color: orangered;
        border: orangered 1px solid;
        font-size: 0.8em;
        padding: 2px;
        margin: 0;
      }
    }
  }

</style>
