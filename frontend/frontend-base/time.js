import { ref } from 'vue'

export const currentTime = ref(NaN)
export const realTime = ref(false)
let updateInterval = null

function updateCurrentTime() {
  if(realTime) {
    currentTime.value = Date.now()
  }
}

export function setTime(time) {
  currentTime.value = time
}

export function startRealTime() {
  currentTime.value = Date.now()
  realTime.value = true
  updateInterval = setInterval(updateCurrentTime, 500)
}

export function now() {
  if (realTime.value) {
    return Date.now()
  } else {
    return currentTime.value
  }
}

