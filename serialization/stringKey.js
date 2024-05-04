import { StringWriter, StringReader } from './string.js'

export class StringKeyWriter {
  // private variable for data buffer, data must be sortable in the same order as keys
  #data = []
  // private variable for structure buffer, structure will be added to the end of the data buffer
  #structureWriter = new StringWriter()
  #separator = '\x00'
  constructor(separator) {
    if(separator) this.#separator = separator
  }

  writeType(type) {
    this.#structureWriter.writeType(type)
    return this
  }

  writeSize(size) {
    this.#structureWriter.writeSize(size)
    return this
  }

  writeKey(key) {
    this.#structureWriter.writeKey(key)
    return this
  }

  writeString(str) {
    this.#structureWriter.writeSize(str.length)
    this.#data.push(str)
    return this
  }

  writeInteger(num) {
    const numString = num.toString()
    const numKey = `${numString.length}:${numString}`
    this.#structureWriter.writeSize(numString.length)
    this.#data.push(numKey)
    return this
  }

  writeFloat(num) {
    const numString = num.toString()
    const numKey = `${numString.length}:${numString}`
    this.#structureWriter.writeSize(numString.length)
    this.#data.push(numKey)
    return this
  }

  writeBoolean(bool) {
    this.#data.push(bool ? 'true' : 'false')
    return this
  }

  writeNull() {
    return this
  }

  getOutput() {
    //console.log('data', this.#data)
    //console.log('structure', this.#structureWriter.getOutput())
    const structure = this.#structureWriter.getOutput()
    return this.#data.join(this.#separator) + this.#separator + structure + ':' + structure.length
  }

  getStructure() {
    return this.#structureWriter.getOutput()
  }

  getData() {
    return this.#data.join(this.#separator)
  }

}

export class StringKeyReader {
  #data
  #dataPointer = 0
  #structureReader

  constructor(serialized) {
    const lastSeparator = serialized.lastIndexOf(':')
    const structureLength = parseInt(serialized.slice(lastSeparator + 1))
    const structure = serialized.slice(lastSeparator - structureLength, lastSeparator)
    this.#data = serialized.slice(0, lastSeparator - structureLength - 1)
    this.#structureReader = new StringReader(structure)
  }

  readType() {
    return this.#structureReader.readType()
  }

  readSize() {
    return this.#structureReader.readSize()
  }

  readKey() {
    return this.#structureReader.readKey()
  }

  readNull() {
    return null
  }

  readString() {
    const size = this.#structureReader.readSize()
    const result = this.#data.slice(this.#dataPointer, this.#dataPointer + size)
    this.#dataPointer += size + 1
    return result
  }

  readInteger() {
    const size = this.#structureReader.readSize()
    const numKeySize = (size.toFixed().length) + 1 + size
    const numKey = this.#data.slice(this.#dataPointer, this.#dataPointer + numKeySize)
    this.#dataPointer += numKeySize + 1
    const numStr = numKey.slice(numKey.indexOf(':') + 1)
    return +numStr
  }

  readBoolean() {
    const result = this.#data.slice(this.#dataPointer, this.#dataPointer + 4)
    this.#dataPointer += 5
    return result === 'true'
  }
}