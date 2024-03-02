const defaultNativeGlobals = [
  'Array', 'ArrayBuffer', 'atob',
  'BigIng', 'BigInt64Array', 'BigUint64Array', 'Boolean', 'btoa',
  'console', 'crypto', 'Crypto', 'CryptoKey',
  'decodeURI', 'decodeURIComponent', 'DataView', 'Date',
  'encodeURI', 'encodeURIComponent', 'escape', 'eval', 'Error',
  'Float32Array', 'Float64Array', 'Function',
  'isFinite', 'isNan', 'Infinity', 'Int8Array', 'Int16Array', 'Int32Array', 'Intl',
  'JSON', 'Map', 'Math', 'NaN', 'Number', 'Object',
  'parseInt', 'performance', 'Promise', 'Proxy', 'PromiseRejectionEvent',
  'RegExp', 'Set', 'String', 'Symbol',
  'undefined', 'unescape', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array',
  'WeakSet', 'WeakMap', 'WebAssembly'
]

const filenameRE = /<anonymous>:(\d+):(\d+)\)$/g

class WebScriptContext {
  constructor(userContext, nativeGlobals = defaultNativeGlobals) {
    this.eval = eval
  }

  run(code, filename) {
    return eval(code)
  }

  createFunctionFromCode(code, paramsNames, filename) {
    let func
    try {
      func = eval(`async function(${Object.keys(paramsNames).join(', ')}) {\n${code}\n}`)
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
    //console.log("COMPILED FUNCTIONS", `\n[\n  ${Object.keys(globalThis.compiledFunctions).join(',\n  ')},\n]`)
    if(!(globalThis.compiledFunctions = globalThis.compiledFunctions || {})[cleanCode]) {
      console.log("############# compiled function not found: ", code)
      for(const key of Object.keys(globalThis.compiledFunctions)) {
        console.log(`compiled func |${cleanCode}| == |${key}| => ${cleanCode == key}`)
      }
    }
    const queryFunction = (globalThis.compiledFunctions = globalThis.compiledFunctions || {})[cleanCode]
      ?? this.run(code, filename)
    ;(globalThis.compiledFunctions = globalThis.compiledFunctions || {})[cleanCode] = queryFunction
    return queryFunction
  }
}

export default WebScriptContext
