import { ActionContext, ViewContext } from "../definition/types.js"

export type AccessFunction = (params: Record<string, any>, context: ViewContext | ActionContext) => boolean

export type AccessSpecification = AccessFunction | string[] | 'internal'

export default function getAccessMethod(access: AccessSpecification) {
  if(typeof access == 'function') {
    return access
  } else if(Array.isArray(access)) {
    return (params, { service, client }) => {
      if(client.internal) return true
      if(client.roles.includes('admin')) return true
      for(let role of access) if(client.roles.includes(role)) return true
      return false
    }
  } else if(access === 'internal') {
    return (params, { service, client }) => {
      if(client.internal) return true
      if(client.roles.includes('admin')) return true
      return false
    }
  } else throw new Error("unknown view access definition " + access)
}
