export interface Entry {
  key: string,
  value: object
}

export interface Change {
  key: string,
  value: object
}

export interface ChangeReceiver {
  lastChangeTs: string, // required for ifNotChangedSince optimization
  onChange(change: Change): Promise<void>
}

export interface ObservableLike {
  observe(receiver: ChangeReceiver): void
  unobserve(receiver: ChangeReceiver): void
  getEntries(): Promise<Entry[]>
}
