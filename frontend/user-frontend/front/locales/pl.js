import messages from "./pl.json"

import { locales as autoFormLocales } from "@live-change/frontend-auto-form"

export { messages }

export const numberFormats = {
  "pln": {
    "style": "currency",
    "currency": "PLN",
    "notation": "standard"
  },
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