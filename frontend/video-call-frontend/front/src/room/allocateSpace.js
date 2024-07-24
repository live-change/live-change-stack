function allocateSpace(left, top, width, height, tiles, styles) {
  console.log("ALLOCATE SPACE FOR TILES", tiles)
  if(!width || !height) return
  let visibleTiles = []
  let allRatioSum = 0
  for(let tile of tiles) {
    const size = tile.size
    if(!size || !size.width || !size.height) {
      styles[tile.id] = { display: 'none' }
      continue
    }
    const { width, height } = size
    allRatioSum += width / height
    visibleTiles.push({ id: tile.id, width, height })
  }
  /// check all options, find best fill
  console.log("SEARCH FOR BEST FILL FOR AREA", width, height, "FOR TILES", visibleTiles)
  if(visibleTiles.length === 0) return
  const aspectRatio = width / height
  const availableArea = width * height
  let bestFill = { area: 0 }
  for(let rows = 1; rows <= tiles.length; rows++) {
    const breakingPoint = (allRatioSum / rows)
    let ratioSum = 0
    let maxRatioSum = 0
    let row = 0
    for(const tile of visibleTiles) { // find maximal aspect ratio sum (maximal row width)
      const canBreak = (row < rows - 1)
      const ratio = tile.width / tile.height
      if(ratioSum + ratio * 0.5 > breakingPoint && canBreak) { // break!
        //console.log("BREAK ROW BEFORE SUM!")
        row += 1
        if(ratioSum > maxRatioSum) maxRatioSum = ratioSum
        ratioSum = 0
      }
      ratioSum += ratio
      //console.log("RATIO SUM", ratioSum, "ROW", row)
      if(ratioSum > breakingPoint && canBreak) { // break!
        //console.log("BREAK ROW AFTER SUM!")
        row += 1
        if(ratioSum > maxRatioSum) maxRatioSum = ratioSum
        ratioSum = 0
      }
    }
    if(ratioSum > maxRatioSum) maxRatioSum = ratioSum
    // compute area and fill:
    const ratio = maxRatioSum / rows
    let filledWidth, filledHeight
    if(ratio > aspectRatio) { // empty bottom and top
      filledWidth = width
      filledHeight = filledWidth / ratio
    } else { // empty left and right
      filledHeight = height
      filledWidth = filledHeight * ratio
    }
    const filledArea = filledWidth * filledHeight
    if(filledArea > bestFill.area) {
      bestFill = { rows, area: filledArea, filledWidth, filledHeight }
    } else {
      console.log("ROWS", rows, "RATIO", ratio, "FILL", filledArea / availableArea)
      console.log("TILES RATIO SUM", maxRatioSum, "ASPECT RATIO", aspectRatio)
    }
  }
  //console.log("BEST FILL", bestFill)

  if(!bestFill.rows) throw new Error("Couldn't find best fill!?!")

  /// we determined rows count, time to place tiles
  let ratioSum = 0
  let row = 0
  let rowTiles = []
  let leftSum = 0
  const { rows, filledWidth, filledHeight } = bestFill
  const leftMargin = (width - filledWidth) / 2
  const topMargin = (height - filledHeight) / 2
  const rowHeight = filledHeight / rows
  const breakingPoint = (allRatioSum / rows)

  //console.log("rowHeight", rowHeight)

  const placeTilesInRow = (rowLeftMargin, rowTiles) => {
    for(const tile of rowTiles) {
      const { left, width } = tile
      //console.log("PLACE TILE", tile)
      styles[tile.id] = {
        width: width + 'px',
        height: rowHeight + 'px',
        left: (left + leftMargin + rowLeftMargin) + 'px',
        top: (top + topMargin + rowHeight * row) + 'px'
      }
      //console.log("TILE STYLE", tile.id,  styles[tile.id])
    }
  }

  for(const tile of visibleTiles) {
    const canBreak = (row < rows - 1)
    const ratio = tile.width / tile.height
    if(ratioSum + ratio * 0.5 > breakingPoint && canBreak) { // break!
      //console.log("BREAK ROW BEFORE SUM!")
      const rowLeftMargin = (filledWidth - leftSum) / 2
      //console.log("ROW LEFT MARGIN", rowLeftMargin)
      placeTilesInRow(rowLeftMargin, rowTiles)
      row += 1
      leftSum = 0
      ratioSum = 0
      rowTiles = []
    }
    ratioSum += ratio
    const width = rowHeight * ratio
    rowTiles.push({ id: tile.id, left: leftSum, width })
    leftSum += width
    //console.log("RATIO SUM", ratioSum, "ROW", row)
    if(ratioSum > breakingPoint && canBreak) { // break!
      //console.log("BREAK ROW AFTER SUM!")
      const rowLeftMargin = (filledWidth - leftSum) / 2
      //console.log("ROW LEFT MARGIN", rowLeftMargin)
      placeTilesInRow(rowLeftMargin, rowTiles)
      row += 1
      leftSum = 0
      ratioSum = 0
      rowTiles = []
    }
    if(ratioSum >= (allRatioSum / rows) * (row + 1) && row < rows - 1) {
      // break!
    }
  }
  if(rowTiles.length > 0) {
    const rowLeftMargin = (filledWidth - leftSum) / 2
    placeTilesInRow(rowLeftMargin, rowTiles)
  }
}

export default allocateSpace