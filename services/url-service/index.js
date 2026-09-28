import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import defaultCreateFromTitle from './createFromTitle.js'
const config = definition.config
const {
  createFromTitle = defaultCreateFromTitle,
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
    const { targetType, path } = params
    const domain = params.domain || ''
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
    const { targetType } = params
    const domain = params.domain || ''
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

function sameDomain(a, b) {
  return (a || '') === (b || '')
}

function randomPath(randomCharacters, length) {
  let path = ''
  const charactersLength = randomCharacters.length
  for(let i = 0; i < length; i++) {
    path += randomCharacters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return path
}

function cutPath(path, cutLength) {
  if(path.length <= cutLength) return path
  let lastSep = path.lastIndexOf('-')
  if(lastSep > cutLength - 40) return path.slice(0, lastSep)
  return path.slice(0, cutLength)
}

async function othersOnPath(targetType, domain, fullPath, target) {
  const canonicals = await Canonical.sortedIndexRangeGet('byUrl', [targetType, domain, fullPath]) || []
  const redirects = await Redirect.sortedIndexRangeGet('byUrl', [targetType, domain, fullPath]) || []
  return [...canonicals, ...redirects].filter(row => row.target !== target)
}

async function deleteOwnRedirectsAt(targetType, target, domain, path, emit) {
  const owned = await Redirect.indexRangeGet('byTarget', [targetType, target]) || []
  for(const row of owned) {
    if(!sameDomain(row.domain, domain) || row.path !== path) continue
    emit({
      type: 'RedirectDeleted',
      redirect: row.id
    })
  }
}

async function generateUrl(props, emit) {
  if(!props.targetType || !props.target) throw new Error("url must have target")
  const domain = props.domain || ''
  const prefix = props.prefix || ''
  const suffix = props.suffix || ''
  const randomCharacters = props.charset ? charsets[props.charset] : charsets.all
  let randomPathLength = props.length || defaultRandomPathLength
  let maxLength = props.maxLength || 125
  const sufixLength = 15
  let path = ''
  let random = false
  if(props.path) {
    path = props.path
    path = cutPath(path, maxLength - sufixLength)
  } else if(props.title) {
    path = createFromTitle(props.title)
    path = cutPath(path, maxLength - sufixLength)
  }
  if(!path) {
    random = true
    path = randomPath(randomCharacters, randomPathLength)
  }
  const basePath = path

  let created = false
  let conflict = false
  do {
    const fullPath = prefix + path + suffix
    const others = await othersOnPath(
      props.targetType, domain, fullPath, props.target
    )
    if(others.length === 0) {
      created = true
    } else {
      if(path.length >= maxLength) {
        if(random) {
          path = randomPath(randomCharacters, randomPathLength)
        } else {
          path = basePath
        }
        path = cutPath(path, maxLength - 10)
      }

      if(!conflict) path += '-'
      conflict = true
      path += randomCharacters.charAt(Math.floor(Math.random() * randomCharacters.length))
    }
  } while(!created)

  const fullPath = prefix + path + suffix

  const canonicalId = App.encodeIdentifier([props.targetType, props.target])
  const existingCanonical = await Canonical.get(canonicalId)

  if(!props.redirect
    && existingCanonical
    && sameDomain(existingCanonical.domain, domain)
    && existingCanonical.path === fullPath
  ) {
    return {
      url: canonicalId,
      domain,
      path: fullPath
    }
  }

  let url
  if(props.redirect) {
    url = app.generateUid()
    emit({
      type: 'RedirectCreated',
      redirect: app.generateUid(),
      identifiers: {
        targetType: props.targetType,
        target: props.target,
      },
      data: {
        domain,
        path: fullPath
      }
    })
  } else {
    await deleteOwnRedirectsAt(
      props.targetType, props.target, domain, fullPath, emit
    )
    if(existingCanonical) {
      emit({
        type: 'RedirectCreated',
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
      type: 'CanonicalSet',
      identifiers: {
        targetType: props.targetType,
        target: props.target
      },
      data: {
        domain,
        path: fullPath
      }
    })
    url = canonicalId
  }

  return {
    url,
    domain,
    path: fullPath
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
    domain = domain || ''
    while(path[0] === '/') path = path.slice(1)

    const others = await othersOnPath(targetType, domain, path, target)
    if(others.length > 0) throw { properties: { path: "taken" } }

    const canonicalId = App.encodeIdentifier([targetType, target])
    const existingCanonical = await Canonical.get(canonicalId)

    if(!redirect
      && existingCanonical
      && sameDomain(existingCanonical.domain, domain)
      && existingCanonical.path === path
    ) {
      return canonicalId
    }

    let url
    if(redirect) {
      url = app.generateUid()
      emit({
        type: 'RedirectCreated',
        redirect: app.generateUid(),
        identifiers: {
          targetType, target,
        },
        data: {
          domain, path
        }
      })
    } else {
      await deleteOwnRedirectsAt(targetType, target, domain, path, emit)
      if(existingCanonical) {
        emit({
          type: 'RedirectCreated',
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
        type: 'CanonicalSet',
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
