import PeerVideo from './front/src/room/PeerVideo.vue'
import Room from './front/src/room/Room.vue'
import VideoWall from './front/src/room/VideoWall.vue'

export { PeerVideo, Room, VideoWall }

import { videoCallRoutes } from './front/src/router.js'
export { videoCallRoutes }

import en from "./front/locales/en.json"
import pl from "./front/locales/pl.json"
const locales = { en, pl }
export { locales }
