import definition from './definition.js'

const {
  agreements = ['privacyPolicy', 'termsOfService']
} = definition.config

definition.clientConfig = {
  agreements
}

const config = {
  agreements
}

export default config
