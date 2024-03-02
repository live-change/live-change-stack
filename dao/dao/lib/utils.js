export function errorToJSON(error) {
  if(typeof error == 'object') {
    let obj = {}
    Object.getOwnPropertyNames(error).forEach(function (key) {
      obj[key] = error[key]
    })
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