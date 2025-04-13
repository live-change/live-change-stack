export function min(a, b) {
  if(a === undefined) return b
  if(b === undefined) return a
  return a < b ? a : b
}

export function max(a, b) {
  if(a === undefined) return b
  if(b === undefined) return a
  return a > b ? a : b
}

export function rangeIntersection(range1, range2) {
  return {
    reverse: range2.reverse,
    gt: max(range1.gt, range2.gt),
    lt: min(range1.lt, range2.lt),
    gte: max(range1.gte, range2.gte),
    lte: min(range1.lte, range2.lte),
    limit: range2.limit
  }
}

export function rangeUnion(range1, range2) {
  return {
    reverse: range1.reverse,
    gt: min(range1.gt, range2.gt),
    lt: max(range1.lt, range2.lt),
    gte: min(range1.gte, range2.gte),
    lte: max(range1.lte, range2.lte),
    limit: range1.limit + range2.limit
  }
}

export function unitRange(id) {
  return {
    gte: id,
    lt: id,
    limit: 1
  }
}