import { ref, isRef, onUnmounted, getCurrentInstance, unref, reactive, computed, watch } from 'vue'

export function mediaStreamsTracks(mediaStreamsRef) {
  if(!mediaStreamsRef) throw new Error("mediaStreamsTracks: mediaStreams argument is required")
  const tracks = ref([])

  function removeLocalTrack(track, stream) {
    const trackIndex = tracks.findIndex(t => t.track === track.track)
    if(trackIndex === -1) return console.error(`removal of non existing track ${track.id}`)
    const trackInfo = tracks[trackIndex]
    trackInfo.track.removeEventListener('mute', track.muteHandler)
    trackInfo.track.removeEventListener('unmute', track.unmuteHandler)
    tracks.value.splice(trackIndex, 1)
  }
  function addLocalTrack(track, stream) {
    const trackInfo = reactive({
      track, stream, muted: track.muted, enabled: track.enabled,
      muteHandler: () => trackInfo.muted = track.muted,
      unmuteHandler: () => trackInfo.muted = track.muted
    })
    console.log("MEDIA STREAM ADD TRACK!", trackInfo)
    trackInfo.track.addEventListener('mute', trackInfo.muteHandler)
    trackInfo.track.addEventListener('unmute', trackInfo.unmuteHandler)
    tracks.value.push(trackInfo)
  }
  function mediaStreamAddTrackHandler(event) {
    addLocalTrack(event.track, event.target)
  }
  function mediaStreamRemoveTrackHandler(event) {
    removeLocalTrack(event.track, event.target)
  }

  watch(() => mediaStreamsRef.value, (newStreams = [], oldStreams = []) => {
    console.log("MEDIA STREAMS CHANGE",
      newStreams.map(stream => ({
        id: stream.id,
        tracks: stream.getTracks().map(tr => tr.kind).join('/')
      })),
      oldStreams.map(stream => ({
        id: stream.id,
        tracks: stream.getTracks().map(tr => tr.kind).join('/')
      }))
    )

    for(const oldStream of oldStreams) {
      if(newStreams.indexOf(oldStream) !== -1) continue; // existing stream
      for(const track of oldStream.getTracks()) removeLocalTrack(track, oldStream)
      oldStream.removeEventListener('addtrack', mediaStreamAddTrackHandler)
      oldStream.removeEventListener('removetrack', mediaStreamRemoveTrackHandler)
    }
    for(const newStream of newStreams) {
      if(oldStreams.indexOf(newStream) !== -1) continue; // existing stream
      for(const track of newStream.getTracks()) addLocalTrack(track, newStream)
      newStream.addEventListener('addtrack', mediaStreamAddTrackHandler)
      newStream.addEventListener('removetrack', mediaStreamRemoveTrackHandler)
    }
  }, { immediate: true })

  return tracks
}
