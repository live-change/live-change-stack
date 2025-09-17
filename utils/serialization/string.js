/** String writer that writer data to human readable string */
export class StringWriter {
  #outputArray = []
  constructor() {
  }

  writeType(type) {
    this.#outputArray.push(type)
    return this
  }

  writeSize(size) {
    this.#outputArray.push(size.toFixed())
    return this
  }

  writeKey(key) {
    this.#outputArray.push(key.length.toFixed())
    this.#outputArray.push(key)
    return this
  }

  writeString(str) {
    this.#outputArray.push(str.length.toFixed())
    this.#outputArray.push(str)
    return this
  }

  writeNumber(num) {
    this.#outputArray.push(num.toString())
    return this
  }

  writeBoolean(bool) {
    this.#outputArray.push(bool ? 'true' : 'false')
    return this
  }

  getOutput() {
    return this.#outputArray.join(';')
  }

}

export class StringReader {
  #data
  #dataPointer = 0
  constructor(serialized) {
    this.#data = serialized
  }

  readToken() {
    const nextSeparator = this.#data.indexOf(';', this.#dataPointer)
    const token = this.#data.slice(this.#dataPointer, nextSeparator === -1 ? this.#data.length : nextSeparator)
    this.#dataPointer = nextSeparator + 1
    return token
  }

  readType() {
    return this.readToken()
  }

  readKey() {
    const keyLength = parseInt(this.readToken())
    const key = this.#data.slice(this.#dataPointer, this.#dataPointer + keyLength)
    this.#dataPointer = this.#dataPointer + keyLength + 1
    return key
  }

  readSize() {
    const size = parseInt(this.readToken())
    return size
  }

  readString() {
    const size = parseInt(this.readToken())
    const str = this.#data.slice(this.#dataPointer, this.#dataPointer + size)
    this.#dataPointer = this.#dataPointer + size + 1
    return str
  }

  readNumber() {
    const num = parseFloat(this.readToken())
    return num
  }

  readBoolean() {
    const bool = this.readToken() === 'true'
    return bool
  }
}

import { write, read } from './serialization.js'

export function serializeToString(key) {
  const writer = new StringWriter()
  write(key, writer)
  return writer.getOutput()
}

export function deserializeFromString(serialized, structure) {
  const reader = new StringReader(serialized, structure)
  return read(reader)
}
