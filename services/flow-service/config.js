import definition from './definition.js'

// definition.config is copied from app.config.services at createServiceDefinition
// time. Import this package only after app.config is assigned (see server/start.js).

const open = () => true

const {
  ownerTypes,
  logicTypes,
  graphTypes = ['flow_Graph'],
  nodeTypes = ['flow_Node'],
  connectionTypes,
  readAccess = open,
  writeAccess = open
} = definition.config || {}

definition.clientConfig = {
  ownerTypes,
  logicTypes,
  graphTypes,
  nodeTypes,
  connectionTypes
}

export default {
  ownerTypes,
  logicTypes,
  graphTypes,
  nodeTypes,
  connectionTypes,
  readAccess,
  writeAccess
}
