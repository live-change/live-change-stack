<template>
  <div ref="viewport" class="overflow-hidden bg-gray-300"
       @mousedown.capture="handleMouseDown"
       @wheel.capture="handleWheel"
       @mousemove="handleMouseMove"
       @mouseup="handleMouseUp"
       @mouseleave="handleMouseLeave">
<!--    <pre class="absolute text-xs">{{ JSON.stringify({
      ...dragState,
      node: undefined
    }, null, 2) }}</pre>-->
    <div ref="container"
         class="bg-white"
         :style="{
           transform, transformOrigin: '0 0',
           width: flow?.size?.width + 'px', height: flow?.size?.height + 'px'
         }">
<!--      <pre class="absolute text-xs">{{ JSON.stringify(freeEdge, null, 2) }}</pre>-->
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute w-full h-full pointer-events-none">
        <slot name="background-edges" v-bind="flow" />
      </svg>
      <slot v-bind="flow" />
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute w-full h-full pointer-events-none">
        <slot name="foreground-edges" v-bind="flow" />
        <slot name="free-edge" v-bind="{ freeEdge, flow }" />
      </svg>
    </div>
  </div>
</template>

<script setup>

  import { defineProps, defineEmits, toRefs, reactive, ref, onMounted, onUnmounted, watch, computed } from "vue"
  import { useFlow } from "./index.js"

  const viewport = ref(null)
  const container = ref(null)

  const flow = useFlow()

  watch(() => container.value, (container) => {
    flow.container.value = container
  }, { immediate: true })
  onUnmounted(() => {
    flow.container.value = null
  })

  watch(() => viewport.value, (viewport) => {
    flow.viewport.value = viewport
  }, { immediate: true })
  onUnmounted(() => {
    flow.viewport.value = null
  })

  const transform = computed(() => {
    return `translate(${flow.position.x}px, ${flow.position.y}px) scale(${flow.scale.value})`
  })

  const dragState = flow.dragState

  const freeEdge = computed(() => {
    if(!dragState.value) return null
    if(dragState.value.type == "drawEdge") {
      return {
        src: {
          node: dragState.value.node,
          port: dragState.value.port
        },
        dest: {
          x: mousePosition.x,
          y: mousePosition.y
        }
      }
    }
    return null
  })

  const mousePosition = reactive({ x: 0, y: 0 })

  const dragHandlers = {
    dragNode(event, position) {
      const { node, initialPosition, startPosition } = dragState.value
      const dx = position.x - startPosition.x
      const dy = position.y - startPosition.y
      node.position.x = initialPosition.x + dx
      node.position.y = initialPosition.y + dy
      flow.invalidateNodeView(node)
      setTimeout(() => {
        flow.invalidateNodeView(node)
      }, 0)
    },
    pan(event, position) {
      const { initialPosition, startPosition } = dragState.value
      const dx = event.clientX - startPosition.x
      const dy = event.clientY - startPosition.y
      flow.updatePositionAndScale(
        initialPosition.x + dx,
        initialPosition.y + dy,
        flow.scale.value
      )
    }
  }

  const dragEndHandlers = {
    dragNode(event) {
    },
    drawEdge(event) {
      const searchPosition = { x: mousePosition.x, y: mousePosition.y }
      const maxDistance = flow.options.edgeConnectDistance ?? 23
      const { nodeView, portView } = flow.getNearestPortView(searchPosition, maxDistance,
          (node, port) => flow.options.isConnectable
              ? flow.options.isConnectable(dragState.value.node, dragState.value.port, node, port) : true
      )
      if(portView) {
        const newEdge = {
          id: flow.generateEdgeId(),
          ...dragState.value.edge,
          src: {
            node: dragState.value.node,
            port: dragState.value.port
          },
          dest: {
            node: nodeView.node,
            port: portView.port
          }
        }
        if(flow.options.connect) {
          flow.options.connect(newEdge)
        } else {
          flow.edges.push(newEdge)
        }
      }
    },
  }

  function handleMouseDown(event) {
    //console.log("handleMouseDown", event, event.target)
    if(event.target == viewport.value || event.target == container.value) {
      event.preventDefault()
      event.stopPropagation()
      dragState.value = {
        type: "pan",
        startPosition: {
          x: event.clientX,
          y: event.clientY
        },
        initialPosition: {
          x: flow.position.x,
          y: flow.position.y
        }
      }
    }
  }

  function handleWheel(event) {
    if(event.target == viewport.value || event.target == container.value) {
      event.preventDefault()
      event.stopPropagation()
      const delta = event.deltaY
      if(delta > 0) {
        flow.zoom(event, 0.8)
      }
      if(delta < 0) {
        flow.zoom(event, 1.25)
      }
    }
  }

  function handleMouseMove(event) {
    const position = flow.getEventPosition(event)
    mousePosition.x = position.x
    mousePosition.y = position.y
    if(!dragState.value) return
    const handler = dragHandlers[dragState.value.type]
    if(handler) handler(event, mousePosition)
  }

  function handleMouseUp(event) {
    if(!dragState.value) return
    handleMouseMove(event)
    const handler = dragEndHandlers[dragState.value.type]
    if(handler) handler(event, mousePosition)
    dragState.value = null
  }

  function handleMouseLeave(event) {
    if(!dragState.value) return
    const handler = dragEndHandlers[dragState.value.type]
    if(handler) handler(event, mousePosition)
    dragState.value = null
  }


</script>

<style scoped>

</style>