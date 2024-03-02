import ReaderModel from "./ReaderModel.js"

class ForeignModel extends ReaderModel {

  constructor(definition, service) {
    super(definition.serviceName, definition.name, service)
    this.service = service
  }

}

export default ForeignModel
