import Vue from 'vue'

import { getElementPositionInWindow } from './dom.js'

let createElement

function createOverlayModel() {
  return new Vue({
    data: {
      overlayStack: [],
      overlayCloseListeners: [],
      createElement: null
    },
    methods: {
      show({component, props, on, slots, parentId}) {
        parentId = parentId || 0
        props = props || {}
        on = on || {}
        slots = slots || []
        this.overlayStack.splice(parentId, Infinity) // remove all above parent
        let stackId = this.overlayStack.length + 1
        props = {
          props: {
            ...props,
            stackId,
            parentId
          },
          attrs: {
            'data-overlay-stack' : stackId
          },
          on: {
            ...on,
            close: () => this.close(stackId),
            closeAll: () => this.closeAll(),
            overlay: (definition) => this.show({ ...definition, parentId: stackId })
          },
          slots
        }
        if(on.close) this.overlayCloseListeners[stackId] = on.close
        this.overlayStack.push(this.createElement(component, props, slots))
        return stackId
      },
      close(stackId) {
        if(this.overlayCloseListeners[stackId]) this.overlayCloseListeners[stackId]()
        delete this.overlayCloseListeners[stackId]
        this.overlayStack.splice(stackId - 1, Infinity)
      },
      closeAll() {
        for(var k in this.overlayCloseListeners) {
          this.overlayCloseListeners[k]()
        }
        this.overlayCloseListeners = []
        this.overlayStack.splice(0, Infinity)
      },
      elementAnchor(element) {
        return { element }
        //let position = getElementPositionInWindow(element)
        //return { ...position, w: element.clientWidth, h: element.clientHeight }
      }
    }
  })
}

let OverlayComponent = {
  name: 'OverlayLayer',
  props: {
    overlayModel : {
      required: true,
      type: Object
    }
  },
  mounted() {
    this.focusLostListener = (ev) => {
      let stackId
      let tg = ev.target
      while(tg) {
        stackId = +tg.getAttribute('data-overlay-stack')
        if (stackId) break;
        tg = tg.parentElement
      }
      if(stackId) {
        this.overlayModel.close(stackId+1)
      } else {
        this.overlayModel.closeAll()
      }
    }
    document.body.addEventListener("touch", this.focusLostListener, true)
    document.body.addEventListener("click", this.focusLostListener, true)
  },
  beforeDestroy() {
    document.body.removeEventListener("touch", this.focusLostListener)
    document.body.removeEventListener("click", this.focusLostListener)
  },
  render(createElement) {
    this.overlayModel.createElement = createElement
    return createElement("div", { class:"overlay-layer" }, this.overlayModel.overlayStack)
  }
}

let allDirections = [
  { x: 1, y: 1 },
  { x: 1, y: 0 },
  { x: 1, y: -1 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 }
]

let windowDimensions = new Vue({
  data: {
    width: (typeof window != 'undefined') && window.innerWidth,
    height: (typeof window != 'undefined') && window.innerHeight
  }
})
if(typeof window != 'undefined') {
  window.addEventListener('resize', () => {
    windowDimensions.width = window.innerWidth
    windowDimensions.height = window.innerHeight
  })
}

function computeDimensions(anchor, size, direction) {
  let aw = anchor.w || 0
  let ah = anchor.h || 0
  let ax = anchor.x || 0
  let ay = anchor.y || 0

  if(ax < 0) ax = 0
  if(ay < 0) ay = 0
  if(ax + aw > windowDimensions.width) aw = windowDimensions.width - ax
  if(ay + ah > windowDimensions.height) ah = windowDimensions.height - ay

  let dx = direction.x || 0
  let dy = direction.y || 0
  let dax = direction.ax || 0
  let day = direction.ay || 0

  let acx = ax + aw / 2
  let acy = ay + ah / 2
  let hx = acx + aw / 2 * dax
  let hy = acy + ah / 2 * day

  let mw = size.x || 0
  let mh = size.y || 0
  let mcx = - mw / 2
  let mcy = - mh / 2

  let xp = hx + mcx + mw / 2 * dx
  let yp = hy + mcy + mh / 2 * dy

  return {
    x: xp,
    y: yp,
    x2: xp + mw,
    y2: yp + mh
  }
}

const saneDirections = [
  /// RIGHT:   (down)                 (center)                           (up)
  { x: 1, y: 1, ax: 1, ay: -1, },  { x: 1, y: 0, ax: 1, ay: 0, },  { x: 1, y: -1, ax: 1, ay: 1, },
  /// LEFT:   (down)                 (center)                           (up)
  { x: -1, y: 1, ax: -1, ay: -1, }, { x: -1, y: 0, ax: -1, ay: 0, },  { x: -1, y: -1, ax: -1, ay: 1, },
  /// UP     (center)                     (right)                           (left)
  { x: 0, y: 1, ax: 0, ay: 1, },  { x: 1, y: -1, ax: -1, ay: -1, }, { x: -1, y: -1, ax: 1, ay: -1, },
  /// DOWN   (center)                     (right)                           (left)
  { x: 0, y: -1, ax: 0, ay: -1, }, { x: 1, y: 1, ax: -1, ay: 1, }, { x: -1, y: 1, ax: 1, ay: 1, },
]

