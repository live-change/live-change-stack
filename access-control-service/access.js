
module.exports = (definition) => {

  const Access = definition.foreignModel('access-control', 'Access')
  const PublicAccess = definition.foreignModel('access-control', 'PublicAccess')

  function clientHasAnyAccess(client, { objectType, object }) {
    /// TODO: access control
    return true
  }

  function clientHasAdminAccess(client, { objectType, object }) {
    /// TODO: access control
    return true
  }

  function clientCanInvite(client, { roles, objectType, object }) {
    /// TODO: access control
    return true
  }

  function clientCanRequest(client, { roles, objectType, object }) {
    /// TODO: access control
    return true
  }

  function clientHasAccessRole(client, { objectType, object }, role) {
    return true
  }

  return {
    clientHasAnyAccess, clientHasAdminAccess,
    clientCanInvite,
    clientCanRequest,
    clientHasAccessRole
  }

}
