import { getSchema } from "@tiptap/core"
import { getExtensions } from "./contentConfigExtensions.js";

export function schemaTypesMapToObject(map) {
  let obj = {}
  for(let i = 0; i < map.content.length; i += 2) {
    const value = map.content[i+1]
    obj[map.content[i]] = {
      ...value,
      parseDOM: undefined
    }
  }
  return obj
}
export function serializeSchema(schema) {
  console.log("SERIALIZE", schema)
  return JSON.parse(JSON.stringify({
    marks: schemaTypesMapToObject(schema.marks),
    nodes: schemaTypesMapToObject(schema.nodes),
    topNode: schema.topNode
  }, null, '  '))
}

export function getSchemaSpecFromConfig(config) {
  const extensions = getExtensions(config)
  const schema = getSchema(extensions)
  return serializeSchema(schema.spec)
}
