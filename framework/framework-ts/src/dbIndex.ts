type PathType = [string, string, ...any]
type RangeType = {
  gt?: string,
  gte?: string,
  lt?: string,
  lte?: string,
  limit?: number,
}

export interface RangeIndex<T extends (...args: any[]) => any[]> {
  path: (args: Parameters<T>, range: RangeType) => PathType
  get: (args: Parameters<T>, range: RangeType) => Promise<ReturnType<T>>
  observable: (args: Parameters<T>, range: RangeType) => ObservableList<ReturnType<T>>
}

export interface ObjectIndex<T extends (...args: any[]) => any> {
  path: (args: Parameters<T>, range: RangeType) => PathType
  get: (args: Parameters<T>, range: RangeType) => Promise<ReturnType<T>>
  observable: (args: Parameters<T>, range: RangeType) => Observable<ReturnType<T>>
}