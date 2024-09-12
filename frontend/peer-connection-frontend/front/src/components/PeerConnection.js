import { ref, isRef, onUnmounted, getCurrentInstance, unref, reactive, computed, watch } from 'vue'
import { path, live, actions, api as useApi, inboxReader } from '@live-change/vue3-ssr'

const createPeerConnection = (peer, to) => {
  const waitingMessages = ref([])
  const state = ref("created")
  const rtc = ref(null)
  const rtcSignalingState = ref("")
  const iceGatheringState = ref("")
  const iceConnectionState = ref("")
  const rtpSenders = ref([])
  const offerOptions = ref(null)
  const answerOptions = ref(null)
  const remoteTracks = ref([])
  const restartOnDisconnect = ref(false) // because could not set rtc configuration(firefox)

  const localTracks = computed(() => peer.localTracks.value)
  const rtcConfiguration = computed(() => peer.rtcConfiguration.value)
  const clientIp = computed(() => peer.clientIp.value)
  const isPolite = computed(() => peer.peerId < to)

  const isEnabled = computed(() => state.value !== 'closed' && state.value !== 'created')

  function synchronizeLocalTracks() {
    console.log("SYNCHRONIZE LOCAL TRACKS")
    const tracks = isEnabled.value ? localTracks.value : []
    let removedSenders = []
    for(const senderInfo of rtpSenders.value) {
      const trackInfo = tracks.find(trackInfo => trackInfo.track === senderInfo.sender.track)
      if(!trackInfo) {
        rtc.value.removeTrack(senderInfo.sender)
        removedSenders.push(senderInfo)
      } else if(senderInfo.stream !== trackInfo.stream) {
        senderInfo.stream = trackInfo.stream
        senderInfo.sender.setStreams(trackInfo.stream)
      }
    }
    for(const removedSenderInfo of removedSenders) {
      rtpSenders.value.splice(rtpSenders.value.indexOf(removedSenderInfo), 1)
    }
    for(const trackInfo of tracks) {
      if(rtpSenders.value.find(senderInfo => senderInfo.sender.track === trackInfo.track)) continue; // existing track
      const sender = rtc.value.addTrack(trackInfo.track, trackInfo.stream)
      rtpSenders.value.push({ sender, stream: trackInfo.stream })
    }
  }
  
  watch(() => isEnabled.value && localTracks.value, () => synchronizeLocalTracks(), { immediate: true, deep: true })
  
  watch(rtcConfiguration, configuration => {
    if(rtc.value) {
      if(rtc.value.setConfiguration) {
        rtc.value.setConfiguration(configuration)
      } else {
        restartOnDisconnect.value = true
      }
    }
  })

  async function restartConnection() {
    console.log("RESTARTING CONNECTION")
    /*if(false && rtc.value.restartIce) {
      console.log("RESTART ICE!")
      rtc.value.restartIce()
    } else {*/
    console.log("RESTART OFFER!")
    const offer = 
      await rtc.value.createOffer({ ...offerOptions.value, iceRestart: true })
    if(rtc.value.signalingState !== "stable") {
      console.log("RTC GOT OUT OF STABLE WHILE CREATING OFFER. IGNORE GENERATED OFFER!")
      return
    }
    await rtc.value.setLocalDescription(offer)
    peer.sendMessage({ to, type: "sdp", data: offer })
  }
  
  watch(clientIp, ip => {
    if(rtc.value) restartConnection()
  })

  async function handleNegotiationNeeded(event) {
    console.log("NEGOTIATION NEEDED! IN STATE", rtc.value.signalingState)
    if(!isEnabled.value) return
    if(state.value === 'negotiating') {
      console.log("SKIP NESTED NEGOTIATIONS WITH", to)
      //return
    }
    state.value = 'negotiating'
    // if it's disabled there is no need for offer
    console.log("UPDATING OFFER")
    const offer = await rtc.value.createOffer(offerOptions.value || undefined)
    if(rtc.value.signalingState !== "stable") {
      console.log("RTC GOT OUT OF STABLE WHILE CREATING OFFER. IGNORE GENERATED OFFER!")
      return;
    }
    await rtc.value.setLocalDescription(offer)
    peer.sendMessage({ to, type: "sdp", data: offer })
    console.log("SDP OFFER SET! RTC IN STATE", rtc.value.signalingState)
  }

  async function handleSignalingStateChange(event) {
    if(state.value === 'closed') return
    console.log("RTC SIGNALING STATE CHANGE", rtc.value.signalingState)
    rtc.valueSignalingState = rtc.value.signalingState
  }
  async function handleIceCandidate(event) {
    if(state.value === 'closed') return
    //console.log("GOT ICE CANDIDATE", event.candidate && event.candidate.candidate)
    peer.sendMessage({ to, type: "ice", data: event.candidate })
  }
  function handleTrack(event) {
    if(state.value === 'closed') return
    const track = event.track
    let stream = event.streams && event.streams[0]
    if(!stream) {
      console.error(`Streamless track ${track.id} ${track.kind} from peer ${to} - something is wrong!`)
      stream = new MediaStream([track])
    }
    const trackInfo = {
      track: event.track,
      stream,
      muted: track.muted,
      removeTrackHandler: () => {
        const trackIndex = remoteTracks.value.findIndex(remoteTrack =>
          remoteTrack.track === track && remoteTrack.stream === stream)
        if(trackIndex !== -1) {
          const trackInfo = remoteTracks.value[trackIndex]
          trackInfo.track.removeEventListener('mute', trackInfo.muteHandler)
          trackInfo.track.removeEventListener('unmute', trackInfo.unmuteHandler)
          remoteTracks.value.splice(trackIndex, 1)
        }
      },
      muteHandler: () => trackInfo.muted = track.muted,
      unmuteHandler: () => trackInfo.muted = track.muted
    }
    if(stream) {
      stream.addEventListener('removetrack', trackInfo.removeTrackHandler)
    }
    const existingTrackInfo = remoteTracks.value.find(remoteTrack => remoteTrack.track === track)
    if(existingTrackInfo) {
      existingTrackInfo.stream = stream // Track stream changed
    } else {
      trackInfo.track.addEventListener('mute', trackInfo.muteHandler)
      trackInfo.track.addEventListener('unmute', trackInfo.unmuteHandler)
      remoteTracks.value.push(trackInfo)
    }
  }
  function handleIceGatheringStateChange(event) {
    if(state.value === 'closed') return
    console.log("ICE GATHERING STATE CHANGED", rtc.value.iceGatheringState)
    iceGatheringState.value = rtc.value.iceGatheringState
  }
  function handleIceConnectionStateChange(event) {
    if(state.value === 'closed') return
    iceConnectionState.value = rtc.value.iceConnectionState
    console.log("ICE GATHERING STATE CHANGED", rtc.value.iceConnectionState)
    if(iceConnectionState.value === 'connected') {
      state.value = 'connected'
    }
    if(iceConnectionState.value === 'failed') {
      state.value = 'failed'
      restartConnection()
    }
    if(iceConnectionState.value === 'disconnected') {
      state.value = 'disconnected'
    }
  }

  async function handleMessage(message) {
    //console.log("PC", to, "HANDLE MESSAGE", message)
    if(state.value === 'created') {
      console.log("ADD MESSAGE TO WAITING QUEUE")
      waitingMessages.value.push(message)
      return
    }
    if(state.value === 'close') return
    //console.log("DO HANDLE MESSAGE")
    switch(message.type) {
      case "sdp": {
        console.log("RECEIVED SDP", message.data.type, "IN STATE", rtc.value.signalingState)
        if(message.data.type === 'offer') {
          if(rtc.value.signalingState !== "stable") {
            console.log("SDP CONFLICT, RECEIVED OFFER IN UNSTABLE STATE")
            if(isPolite.value) {
              console.log("I AM POLITE SO I WILL ROLLBACK RTC STATE MACHINE")
              await rtc.value.setLocalDescription({ type: "rollback" })
              await rtc.value.setRemoteDescription(message.data)
              console.log("ROLLBACK DONE")
              const answer =
                await rtc.value.createAnswer(answerOptions.value || undefined)
              console.log("GOT RTC ANSWER IN STATE", rtc.value.signalingState)
              await rtc.value.setLocalDescription(answer)
              console.log("LOCAL ANSWER DESCRIPTION SET! SENDING ANSWER!")
              peer.sendMessage({ to, type: "sdp", data: answer })
            } else {
              console.log("I AM NOT POLITE SO I WILL IGNORE OFFER")
            }
          } else {
            console.log("SDP STATE GOOD!")
            await rtc.value.setRemoteDescription(message.data)
            const answer =
              await rtc.value.createAnswer(answerOptions.value || undefined)
            console.log("GOT RTC ANSWER IN STATE", rtc.value.signalingState)
            await rtc.value.setLocalDescription(answer)
            console.log("LOCAL ANSWER DESCRIPTION SET! SENDING ANSWER!")
            peer.sendMessage({ to, type: "sdp", data: answer })
          }
        } else {
          console.log("GOT ANSWER FROM REMOTE PEER")
          await rtc.value.setRemoteDescription(message.data)
        }
      } break;
      case "ice": {
        console.log("RECEIVED ICE! IN STATE", rtc.value.signalingState)
        let ice = message.data
        //if(ice && ice.candidate === "") break;
        if(ice && ice.candidate !== "") {
          console.log("ADDING ICE CANDIDATE", ice.candidate)
          await rtc.value.addIceCandidate(new RTCIceCandidate(ice))
        } else if(window.RTCPeerConnection.prototype.addIceCandidate.length === 0){
          await rtc.value.addIceCandidate()
        }
        //console.log("REMOTE ICE CANDIDATE ADDED", ice && ice.candidate)
      } break;
      case "ping": {
        peer.sendMessage({ to, type: "pong", data: message.data})
      } break;
      case "pong": break; // ignore pong
      default:
        console.error("Unknown peer message", message)
    }
  }

  async function connect() {
    console.log("PeerConnection connect")
    if(rtc.value) throw new Error("can't connect twice!")
    state.value = 'connecting'
    rtc.value = new RTCPeerConnection(rtcConfiguration.value)
    rtcSignalingState.value = rtc.value.signalingState
    iceGatheringState.value = rtc.value.iceGatheringState
    iceConnectionState.value = rtc.value.iceConnectionState
    rtc.value.addEventListener('negotiationneeded', handleNegotiationNeeded)
    rtc.value.addEventListener('signalingstatechange', handleSignalingStateChange)
    rtc.value.addEventListener('icecandidate', handleIceCandidate)
    rtc.value.addEventListener('track', handleTrack)
    rtc.value.addEventListener('icegatheringstatechange', handleIceGatheringStateChange)
    rtc.value.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange)
    for(const message of waitingMessages.value) {
      try {
        await handleMessage(message)
      } catch(error) {
        console.error("MESSAGE", message, "HANDLING ERROR", error)
      }
    }
    waitingMessages.value = []
  }
  function close() {
    console.log("PeerConnection close")
    state.value = 'closed'
    if(rtc.value) {
      rtc.value.removeEventListener('negotiationneeded', handleNegotiationNeeded)
      rtc.value.removeEventListener('signalingstatechange', handleSignalingStateChange)
      rtc.value.removeEventListener('icecandidate', handleIceCandidate)
      rtc.value.removeEventListener('track', handleTrack)
      rtc.value.removeEventListener('icegatheringstatechanged', handleIceGatheringStateChange)
      rtc.value.removeEventListener('iceconnectionstatechanged', handleIceConnectionStateChange)
      rtc.value.close()
      rtpSenders.value = []
      rtc.value = null
    }
  }
  
  function dispose() {
    if(state.value !== 'closed') {
      close()
    }
  }

  const summary = computed(() => ({
    to: to,
    state: state.value,
    isPolite: isPolite.value,
    waitingMessages: waitingMessages.value.length,
    rtpSenders: rtpSenders.value.map(({ sender, stream }) => {
      const { id, kind, label } = sender.track
      return { id, kind, label, stream: stream.id }
    }),
    rtcSignalingState: rtcSignalingState.value,
    iceGatheringState: iceGatheringState.value,
    iceConnectionState: iceConnectionState.value,
    remoteTracks: remoteTracks.value.map(({ track, stream }) => {
      const { id, kind, label, muted } = track
      return { id, kind, label, muted, stream: stream.id }
    }),
    connected: iceConnectionState.value === 'connected',
  }))

  return {
    to,
    state,
    isPolite,
    isEnabled,
    summary,
    remoteTracks,
    connect,
    close,
    restartConnection,
    handleMessage,
    dispose,
  }

}

export { createPeerConnection }
