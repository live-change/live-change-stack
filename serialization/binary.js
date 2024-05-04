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

  /** write positive integer using unicode like coding scheme, because it will give sortable result */
  writeInteger(num) {
    if(this.#outputPosition + 9 > this.#outputBuffer.byteLength) this.allocateMore()
    if(num < 0) throw new Error('Only positive numbers are supported')
    if(num < 0x80) { // 7 bit number encoded as 0xxxxxxx
      this.#outputView.setUint8(this.#outputPosition++, num)
    } else if(num < 0x4000) { // 14 bit number encoded as 10xxxxxx xxxxxxxx
      this.#outputView.setUint16(this.#outputPosition, 0x8000 | num)
      this.#outputPosition += 2
    } else if(num < 0x200000) { // 21 bit number encoded as 110xxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint8(this.#outputPosition++, 0xC0 | (num >> 16))
      this.#outputView.setUint16(this.#outputPosition, num & 0xFFFF)
      this.#outputPosition += 3
    } else if(num < 0x10000000) { // 28 bit number encoded as 1110xxxx xxxxxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint32(this.#outputPosition, 0xE0000000 | num)
      this.#outputPosition += 4
    } else if(num < 0x800000000) { // 35 bit number encoded as 11110xxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint8(this.#outputPosition++, 0xF0 | (num >> 32))
      this.#outputView.setUint32(this.#outputPosition, num & 0xFFFFFFFF)
      this.#outputPosition += 5
    } else if(num < 0x40000000000) { // 42 bit number encoded as 111110xx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint16(this.#outputPosition, 0xF800 | (num >> 32))
      this.#outputView.setUint32(this.#outputPosition + 2, num & 0xFFFFFFFF)
      this.#outputPosition += 6
    } else if(num < 0x2000000000000) { // 49 bit number encoded as 1111110x xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint8(this.#outputPosition++, 0xFC | (num >> 48))
      this.#outputView.setUint16(this.#outputPosition, (num >> 32) & 0xFFFF)
      this.#outputView.setUint32(this.#outputPosition + 2, num & 0xFFFFFFFF)
      this.#outputPosition += 7
    } else if(num < 0x100000000000000) { // 56 bit number encoded as 11111110 xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint32(this.#outputPosition, 0xFE000000 | (num >> 32))
      this.#outputView.setUint32(this.#outputPosition + 4, num & 0xFFFFFFFF)
      this.#outputPosition += 4
    } else if(num < 0x8000000000000000) { // 63 bit number encoded as 11111111 xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint8(this.#outputPosition++, 0xFF)
      this.#outputView.setUint32(this.#outputPosition, num >> 32)
      this.#outputView.setUint32(this.#outputPosition + 4, num & 0xFFFFFFFF)
      this.#outputPosition += 9
    } else { // 64 bit number encoded as 11111111 xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx
      this.#outputView.setUint8(this.#outputPosition++, 0xFF)
      this.#outputView.setUint32(this.#outputPosition, num >> 32)
      this.#outputView.setUint32(this.#outputPosition + 4, num & 0xFFFFFFFF)
      this.#outputPosition += 9
    }
    return this
  }

  writeFloat(num) {
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
  #inputView = new DataView(this.#outputBuffer)
  constructor(inputBuffer, structureBuffer) {
    this.#inputBuffer = inputBuffer
    this.#inputView = new DataView(inputBuffer)
  }

  /** read positive integer using unicode like coding scheme, because it will give sortable result */
  readInteger() {
    const firstByte = this.#inputView.getUint8(this.#inputPosition++)
    if(firstByte < 0x80) return firstByte
    if(firstByte < 0xC0) return (firstByte & 0x3F) << 8 | this.#inputView.getUint8(this.#inputPosition++)
    if(firstByte < 0xE0) return (firstByte & 0x1F) << 16 | this.#inputView.getUint16(this.#inputPosition)
    if(firstByte < 0xF0) return this.#inputView.getUint32(this.#inputPosition)
    if(firstByte < 0xF8) return (firstByte & 0x07) << 32 | this.#inputView.getUint32(this.#inputPosition)
    if(firstByte < 0xFC) return (firstByte & 0x03) << 32 | this.#inputView.getUint32(this.#inputPosition)
      | this.#inputView.getUint16(this.#inputPosition + 4)
    if(firstByte < 0xFE) return (firstByte & 0x01) << 48 | this.#inputView.getUint32(this.#inputPosition) << 16
      | this.#inputView.getUint32(this.#inputPosition + 4)
    if(firstByte < 0xFF) return this.#inputView.getUint32(this.#inputPosition) << 32
      | this.#inputView.getUint32(this.#inputPosition + 4)
    return this.#inputView.getUint32(this.#inputPosition) << 32
      | this.#inputView.getUint32(this.#inputPosition + 4)
  }

  readFloat() {
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