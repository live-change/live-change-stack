import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import Debug from 'debug'
const debug = Debug('services:googleAuthentication')

import axios from 'axios'

import config from './config.js'

const googleClientId = config.clientId
const googleClientSecret = config.clientSecret
export { googleClientId, googleClientSecret }

export async function getTokensWithCode(code, redirectUri) {
  if(!code) throw new Error("No code provided")
  if(!redirectUri) throw new Error("No redirectUri provided")

  const options = {
    url: 'https://accounts.google.com/o/oauth2/token',
    method: 'post',
    data: {
      code: code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }
  }

  try {
    const response = await axios(options)
    return response.data
  } catch(error) {
    console.error("OAUTH ERROR", error?.stack || error?.message || JSON.stringify(error))
    console.error("OAUTH ERROR RESPONSE", error?.response?.data)
    throw error?.response?.data
      ? new Error(error?.response?.data?.error || error?.response?.data)
      : new Error(error.message || error.toString())
  }
}

export async function getUserInfo(accessToken) {
  const options = {
    url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    method: 'get',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }

  try {
    const response = await axios(options)
    return response.data
  } catch(error) {
    console.error("OAUTH ERROR", error)
    throw error?.response?.data  ? new Error(error?.response?.data) : error
  }
}
