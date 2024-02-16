import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
const config = definition.config
const {
  createFromTitle = (title) => {
    let path = title
    path = path.replace(/[@]+/g, '-at-')
    path = path.replace(/[_/\\\\ -]+/g, '-')
    path = path.replace(/[^a-z0-9-]+/gi, '')
    return path
  },
  urlWriterRoles = ['writer']
} = config

import { Canonical, Redirect, UrlToTarget, UrlToTargetWithoutDomain } from "./model.js"

definition.view({
  name: "urlsByTargetAndPath",
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    domain: {
      type: String
    },
    path: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Object,
    properties: {
      urlType: {
        type: String,
      },
      target: {
        type: String
      }
    }
  },
  daoPath(params, { client, service }, method) {
    const { targetType, domain, path } = params
    const dp = UrlToTarget.rangePath([ targetType, domain, path ], App.extractRange(params))
    //console.log("URLS PATH", params, '=>', dp)
    return dp
  }
})

definition.view({
  name: "urlsByTargetType",
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Object,
    properties: {
      urlType: {
        type: String,
      },
      target: {
        type: String
      }
    }
  },
  daoPath(params, { client, service }, method) {
    const { targetType } = params
    const dp = UrlToTargetWithoutDomain.rangePath([ targetType ], App.extractRange(params))
    //console.log("URLS PATH", params, '=>', dp)
    return dp
  }
})

definition.view({
  name: "urlsByTargetTypeAndDomain",
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Object,
    properties: {
      urlType: {
        type: String,
      },
      target: {
        type: String
      }
    }
  },
  daoPath(params, { client, service }, method) {
    const { targetType, domain } = params
    const dp = UrlToTarget.rangePath([ targetType, domain ], App.extractRange(params))
    //console.log("URLS PATH", params, '=>', dp)
    return dp
  }
})

const randomLettersBig = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randomLettersSmall = 'abcdefghijklmnopqrstuvwxyz'
const randomDigits = '0123456789'
const charsets = {
  'all' :  randomLettersBig + randomLettersSmall + randomDigits,
  'digits': randomDigits,
  'letters': randomLettersSmall + randomLettersBig,
  'smallLetters': randomLettersSmall,
  'bigLetters': randomLettersBig,
  'small': randomLettersSmall + randomDigits,
  'big': randomLettersBig + randomDigits,
}

const defaultRandomPathLength = 5

async function generateUrl(props, emit) {
  console.log("GENERATE URL", props)
  if(!props.targetType || !props.target) throw new Error("url must have target")
  const prefix = props.prefix || ''
  const suffix = props.suffix || ''
  const randomCharacters = props.charset ? charsets[props.charset] : charsets.all
  let randomPathLength = props.length || defaultRandomPathLength
  let maxLength = props.maxLength || 125
  const sufixLength = 15
  let path = ''
  let random = false
  if(props.path) {
    path = path
    const cutLength = maxLength - sufixLength/// because max id size
    if(path.length > cutLength) {
      let lastSep = path.lastIndexOf('-')
      if(lastSep > cutLength - 40) path = path.slice(0, lastSep)
      else path = path.slice(0, cutLength)
    }
  } else {
    if(props.title) { // generated from title
      path = createFromTitle(props.title)
      const cutLength = maxLength - sufixLength /// because max id size
      while(path.length > cutLength) {
        let lastSep = path.lastIndexOf('-')
        if(lastSep > cutLength - 40) path = path.slice(0, lastSep)
        else path = path.slice(0, cutLength)
      }
    } else { // random
      random = true
      const charactersLength = randomCharacters.length
      for(let i = 0; i < randomPathLength; i++) {
        path += randomCharacters.charAt(Math.floor(Math.random() * charactersLength))
      }
    }
  }
  const basePath = path

  let created = false
  let conflict = false
  do {
    const fullPath = prefix + path + suffix
    console.log("TRYING PATH", prefix + path + suffix)
    const res = await UrlToTarget.rangeGet([props.targetType, props.domain, fullPath])
    const count = res?.length ?? 0
    if(count == 0) {
      //Url.create({ id: `${group}_${path}`, group, path: prefix + path + suffix, to: props.to || null })
      created = true
    } else {
      console.log("PATH TAKEN", prefix + path + suffix)

      if(path.length >= maxLength) { /// because max id size
        if(random) {
          const charactersLength = randomCharacters.length
          path = ''
          for(let i = 0; i < randomPathLength; i++) {
            path += randomCharacters.charAt(Math.floor(Math.random() * charactersLength))
          }
        } else {
          path = basePath
        }
        const cutLength = maxLength - 10
        if(path.length > cutLength) {
          let lastSep = path.lastIndexOf('-')
          if(lastSep > cutLength - 40) path = path.slice(0, lastSep)
          else path = path.slice(0, cutLength)
        }
      }

      if(!conflict) path += '-'
      conflict = true
      path += randomCharacters.charAt(Math.floor(Math.random() * randomCharacters.length))
    }
  } while(!created)

  const fullPath = prefix + path + suffix

  const canonicalId = App.encodeIdentifier([props.targetType, props.target])
  const existingCanonical = await Canonical.get(canonicalId)

  let url
  if(props.redirect) {
    url = app.generateUid()
    emit({
      type: 'targetOwnedRedirectCreated',
      redirect: app.generateUid(),
      identifiers: {
        targetType: props.targetType,
        target: props.target,
      },
      data: {
        domain: props.domain,
        path: fullPath
      }
    })
  } else {
    if(existingCanonical) {
      emit({
        type: 'targetOwnedRedirectCreated',
        redirect: app.generateUid(),
        identifiers: {
          targetType: props.targetType,
          target: props.target,
        },
        data: {
          domain: existingCanonical.domain,
          path: existingCanonical.path
        }
      })
    }
    emit({
      type: 'targetOwnedCanonicalSet',
      identifiers: {
        targetType: props.targetType,
        target: props.target
      },
      data: {
        domain: props.domain,
        path: fullPath
      }
    })
    url = canonicalId
  }

  return {
    url,
    domain: props.domain,
    path: prefix + path + suffix
  }
}

