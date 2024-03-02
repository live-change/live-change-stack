
class InboxReader {
  constructor(observableFunction, callback, start = '', bucketSize = 32, idField = 'id',
              positionFilterCallback = (n, curr) => n > curr ) {
    this.observableFunction = observableFunction
    this.position = start
    this.callback = callback
    this.bucketSize = bucketSize
    this.idField = idField
    this.positionFilterCallback = positionFilterCallback

    this.observable = null
    this.queue = []
    this.processingPromise = null
    this.finished = false
    this.readPromise = null
    this.readPromiseResolve = null

    this.observer = (signal, ...args) => {
      if(signal == 'error') {
        const error = args[0]
        console.error("PEER MESSAGE ERROR", error.stack || error)
        return
      }
      if(signal == 'putByField') {
        const [field, id, message] = args
        this.handleMessage(message)
      } else if(signal == 'set') {
        const value = args[0]
        for (const message of value) {
          this.handleMessage(message)
        }
      } else if(signal == 'push') {
        const [...messages] = args
        for(const message of messages) this.handleMessage(message)
      } else {
        console.error("INBOX READER SIGNAL NOT HANDLED", signal)
      }
      this.startProcessing()
      this.observeNext()
    }
    this.observeNext()
  }

  observeNext() {
    if(this.queue.length > this.bucketSize) return // no need to observe, there is work to do
    if(this.observable) {
      const observableValue = this.observable.getValue()
      if(!observableValue) return // still loading data
      if(observableValue.length < this.bucketSize) return // we are waiting for more
    }
    if(this.observable) {
      this.observable.unobserve(this.observer)
      this.observable = null
    }
    this.readPromise = new Promise(resolve => this.readPromiseResolve = resolve)
    this.observable = this.observableFunction(this.position, this.bucketSize)
    this.observable.observe(this.observer)
  }

  handleMessage(message) {
    if(!this.positionFilterCallback(message[this.idField], this.position)) return // ignore
    this.position = message[this.idField]
    this.queue.push(message)
  }

  startProcessing() {
    if(!this.processingPromise) {
      this.processingPromise = this.doProcessing()
      this.processingPromise.then(() => this.processingPromise = null)
    }
    return this.processingPromise
  }

  async doProcessing() {
    while(this.queue.length > 0 && !this.finished) {
      const message = this.queue.shift()
      await this.callback(message)
      this.observeNext() // observe if needed
    }
  }

  async sync() {
    while(this.queue.length > 0 || this.readPromise) {
      if(this.queue.length > 0) await this.startProcessing()
      if(this.readPromise) await this.readPromise
    }
  }

  dispose() {
    this.finished = true
    if(this.observable) {
      this.observable.unobserve(this.observer)
      this.observable = null
    }
  }

}

export default InboxReader
