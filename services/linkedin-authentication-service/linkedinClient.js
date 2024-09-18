import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import Debug from 'debug'
const debug = Debug('services:linkedinAuthentication')

import axios from 'axios'

const config = definition.config

const linkedinClientId = config.clientId || process.env.LINKEDIN_CLIENT_ID
const linkedinClientSecret = config.clientId || process.env.LINKEDIN_CLIENT_SECRET
export { linkedinClientId, linkedinClientSecret }


export async function getTokensWithCode(code, redirectUri) {
  if (!code) throw new Error("No code provided")
  if (!redirectUri) throw new Error("No redirectUri provided")

  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('redirect_uri', redirectUri)
  params.append('client_id', linkedinClientId)
  params.append('client_secret', linkedinClientSecret)

  const options = {
    url: 'https://www.linkedin.com/oauth/v2/accessToken',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: params.toString(),
  };

  try {
    const response = await axios(options)
    return response.data
  } catch (error) {
    console.log("OAUTH REQUEST", options)
    console.error("OAUTH ERROR", error?.stack || error?.message || JSON.stringify(error))
    console.error("OAUTH ERROR RESPONSE", error?.response?.data)
    throw error?.response?.data ? new Error(error?.response?.data) : error
  }
}

export async function getUserInfo(accessToken) {
  console.log("GET USER INFO", accessToken)
  const options = {
    url: 'https://api.linkedin.com/v2/userinfo',
    method: 'get',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }

  try {
    const response = await axios(options)
    return response.data
  } catch(error) {
    console.log("OAUTH REQUEST", options)
    console.error("OAUTH ERROR", error)
    throw error?.response?.data  ? new Error(error?.response?.data) : error
  }
}