import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

export function normalizeTagName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

const Tag = definition.model({
  name: 'Tag',
  entity: {
    readAccessControl: {
      roles: []
    },
    writeAccessControl: {
      roles: []
    },
    deleteAccessControl: {
      roles: ['admin']
    }
  },
  properties: {
    tagType: {
      type: String,
      validation: ['nonEmpty'],
      input: 'select',
      options: ['hardSkill', 'softSkill', 'keyValue']
    },
    name: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 120 }]
    },
    normalizedName: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 120 }]
    }
  },
  indexes: {
    byTagTypeAndNormalizedName: {
      property: ['tagType', 'normalizedName']
    }
  }
})

definition.action({
  name: 'ensureTag',
  properties: {
    tagType: {
      type: String,
      validation: ['nonEmpty']
    },
    name: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 120 }]
    }
  },
  returns: {
    type: Tag
  },
  async execute({ tagType, name }, { client, service }, emit) {
    const normalizedName = normalizeTagName(name)
    if(!normalizedName.length) {
      throw new Error('tags_emptyTagName')
    }
    const id = App.encodeIdentifier([tagType, normalizedName])
    const existing = await Tag.get(id)
    if(existing) {
      return existing
    }
    const displayName = String(name).trim()
    await Tag.create({
      id,
      tagType,
      name: displayName.length ? displayName : normalizedName,
      normalizedName
    })
    return await Tag.get(id)
  }
})

definition.view({
  name: 'tagsByTypeAndPrefix',
  properties: {
    tagType: {
      type: String,
      validation: ['nonEmpty']
    },
    prefix: {
      type: String,
      default: ''
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Tag
    }
  },
  async daoPath(props, { client, service }, method) {
    const { tagType, prefix } = props
    const range = App.utils.extractRange(props)
    const namePrefix = normalizeTagName(prefix)
    const pathRange = App.utils.prefixRangePartial(
      range,
      `${JSON.stringify(tagType)}:${JSON.stringify(namePrefix).slice(0, -1)}`,
      `${JSON.stringify(tagType)}:${JSON.stringify(namePrefix).slice(0, -1)}`
    )    
    //console.log("TAG PATH RANGE", pathRange)
    const path = Tag.sortedIndexRangePath('byTagTypeAndNormalizedName', [tagType], pathRange)
    //console.log("RESULT", await app.dao.get(path))
    return path
  }
})

export { Tag }
