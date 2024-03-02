import { ref, isRef, onUnmounted, getCurrentInstance, unref, reactive, computed } from 'vue'
import { path, live, actions, api as useApi } from '@live-change/vue3-ssr'
import { createPeerConnection } from "./PeerConnection.js"

const messagesBucketSize = 32

let lastInstanceId = 0

const createPeer = async ({ channelType, channel, instance, localMediaStreams, online, onUnmountedCb }) => {
  if(!isRef(localMediaStreams)) {
    localMediaStreams = ref(localMediaStreams ?? [])
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

  const peerId = [channelType, channel, 'session_Session', api.client.value.session, instance].join(':')

  console.log("CREATE PEER!")

  const [ peers, peerOnline, turnConfiguration ] = await Promise.all([
    live(path().peerConnection.peers({ channelType, channel })),
    live(path().online.session({ group: 'peer', peer: peerId })),
    live(path().peerConnection.turnConfiguration({ peer: peerId }))
  ])

  const localPeerState = ref(null)

  const finished = ref(false)
  const lastProcessedMessage = ref('')
  const connections = ref([])
  const waitingConnections = ref([]) // connections that are not initialized, but messages are received
  const localTracks = ref([])

  const otherPeers = computed(() => peers.value?.filter(peer => peer.id != peerId))
  const isConnectionPossible = computed(() => online.value && (!!turnConfiguration.value))

  const rtcConfiguration = computed(() => ({
      iceServers: [ turnConfiguration.value ],
      iceTransportPolicy: 'all', // 'all' or 'relay',
      bundlePolicy: 'balanced'
  }))
  const clientIp = computed(() => turnConfiguration.value?.clientIp)

  const anyLocalAudioEnabled = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind == 'audio' && trackInfo.enabled))
  const anyLocalVideoEnabled = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind == 'video' && trackInfo.enabled))
  const anyLocalAudioAvailable = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind == 'audio'))
  const anyLocalVideoAvailable = computed(() => localTracks.value
      .some(trackInfo => trackInfo.track.kind == 'video'))
  const computedLocalPeerState = computed(() => ({
    audioState: anyLocalAudioAvailable.value ? (anyLocalAudioEnabled.value ? "enabled" : "muted") : "none",
    videoState: anyLocalVideoAvailable.value ? (anyLocalVideoEnabled.value ? "enabled" : "muted") : "none"
  }))

  const summary = computed(() => ({
    peerId, online: online.value, finished: finished.value,
    computedLocalPeerState: computedLocalPeerState.value,
    lastProcessedMessage: lastProcessedMessage.value,
    peers: peers.value?.length,
    otherPeers: otherPeers.value?.map(p => p.id),
    connections: connections.value?.map(connection => connection.summary),
    tracks: localTracks.value?.map(({ track, stream }) => {
      const { id, kind, label, muted, enabled } = track
      return { id, kind, label, muted, enabled, stream: stream.id }
    }),
    turnConfiguration: turnConfiguration.value && {
      ...turnConfiguration.value,
      expire: new Date((+turnConfiguration.value.username.split(':')[0])*1000).toLocaleString()
    },
    isConnectionPossible: isConnectionPossible.value
  }))

  function setOnline(onlineValue) {
    online.value = onlineValue
  }

  return {
    peerId, online, isConnectionPossible,
    connections, localTracks,
    otherPeers,
    summary,
    setOnline
  }

  /*

    },
    watch: {
      otherPeers(peers) {
        this.updateConnections()
      },
      isConnectionPossible(online) {
        this.updateConnections()
      },
      computedLocalPeerState(newState) {
        this.updatePeerState(newState)
      },
      localMediaStreams(newStreams, oldStreams) {
        console.log("LOCAL MEDIA STREAMS CHANGE",
            newStreams.map(stream => ({ id: stream.id, tracks: stream.getTracks().map(tr => tr.kind).join('/') })),
            oldStreams.map(stream => ({ id: stream.id, tracks: stream.getTracks().map(tr => tr.kind).join('/') })))

        let deletedTracks = []
        let addedTracks = []
        for(const oldStream of oldStreams) {
          if(newStreams.indexOf(oldStream) != -1) continue; // existing stream
          deletedTracks.push(...(oldStream.getTracks().map( track => ({ track, stream: oldStream }) )))
          oldStream.removeEventListener('addtrack', this.mediaStreamAddTrackHandler)
          oldStream.removeEventListener('removetrack', this.mediaStreamRemoveTrackHandler)
        }
        for(const newStream of newStreams) {
          if(oldStreams.indexOf(newStream) != -1) continue; // existing stream
          addedTracks.push(...(newStream.getTracks().map(track => {
            const trackInfo = {
              track, stream: newStream, muted: track.muted, enabled: track.enabled,
              muteHandler: () => trackInfo.muted = track.muted,
              unmuteHandler: () => trackInfo.muted = track.muted
            }
            return trackInfo
          })))
          newStream.addEventListener('addtrack', this.mediaStreamAddTrackHandler)
          newStream.addEventListener('removetrack', this.mediaStreamRemoveTrackHandler)
        }
        for(const deletedTrack of deletedTracks) {
          const trackIndex = this.localTracks.findIndex(track => track.track == deletedTrack.track)
          if(trackIndex == -1) return console.error(`removal of non existing track ${deletedTrack.id}`)
          const trackInfo = this.localTracks[trackIndex]
          trackInfo.track.removeEventListener('mute', deletedTrack.muteHandler)
          trackInfo.track.removeEventListener('unmute', deletedTrack.unmuteHandler)
          this.localTracks.splice(trackIndex, 1)
        }
        for(const addedTrack of addedTracks) {
          addedTrack.track.addEventListener('mute', addedTrack.muteHandler)
          addedTrack.track.addEventListener('unmute', addedTrack.unmuteHandler)
          this.localTracks.push(addedTrack)
        }
      }
    },
    methods: {
      setTrackEnabled(track, v) {
        track.enabled = v
        track.track.enabled = v
      },
      updatePeerState(newState) {
        const updated = { ...this.localPeerState, ...newState }
        if(JSON.stringify(updated) != JSON.stringify(this.localPeerState)) {
          this.localPeerState = updated
          const update = { ...updated, peer: peerId, _commandId: api.guid() }
          this.sendPeerStateUpdate(update)
        }
      },
      sendPeerStateUpdate(update) {
        const requestTimeout = 10000
        dao.requestWithSettings({ requestTimeout },
          ['peerConnection', 'setPeerState'], update)
          .catch(error => {
            console.log("SET PEER STATE ERROR", error)
            if(error == 'timeout' && !this.finished
                && JSON.stringify({ ...this.localPeerState, ...update }) === JSON.stringify(this.localPeerState)
            ) {
              console.log("RETRYING")
              this.sendPeerStateUpdate()
            }
          })
      },
      observeMore() {
        if(this.messagesObservable) {
          this.messagesObservable.unobserve(this.messagesObserver)
          this.messagesObservable = null
        }
        const path = ['peerConnection', 'messages', {
          peer: peerId,
          gt: this.lastProcessedMessage,
          limit: messagesBucketSize
        }]
        this.messagesObservable = api.observable(path).observable
        //console.log("MESSAGES OBSERVABLE", path, this.messagesObservable, this.messagesObservable.observable)
        this.messagesObservable.observe(this.messagesObserver)
        //this.messagesObservable.observe(this.messagesObserver)
      },
      handleMessagesSignal(signal, ...args) {
        //console.log("HANDLE MESSAGE SIGNAL", signal, args)
        if(signal == 'error') {
          const error = args[0]
          console.error("PEER MESSAGE ERROR", error.stack || error)
          return
        }
        if(signal == 'putByField') {
          const [field, id, message] = args
          this.handleMessage(message)
        } else if(signal == 'set') {
          const value = args[0]
          for(const message of value) {
            this.handleMessage(message)
          }
        } else {
          console.error("SIGNAL NOT HANDLED", signal)
          /!*for(const message of this.messagesObservable.list) {
            this.handleMessage(message)
          }*!/
        }
        //console.log("PEER MESSAGES OBSERVABLE", this.messagesObservable)
        if(this.messagesObservable.list.length >= messagesBucketSize) {
          this.observeMore()
        }
      },
      handleMessage(message) {
        if(message.id <= this.lastProcessedMessage) {
          console.log("IGNORE OLD MESSAGE", message.id)
          return
        }
        this.lastProcessedMessage = message.id
        //console.log("HANDLE PEER MESSAGE", message)
        if(message.from) {
          let connection = this.connections.find(c => c.to == message.from)
          if(!connection) connection = this.waitingConnections.find(c => c.to == message.from)
          if(!connection) {
            connection = createPeerConnection(this, message.from)
            this.waitingConnections.push(connection)
          }
          connection.handleMessage(message)
        } else {

        }
      },
      sendMessage(message) {
        message.from = peerId
        message.sent = message.sent || new Date().toISOString()
        message._commandId = message._commandId || api.guid()
        const requestTimeout = 10000
        //console.log("SENDING PEER MESSAGE", message)
        dao.requestWithSettings({ requestTimeout }, ['peerConnection', 'postMessage'], message)
          .catch(error => {
            console.log("PEER MESSAGE ERROR", error)
            if(error == 'timeout' && !this.finished) {
              console.log("RETRYING")
              this.sendMessage(message)
            }
          })
      },
      updateConnections() {
        const peers = this.isConnectionPossible ? this.otherPeers : []
        for(let connectionId = 0; connectionId < this.connections.length; connectionId++) {
          const connection = this.connections[connectionId]
          const connectionPeer = peers.find(peer => peer.id == connection.to)
          if(!connectionPeer) {
            connection.close()
            connection.$destroy()
            this.connections.splice(connectionId, 1)
            connectionId --
          }
        }
        for(const peer of peers) {
          let peerConnection = this.connections.find(connection => connection.to == peer.id)
          if(peerConnection) continue;
          const peerConnectionId = this.waitingConnections.findIndex(connection => connection.to == peer.id)
          if(peerConnectionId != -1) { // use waiting connection with cached messages
            peerConnection = this.waitingConnections[peerConnectionId]
            this.waitingConnections.splice(peerConnectionId, 1)
          } else { // create connection
            peerConnection = createPeerConnection(this, peer.id)
          }
          this.connections.push(peerConnection)
          peerConnection.connect()
        }
      }
    },
    created() {
      this.messagesObserver = (...args) => this.handleMessagesSignal(...args)
      this.observeMore()
      this.disconnectHandler = () => this.observeMore() // to avoid redownloading processed messages
      api.on('disconnect', this.disconnectHandler)

      this.mediaStreamAddTrackHandler = (event) => {
        const track = event.track
        const trackInfo = {
          track, stream: newStream, muted: track.muted, enabled: track.enabled,
          muteHandler: () => trackInfo.muted = track.muted,
          unmuteHandler: () => trackInfo.muted = track.muted
        }
        console.log("MEDIA STREAM ADD TRACK!", trackInfo)
        trackInfo.track.addEventListener('mute', trackInfo.muteHandler)
        trackInfo.track.addEventListener('unmute', trackInfo.unmuteHandler)
        this.localTracks.push(trackInfo)
      }
      this.mediaStreamRemoveTrackHandler = (event) => {
        const trackIndex = this.localTracks.indexOf(event.track)
        if(trackIndex == -1) return console.error(`removal of non existing track ${event.track.id}`)
        const trackInfo = this.localTracks[trackIndex]
        console.log("MEDIA STREAM REMOVE TRACK!", trackInfo)
        trackInfo.track.removeEventListener('mute', trackInfo.muteHandler)
        trackInfo.track.removeEventListener('unmute', trackInfo.unmuteHandler)
        this.localTracks.splice(trackIndex, 1)
      }
    },
    beforeDestroy() {
      this.finished = true
      if(this.messagesObservable) {
        this.messagesObservable.unobserve(this.messagesObserver)
        this.messagesObservable = null
      }
      for(const connection of this.waitingConnections) {
        connection.$destroy()
      }
      for(const connection of this.connections) {
        connection.$destroy()
      }
      api.removeListener('disconnect', this.disconnectHandler)
    }
  })*/
}

export { createPeer }