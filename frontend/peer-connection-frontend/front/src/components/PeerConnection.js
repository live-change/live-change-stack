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

  const sendQueue = []
  let sendingPromise = null
  async function sendMessagesQueue() {
    if(!sendingPromise) sendingPromise = (async () => {
      while(sendQueue.length && !peer.finished.value) {
        const messages = sendQueue.slice(0, 23)
        console.log("SENDING PEER MESSAGES", messages)
        const requestTimeout = 10000
        const request = {
          from: peer.peerId,
          to,
          messages,
          _commandId: messages[0]._commandId || api.uid()
        }
        while(true) {
          try {
            await api.requestWithSettings({ requestTimeout }, ['peerConnection', 'postMessages'], request)
            sendQueue.splice(0, messages.length)
            break
          } catch(error) {
            console.error("SENDING PEER MESSAGES ERROR", error)
          }
        }
      }
      sendingPromise = null
    })()
    return sendingPromise
  }

  function sendMessage(message) {
    //console.log("SENDING PEER MESSAGE", message)
    message.sent = message.sent || new Date().toISOString()
    message._commandId = message._commandId || api.uid()
    sendQueue.push(message)
    sendMessagesQueue()
  }

  async function restartConnection() {
    console.log("RESTARTING CONNECTION")
    /*if(false && rtc.value.restartIce) {
      console.log("RESTART ICE!")
      rtc.value.restartIce()
    } else {*/
    console.log("RESTART OFFER!")
    createOffer()
  }
  
  watch(clientIp, ip => {
    if(rtc.value) restartConnection()
  })

  let lastOfferId = 0
  async function createOffer(){
    if(state.value === 'rollback') return // if it's rollbacked there is no need for offer
    const offerId = ++lastOfferId
    state.value = 'creating-offer'
    console.log("CREATING OFFER")
    const offer = await rtc.value.createOffer(offerOptions.value || undefined)
    if(rtc.value.signalingState !== "stable") {
      console.log("RTC GOT OUT OF STABLE WHILE CREATING OFFER. IGNORE GENERATED OFFER!")
      return
    }
    if(offerId !== lastOfferId) {
      console.log("OFFER ID CHANGED WHILE CREATING OFFER. IGNORE GENERATED OFFER!")
      return
    }
    await rtc.value.setLocalDescription(offer)
    console.log("SDP OFFER SET! RTC IN STATE", rtc.value.signalingState)
    sendMessage({ type: "sdp", data: offer })
    state.value = 'sent-offer'
  }

  let lastAnswerId = 0
  async function createAnswer(){
    const answerId = ++lastAnswerId
    state.value = 'creating-answer'
    console.log("CREATING ANSWER")
    const answer = await rtc.value.createAnswer(answerOptions.value || undefined)
    if(rtc.value.signalingState !== "have-remote-offer") {
      console.log("RTC GOT OUT OF HAVE REMOTE OFFER WHILE CREATING ANSWER. IGNORE GENERATED ANSWER!")
      return
    }
    if(answerId !== lastAnswerId) {
      console.log("ANSWER ID CHANGED WHILE CREATING ANSWER. IGNORE GENERATED ANSWER!")
      return
    }
    await rtc.value.setLocalDescription(answer)
    console.log("SDP ANSWER SET! RTC IN STATE", rtc.value.signalingState)
    sendMessage({ type: "sdp", data: answer })
    state.value = 'sent-answer'
  }

  async function handleNegotiationNeeded(event) {
    console.log("NEGOTIATION NEEDED! IN RTC STATE", rtc.value.signalingState, "STATE", state.value)
    if(!isEnabled.value) return // if it's disabled there is no need for offer
    await createOffer()
  }

  async function handleSignalingStateChange(event) {
    if(state.value === 'closed') return
    console.log("RTC SIGNALING STATE CHANGE", rtc.value.signalingState)
    rtc.valueSignalingState = rtc.value.signalingState
  }
  async function handleIceCandidate(event) {
    if(state.value === 'closed') return
    //console.log("GOT ICE CANDIDATE", event.candidate && event.candidate.candidate)
    sendMessage({ type: "ice", data: event.candidate })
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

  let lastReceivedMessageSent = ''

  async function handleMessage(message) {
    if(lastReceivedMessageSent > message.sent) {
      console.error("MESSAGE OUT OF ORDER", message)
      throw new Error("Message sent before last received message - message order broken!")
    }
    lastReceivedMessageSent = message.sent
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
        console.log("RECEIVED SDP", message.data.type, "IN RTC STATE", rtc.value.signalingState, "STATE", state.value)
        if(message.data.type === 'offer') {
          if(rtc.value.signalingState !== "stable"
            || state.value === 'sent-offer' || state.value === 'creating-offer') {
            console.log("SDP CONFLICT, RECEIVED OFFER WHEN CREATING/GOT OFFER")
            if(isPolite.value) {
              console.log("I AM POLITE SO I WILL ROLLBACK RTC STATE MACHINE")
              lastOfferId ++ // ignore currently creating offer
              state.value = 'rollback'
              if(rtc.value.signalingState !== "stable") {
                console.log("RTC NOT STABLE! ROLLBACK NEEDED!")
                await rtc.value.setLocalDescription({ type: "rollback" })
                console.log("ROLLBACK DONE!")
              }
              await rtc.value.setRemoteDescription(message.data)
              await createAnswer()
            } else {
              console.log("I AM NOT POLITE SO I WILL IGNORE OFFER")
            }
          } else {
            console.log("SDP STATE GOOD!")
            await rtc.value.setRemoteDescription(message.data)
            await createAnswer()
          }
        } else {
          console.log("GOT ANSWER FROM REMOTE PEER")
          await rtc.value.setRemoteDescription(message.data)
        }
      } break;
      case "ice": {
        console.log("RECEIVED ICE! IN STATE", rtc.value.signalingState)
        console.log("ICE TIMESTAMP", message.timestamp, 'SENT', message.sent)
        if(rtc.value.signalingState === "have-local-offer") {
          console.log("IGNORE ICE IN THIS STATE")
          return;
        }
        let ice = message.data
        //if(ice && ice.candidate === "") break;
        if(ice && ice.candidate) {
          console.log("ADDING ICE CANDIDATE", ice.candidate)
          await rtc.value.addIceCandidate(new RTCIceCandidate(ice))
        } else {
          console.log("ICE CANDIDATE WITHOUT CANDIDATE - ICE CANDIDATES END", ice)
          if(window.RTCPeerConnection.prototype.addIceCandidate.length === 0){
            await rtc.value.addIceCandidate()
          }
        }
        //console.log("REMOTE ICE CANDIDATE ADDED", ice && ice.candidate)
      } break;
      case "ping": {
        sendMessage({ type: "pong", data: message.data})
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
    window.rtc = rtc.value
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
