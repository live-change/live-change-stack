const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/** Writer that will write data in binary format. */
class BinaryWriter {
  #outputBuffer = new ArrayBuffer(1024)
  #outputPosition = 0
  #outputView = new DataView(this.#outputBuffer)
  #structureBuffer 
  #structurePosition = 0
  #structureView
  constructor(structure) {
    if(structure) {
      this.#structureBuffer = new ArrayBuffer(1024)
      this.#structureView = new DataView(this.#structureBuffer)
    }
  }

  allocateMore() {
    const newBuffer = new ArrayBuffer(this.#outputBuffer.byteLength * 2)
    const newView = new DataView(newBuffer)
    new Uint8Array(newBuffer).set(new Uint8Array(this.#outputBuffer))
    this.#outputBuffer = newBuffer
    this.#outputView = newView
  }

  writeNumber(num) {
    if(this.#outputPosition + 8 > this.#outputBuffer.byteLength) this.allocateMore()
    this.#outputView.setFloat64(this.#outputPosition, num)
    this.#outputPosition += 8
    return this
  }

  writeType(type) {
    this.writeInteger(type)
    return this
  }

  writeSize(size) {
    this.writeInteger(size)
    return this
  }

  writeString(str) {
    const encoded = textEncoder.encode(str, new Uint8Array(this.#outputBuffer, this.#outputPosition))
    this.writeInteger(encoded.length)
    // copy string to output buffer
    new Uint8Array(this.#outputBuffer, this.#outputPosition).set(encoded)
    this.#outputPosition += encoded.length
    return this
  }

  writeKey(key) {
    const encoded = textEncoder.encode(str, new Uint8Array(this.#outputBuffer, this.#outputPosition))
    this.writeInteger(encoded.length)
    if(this.#structureBuffer) {
      new Uint8Array(this.#structureBuffer, this.#structurePosition).set(encoded)
      this.#structurePosition += encoded.length
      return this
    }
    new Uint8Array(this.#outputBuffer, this.#outputPosition).set(encoded)
    this.#outputPosition += encoded.length
    return this
  }

  writeBoolean(bool) {
    this.#outputView.setUint8(this.#outputPosition++, bool ? 1 : 0)
    return this
  }

  writeNull() {
  }

}

export class BinaryReader {
  #inputBuffer
  #inputPosition = 0
  #inputView = new DataView(this.#inputBuffer)
  constructor(inputBuffer, structureBuffer) {
    this.#inputBuffer = inputBuffer
    this.#inputView = new DataView(inputBuffer)
  }

  readNumber() {
    const result = this.#inputView.getFloat64(this.#inputPosition)
    this.#inputPosition += 8
    return result
  }

  readType() {
    return this.readInteger()
  }

  readSize() {
    return this.readInteger()
  }

  readString() {
    const size = this.readInteger()
    const result = textDecoder.decode(new Uint8Array(this.#inputBuffer, this.#inputPosition, size))
    this.#inputPosition += size
    return result
  }

  readKey() {
    return this.readString()
  }

  readBoolean() {
    return this.#inputView.getUint8(this.#inputPosition++) === 1
  }

  readNull() {
  }
}

import { write, read } from './serialization.js'

export function serializeToBinary(key) {
  const writer = new BinaryWriter()
  write(key, writer)
  return writer.getOutput()
}

export function deserializeFromBinary(serialized, structure) {
  const reader = new BinaryReader(serialized, structure)
  return read(reader)
}
