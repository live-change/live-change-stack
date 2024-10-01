import messagesJson from "./en.json"

import { locales as autoFormLocales } from "@live-change/frontend-auto-form"

function mergeDeep(...sources) {
  let acc = {}
  for (const source of sources) {
    if (source instanceof Array) {
      if (!(acc instanceof Array)) {
        acc = []
      }
      acc = acc.concat(source)
    } else if (source instanceof Object) {
      for (const [key, value] of Object.entries(source)) {
        if (value instanceof Object && key in acc) {
          acc[key] = mergeDeep(acc[key], value)
        } else {
          acc[key] = value
        }
      }
    }
  }
  return acc
}

const messages = mergeDeep(autoFormLocales.en, messagesJson)

export { messages }

export const numberFormats ={
  "usd": {
    "style": "currency",
      "currency": "USD",
      "notation": "standard"
  }
}

export const datetimeFormats = {
  "short": {
    "year": "numeric", "month": "short", "day": "numeric"
  },
  "shortTime": {
    "dateStyle": "short", "timeStyle": "short", "hour12": false
  },
  "shortestTime": {
    "month": "numeric", "day": "numeric", "hour": "numeric", "minute": "numeric", "hour12": false
  },
  "long": {
    "year": "numeric", "month": "short", "day": "numeric",
      "weekday": "short", "hour": "numeric", "minute": "numeric"
  }
}
