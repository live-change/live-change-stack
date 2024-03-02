import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

const config = definition.config
const {
  contentReaderRoles = ['reader', 'writer'],
  contentWriterRoles = ['writer']
} = config

const urlType = {
  type: String,
  softValidation: ['nonEmpty', 'url']
}
const urlArrayType = {
  type: Array,
  of: urlType
}

const musicSongsType = {
  type: Array,
  of: {
    type: Object,
    properties: {
      url: urlType,
      disc: {
        type: Number,
        input: 'integer',
        softValidation: ['integer']
      },
      track: {
        type: Number,
        input: 'integer',
        softValidation: ['integer']
      }
    }
  }
}

const durationType = {
  type: Number,
  input: 'duration',
  unit: 'seconds',
  softValidation: ['nonEmpty', 'integer']
}

const tagsType = {
  type: Array,
  of: {
    type: String
  }
}

const Metadata = definition.model({
  name: 'Metadata',
  propertyOfAny: {
    to: 'object',
    readAccessControl: {
      roles: contentReaderRoles
    },
    writeAccessControl: {
      roles: contentWriterRoles
    }
  },
  properties: {
    title: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', params: { length: 64 } }]
    },
    description: {
      type: String,
      input: 'textarea',
      softValidation: ['nonEmpty', { name: 'maxLength', params: { length: 155 } }]
    },
    og: {
      type: Object,
      properties: {
        title: {
          type: String,
          softValidation: ['nonEmpty', { name: 'maxLength', params: { length: 60 } }]
        },
        description: {
          type: String,
          input: 'textarea',
          softValidation: ['nonEmpty', { name: 'maxLength', params: { length: 65 } }]
        },
        image: {
          type: 'Image',
          softValidation: ['nonEmpty'],
        },
        determiner: {
          type: String
        },
        locale: {
          type: String
        },
        localeAlternate: {
          type: Array,
          of: {
            type: String
          }
        },

        /* audio: { /// TODO: add audio
           type: 'Audio',
         },*/
        /* video: { /// TODO: add video
          type: 'Video',
        },*/
        type: {
          type: String,
          input: 'select',
          softValidation: ['nonEmpty'],
          defaultValue: 'website',
          options: [
            'website',
            'article',
            'book',
            'profile',
            'music.song', 'music.album', 'music.playlist', 'music.radio_station',
            'video.movie', 'video.episode', 'video.tv_show', 'video.other'
          ]
        },
        music: {
          if: App.isomorphic(({ props }) =>
            ['music.radio_station', 'music.playlist', 'music.album', 'music.song'].includes(props?.og?.type)
          ),
          type: Object,
          properties: {
            duration: {
              if: App.isomorphic(({ props }) => ['music.album', 'music.song'].includes(props?.og?.type)),
              ...durationType
            },
            song: {
              if: App.isomorphic(({ props }) => ['music.album', 'music.playlist'].includes(props?.og?.type)),
              ...musicSongsType
            },
            album: {
              if: App.isomorphic(({ props }) => props?.og?.type === 'music.song'),
              ...musicSongsType  /// music.song list is compatible with music.album list
            },
            musician: {
              if: App.isomorphic(({ props }) => ['music.album', 'music.song'].includes(props?.og?.type)),
              ...urlArrayType
            },
            releaseDate: {
              if: App.isomorphic(({ props }) => props?.og?.type === 'music.album'),
              type: Date,
            },
            creator: {
              if: App.isomorphic(({ props }) => ['music.radio_station', 'music.playlist'].includes(props?.og?.type)),
              ...urlArrayType
            },
          },
          softValidation: ['nonEmpty']
        },
        video: {
          if: App.isomorphic(({ props }) =>
            ['video.movie', 'video.episode', 'video.tv_show', 'video.other'].includes(props?.og?.type)
          ),
          type: Object,
          properties: {
            actor: {
              type: Array,
              of: {
                type: Object,
                properties: {
                  url: urlType,
                  role: {
                    type: Number,
                    softValidation: ['integer']
                  }
                }
              }
            },
            director: urlArrayType,
            writer: urlArrayType,
            duration: durationType,
            releaseDate: {
              type: Date,
            },
            tag: tagsType,
            series: {
              if: App.isomorphic(({ props }) => props?.og?.type === 'video.tv_show'),
              ...urlType
            }
          }
        },
        article: {
          if: App.isomorphic(({ props }) => props?.og?.type === 'article'),
          type: Object,
          properties: {
            publishedTime: {
              type: Date,
            },
            modifiedTime: {
              type: Date,
            },
            expirationTime: {
              type: Date,
            },
            author: urlArrayType,
            section: {
              type: String
            },
            tag: tagsType
          }
        },
        profile: {
          if: App.isomorphic(({ props }) => props?.og?.type === 'profile'),
          type: Object,
          properties: {
            firstName: {
              type: String
            },
            lastName: {
              type: String
            },
            username: {
              type: String
            },
            gender: {
              type: String,
              options: ['male', 'female']
            }
          }
        },
        book: {
          if: App.isomorphic(({ props }) => props?.og?.type === 'book'),
          type: Object,
          properties: {
            author: urlArrayType,
            isbn: {
              type: String
            },
            releaseDate: {
              type: Date
            },
            tag: tagsType
          }
        }
      }
    },
    lastUpdate: {
      type: Date
    }
  }
})
