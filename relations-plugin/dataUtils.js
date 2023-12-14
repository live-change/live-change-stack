const App = require("@live-change/framework");

function extractIdentifiers(otherPropertyNames, properties) {
  const identifiers = {}
  for (const propertyName of otherPropertyNames) {
    identifiers[propertyName] = properties[propertyName]
  }
  return identifiers
}

function extractObjectData(writeableProperties, properties, defaults) {
  let objectData = {}
  for (const propertyName of writeableProperties) {
    if (properties.hasOwnProperty(propertyName)) {
      objectData[propertyName] = properties[propertyName]
    }
  }
  return App.utils.mergeDeep({}, defaults, JSON.parse(JSON.stringify(objectData)))
}

module.exports = {
  extractIdentifiers,
  extractObjectData
}