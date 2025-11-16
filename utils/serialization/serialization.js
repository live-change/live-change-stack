
export const typeMap = Object.freeze({
  'string': 's',
  'number': 'n',
  'boolean': 'b',
  'object': 'o',
  'null': 'z',
  'array': 'a',
  'undefined': 'u'
})

export const types = Object.freeze(Object.fromEntries(
  Object.entries(typeMap).map(([type, key]) => [key, type])
))

/** Serialize any data using writer
 *
 * @param {any} data
 * @param {Writer} writer
 */
export function write(data, writer) {
  switch(typeof data) {
    case 'string': return writer.writeType(typeMap.string).writeString(data)
    case 'number': {
      return writer.writeType(typeMap.number).writeNumber(data)
    }
    case 'boolean': return writer.writeType(typeMap.boolean).writeBoolean(data)
    case 'object':
      if(data === null) return writer.writeType(typeMap.null)
      if(Array.isArray(data)) {
        writer.writeType(typeMap.array).writeSize(data.length)
        for(let value of data) write(value, writer)
        return writer
      }
      const entries = Object.entries(data)
      writer.writeType(typeMap.object).writeSize(entries.length)
      for(let [key, value] of entries) {
        writer.writeKey(key)
        write(value, writer)
      }
      return writer
    case 'undefined': return writer.writeType(typeMap.undefined)
    default:
      throw new Error(`Unsupported type: ${typeof data}`)
  }
}

/** Deserialize data using reader
 *
 * @param {Reader} reader
 * @returns {any}
 */
export function read(reader) {
  const type = reader.readType()
  switch(type) {
    case typeMap.string:
      return reader.readString()
    case typeMap.number:
      return reader.readNumber()
    case typeMap.boolean:
      return reader.readBoolean()
    case typeMap.object: {
      const size = reader.readSize()
      const entries = []
      for(let i = 0; i < size; i++) {
        const key = reader.readKey()
        const value = read(reader)
        entries.push([key, value])
      }
      return Object.fromEntries(entries)
    }
    case typeMap.null:
      return null
    case typeMap.array: {
      const size = reader.readSize()
      const array = []
      for(let i = 0; i < size; i++) array.push(read(reader))
      return array
    }
    default:
      throw new Error(`Unsupported type: ${type}`)
  }
}
