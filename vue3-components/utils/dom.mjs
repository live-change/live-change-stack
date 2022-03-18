function getElementPositionInWindow(element) {
  let o = element
  let x = 0
  let y = 0
  while (true) {
    //console.log("OE", o, x, y)
    x += o.offsetLeft
    y += o.offsetTop
    if(window.getComputedStyle(o).position == 'fixed') {
      return { x, y }
    }
    o = o.offsetParent
    if(!o) {
      return {
        x: x - document.documentElement.scrollLeft || 0,
        y: y - document.documentElement.scrollTop || 0
      }
    }
    if(o.scrollLeft) x -= o.scrollLeft
    if(o.scrollTop) y -= o.scrollTop
  }
}

function getElementPositionInDocument(element) {
  let o = element
  let x = 0
  let y = 0
  while (true) {
    x += o.offsetLeft
    y += o.offsetTop
    if(window.getComputedStyle(o).position == 'fixed') {
      return { x, y }
    }
    o = o.offsetParent
    if(!o) {
      return {
        x: x || 0,
        y: y || 0
      }
    }
    if(o.scrollLeft) x -= o.scrollLeft
    if(o.scrollTop) y -= o.scrollTop
  }
}

function getElementPositionInElement(element, parent) {
  let o = element
  let x = 0
  let y = 0
  while (true) {
    x += o.offsetLeft
    y += o.offsetTop
    if(window.getComputedStyle(o).position == 'fixed') {
      return { x, y }
    }
    o = o.offsetParent
    if(!o || o == parent) {
      return {
        x: x || 0,
        y: y || 0
      }
    }
    if(o.scrollLeft) x -= o.scrollLeft
    if(o.scrollTop) y -= o.scrollTop
  }
}

function getScrollParent(element, includeHidden) {
  let style = getComputedStyle(element)
  const excludeStaticParent = style.position === "absolute"
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/
  if (style.position === "fixed") return document.body
  for (let parent = element; (parent = parent.parentElement);) {
    style = getComputedStyle(parent)
    if (excludeStaticParent && style.position === "static") continue
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return parent
  }
  return document.body
}


export { getElementPositionInWindow, getElementPositionInDocument, getElementPositionInElement, getScrollParent }