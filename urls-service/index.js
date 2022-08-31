const App = require("@live-change/framework")
const app = App.app()

const definition = require('./definition.js')
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

const { Url, AccessInvitation } = require("./model.js")

definition.view({
  name: "url",
  properties: {
    ownerType: {
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
    type: Url
  },
  daoPath({ ownerType, domain, path }, { client, service }, method) {
    return Url.path([ownerType, domain, path])
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

definition.trigger({
  name: 'generateSlug',
  properties: {
    ownerType: {
      type: String,
      validation: ['nonEmpty']
    },
    owner: {
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
      type: String
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
  queuedBy: 'ownerType',
  async execute (props, { client, service }, emit) {
    console.log("GENERATE URL", props)
    if(!props.ownerType || !props.owner) throw new Error("url must have owner")
    const prefix = props.prefix || ''
    const suffix = props.suffix || ''
    const randomCharacters = props.charset ? charsets[props.charset] : charsets.all
    let randomPathLength = props.length || defaultRandomPathLength
    const group = props.group
    let maxLength = props.maxLength || 125
    maxLength -= group.length
    const sufixLength = 15
    let path = ''
    let random = false
    if(props.path) {
      path = path
      const cutLength = maxLength - sufixLength/// because max id size
      if (path.length > cutLength) {
        let lastSep = path.lastIndexOf('-')
        if(lastSep > cutLength - 40) path = path.slice(0, lastSep)
        else path = path.slice(0, cutLength)
      }
    } else {
      if (props.title) { // generated from title
        path = createFromTitle(props.title)
        const cutLength = maxLength - sufixLength /// because max id size
        while (path.length > cutLength) {
          let lastSep = path.lastIndexOf('-')
          if (lastSep > cutLength - 40) path = path.slice(0, lastSep)
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
      const res = await Url.indexObjectGet('byUrl', [props.ownerType, props.domain, fullPath])
      if(res == null) {
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

    const url = app.generateUid()
    emit({
      type: 'ownerOwnedUrlCreated',
      url,
      identifiers: {
        ownerType: props.ownerType,
        owner: props.owner,
        domain: props.domain,
        path: fullPath
      },
      data: {
        redirect: props.redirect
      }
    })

    return {
      url,
      domain: props.domain,
      path: prefix + path + suffix
    }
  }
})

definition.action({
  name: 'takeUrl',
  waitForEvents: true,
  properties: {
    ownerType: {
      type: String,
      validation: ['nonEmpty']
    },
    owner: {
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
      type: String
    }
  },
  accessControl: {
    roles: urlWriterRoles,
    objects: ({ ownerType: objectType, owner: object }) => ({ objectType, object })
  },
  queuedBy: 'ownerType',
  async execute({ ownerType, owner, domain, path, redirect }, { client, service }, emit) {
    const res = await Url.indexObjectGet('byUrl', [ownerType, domain, path])
    if(res) throw { properties: { path: "taken" } }

    const url = app.generateUid()
    emit({
      type: 'ownerOwnedUrlCreated',
      url,
      identifiers: {
        ownerType,
        owner,
        domain,
        path
      },
      data: {
        redirect
      }
    })

    return url
  }

})

definition.action({
  name: 'redirectUrl',
  properties: {
    ownerType: {
      type: String,
      validation: ['nonEmpty']
    },
    owner: {
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
      type: String
    }
  },
  accessControl: {
    roles: urlWriterRoles,
    objects: ({ ownerType: objectType, owner: object }) => ({ objectType, object })
  },
  waitForEvents: true,
  queuedBy: 'group',
  async execute({ ownerType, owner, domain, path, redirect }, { client, service }, emit) {
    const res = await Url.indexObjectGet('byUrl', [ownerType, domain, path])
    if(res) throw new Error('not_found')

    emit({
      type: 'ownerOwnedUrlUpdated',
      url: res.id,
      identifiers: {
        ownerType,
        owner,
        domain,
        path
      },
      data: {
        redirect
      }
    })

    return res.id
  }
})

module.exports = definition
