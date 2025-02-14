import countries from '../utils/countries.js'

export function parsePhoneNumber(number) {
  let countryFound = countries.find((country) => number.startsWith(country.dial_code))
  if(countryFound) {
    const countryCode = countryFound.dial_code
    const localNumber = number.slice(countryFound.dial_code.length)
    return { countryCode, localNumber }
  } else {
    countryFound = countries.find((country) => number.startsWith(country.dial_code.slice(1)))
    const countryCode = countryFound ? countryFound.dial_code : null
    const localNumber = number.slice(countryFound ? countryFound.dial_code.length - 1 : 0)
    return { countryCode, localNumber }
  }
}

export function formatPhoneNumber(number) {
  const parsed = parsePhoneNumber(number)
  if(!parsed.countryCode) return number
  return `${parsed.countryCode} ${parsed.localNumber}`
}
