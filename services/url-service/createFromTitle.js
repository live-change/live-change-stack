import latinize from 'latinize'

export default function createFromTitle(title) {
  let path = latinize(String(title ?? '')).toLowerCase()
  path = path.replace(/[@]+/g, '-at-')
  path = path.replace(/[_/\\\\ -]+/g, '-')
  path = path.replace(/[^a-z0-9-]+/g, '')
  path = path.replace(/-+/g, '-').replace(/^-|-$/g, '')
  return path
}
