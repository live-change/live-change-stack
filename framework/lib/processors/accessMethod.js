export default function getAccessMethod(access) {
  if(typeof access == 'function') {
    return access
  } else if(Array.isArray(access)) {
    return (params, { service, client }) => {
      if(client.roles.includes('administrator')) return true
      if(client.roles.includes('admin')) return true
      for(let role of access) if(client.roles.includes(role)) return true
      return false
    }
  } else throw new Error("unknown view access definition "+access)
}
