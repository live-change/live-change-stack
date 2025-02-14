<template>
  <div class="w-full relative surface-400 overflow-hidden" ref="dragArea"
       @mousedown="handleEditorMouseDown"
       @mouseup="handleEditorMouseUp"
       @mouseout="handleEditorMouseOut"
       @mousemove="handleEditorMouseMove"
       @touchstart="handleEditorTouchStart"
       @touchend="handleEditorTouchEnd"
       @touchcancel="handleEditorTouchCancel"
       @touchmove="handleEditorTouchMove"
       @wheel="handleEditorWheel">
    <div class="p-4 md:p-5 lg:p-6 flex flex-row justify-content-center align-items-center">
      <div class="w-full relative"
           :style="`aspect-ratio: ${aspectRatio}; max-width: 40vh;`"
           ref="cropArea">
        <div class="absolute left-50 top-50 w-0 h-0">
          <Image :image="sourceImage"
                 :style="{ width: `${rectSize?.x}px`, transform: imageTransform }"
                 @size="handleImageSize" />
        </div>
      </div>
    </div>
    <canvas class="absolute w-full h-full left-0 top-0 pointer-events-none" ref="overlayCanvas" />
  </div>
</template>

<script setup>

  import Image from "./Image.vue"

  import { ref, reactive, watch, computed, onMounted, defineEmits, defineExpose } from 'vue'
  import { toRefs, useResizeObserver, useDebounceFn } from '@vueuse/core'
  import { getElementPositionInElement, getElementPositionInWindow } from "./dom"
  import { loadImage, imageToCanvas } from "./imageUtils.js"

  const props = defineProps({
    sourceImage: { // image
      type: String,
      required: true
    },
    sourceUpload: {
      type: Object,
      default: null
    },
    aspectRatio: {
      type: Number,
      default: 1
    },
    fill: {
      type: Boolean,
      default: true
    },
    ready: {
    },
    type: {
      type: String,
      default: 'rect' // or 'circle'
    },
    crop: {
      type: Object,
      default: () => ({ x: 0, y: 0, zoom:1, orientation: 0 })
    }
  })

  const emit = defineEmits(['update:ready'])

  const { sourceImage, aspectRatio, fill, sourceUpload } = toRefs(props)

  const overlayCanvas = ref()
  const cropArea = ref()
  const dragArea = ref()

  const rectSize = ref()

  function repaintOverlayCanvas() {
    console.log('canvas', overlayCanvas)
    const canvas = overlayCanvas.value
    const content = cropArea.value
    const editor = dragArea.value
    if(!canvas) return
    if(!content) return
    if(!editor) return
    const pixelRatio = window.devicePixelRatio || 1
    if((canvas.width !== Math.floor(canvas.clientWidth * pixelRatio))
      || (canvas.height !== Math.floor(canvas.clientHeight * pixelRatio))) {
      canvas.width = Math.floor(canvas.clientWidth * pixelRatio)
      canvas.height = Math.floor(canvas.clientHeight * pixelRatio)
    }
    const position = getElementPositionInElement(content, editor)
    const size = { x: content.clientWidth, y: content.clientHeight }
    rectSize.value = size
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = 'rgba(0, 0, 0, 0.5)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = "white"
    context.lineWidth = 1.5 * pixelRatio;
    if(props.type === 'circle') {
      context.save()
      context.globalCompositeOperation = 'destination-out'
      context.fillStyle = '#000'
      context.beginPath()
      context.ellipse(
        (position.x + size.x / 2) * pixelRatio,
        (position.y + size.y / 2) * pixelRatio,
        (size.x / 2) * pixelRatio,
        (size.y / 2) * pixelRatio,
        0, 0, 2 * Math.PI
      )
      context.fill()
      context.restore()
      context.beginPath()
      context.ellipse(
        (position.x + size.x / 2) * pixelRatio,
        (position.y + size.y / 2) * pixelRatio,
        (size.x / 2) * pixelRatio,
        (size.y / 2) * pixelRatio,
        0, 0, 2 * Math.PI
      )
      context.stroke()
    } else {
      context.clearRect(position.x * pixelRatio, position.y * pixelRatio,
        size.x * pixelRatio, size.y * pixelRatio)
      context.strokeRect(position.x * pixelRatio, position.y * pixelRatio,
        size.x * pixelRatio, size.y * pixelRatio)
    }
  }

  const repaintDebounced = useDebounceFn(() => repaintOverlayCanvas(), 300)

  useResizeObserver(overlayCanvas, (entries) => repaintDebounced())
  watch(() => [props.width, props.height, props.type], () => repaintDebounced())

  const position = reactive({ x: props.crop.x, y: props.crop.y, scale: props.crop.zoom })
  const imageTransform = computed(() => {
    const x = - position.x * 50
    const y = - position.y * 50
    const s = position.scale
    return `translate(-50%, -50%) scale(${s}) translate(${x}%, ${y}%)`
  })

  const sourceImageSize = ref()
  function handleImageSize(size) {
    console.log("SIZE EVENT", size)
    sourceImageSize.value = size
  }
  const sourceAspectRatio = computed(() => sourceImageSize.value?.width / sourceImageSize.value?.height)

  const minScale = computed(() => {
    if(!sourceImageSize.value) return 0.01
    const imageRatio = sourceAspectRatio.value
    const requiredRatio = aspectRatio.value
    if(fill.value) {
      return (imageRatio > requiredRatio)
        ? (imageRatio / requiredRatio)
        : 1
    } else {
      return (imageRatio > requiredRatio)
        ? 1
        : imageRatio / requiredRatio
    }
  })
  const maxScale = ref(5)

  function updatePosition(x, y, scale) {
    if(scale > maxScale.value) scale = maxScale.value
    if(scale < minScale.value) scale = minScale.value
    const ratio = aspectRatio.value / sourceAspectRatio.value
    let xMin, xMax, yMin, yMax
    if(fill.value) {
      xMin = -1 + (1 / scale)
      xMax = 1 - (1 / scale)
      yMin = -1 + (1 / scale / ratio)
      yMax = 1 - (1 / scale / ratio)
    } else {
      xMin = - 1
      xMax = 1
      yMin = - 1
      yMax = 1
    }
    if(x < xMin) x = xMin
    if(x > xMax) x = xMax
    if(y < yMin) y = yMin
    if(y > yMax) y = yMax
    position.x = x
    position.y = y
    position.scale = scale
  }

  watch(() => [minScale.value, maxScale.value], () => updatePosition(position.x, position.y, position.scale))

  const ready = computed(() => !!sourceImageSize.value)
  console.log("R", ready.value)
  if(ready.value) onMounted(() => emit('update:ready', true))
  watch(() => ready.value, r => {
    console.log("RR", ready.value)
    emit('update:ready', r)
  })

  function preProcessTouch(ev, id) {
    const contentPosition = getElementPositionInWindow(cropArea.value)
    const contentSize = rectSize.value
    const destX = (ev.clientX - contentPosition.x ) / contentSize.x * 2 - 1
    const destY = (ev.clientY - contentPosition.y ) / contentSize.y * 2 - 1
    const ratio = aspectRatio.value / sourceAspectRatio.value
    const srcX = destX / position.scale
    const srcY = destY / position.scale / ratio
    //console.log(destX, destY, "R", ratio, "S", srcX, srcY)
    return {
      id,
      x: srcX,
      y: srcY,
      dx: destX,
      dy: destY
    }
  }

  const dragStart = ref()

  function updateTouches(newTouches) {
    if(!sourceImage.value) return
    const ratio = aspectRatio.value / sourceAspectRatio.value
    const newCenter = newTouches.reduce(
      (a, b) => ({
        x: a.x + b.x / newTouches.length,
        y: a.y + b.y / newTouches.length,
        dx: a.dx + b.dx / newTouches.length,
        dy: a.dy + b.dy / newTouches.length
      }), { x: 0, y: 0, dx:0, dy:0 })
    const newSize = newTouches.length > 1
      ? newTouches.map(t => {
        let x = t.dx - newCenter.dx, y = (t.dy - newCenter.dy)*ratio
        return Math.sqrt(x*x+y*y)
      }).reduce((a,b) => a + b / newTouches.length, 0)
      : 1
    if(newTouches.length === (dragStart.value && dragStart.value.touchCount || 0)) {
      if(!newTouches.length) return
      //console.log("newSize", newSize, "size", this.dragStart.size, "scale", this.dragStart.size * newSize)
      updatePosition(
        dragStart.value.x - newCenter.x,
        dragStart.value.y - newCenter.y,
        dragStart.value.size * newSize
      )
    } else {
      if(newTouches.length) {
        dragStart.value = {
          x: position.x + newCenter.x,
          y: position.y + newCenter.y,
          size: position.scale / newSize,
          touchCount: newTouches.length
        }
      } else {
        dragStart.value = null
      }
    }
  }

  function handleEditorMouseDown(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if(dragArea.value && cropArea.value) updateTouches([ preProcessTouch(ev, 'mouse') ])
  }
  function handleEditorMouseUp(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    updateTouches([ ])
  }
  function handleEditorMouseOut(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    updateTouches([ ])
  }
  function handleEditorMouseMove(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if(dragArea.value && cropArea.value && dragStart.value) updateTouches([ preProcessTouch(ev, 'mouse') ])
  }
  function handleEditorTouchStart(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if(dragArea.value && cropArea.value) updateTouches(
      Array.prototype.slice.call(ev.targetTouches).map(t => preProcessTouch(t, t.identifier))
    )
  }
  function handleEditorTouchEnd(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if(dragArea.value && cropArea.value) updateTouches(
      Array.prototype.slice.call(ev.targetTouches).map(t => preProcessTouch(t, t.identifier))
    )
  }
  function handleEditorTouchCancel(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if(dragArea.value && cropArea.value) updateTouches(
      Array.prototype.slice.call(ev.targetTouches).map(t => preProcessTouch(t, t.identifier))
    )
  }
  function handleEditorTouchMove(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if(dragArea.value && cropArea.value) updateTouches(
      Array.prototype.slice.call(ev.targetTouches).map(t => preProcessTouch(t, t.identifier))
    )
  }
  function handleEditorWheel(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    const rate = 0.2
    if(ev.deltaY > 0) {
      updatePosition(position.x, position.y, position.scale / (1 + rate))
    } else if(ev.deltaY < 0) {
      updatePosition(position.x, position.y, position.scale * (1 + rate))
    }
  }


  async function getSourceImageUrl() {
    if(sourceUpload.value) {
      await sourceUpload.value.prepare()
      if(sourceUpload.value.url) {
        return sourceUpload.value.url
      }
      await sourceUpload.value.upload()
      if(sourceUpload.value.url) {
        return sourceUpload.value.url
      }
    }
    if(!sourceImageSize.value) throw new Error("crop not ready")
    return `/api/image/image/${sourceImage.value}`
  }

  async function getSourceImageCanvas() {
    if(sourceUpload.value?.canvas) return sourceUpload.value.canvas
    const image = await loadImage(await getSourceImageUrl())
    const canvas = imageToCanvas(image)
    return canvas
  }

  async function crop() {
    const ratio = aspectRatio.value / sourceAspectRatio.value
    const xMin = Math.round(((position.x - 1/position.scale) / 2 + 0.5) * sourceImageSize.value.width)
    const xMax = Math.round(((position.x + 1/position.scale) / 2 + 0.5) * sourceImageSize.value.width)
    console.log("X", xMin, xMax)
    const yMin = Math.round(((position.y - 1/position.scale/ratio) / 2 + 0.5) * sourceImageSize.value.height)
    const yMax = Math.round(((position.y + 1/position.scale/ratio) / 2 + 0.5) * sourceImageSize.value.height)
    console.log("Y", yMin, yMax)
    const width = xMax - xMin
    const height = yMax - yMin

    const crop = {
      x: position.x,
      y: position.y,
      zoom: position.scale,
      orientation: 0,
      originalImage: sourceImage.value || sourceUpload.value.id
    }

    const srcXMin = Math.max(0, xMin)
    const srcYMin = Math.max(0, yMin)
    const srcXMax = Math.min(sourceImageSize.value.width, xMax)
    const srcYMax = Math.max(sourceImageSize.value.height, yMax)

    const canvas = await getSourceImageCanvas()
    const context = canvas.getContext('2d')
    let imageData = context.getImageData(srcXMin, srcYMin, srcXMax - srcXMin, srcYMax - srcYMin)
    canvas.width = width
    canvas.height = height
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.putImageData(imageData, srcXMin - xMin, srcYMin - yMin)


    return { crop, canvas }
  }

  defineExpose({
    crop
  })
</script>

<style scoped>

</style>
