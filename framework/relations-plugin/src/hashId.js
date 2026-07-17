const HASH_ID_SALT = '@live-change/hashId/v1'
export const HASH_ID_PREFIX = 'h_'

function fnv1a64(str, offset = 0xcbf29ce484222325n) {
  let hash = offset
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i))
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn
  }
  return hash
}

function writeHashBytes(hash, bytes, offset) {
  for (let i = 0; i < 8; i++) {
    bytes[offset + i] = Number((hash >> BigInt(i * 8)) & 0xffn)
  }
}

function bytesToBase64Url(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = typeof btoa !== 'undefined'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function hashCompositeId(composite) {
  const bytes = new Uint8Array(16)
  writeHashBytes(fnv1a64(composite), bytes, 0)
  writeHashBytes(fnv1a64(HASH_ID_SALT + composite), bytes, 8)
  return bytesToBase64Url(bytes)
}
