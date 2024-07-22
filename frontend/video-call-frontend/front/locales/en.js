import messages from "./en.json"
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
