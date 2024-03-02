<template>
  <slot v-bind="{ end, linePath }">
    <path @mousedown="handleMouseDown"
          @touchstart="handleTouchStart"
          :d="linePath"
          class="pointer-events-auto" style="cursor: move"
          stroke="rgba(0,0,0,0)" fill="none" stroke-width="19" stroke-linecap="round" />
  </slot>
</template>

<script setup>

  import { defineProps, defineEmits, toRefs, computed, inject } from "vue"

  const props = defineProps({
    position: {
      type: Object,
      required: true,
      properties: {
        x: {
          type: Number,
          required: true
        },
        y: {
          type: String,
          required: true
        },
        direction: {
          type: Object,
          required: false,
          default: null,
          properties: {
            x: {
              type: Number,
              required: true
            },
            y: {
              type: Number,
              required: true
            }
          }
        }
      }
    },
    edge: {
      type: Object,
      required: true,
      properties: {
        type: {
          type: String,
          default: undefined
        },
        src: {
          type: Object,
          required: true,
          properties: {
            node: {
              type: String,
              required: true
            },
            port: {
              type: String,
              required: true
            }
          }
        },
        dest: {
          type: Object,
          required: true,
          properties: {
            node: {
              type: String,
              required: true
            },
            port: {
              type: String,
              required: true
            }
          }
        }
      }
    },
    end: {
      type: String,
      required: true
    },
    endLength: {
      type: Number,
      default: 10
    },
    endDistance: {
      type: Number,
      default: 15
    }
  })

  const { position, edge, end, endLength, endDistance } = toRefs(props)

  const linePath = computed(() => {
    const p = position.value
    const el = endLength.value
    const ed = endDistance.value
    return [
      ...(p.direction ? [
        `M ${p.x + p.direction.x * ed} ${p.y + p.direction.y * ed}`,
        `l ${p.direction.x * el} ${p.direction.y * el}`
      ] : [
        `M ${p.x} ${p.y}`,
      ]),
      `l 0 0`,
    ].join(' ')
  })

  const flow = inject("flow")

  function handleMouseDown(event) {
    event.preventDefault()
    flow.startDragEdgeEnd(edge.value, end.value, event)
  }

  function handleTouchStart(event) {

  }


</script>

<style scoped>

</style>