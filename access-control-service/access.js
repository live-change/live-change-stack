
module.exports = (definition) => {

  const Access = definition.foreignModel('access-control', 'Access')
  const PublicAccess = definition.foreignModel('access-control', 'PublicAccess')

  function clientHasAnyAccess(client, toType, toId) {
    /// TODO: access control
    return true
  }

  function clientHasAdminAccess(client, toType, toId) {
    /// TODO: access control
    return true
  }

  return {clientHasAnyAccess, clientHasAdminAccess }

}
