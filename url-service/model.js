const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config
const {
  urlReaderRoles = ['writer'],
  urlWriterRoles = ['writer']
} = config

const urlProperties = {
  domain: {
    type: String
  },
  path: {
    type: String,
    validation: ['nonEmpty']
  }
}

const Canonical = definition.model({
  name: 'Canonical',
  propertyOfAny: {
    readAccessControl: { /// everyone can read canonical urls
    },
    resetAccessControl: {
      roles: urlWriterRoles
    },
    to: 'target',
  },
  properties: {
    ...urlProperties
  },
  indexes: {
    byUrl: {
      property: ["targetType", "domain", "path"]
    }
  }
})

const Redirect = definition.model({
  name: 'Redirect',
  itemOfAny: {
    to: 'target',
    readAccessControl: {
      roles: urlReaderRoles
    },
    deleteAccessControl: {
      roles: urlWriterRoles
    }
  },
  properties: {
    ...urlProperties
  },
  indexes: {
    byUrl: {
      property: ["targetType", "domain", "path"]
    }
  }
})

const UrlToTarget = definition.index({
  name: 'Urls',
  function: async function(input, output) {
    const urlMapper = urlType => ({targetType, domain, path, target}) =>
      ({ id: `"${targetType}":${JSON.stringify(domain)}:${JSON.stringify(path)}_"${target}"`, target, type: urlType })
    const redirectMapper = urlMapper('redirect')
    const canonicalMapper = urlMapper('canonical')
    await input.table('url_Redirect').onChange(
      (obj, oldObj) => output.change(obj && redirectMapper(obj), oldObj && redirectMapper(oldObj))
    )
    await input.table('url_Canonical').onChange(
      (obj, oldObj) => output.change(obj && canonicalMapper(obj), oldObj && canonicalMapper(oldObj))
    )
  }
})

module.exports = { Canonical, Redirect, UrlToTarget }
