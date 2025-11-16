import vm from 'vm'
import crypto from 'crypto'
import { ChangeStreamPipe } from './ChangeStream.js'
import pref_hooks from 'perf_hooks'
import { rangeIntersection, rangeUnion, unitRange, prefixRange } from './utils.js'
import { serializeKeyToString, deserializeKeyFromString, serializeKeyDataToString } from '@live-change/serialization'

const defaultNativeGlobals = [
  'Array', 'ArrayBuffer',
  'BigInt', 'BigInt64Array', 'BigUint64Array', 'Boolean',
  'console',
  'decodeURI', 'decodeURIComponent', 'DataView', 'Date',
  'encodeURI', 'encodeURIComponent', 'escape', 'eval', 'Error',
  'Float32Array', 'Float64Array', 'Function',
  'isFinite', 'Infinity', 'Int8Array', 'Int16Array', 'Int32Array', 'Intl',
  'JSON', 'Map', 'Math', 'NaN', 'Number', 'Object',
  'parseInt', 'Promise', 'Proxy',
  'RegExp', 'Set', 'String', 'Symbol',
  'undefined', 'unescape', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array',
  'WeakSet', 'WeakMap', 'WebAssembly'
]

const defaultContext = {
  crypto,
  sha1(data, encoding = 'hex') {
    if(typeof data != 'string') data = JSON.stringify(data)
    return crypto.createHash('sha1').update(data).digest(encoding)
  },
  sha256(data, encoding = 'hex') {
    if(typeof data != 'string') data = JSON.stringify(data)
    return crypto.createHash('sha256').update(data).digest(encoding)
  },
  hash(data, encoding = 'hex') {
    if(typeof data != 'string') data = JSON.stringify(data)
    return crypto.createHash('sha1').update(data).digest(encoding)
  },
  pipe() {
    return new ChangeStreamPipe()
  },
  rangeIntersection,
  rangeUnion,
  unitRange,
  prefixRange,

  serializeKey : serializeKeyToString,
  serializeKeyData : serializeKeyDataToString,
  deserializeKey : deserializeKeyFromString,

  'performance': pref_hooks.performance,
  constructor: null
}

const filenameRE = /scriptFile:(\d+):(\d+)\)$/g

class ScriptContext {
  constructor(userContext, nativeGlobals = defaultNativeGlobals) {
    let context = {}
    for(const key of nativeGlobals) {
      context[key] = global[key]
    }
    this.context = vm.createContext({ ...defaultContext, ...context, ...userContext })
/*    vm.runInContext(`
    (function() {
      const allowed = ${JSON.stringify(nativeGlobals.concat(Object.keys(userContext)))}
      const keys = Object.getOwnPropertyNames(this)
      keys.forEach((key) => {
        const item = this[key]
        if(!item) return
        this[key].constructor = undefined
        if(allowed.indexOf(key)) return
        this[key] = undefined
      })
    })()
    `, this.context, { filename: 'init' })*/

  }

  run(code, filename) {
    return vm.runInContext(code, this.context, { filename })
  }

  createFunctionFromCode(code, paramsNames, filename) {
    let func
    try {
      func = vm.runInContext(`async function(${Object.keys(paramsNames).join(', ')}) {\n${code}\n}`,
          this.context, { filename: 'scriptFile' })
    } catch(e) {
      const mappedTrace = e.replace(filenameRE, (all, line, column) => `${filename}:${+line-1}:${column}`)
      console.error("SCRIPT COMPILATION ERROR:\n" + mappedTrace)
      throw new Error("SCRIPT COMPILATION ERROR:\n" + mappedTrace)
    }
    return (...args) => {
      try {
        return func(...args)
      } catch(e) {
        const mappedTrace = e.replace(filenameRE, (all, line, column) => `${filename}:${+line-1}:${column}`)
        throw new Error(mappedTrace)
      }
    }
  }

  getOrCreateFunction(code, filename) {
    const cleanCode = code.replace(/\n +/g, "\n")
    if(!globalThis.compiledFunctions) globalThis.compiledFunctions = {}
    const compiledFunction = globalThis.compiledFunctions[cleanCode]
    if(compiledFunction) {
      /* console.log("found compiled function!", cleanCode) */
      if(typeof compiledFunction != 'function') {
        console.error("compiled function is not a function!", cleanCode)
        process.exit(20)
      }
      return compiledFunction
    }
    const queryFunction = this.run(code, filename)
    if(typeof queryFunction != 'function') {
      console.error("compiled query function is not a function!", cleanCode)
      console.trace('compiled function trace', code)
      process.exit(21)
    }
    globalThis.compiledFunctions[cleanCode] = queryFunction
    return queryFunction
  }
}

export default ScriptContext
