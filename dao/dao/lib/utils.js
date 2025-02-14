export function errorToJSON(error) {
  if(typeof error == 'object') {
    if(error instanceof Error && error.stack) return error.stack.toString()
    if(error instanceof Error && error.message) return error.message.toString()
    let obj = {}
    //obj.string = error.toString()
    Object.getOwnPropertyNames(error).forEach(function (key) {
      obj[key] = error[key]
    })
    if(error.message) obj.message = error.message.toString()
    if(error.stack) obj.stack = error.stack.toString()
    return obj
  }
  return error
}

function nextTickMicrotask(handler, ...args) {
  queueMicrotask(() => handler(...args))
}
function nextTickPromise(handler, ...args) {
  Promise.resolve()
      .then(() => handler(...args))
      .catch(err => setTimeout(() => { throw err }, 0))
}

const supportMicrotask = typeof queueMicrotask !== 'undefined'
const supportNextTick = typeof process !== 'undefined' && process.nextTick

export const nextTick = supportNextTick ? process.nextTick : (supportMicrotask ? nextTickMicrotask : nextTickPromise)