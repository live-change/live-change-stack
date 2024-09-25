import Debugger from './front/src/components/Debugger.vue'
import DeviceSelect from './front/src/components/DeviceSelect.vue'
import PermissionsDialog from './front/src/components/PermissionsDialog.vue'
import VolumeIndicator from './front/src/components/VolumeIndicator.vue'
import CameraButton from './front/src/components/CameraButton.vue'
import MicrophoneButton from './front/src/components/MicrophoneButton.vue'
import MediaSettingsButton from './front/src/components/MediaSettingsButton.vue'

export {
  Debugger, DeviceSelect, PermissionsDialog, VolumeIndicator,
  CameraButton, MicrophoneButton, MediaSettingsButton
}

import { createPeer } from './front/src/components/Peer.js'
import { createPeerConnection } from './front/src/components/PeerConnection.js'
import { getUserMedia, getDisplayMedia, isUserMediaPermitted } from './front/src/components/userMedia.js'
import { mediaStreamsTracks } from './front/src/components/mediaStreamsTracks.js'

export {
  createPeer, createPeerConnection, getUserMedia, getDisplayMedia, isUserMediaPermitted, mediaStreamsTracks
}

import { peerConnectionRoutes } from './front/src/router.js'
export { peerConnectionRoutes }
