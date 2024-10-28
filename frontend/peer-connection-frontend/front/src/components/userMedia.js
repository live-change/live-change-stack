function oldUserMediaFactory() {
  if(navigator.getUserMedia) return (...args) => navigator.getUserMedia(...args)
  if(navigator.webkitGetUserMedia) return (...args) => navigator.webkitGetUserMedia(...args)
  if(navigator.mozGetUserMedia) return (...args) => navigator.mozGetUserMedia(...args)
}

function userMediaFactory() {
  if(typeof window == 'undefined') return null
  if(typeof navigator == 'undefined') return null
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return (constraints) => navigator.mediaDevices.getUserMedia(constraints)
  }
  return (constraints) => new Promise((resolve, reject) => {
    const getUserMedia = oldUserMediaFactory()
    getUserMedia(constraints, resolve, reject)
  })
}

function displayMediaFactory() {
  if(typeof window == 'undefined') return null
  if(typeof navigator == 'undefined') return null
  if(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    return (constraints) => navigator.mediaDevices.getDisplayMedia(constraints)
  }
  return null
}

async function isUserMediaPermitted(constraints = { audio: true, video: true }) {
  if(!navigator.permissions) return true
  console.log("QUERING FOR PERMISSIONS", constraints)
  const { audio, video } = constraints
  const [microphonePermission, cameraPermission] = (await Promise.all([
    audio
        ? navigator.permissions.query({ name: 'microphone' }).catch(err => true)
        : Promise.resolve(null),
    video
        ? navigator.permissions.query({ name: 'camera' }).catch(err => true)
        : Promise.resolve(null)
  ]))
  console.log("MICROPHONE PERMISSION", microphonePermission && microphonePermission.state)
  console.log("CAMERA PERMISSION", cameraPermission && cameraPermission.state)
  if(microphonePermission && microphonePermission.state === 'denied') return false
  if(cameraPermission && cameraPermission.state === 'denied') return false
  return true
}

const getUserMediaNative = userMediaFactory()
const getDisplayMediaNative = displayMediaFactory()

const trackedStreams = []

async function getUserMedia(...args) {
  const stream = await getUserMediaNative(...args)
  trackedStreams.push(stream)
  console.log("STREAM ADDED", stream, "ALL STREAMS", trackedStreams.length)
  return stream
}

async function getDisplayMedia(...args) {
  const stream = await getDisplayMediaNative(...args)
  trackedStreams.push(stream)
  console.log("STREAM ADDED", stream, "ALL STREAMS", trackedStreams.length)
  return stream
}

function stopMedia(stream) {
  const index = trackedStreams.indexOf(stream)
  if(index >= 0) {
    trackedStreams.splice(index, 1)
    console.log("STREAM REMOVED", stream, "ALL STREAMS", trackedStreams.length)
  } else {
    console.error("STREAM NOT FOUND", stream, "ALL STREAMS", trackedStreams)
  }
  if(stream.getTracks) {
    for(const track of stream.getTracks()) {
      track.stop()
    }
  } else {
    stream.stop()
  }
}

export { getUserMedia, getDisplayMedia, isUserMediaPermitted, stopMedia }