definition.trigger({
  name: 'generateUrl',
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    domain: {
      type: String
    },
    title: {
      type: String
    },
    path: {
      type: String,
    },
    maxLength: {
      type: Number
    },
    redirect: {
      type: Boolean
    },
    charset: {
      type: String
    },
    prefix: {
      type: String
    },
    suffix: {
      type: String
    }
  },
  waitForEvents: true,
  queuedBy: 'targetType',
  async execute (props, { client, service }, emit) {
    return await generateUrl(props, emit)
  }
})

definition.action({
  name: 'generateUrl',
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    domain: {
      type: String
    },
    title: {
      type: String
    },
    path: {
      type: String,
    },
    maxLength: {
      type: Number
    },
    redirect: {
      type: Boolean
    },
    charset: {
      type: String
    },
    prefix: {
      type: String
    },
    suffix: {
      type: String
    }
  },
  waitForEvents: true,
  accessControl: {
    roles: urlWriterRoles,
    objects: ({ targetType: objectType, target: object }) => ({ objectType, object })
  },
  queuedBy: 'targetType',
  async execute (props, { client, service }, emit) {
    return await generateUrl(props, emit)
  }
})


definition.action({
  name: 'takeUrl',
  waitForEvents: true,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    domain: {
      type: String
    },
    path: {
      type: String,
      validation: ['nonEmpty']
    },
    redirect: {
      type: Boolean
    }
  },
  accessControl: {
    roles: urlWriterRoles,
    objects: ({ targetType: objectType, target: object }) => ({ objectType, object })
  },
  queuedBy: 'targetType',
  async execute({ targetType, target, domain, path, redirect }, { client, service }, emit) {
    while(path[0] == '/') path = path.slice(1)

    const res = await UrlToTarget.rangeGet([targetType, domain, path])
    const count = res?.length ?? 0
    if(count > 0) throw { properties: { path: "taken" } }

    const canonicalId = App.encodeIdentifier([targetType, target])
    const existingCanonical = await Canonical.get(canonicalId)

    let url
    if(redirect) {
      url = app.generateUid()
      emit({
        type: 'targetOwnedRedirectCreated',
        redirect: app.generateUid(),
        identifiers: {
          targetType, target,
        },
        data: {
          domain, path
        }
      })
    } else {
      if(existingCanonical) {
        emit({
          type: 'targetOwnedRedirectCreated',
          redirect: app.generateUid(),
          identifiers: {
            targetType, target
          },
          data: {
            domain: existingCanonical.domain,
            path: existingCanonical.path
          }
        })
      }
      emit({
        type: 'targetOwnedCanonicalSet',
        identifiers: {
          targetType, target,
        },
        data: {
          domain, path
        }
      })
      url = canonicalId
    }

    return url
  }

})

export default definition
