//import Vue from "vue"

const createPeerConnection = (peer, to) => {
  return new Vue({
    data: {
      waitingMessages: [],
      state: "created",
      rtc: null,
      rtcSignalingState: "",
      iceGatheringState: "",
      iceConnectionState: "",
      rtpSenders: [],
      offerOptions: null,
      answerOptions: null,
      remoteTracks: [],
      restartOnDisconnect: false // because could not set rtc configuration(firefox)
    },
    computed: {
      to() {
        return to
      },
      summary() {
        return {
          to: this.to,
          state: this.state,
          waitingMessages: this.waitingMessages.length,
          rtpSenders: this.rtpSenders.map(({ sender, stream }) => {
            const { id, kind, label } = sender.track
            return { id, kind, label, stream: stream.id }
          }),
          rtcSignalingState: this.rtcSignalingState,
          iceGatheringState: this.iceGatheringState,
          iceConnectionState: this.iceConnectionState,
          remoteTracks: this.remoteTracks.map(({ track, stream }) => {
            const { id, kind, label, muted } = track
            return { id, kind, label, muted, stream: stream.id }
          }),
        }
      },
      localTracks() {
        return peer.localTracks
      },
      isEnabled() {
        return this.state != 'closed' && this.state != 'created'
      },
      rtcConfiguration() {
        return peer.rtcConfiguration
      },
      clientIp() {
        return peer.clientIp
      },
      isPolite() {
        return peer.peerId < this.to
      }
    },
    watch: {
      isEnabled() {
        this.synchronizeLocalTracks()
      },
      localTracks() {
        this.synchronizeLocalTracks()
      },
      rtcConfiguration(configuration) {
        if(this.rtc) {
          if(this.rtc.setConfiguration) {
            this.rtc.setConfiguration(configuration)
          } else {
            this.restartOnDisconnect = true
          }
        }
      },
      clientIp(newIp, oldIp) {
        if(this.rtc) {
          this.restartConnection()
        }
      }
    },
    methods: {
      async connect() {
        console.log("PeerConnection connect")
        if(this.rtc) throw new Error("can't connect twice!")
        this.state = 'connecting'
        this.rtc = new RTCPeerConnection(this.rtcConfiguration)
        this.rtcSignalingState = this.rtc.signalingState
        this.iceGatheringState = this.rtc.iceGatheringState
        this.iceConnectionState = this.rtc.iceConnectionState
        this.rtc.addEventListener('negotiationneeded', this.negotiationNeededHandler)
        this.rtc.addEventListener('signalingstatechange', this.signalingStateChangeHandler)
        this.rtc.addEventListener('icecandidate', this.iceCandidateHandler)
        this.rtc.addEventListener('track', this.trackHandler)
        this.rtc.addEventListener('icegatheringstatechange', this.iceGatheringStateChangeHandler)
        this.rtc.addEventListener('iceconnectionstatechange', this.iceConnectionStateChangeHandler)
        for(const message of this.waitingMessages) {
          try {
            await this.handleMessage(message)
          } catch(error) {
            console.error("MESSAGE", message, "HANDLING ERROR", error)
          }
        }
        this.waitingMessages = []
      },
      close() {
        console.log("PeerConnection close")
        this.state = 'closed'
        if(this.rtc) {
          this.rtc.close()
          this.rtc = null
        }
      },
      async handleMessage(message) {
        //console.log("PC", to, "HANDLE MESSAGE", message)
        if(this.state == 'created') {
          console.log("ADD MESSAGE TO WAITING QUEUE")
          this.waitingMessages.push(message)
          return
        }
        if(this.state == 'close') return;
        //console.log("DO HANDLE MESSAGE")
        switch(message.type) {
          case "sdp": {
            console.log("RECEIVED SDP", message.data.type, "IN STATE", this.rtc.signalingState)
            if(message.data.type == 'offer') {
              if(this.rtc.signalingState != "stable") {
                console.log("SDP CONFLICT, RECEIVED OFFER IN UNSTABLE STATE")
                if(this.isPolite) {
                  console.log("I AM POLITE SO I WILL ROLLBACK RTC STATE MACHINE")
                  await this.rtc.setLocalDescription({type: "rollback"}),
                  await this.rtc.setRemoteDescription(message.data)
                  console.log("ROLLBACK DONE")
                  const answer = await this.rtc.createAnswer(this.answerOptions || undefined)
                  console.log("GOT RTC ANSWER IN STATE", this.rtc.signalingState)
                  await this.rtc.setLocalDescription(answer)
                  console.log("LOCAL ANSWER DESCRIPTION SET! SENDING ANSWER!")
                  peer.sendMessage({ to, type: "sdp", data: answer })
                } else {
                  console.log("I AM NOT POLITE SO I WILL IGNORE OFFER")
                }
              } else {
                console.log("SDP STATE GOOD!")
                await this.rtc.setRemoteDescription(message.data)
                const answer = await this.rtc.createAnswer(this.answerOptions || undefined)
                console.log("GOT RTC ANSWER IN STATE", this.rtc.signalingState)
                await this.rtc.setLocalDescription(answer)
                console.log("LOCAL ANSWER DESCRIPTION SET! SENDING ANSWER!")
                peer.sendMessage({ to, type: "sdp", data: answer })
              }
            } else {
              console.log("GOT ANSWER FROM REMOTE PEER")
              await this.rtc.setRemoteDescription(message.data)
            }
          } break;
          case "ice": {
            console.log("RECEIVED ICE! IN STATE", this.rtc.signalingState)
            let ice = message.data
            //if(ice && ice.candidate === "") break;
            if(ice && ice.candidate != "") {
              console.log("ADDING ICE CANDIDATE", ice.candidate)
              await this.rtc.addIceCandidate(new RTCIceCandidate(ice))
            } else if(window.RTCPeerConnection.prototype.addIceCandidate.length === 0){
              await this.rtc.addIceCandidate()
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
      },
      synchronizeLocalTracks() {
        const tracks = this.isEnabled ? this.localTracks : []
        let removedSenders = []
        let somethingChanged = false
        for(const senderInfo of this.rtpSenders) {
          const trackInfo = tracks.find(trackInfo => trackInfo.track == senderInfo.sender.track)
          if(!trackInfo) {
            this.rtc.removeTrack(senderInfo.sender)
            removedSenders.push(senderInfo)
            somethingChanged = true
          } else if(senderInfo.stream != trackInfo.stream) {
            senderInfo.stream = trackInfo.stream
            senderInfo.sender.setStreams(trackInfo.stream)
            somethingChanged = true
          }
        }
        for(const removedSenderInfo of removedSenders) {
          this.rtpSenders.splice(this.rtpSenders.indexOf(removedSenderInfo), 1)
        }
        for(const trackInfo of tracks) {
          if(this.rtpSenders.find(senderInfo => senderInfo.sender.track == trackInfo.track)) continue; // existing track
          const sender = this.rtc.addTrack(trackInfo.track, trackInfo.stream)
          this.rtpSenders.push({ sender, stream: trackInfo.stream })
          somethingChanged = true
        }
        if(somethingChanged) {
          //this.updateOffer() // wait for onnegotiationneeded
        }
      },
      async handleNegotiationNeeded(event) {
        console.log("NEGOTIATION NEEDED! IN STATE", this.rtc.signalingState)
        if(!this.isEnabled) return
        if(this.state == 'negotiating') {
          console.log("SKIP NESTED NEGOTIATIONS WITH", this.to)
          //return
        }
        this.state = 'negotiating'
        // if it's disabled there is no need for offer
        console.log("UPDATING OFFER")
        const offer = await this.rtc.createOffer(this.offerOptions || undefined)
        if(this.rtc.signalingState != "stable") {
          console.log("RTC GOT OUT OF STABLE WHILE CREATING OFFER. IGNORE GENERATED OFFER!")
          return;
        }
        await this.rtc.setLocalDescription(offer)
        peer.sendMessage({ to, type: "sdp", data: offer })
        console.log("SDP OFFER SET! RTC IN STATE", this.rtc.signalingState)

      },
      async handleSignalingStateChange(event) {
        if(this.state == 'closed') return;
        console.log("RTC SIGNALING STATE CHANGE", this.rtc.signalingState)
        this.rtcSignalingState = this.rtc.signalingState
      },
      async handleIceCandidate(event) {
        if(this.state == 'closed') return
        //console.log("GOT ICE CANDIDATE", event.candidate && event.candidate.candidate)
        peer.sendMessage({ to, type: "ice", data: event.candidate })
      },
      handleTrack(event) {
        if(this.state == 'closed') return
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
            const trackIndex = this.remoteTracks.findIndex(remoteTrack =>
                remoteTrack.track == track && remoteTrack.stream == stream)
            if(trackIndex != -1) {
              const trackInfo = this.remoteTracks[trackIndex]
              trackInfo.track.removeEventListener('mute', trackInfo.muteHandler)
              trackInfo.track.removeEventListener('unmute', trackInfo.unmuteHandler)
              this.remoteTracks.splice(trackIndex, 1)
            }
          },
          muteHandler: () => trackInfo.muted = track.muted,
          unmuteHandler: () => trackInfo.muted = track.muted
        }
        if(stream) {
          stream.addEventListener('removetrack', trackInfo.removeTrackHandler)
        }
        const existingTrackInfo = this.remoteTracks.find(remoteTrack => remoteTrack.track == track)
        if(existingTrackInfo) {
          existingTrackInfo.stream = stream // Track stream changed
        } else {
          trackInfo.track.addEventListener('mute', trackInfo.muteHandler)
          trackInfo.track.addEventListener('unmute', trackInfo.unmuteHandler)
          this.remoteTracks.push(trackInfo)
        }
      },
      handleIceGatheringStateChange(event) {
        if(this.state == 'closed') return
        console.log("ICE GATHERING STATE CHANGED", this.rtc.iceGatheringState)
        this.iceGatheringState = this.rtc.iceGatheringState
      },
      handleIceConnectionStateChange(event) {
        if(this.state == 'closed') return
        this.iceConnectionState = this.rtc.iceConnectionState
        console.log("ICE GATHERING STATE CHANGED", this.rtc.iceConnectionState)
        if(this.iceConnectionState == 'connected') {
          this.state = 'connected'
        }
        if(this.iceConnectionState == 'failed') {
          this.state = 'failed'
          this.restartConnection()
        }
        if(this.iceConnectionState == 'disconnected') {
          this.state = 'disconnected'
        }
      },
      async restartConnection() {
        console.log("RESTARTING CONNECTION")
        if(false && this.rtc.restartIce) {
          console.log("RESTART ICE!")
          this.rtc.restartIce()
        } else {
          console.log("RESTART OFFER!")
          const offer = await this.rtc.createOffer({ ...this.offerOptions, iceRestart: true })
          if(this.rtc.signalingState != "stable") {
            console.log("RTC GOT OUT OF STABLE WHILE CREATING OFFER. IGNORE GENERATED OFFER!")
            return;
          }
          await this.rtc.setLocalDescription(offer)
          peer.sendMessage({ to, type: "sdp", data: offer })
        }
      }
    },
    created() {
      this.negotiationNeededHandler = (e) => this.handleNegotiationNeeded(e)
      this.signalingStateChangeHandler = (e) => this.handleSignalingStateChange(e)
      this.iceCandidateHandler = (e) => this.handleIceCandidate(e)
      this.trackHandler = (e) => this.handleTrack(e)
      this.iceGatheringStateChangeHandler = (e) => this.handleIceGatheringStateChange(e)
      this.iceConnectionStateChangeHandler = (e) => this.handleIceConnectionStateChange(e)
    },
    beforeDestroy() {
      if(this.state != 'closed') {
        this.close()
      }
      if(this.rtc) {
        this.rtc.removeEventListener('negotiationneeded', this.negotiationNeededHandler)
        this.rtc.removeEventListener('signalingstatechange', this.signalingStateChangeHandler)
        this.rtc.removeEventListener('icecandidate', this.iceCandidateHandler)
        this.rtc.removeEventListener('track', this.trackHandler)
        this.rtc.removeEventListener('icegatheringstatechanged', this.iceGatheringStateChangeHandler)
        this.rtc.removeEventListener('iceconnectionstatechanged', this.iceConnectionStateChangeHandler)
      }
    }
  })
}

export { createPeerConnection }
