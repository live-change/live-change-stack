import definition from './definition.js'
const config = definition.config

import maxmind from 'maxmind'

const countryDatabase = maxmind.open(config.geoIpCountryPath ?? process.env.GEOIP_COUNTRY_PATH)
const defaultCountry = config.geoIpDefaultCountry || process.env.GEOIP_DEFAULT_COUNTRY || "unknown"
countryDatabase.catch(err => console.error('COUNTRY DB ERROR', err))

async function getGeoIp(ip) {
  if(!ip) return defaultCountry
  if(ip === '1' || ip.slice(0,4) === '127.') return defaultCountry
  return countryDatabase.then(db => {
    console.log('GEOIP', db, ip)
    let result = db.get(ip)
    if(!result) return defaultCountry
    if(!result.country) return defaultCountry
    return result.country.iso_code
  }).catch(error => {
    console.error("GEOIP", ip, error);
    return defaultCountry
  })
}

definition.view({
  name: "myCountry",
  properties: {
  },
  returns: {
    type: String
  },
  remote: true,
  async fetch(props, { client, context }) {
    client.ip = '137.74.93.199'
    const geoIpResult = await getGeoIp(client.ip)
    console.log('GEOIP', client.ip, '=>', geoIpResult)
    return geoIpResult
  }
})

