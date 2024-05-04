import { read, write, typeMap, types } from './serialization.js'
export { read, write, typeMap, types }

import { StringKeyWriter, StringKeyReader } from './stringKey.js'
export { StringKeyWriter, StringKeyReader }

function serializeKeyToString(key) {
  const writer = new StringKeyWriter(' ')
  write(key, writer)
  return writer.getOutput()
}

function deserializeKeyFromString(serialized, structure) {
  const reader = new StringKeyReader(serialized, structure)
  return read(reader)
}

import { StringWriter, StringReader } from './string.js'
export { StringWriter, StringReader }

function serializeToString(key) {
  const writer = new StringWriter()
  write(key, writer)
  return writer.getOutput()
}

function deserializeFromString(serialized, structure) {
  const reader = new StringReader(serialized, structure)
  return read(reader)
}

function serializeToStringExperiment(serialize, deserialize, examplesGroups) {
  for(const examples of examplesGroups) {
    console.log("Examples", examples)
    for(let key of examples) {
      console.log('serialize', key)
      const serialized = serialize(key)
      console.log('result', serialized.replace(/\x00/g, '▪'))
      console.log('deserialized', deserialize(serialized))
      console.log('---')
    }
  }
}

const examples = [
  [
    'singleString'
  ],
  [
    ['string1', 'string2'],
    ['string3', 'string543'],
  ],
  [
    123, 2342534
  ],
  [
    ['test', null, 123],
    ['test2', null, 43543]
  ],
  [
    { a: 1, b: 2 },
    { a: 3, b: 1123 }
  ],
  [
    [new Date().toISOString(), Date.now(), { a: 1, b: 2 }],
    [new Date(1).toISOString(), 1, { a: 0, b: 3 }]
  ]
]

serializeToStringExperiment(serializeKeyToString, deserializeKeyFromString, examples)
serializeToStringExperiment(serializeToString, deserializeFromString, examples)
