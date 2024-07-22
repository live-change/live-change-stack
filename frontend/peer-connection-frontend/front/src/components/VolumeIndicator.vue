<template>
  <div class="flex flex-row border-circle w-2rem h-2rem bg-primary-800
              align-items-center justify-content-center">
    <div class="volume-indicator-bar bg-white border-round" ref="low"></div>
    <div class="volume-indicator-bar bg-white border-round" ref="mid"></div>
    <div class="volume-indicator-bar bg-white border-round" ref="high"></div>
  </div>
</template>

<style scoped lang="scss">
  .volume-indicator-bar {
    width: 0.3rem;
    margin: 0.1rem;
  }
  .border-circle {
    border-radius: 50%;
  }
  .bg-primary-700 {
    background-color: #1976D2;
  }
</style>

<script setup>

  import { ref, defineProps, computed, toRefs, onMounted, onUnmounted, watch } from 'vue'

  const props = defineProps({
    stream: {
      type: Object,
      required: true
    }
  })

  const { stream } = toRefs(props)

  const speed = 0.46
  const maxVolume = 0.123
  const maxLogVolume = -2
  const minLogVolume = -7
  const lowFrequency = 230
  const midFrequency = 460
  const highFrequency = 1230
  const filterQ = 0.1
  const detune = 100

  const minHeight = 3
  const maxHeight = 15

  const low = ref(null)
  const mid = ref(null)
  const high = ref(null)

  let audioContext, mediaStreamSource
  let lowFilter, midFilter, highFilter
  let lowProcessor, midProcessor, highProcessor
  let lowSlow = 0, midSlow = 0, highSlow = 0


  function measureAmplitudeProcess(cb) {
    return function(event) {
      const numberOfChannels = event.inputBuffer.numberOfChannels
      let instant = 0
      for(let channelId = 0; channelId < numberOfChannels; channelId++) {
        let sum = 0
        const input = event.inputBuffer.getChannelData(channelId)
        for (let i = 0; i < input.length; ++i) {
          sum += input[i] * input[i]
        }
        instant += sum / input.length
      }
      cb(Math.sqrt(instant))
    }
  }

  function handleLow(instant) {
    instant = Math.log(instant)
    let value = lowSlow
    if(!Number.isFinite(value)) value = -1000
    value = instant * speed + value * (1 - speed)
    if(value > maxLogVolume) value = maxLogVolume
    if(value < minLogVolume) value = minLogVolume
    const height = ((value - minLogVolume)/(maxLogVolume - minLogVolume))
      * (maxHeight - minHeight) + minHeight
    lowSlow = value
    low.value.style.height = height + 'px'
  }
  function handleMid(instant) {
    instant = Math.log(instant)
    let value = midSlow
    if(!Number.isFinite(value)) value = -1000
    value = instant * speed + value * (1 - speed)
    if(value > maxLogVolume) value = maxLogVolume
    if(value < minLogVolume) value = minLogVolume
    const height = ((value - minLogVolume)/(maxLogVolume - minLogVolume))
      * (maxHeight - minHeight) + minHeight
    midSlow = value
    mid.value.style.height = height + 'px'
  }
  function handleHigh(instant) {
    instant = Math.log(instant)
    let value = highSlow
    if(!Number.isFinite(value)) value = -1000
    value = instant * speed + value * (1 - speed)
    if(value > maxLogVolume) value = maxLogVolume
    if(value < minLogVolume) value = minLogVolume
    const height = ((value - minLogVolume)/(maxLogVolume - minLogVolume))
      * (maxHeight - minHeight) + minHeight
    highSlow = value
    high.value.style.height = height + 'px'
  }

  function startProcessingAudioStream(sourceStream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()

    lowFilter = audioContext.createBiquadFilter()
    lowFilter.type = 'lowpass'
    lowFilter.frequency.value = lowFrequency
    lowFilter.detune.value = detune
    lowFilter.Q.value = filterQ

    midFilter = audioContext.createBiquadFilter()
    midFilter.type = 'bandpass'
    midFilter.frequency.value = midFrequency
    midFilter.detune.value = detune
    midFilter.Q.value = filterQ

    highFilter = audioContext.createBiquadFilter()
    highFilter.type = 'highpass'
    highFilter.frequency.value = highFrequency
    highFilter.detune.value = detune
    highFilter.Q.value = filterQ

    lowProcessor = audioContext.createScriptProcessor(
      2*2048, 1, 1)
    lowProcessor.addEventListener('audioprocess', measureAmplitudeProcess(a => handleLow(a)))

    midProcessor = audioContext.createScriptProcessor(
      2*2048, 1, 1)
    midProcessor.addEventListener('audioprocess', measureAmplitudeProcess(a => handleMid(a)))

    highProcessor = audioContext.createScriptProcessor(
      2*2048, 1, 1)
    highProcessor.addEventListener('audioprocess', measureAmplitudeProcess(a => handleHigh(a)))

    lowFilter.connect(lowProcessor)
    midFilter.connect(midProcessor)
    highFilter.connect(highProcessor)

    lowProcessor.connect(audioContext.destination)
    midProcessor.connect(audioContext.destination)
    highProcessor.connect(audioContext.destination)

    mediaStreamSource = audioContext.createMediaStreamSource(sourceStream)
    mediaStreamSource.connect(lowFilter)
    mediaStreamSource.connect(midFilter)
    mediaStreamSource.connect(highFilter)
  }

  function stopProcessingAudioStream() {
    if(mediaStreamSource) {
      mediaStreamSource.disconnect()
      mediaStreamSource = null
    }
    if(audioContext) audioContext.close()
  }

  function handleStreamChange() {
    updateSource()
  }

  watch(stream, (newStream, oldStream) => {
    if(oldStream) {
      oldStream.removeEventListener('addtrack', handleStreamChange)
      oldStream.removeEventListener('removetrack', handleStreamChange)
    }
    updateSource()
    if(newStream) {
      newStream.addEventListener('addtrack', handleStreamChange)
      newStream.addEventListener('removetrack', handleStreamChange)
    }
  }, { immediate: true })

  onMounted(() => {
    updateSource()
  })

  function updateSource() {
    console.log("UPDATE SOURCE", stream.value, "STARTED?")
    if(mediaStreamSource) {
      stopProcessingAudioStream()
    }
    if(stream.value && stream.value.getAudioTracks().length > 0) {
      console.log("GOT AUDIO TRACKS!")
      startProcessingAudioStream(stream.value)
    }
  }

  onUnmounted(() => {
    if(stream.value) {
      stream.value.removeEventListener('addtrack', handleStreamChange)
      stream.value.removeEventListener('removetrack', handleStreamChange)
    }
    stopProcessingAudioStream()
  })

</script>

<style scoped>

</style>