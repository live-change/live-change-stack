const ReaderModel = require("./ReaderModel.js")

class ForeignModel extends ReaderModel {

  constructor(definition, service) {
    super(definition.serviceName, definition.name, service)
    this.service = service
  }

}

module.exports = ForeignModel
