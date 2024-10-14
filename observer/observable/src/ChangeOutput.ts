import type { Change, ChangeReceiver } from './types'

const registry = new FinalizationRegistry((output: ChangeOutput) => {
  output.dispose()
})

export interface OutputSource {
  removeOutput(output: ChangeOutput): void
  drain(): void
}

export class ChangeOutput {
  receiver: WeakRef<ChangeReceiver> = null
  #source: OutputSource = null
  #changes: Change[] = []
  #finished: boolean = false
  #uid = Symbol()
  #handlingPromise: Promise<void> = null
  #updating = false

  constructor(receiver: ChangeReceiver, source: OutputSource) {
    this.receiver = new WeakRef(receiver)
    this.#source = source
    registry.register(receiver, this, this.#uid)
  }
  change(change: Change) {
    if(this.#finished) return
    const receiver = this.receiver.deref()
    if(!receiver) return this.dispose()
    if(this.#handlingPromise) {
      if(!change.key && !change.value) { // end or reset
        this.#updating = !this.#updating
        if(!this.#updating) // not updating, so sending all data, reseting changes
          this.#changes = [] // reset clearing all changes
      }
      this.#changes.push(change)
      return
    }
    this.#handlingPromise = receiver.onChange(change).then(async () => this.handleNextChanges())
  }
  async handleNextChanges() {
    while(this.#changes.length) {
      const change = this.#changes.shift()
      const receiver = this.receiver.deref()
      if(!receiver) return this.dispose()
      await receiver.onChange(change)
    }
    this.#source.drain()
    this.#handlingPromise = null
  }
  bufferSize() {
    return this.#changes.length
  }
  dispose() {
    if(this.#finished) return
    this.#finished = true
    this.#source.removeOutput(this)
    registry.unregister(this.#uid)
  }
}