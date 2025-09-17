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

/*   writeInteger(num) {
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
  } */

  writeNumber(num) {
    const exponentialString = num.toExponential()
    const [mantisaString, exponentString] = exponentialString.split('e')    
    
    const mantisa = +mantisaString
    const negative = mantisa < 0    
    const mantisaNumbers = mantisaString.slice(negative ? 1 : 0).replace('.', '')
    const mantisaEncoded = negative 
      ? (Math.pow(10, mantisaNumbers.length) - (+mantisaNumbers))
      : mantisaNumbers

    const exponent = +exponentString
    const negativeExponent = exponent < 0
    const negativeEncoded = negative ^ negativeExponent
    const exponentEncoded = negativeEncoded ? 9999 - Math.abs(exponent) : Math.abs(exponent) + 1
    const digitizedExponent = exponentEncoded.toString(10).padStart(4, '0')

    const prefix = (negativeEncoded ? '/' : '') + digitizedExponent
    const numKey = `${negative ? '-' : ''}${prefix}v${mantisaEncoded}`
    this.#structureWriter.writeSize(numKey.length)
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

  readNumber() {
    const size = this.#structureReader.readSize()    
    const numKey = this.#data.slice(this.#dataPointer, this.#dataPointer + size)
    this.#dataPointer += size + 1

    const [prefix, encodedMantisa] = numKey.split('v')
    const negative = prefix[0] === '-'
    const encodedExponentString = prefix.slice(negative ? 1 : 0)
    const negativeEncoded = encodedExponentString[0] == '/'    
    const encodedExponent = +encodedExponentString.slice(negativeEncoded ? 1 : 0)
    const absoluteExponent = negativeEncoded ? (9999 - encodedExponent) : encodedExponent - 1
    const negativeExponent = negativeEncoded ^ negative
    const exponent = negativeExponent ? -absoluteExponent : absoluteExponent

    const mantisaInteger = negative 
      ? ''+(Math.pow(10, encodedMantisa.length) - (+encodedMantisa))
      : ''+encodedMantisa

    const mantisa = mantisaInteger.length > 1 
      ? `${mantisaInteger[0]}.${mantisaInteger.slice(1)}` 
      : mantisaInteger
    const exponentialString = `${negative ? '-' : ''}${mantisa}e${exponent}`
    
    return +exponentialString
  }

  readBoolean() {
    const result = this.#data.slice(this.#dataPointer, this.#dataPointer + 4)
    this.#dataPointer += 5
    return result === 'true'
  }
}

import { write, read } from './serialization.js'

export function serializeKeyToString(key) {
  const writer = new StringKeyWriter()
  write(key, writer)
  return writer.getOutput()
}

export function deserializeKeyFromString(serialized, structure) {
  const reader = new StringKeyReader(serialized, structure)
  return read(reader)
}