const namedDirections = {
  "left" : { x: -1, y: 0 },
  "right" : { x: 1, y: 0 },
  "top" : { x: 0, y: -1 },
  "bottom" : { x: 0, y: 1 }
}

function parseDirection(name) {
  let res = { x:0, y:0 }
  const parts = name.split('-')
  for(const part of parts) {
    const dir = namedDirections[part]
    if(!dir) throw new Error(`unknown direction '${part}'`)
    res.x += dir.x
    res.y += dir.y
  }
  return res
}

function parseDirections(descr) {
  let res = {
    x: descr.x || 0,
    y: descr.y || 0,
    ax: descr.ax || 0,
    ay: descr.ay || 0
  }
  if(descr.from || descr[0]) {
    const dir = parseDirection(descr.from || descr[0])
    res.ax += dir.x
    res.ay += dir.y
  }
  if(descr.to || descr[1]) {
    const dir = parseDirection(descr.to || descr[1])
    res.x += dir.x
    res.y += dir.y
  }
  console.log("PARSED", descr, "TO", res)
  return res
}

let OverlayAnchor = {
  name: 'OverlayAnchor',
  props: {
    anchor: {
      required: true,
      type: Object
    },
    directions: {
      default: () => allDirections,
      type: Array
    }
  },
  data() {
    return {
      width: 0,
      height: 0,
      computedAnchor: null,
      computedPosition: null
    }
  },
  computed: {
    parsedDirections() {
      return this.directions.map(parseDirections)
    },
    possibleDirections() {
      let size = { x: this.width, y: this.height }
      return this.parsedDirections.map(direction => ({
        direction,
        position: computeDimensions(this.computedAnchor, size, direction)
      })).filter(dir => {
        console.log("CHECK", dir.position.x2, windowDimensions.width)
        if(dir.position.x < 0) return false
        if(dir.position.x2 > windowDimensions.width) return false
        if(dir.position.y < 0) return false
        if(dir.position.y2 > windowDimensions.height) return false
        return true
      })
    },
    style() {
      let directions = this.possibleDirections
      //console.log("DIRECTIONS", directions.length)
      if(directions.length == 0) {
        this.computedPosition = { hidden: true }
        this.$emit("positioned", { hidden: true })
        return { visibility: "hidden", /*display: "none"*/ }
      }
      //console.log("POSITIONED", directions[0].position)
      if(JSON.stringify(this.computedPosition) != JSON.stringify(directions[0].position)) {
        const dir = directions[0]
        this.computedPosition = dir.position
        this.$emit("positioned", dir.position, dir.direction)
      }
      return {
        left: directions[0].position.x + 'px',
        top: directions[0].position.y + 'px'
      }
    }
  },
  methods: {
    updateSize() {
      if(this.finished) return
      let element = this.$refs.anchor
      if(!element) return
      let width = element.clientWidth
      let height = element.clientHeight
      if(width != this.width) this.width = width
      if(height != this.height) this.height = height
      setTimeout(()=>this.updateSize(), 100)
    },
    computeAnchor() {
      if(this.finished) return
      const position = getElementPositionInWindow(this.anchor.element)
      const anchor = { ...position, w: this.anchor.element.clientWidth, h: this.anchor.element.clientHeight }
      if(JSON.stringify(anchor) != JSON.stringify(this.computedAnchor)) {
        this.computedAnchor = anchor
      }
      setTimeout(()=>this.computeAnchor(), 100)
    }
  },
  mounted() {
    this.updateSize()
  },
  created() {
    this.computeAnchor()
  },
  beforeDestroy() {
    this.finished = true
  },
  render(createElement) {
    return createElement("div", {
      'class': 'overlay-anchor',
      style: this.style,
      ref: 'anchor'
    }, this.$scopedSlots.default({
      anchor: this.computedAnchor,
      position: this.computedPosition
    }))
    //}, this.$slots.default)
  }
}

let OverlayActivator = {
  name: "OverlayActivator",
  props: ["model", "directions"],
  render(createElement) {
    return createElement("div", {
      ref: "button",
      on: {
        click: () => {
          console.error("OVERLAY SLOT", this.$slots.overlay)
          this.model.show({
            component: OverlayAnchor,
            props: {
              anchor: this.model.elementAnchor(this.$refs.button),
              directions: this.directions
            },
            on: {
              positioned: (position) => this.$emit('positioned', position)
            },
            slots: this.$slots.overlay
          })
        }
      }
    }, this.$slots.button)
  }
}

export { OverlayComponent, createOverlayModel, OverlayAnchor, windowDimensions, OverlayActivator }



