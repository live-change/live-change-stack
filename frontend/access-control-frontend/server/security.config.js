const lcp = require("@live-change/pattern")

const clientKeys = (client) => [
  { key: 'user', value: client.user },
  { key: 'session', value: client.session },
  { key: 'ip', value: client.ip }
]

const failedAuthCodes = lcp.chain([
  { type: "wrong-secret-code", id: "1st-failed-secret-code" },
  { eq: "ip", expire: "10m" },
  { type: "wrong-secret-code", id: "2nd-failed-secret-code" },
  { eq: "ip", expire: "10m" },
  { type: "wrong-secret-code", id: "3rd-failed-secret-code",
    actions: [
      { type: 'ban', keys: ['ip'], ban: { type: 'captcha', actions: ['checkSecretCode'], expire: "30m" } }
    ]
  }
]).model

const patterns = lcp.mergeModels(
  //failedAuthCodes
)

const counters = [
  {
    id: 'wrong-codes-captcha',
    match: ['wrong-secret-code'],
    keys: ['ip'],
    max: 2,
    duration: '1m',
    actions: [
      { type: 'ban', keys: ['ip'], ban: { type: 'captcha', actions: ['checkSecretCode'], expire: "30m" } }
    ]
  },
  {
    id: 'wrong-codes-ban',
    visible: true,
    match: ['wrong-secret-code'],
    keys: ['ip'],
    max: 5,
    duration: '10m',
    actions: [
      { type: 'ban', keys: ['ip'], ban: { type: 'block', actions: ['checkSecretCode'], expire: "2m" } }
    ]
  }
]

module.exports = {
  clientKeys,
  patterns,
  counters
}
