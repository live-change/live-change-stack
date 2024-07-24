import Debugger from './front/src/components/Debugger.vue'
import DeviceSelect from './front/src/components/DeviceSelect.vue'
import PermissionsDialog from './front/src/components/PermissionsDialog.vue'
import VolumeIndicator from './front/src/components/VolumeIndicator.vue'

export { Debugger, DeviceSelect, PermissionsDialog, VolumeIndicator }

import { createPeer } from './front/src/components/Peer.js'
import { createPeerConnection } from './front/src/components/PeerConnection.js'
import { getUserMedia, getDisplayMedia, isUserMediaPermitted } from './front/src/components/userMedia.js'

export { createPeer, createPeerConnection, getUserMedia, getDisplayMedia, isUserMediaPermitted }

import { peerConnectionRoutes } from './front/src/router.js'
export { peerConnectionRoutes }
