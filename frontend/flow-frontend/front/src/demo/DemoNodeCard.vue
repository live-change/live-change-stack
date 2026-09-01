<template>
  <Node :node="node">
    <div class="demo-node-card">
      <NodeHandle :node="node" class="demo-node-handle">
        <i :class="['pi', icon, 'text-sm']" />
        <span>{{ title }}</span>
      </NodeHandle>
      <div class="demo-node-body">
        <slot />
      </div>
      <div class="demo-node-footer">
        <Button @click="emit('delete')" size="small" severity="danger"
                variant="outlined" rounded icon="pi pi-trash"
                data-testid="delete-node" />
      </div>
    </div>
  </Node>
</template>

<script setup>

  import Node from "../components/Node.vue"
  import NodeHandle from "../components/NodeHandle.vue"

  import { defineProps, defineEmits, toRefs } from "vue"

  const props = defineProps({
    node: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  })

  const { node, title, icon } = toRefs(props)

  const emit = defineEmits(['delete'])

</script>

<style>
  .demo-node-card {
    background: var(--p-surface-0, #ffffff);
    border: 1px solid var(--p-surface-200, #e5e7eb);
    border-radius: 12px;
    box-shadow:
      0 4px 10px rgba(0, 0, 0, 0.12),
      0 1px 5px rgba(0, 0, 0, 0.12);
    min-width: 13rem;
    max-width: 16rem;
    color: var(--p-surface-900, #212121);
  }
  .demo-node-handle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.125rem;
    font-weight: 500;
    padding: 0.5rem 0.75rem 0.45rem;
    margin-bottom: 0.15rem;
    border-bottom: 1px solid var(--p-surface-200, #f3f4f6);
  }
  .demo-node-body {
    padding-bottom: 0.15rem;
  }
  .demo-node-section {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--p-surface-500, #6b7280);
    padding: 0.25rem 0.75rem 0.15rem;
  }
  .demo-node-footer {
    display: flex;
    justify-content: center;
    padding: 0.25rem 0 0.5rem;
  }
</style>
