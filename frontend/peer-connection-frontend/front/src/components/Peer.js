import { ref, isRef, onUnmounted, getCurrentInstance, unref, reactive, computed, watch } from 'vue'
import { usePath, live, actions, api as useApi, inboxReader } from '@live-change/vue3-ssr'
import { createPeerConnection } from "./PeerConnection.js"

let lastInstanceId = 0

const createPeer = async ({
  channelType, channel, instance, online, onUnmountedCb, appContext,
  localTracks
}) => {
  if(!appContext) appContext = (typeof window != 'undefined') && getCurrentInstance()?.appContext
  if(!isRef(localTracks)) {
    localTracks = ref(localTracks ?? [])
  }
  if(!isRef(online)) {
    online = ref(online ?? false)
  }
  if(!onUnmountedCb && typeof window != 'undefined') {
    if(getCurrentInstance()) {
      onUnmountedCb = onUnmounted
    } else {
      onUnmountedCb = () => {
        console.error("peer outside component instance - leak possible")
      }
    }
  }

  if(!instance) instance = window.__WINDOW_ID__ + '.' + (++lastInstanceId)

  const api = useApi()

  const peerId = [channelType, channel, api.client.value.session, instance].join(':')

  console.log("CREATE PEER!")

  const path = usePath()
  const [
    peers,
    peerOnline,
    turnConfiguration
  ] = await Promise.all([
    live(path.peerConnection.peers({ channelType, channel }, appContext)
      .with(peer => path.peerConnection.peerState({ peer: peer.id }).bind('peerState'))
    ),
    live(path.online.session({ group: 'peer', peer: peerId }), appContext),
    live(path.peerConnection.turnConfiguration({ peer: peerId }), appContext)
  ])

  const localPeerState = ref(null)

  const finished = ref(false)
  const connections = ref([])
  const waitingConnections = ref([]) // connections that are not initialized, but messages are received

  const otherPeers = computed(() => peers.value?.filter(peer => peer.id !== peerId))
  const otherPeersOnline = computed(() => otherPeers.value?.filter(peer => peer.peerState?.online))
  const isConnectionPossible = computed(() => online.value && (!!turnConfiguration.value))

  const rtcConfiguration = computed(() => ({
    iceServers: [ turnConfiguration.value ],
    iceTransportPolicy: 'all', // 'all' or 'relay',
    bundlePolicy: 'balanced'
  }))
  const clientIp = computed(() => turnConfiguration.value?.clientIp)

  const anyLocalAudioEnabled = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind === 'audio' && trackInfo.enabled))
  const anyLocalVideoEnabled = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind === 'video' && trackInfo.enabled))
  const anyLocalAudioAvailable = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind === 'audio'))
  const anyLocalVideoAvailable = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind === 'video'))
  const computedLocalPeerState = computed(() => ({
    online: online.value,
    audioState: anyLocalAudioAvailable.value ? (anyLocalAudioEnabled.value ? "enabled" : "muted") : "none",
    videoState: anyLocalVideoAvailable.value ? (anyLocalVideoEnabled.value ? "enabled" : "muted") : "none"
  }))

  function sendPeerStateUpdate(update) {
    const requestTimeout = 10000
    api.requestWithSettings({ requestTimeout },
      ['peerConnection', 'setPeerState'], update)
      .catch(error => {
        console.error("SET PEER STATE ERROR", error)
        if(error === 'timeout' && !finished.value
          && JSON.stringify({ ...localPeerState.value, ...update }) === JSON.stringify(localPeerState)
        ) {
          console.log("RETRYING")
          sendPeerStateUpdate()
        }
      })
  }
  function updatePeerState(newState) {
    const updated = { ...localPeerState.value, ...newState }
    if(JSON.stringify(updated) !== JSON.stringify(localPeerState.value)) {
      localPeerState.value = updated
      const update = { ...updated, peer: peerId, _commandId: api.uid() }
      sendPeerStateUpdate(update)
    }
  }
  watch(computedLocalPeerState, (newState) => updatePeerState(newState), { immediate: true })

  const messagesReader = inboxReader(
    (rawPosition, bucketSize) => {
      const path = ['peerConnection', 'messages', {
        peer: peerId, gt: rawPosition, limit: bucketSize
      }]
      console.log("P", path)
      return path
    },
    (message) => {
      console.log("GOT MESSAGE!", message)
      //console.log("HANDLE PEER MESSAGE", message)
      if(message.from) {
        let connection = connections.value.find(c => c.to === message.from)
        if(!connection) connection = waitingConnections.value.find(c => c.to === message.from)
        if(!connection) {
          connection = createPeerConnection(peerInternal, message.from)
          waitingConnections.value.push(connection)
        }
        connection.handleMessage(message)
      } else {
        throw new Error('messages from server not implemented')
      }
    },
    '',
    {
      bucketSize: 32,
      context: appContext
    }
  )

  function sendMessage(message) {
    console.log("SENDING PEER MESSAGE", message)
    message.from = peerId
    message.sent = message.sent || new Date().toISOString()
    message._commandId = message._commandId || api.uid()
    const requestTimeout = 10000
    //console.log("SENDING PEER MESSAGE", message)
    api.requestWithSettings({ requestTimeout }, ['peerConnection', 'postMessage'], message)
      .catch(error => {
        console.log("PEER MESSAGE ERROR", error)
        if(error === 'timeout' && !finished.value) {
          console.log("RETRYING")
          sendMessage(message)
        }
      })
  }

  function updateConnections() {
    const peers = isConnectionPossible.value ? otherPeersOnline.value : []
    for(let connectionId = 0; connectionId < connections.value.length; connectionId++) {
      const connection = connections.value[connectionId]
      const connectionPeer = peers.find(peer => peer.id === connection.to)
      if(!connectionPeer) {
        connection.close()
        connection.dispose()
        connections.value.splice(connectionId, 1)
        connectionId --
      }
    }
    for(const peer of peers) {
      let peerConnection = connections.value.find(connection => connection.to === peer.id)
      if(peerConnection) continue;
      const peerConnectionId = waitingConnections.value.findIndex(connection => connection.to === peer.id)
      if(peerConnectionId !== -1) { // use waiting connection with cached messages
        peerConnection = waitingConnections.value[peerConnectionId]
        waitingConnections.value.splice(peerConnectionId, 1)
      } else { // create connection
        peerConnection = createPeerConnection(peerInternal, peer.id)
      }
      connections.value.push(peerConnection)
      peerConnection.connect()
    }
  }

  watch(() => isConnectionPossible.value && otherPeersOnline.value, () => {
    updateConnections()
  }, { immediate: true })

  onUnmountedCb(() => {
    finished.value = true
    messagesReader.dispose()
    for(const connection of waitingConnections.value) {
      connection.dispose()
    }
    for(const connection of connections.value) {
      connection.dispose()
    }
  })

  const summary = computed(() => ({
    peerId, online: online.value, finished: finished.value,
    computedLocalPeerState: computedLocalPeerState.value,
    peers: peers.value?.length,
    otherPeers: otherPeers.value?.map(p => p.peerState ?? p.id),
    connections: connections.value?.map(connection => connection.summary),
    waitingConnections: waitingConnections.value?.map(connection => connection.summary),
    localTracks: localTracks.value?.map(({ track, stream, enabled }) => {
      const { id, kind, label, muted } = track
      return { id, kind, label, muted, enabled, stream: stream.id }
    }),
    turnConfiguration: turnConfiguration.value && {
      ...turnConfiguration.value,
      expire: new Date((+turnConfiguration.value.username.split(':')[0])*1000).toLocaleString()
    },
    isConnectionPossible: isConnectionPossible.value,
    //rtcConfiguration: rtcConfiguration.value
  }))

  function setTrackEnabled(track, v) {
    track.enabled = v
    track.track.enabled = v
  }

  const peerPublic = {
    peerId, online, isConnectionPossible,
    connections, localTracks,
    otherPeers,
    summary,
    setTrackEnabled,
  }

  const peerInternal = {
    ...peerPublic,
    rtcConfiguration,
    clientIp,
    sendMessage
  }

  return {
    ...peerPublic
  }

  /*

    beforeDestroy() {

    }
  })*/
}

export { createPeer }