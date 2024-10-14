import type { ObservableLike, Entry, ChangeReceiver, Change } from './types.ts'
import  { ChangeOutput, OutputSource } from './ChangeOutput'

interface ObservableSource {
  start(observable: ChangeReceiver): void
  stop(): void,
  get(): Promise<Entry[]>
}

class Observable implements ObservableLike, OutputSource, ChangeReceiver {
  #source: ObservableSource
  #data: Entry[] = []
  #loading: boolean = true
  #outputs: ChangeOutput[] = []
  #drainCallbacks: (() => void)[] = []
  #loadingCallback: (entries: Entry[]) => void = null
  #loadingPromise: Promise<Entry[]> =
    new Promise(resolve => this.#loadingCallback = resolve)

  constructor(source: ObservableSource) {
    this.#source = source
  }

  removeOutput(output: ChangeOutput) {
    const index = this.#outputs.indexOf(output)
    if(index === -1) throw new Error('ChangesOutput not found in observable')
    this.#outputs.splice(index, 1)
    if(this.#outputs.length === 0) this.#source.stop()
  }

  addOutput(output: ChangeOutput) {
    this.#outputs.push(output)
    if(this.#outputs.length === 1) this.#source.start(this)
  }

  drain() {
    for(const cb of this.#drainCallbacks) cb()
    this.#drainCallbacks = []
  }

  observe(receiver: ChangeReceiver) {
    const output = new ChangeOutput(receiver, this)
    this.addOutput(output)
  }

  unobserve(receiver: ChangeReceiver) {
    for(let i = this.#outputs.length - 1; i >= 0; i--) {
      const otherReceiver = this.#outputs[i].receiver.deref()
      if(otherReceiver === receiver) {
        this.#outputs[i].dispose()
        return
      } else if (!otherReceiver) {
        this.#outputs[i].dispose()
        i--
      }
    }
  }

  onChange(change: Change): Promise<void> {
    if(change.key === null && change.value === null) {
      this.#loading = !this.#loading
      if(this.#loading) {
        this.#data = []
        this.#loadingPromise =
          new Promise(resolve => this.#loadingCallback = resolve)
      } else {
        this.#loadingCallback(this.#data)
      }
    } else if(this.#loading) {
      this.#data.push(change)
    } else {
      let i = 0, l = this.#data.length
      for(i = 0; i < l; i++) {
        const key = this.#data[i].key
        if(key === change.key) {
          this.#data[i] = change
          break;
        } else if(key > change.key) {
          this.#data.splice(i, 0, change)
          break;
        }
      }
      if(i == l) this.#data.push(change)
    }
    let anyReading = false
    for(let i = this.#outputs.length - 1; i >= 0; i--) {
      const bufferSize = this.#outputs[i].bufferSize()
      if(bufferSize > this.#data.length * 2) {
        /// reset change output
        this.#outputs[i].change({ key: null, value: null })
        for(const entry of this.#data) {
          this.#outputs[i].change(entry)
        }
      } else {
        if(bufferSize == 0) anyReading = true
        this.#outputs[i].change(change)
      }
    }
    if(anyReading) return Promise.resolve()
    return new Promise(resolve => this.#drainCallbacks.push(resolve))
  }

  async getEntries() : Promise<Entry[]> {
    if(this.#loading) return this.#loadingPromise
    return this.#data
  }

  async get(key: string) : Promise<object> {
    const entries = await this.getEntries()
    for(const entry of entries) {
      if(entry.key === key) return entry.value
    }
    return null
  }

  getCache() : Entry[] {
    return this.#data
  }

  getCached(key: string) : object {
    const entries = this.getCache()
    for (const entry of entries) {
      if (entry.key === key) return entry.value
    }
    return null
  }

}