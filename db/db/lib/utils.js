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
  // gt/gte and lt/lte are two ways to express the same bound.
  // The result must keep only one of each — the stricter (intersection) wins.
  // gt: v is stricter than gte: v (gt excludes equality, gte includes it).
  // So when comparing gt vs gte: if gt.value >= gte.value, gt wins;
  // if gt.value < gte.value, gte wins (it starts higher).
  // Treat '' (empty string from readInBuckets first bucket) as unset.
  const gt1 = range1.gt || undefined, gt2 = range2.gt || undefined
  const gte1 = range1.gte || undefined, gte2 = range2.gte || undefined
  const lt1 = range1.lt || undefined, lt2 = range2.lt || undefined
  const lte1 = range1.lte || undefined, lte2 = range2.lte || undefined

  // Lower bound: normalize each side to a single (type, value) bound,
  // then take the stricter (max) of the two.
  function lowerFrom(gt, gte) {
    if(gt !== undefined) return { type: 'gt', value: gt }
    if(gte !== undefined) return { type: 'gte', value: gte }
    return undefined
  }
  function lowerMax(b1, b2) {
    if(!b1) return b2
    if(!b2) return b1
    if(b1.type === b2.type) return { type: b1.type, value: max(b1.value, b2.value) }
    // one gt, one gte: gt excludes equality, gte includes it.
    // gt.value >= gte.value → gt is stricter (or equal). Else gte starts higher.
    const gtB = b1.type === 'gt' ? b1 : b2
    const gteB = b1.type === 'gte' ? b1 : b2
    if(gtB.value >= gteB.value) return { type: 'gt', value: gtB.value }
    return { type: 'gte', value: gteB.value }
  }
  const lower = lowerMax(lowerFrom(gt1, gte1), lowerFrom(gt2, gte2))
  const gt = lower?.type === 'gt' ? lower.value : undefined
  const gte = lower?.type === 'gte' ? lower.value : undefined

  // Upper bound: symmetric — lt is stricter than lte (lt excludes equality).
  function upperFrom(lt, lte) {
    if(lt !== undefined) return { type: 'lt', value: lt }
    if(lte !== undefined) return { type: 'lte', value: lte }
    return undefined
  }
  function upperMin(b1, b2) {
    if(!b1) return b2
    if(!b2) return b1
    if(b1.type === b2.type) return { type: b1.type, value: min(b1.value, b2.value) }
    const ltB = b1.type === 'lt' ? b1 : b2
    const lteB = b1.type === 'lte' ? b1 : b2
    // lt excludes equality, lte includes it.
    // lt.value <= lte.value → lt is stricter. Else lte ends lower.
    if(ltB.value <= lteB.value) return { type: 'lt', value: ltB.value }
    return { type: 'lte', value: lteB.value }
  }
  const upper = upperMin(upperFrom(lt1, lte1), upperFrom(lt2, lte2))
  const lt = upper?.type === 'lt' ? upper.value : undefined
  const lte = upper?.type === 'lte' ? upper.value : undefined

  return {
    reverse: range2.reverse,
    gt,
    lt,
    gte,
    lte,
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

export function prefixRange(prefix) {
  return {
    gte: prefix + ':',
    lte: prefix + '\uffff'
  }
}