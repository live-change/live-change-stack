<template>
  <slot v-bind="{ bezierPath }">
    <path :d="bezierPath" stroke="black" fill="none" stroke-width="10" stroke-linecap="round" />
  </slot>
</template>

<script setup>

  import { defineProps, defineEmits, toRefs, computed } from "vue"

  const props = defineProps({
    src: {
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
    dest: {
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
    endpointLength: {
      type: Number,
      required: false,
      default: 90
    },
  })

  const { src, dest, endpointLength } = toRefs(props)

  const bezierPath = computed(() => {
    const f = src.value
    const t = dest.value
    const el = endpointLength.value
    const dx = t.x - f.x
    const dy = t.y - f.y
    const fdx = f.direction?.x ?? 0
    const fdy = f.direction?.y ?? 0
    const tdx = t.direction?.x ?? 0
    const tdy = t.direction?.y ?? 0
    return [
      `M ${f.x} ${f.y}`,
      `c ${fdx * el} ${fdy * el}, ${dx + tdx * el} ${dy + tdy * el}, ${dx} ${dy}`
      //`l ${dx} ${dy}`,
    ].join(' ')
  })

</script>

<style scoped>

</style>