export class TypeAndId {
  type: string
  id: string
  constructor(type: string, id: string) {
    this.type = type
    this.id = id
  }
  async fetch<T extends Object = Object>(): Promise<T> {
    return Promise.resolve(null)
  }
}

export class Id<T extends Object = Object> {
  id: string
  constructor(id: string) {
    this.id = id
  }
  async fetch<T extends Object = Object>(): Promise<T> {
    return Promise.resolve(null)
  }
  toString() {
    return this.id
  }
}