import { describe, it } from 'node:test'
import assert from 'node:assert'
import { serializeKeyToString, deserializeKeyFromString } from '../stringKey.js'

function testSerializeToString(data) {
  const serialized = serializeKeyToString(data)
  console.log('serialized', serialized)
  const deserialized = deserializeKeyFromString(serialized)
  console.log('deserialized', deserialized)
  assert.deepStrictEqual(deserialized, data)
}

function deepCompare(a, b) {
  if(typeof a !== typeof b) return 'different'
  if(typeof a === 'object') {
    if(Array.isArray(a) && Array.isArray(b)) {
      const maxLength = Math.max(a.length, b.length)
      for(let i = 0; i < maxLength; i++) {
        const av = a[i]
        const bv = b[i]
        if(av === undefined || bv === undefined) return 'different'              
        const result = deepCompare(a[i], b[i])
        if(result !== 'equal') return result
      }
    }
    for(let key in b) {
      const av = a[key]
      const bv = b[key]
      if(av === undefined || bv === undefined) return 'different'
    }
    for(let key in a) {
      const av = a[key]
      const bv = b[key]
      if(av === undefined || bv === undefined) return 'different'
      
      const result = deepCompare(av, bv)
      if(result !== 'equal') return result
    }
    return 'equal'
  }
  if(a === b) return 'equal'
  if(a > b) return 'greater'
  if(a < b) return 'less'
  return 'different'
}

function testCompareSerialization(a, b) {
  const serializedA = serializeKeyToString(a)
  const serializedB = serializeKeyToString(b)
  const comparison = deepCompare(a, b)
  const serializedComparison = deepCompare(serializedA, serializedB)
  if(comparison === 'different') {
    return // ignore different values
  }
  if(comparison !== serializedComparison) {
    console.log("Compare Failed", JSON.stringify(a), JSON.stringify(b), '=>', comparison, '!=',
      serializedComparison, JSON.stringify(serializedA), JSON.stringify(serializedB))
  }
  assert.deepStrictEqual(comparison, serializedComparison)
}

describe('stringKey serialization', () => {
  it('should serialize and deserialize numbers', () => {
    testSerializeToString(1)
    testSerializeToString(1.1)
    testSerializeToString(1.11)
    testSerializeToString(0.001)
    testSerializeToString(10000)
    testSerializeToString(-1)
    testSerializeToString(-1.1)
    testSerializeToString(-1.11)
    testSerializeToString(-0.001)
    testSerializeToString(-10000)
  })
  it('should serialize and deserialize strings', () => {
    testSerializeToString('')
    testSerializeToString('a')
    testSerializeToString('ab')
    testSerializeToString('abc')
    testSerializeToString('abcd')
    testSerializeToString('abcde')
    testSerializeToString('abcdef')
    testSerializeToString('a\n\r')
    testSerializeToString('a{}\t')
  })
  it('should serialize and deserialize booleans', () => {
    testSerializeToString(true)
    testSerializeToString(false)
  })
  it('should serialize and deserialize null', () => {
    testSerializeToString(null)
  })
  it('should serialize and deserialize objects', () => {
    testSerializeToString({ a: 1, c: 'a', b: 2 })
  })
  it('should serialize and deserialize arrays', () => {
    testSerializeToString([1, 2, 3])
    testSerializeToString(['a', 'b', 'c'])
    testSerializeToString([true, false, null])
    testSerializeToString([{ a: 1, c: 'a', b: 2 }, { a: 3, b: 4 }])
  })

  it('should leave numbers in the same order', () => {
    const numers = [1, 2, 1.1, 1.11, 0.001, 10000, 10000.1, -1, -1.1, -1.11, -0.001, -10000, -10000.1]
    for(let i = 0; i < numers.length; i++) {
      for(let j = i + 1; j < numers.length; j++) {
        testCompareSerialization(numers[i], numers[j])
      }    
    }
  })
  it('should leave strings in the same order', () => {
    const strings = ['', 'a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef', 'a\n\r', 'a{}\t']
    for(let i = 0; i < strings.length; i++) {
      for(let j = i + 1; j < strings.length; j++) {
        testCompareSerialization(strings[i], strings[j])
      }
    }
  })
  it('should leave booleans in the same order', () => {
    const booleans = [true, false]
    for(let i = 0; i < booleans.length; i++) {
      for(let j = i + 1; j < booleans.length; j++) {
        testCompareSerialization(booleans[i], booleans[j])
      }
    }
  })
  it('should leave arrays in the same order', () => {
    const arrays = [[], [1], [1, 2], [1, 2, 3], [1, 2, 3, 4], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]
    for(let i = 0; i < arrays.length; i++) {
      for(let j = i + 1; j < arrays.length; j++) {
        testCompareSerialization(arrays[i], arrays[j])
      }
    }
  })
  it('should leave objects in the same order', () => {
    const objects = [{}, {a: 1}, {a: 1, b: 2}, {a: 1, b: 2, c: 3}, {a:2, b: 1}, {a: 2}, {a:1, b:1}]
    for(let i = 0; i < objects.length; i++) {
      for(let j = i + 1; j < objects.length; j++) {
        testCompareSerialization(objects[i], objects[j])
      }
    }
  })
  
})