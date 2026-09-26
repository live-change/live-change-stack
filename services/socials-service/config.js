import definition from './definition.js'

const open = () => true

const defaultPlatforms = {
  instagram: { prefix: 'https://www.instagram.com/' },
  tiktok: { prefix: 'https://www.tiktok.com/@' },
  youtube: { prefix: 'https://www.youtube.com/@' },
  facebook: { prefix: 'https://www.facebook.com/' },
  x: { prefix: 'https://x.com/' },
  threads: { prefix: 'https://www.threads.net/@' },
  spotify: { prefix: 'https://open.spotify.com/artist/' },
  soundcloud: { prefix: 'https://soundcloud.com/' },
  bandcamp: { kind: 'url' },
  vimeo: { prefix: 'https://vimeo.com/' },
  twitch: { prefix: 'https://www.twitch.tv/' },
  behance: { prefix: 'https://www.behance.net/' },
  linkedin: { prefix: 'https://www.linkedin.com/in/' },
  patreon: { prefix: 'https://www.patreon.com/' },
  website: { kind: 'url' },
  other: { kind: 'free', label: true }
}

const {
  ownerTypes = ['user_User'],
  platforms = defaultPlatforms,
  readAccess = open
} = definition.config || {}

definition.clientConfig = {
  ownerTypes,
  platforms
}

export default {
  ownerTypes,
  platforms,
  readAccess
}
