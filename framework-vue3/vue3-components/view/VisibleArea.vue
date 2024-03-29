<template>
  <div class="visible-area" ref="area">
    <slot v-bind="visibleArea"></slot>
  </div>
</template>

<script>
  export default {
    name: "VisibleArea",
    props: {
      throttleTime: {
        type: Number,
        default: 0
      },
      checkInterval: {
        type: Number,
        default: 200
      },
      rootElement: {
      }
    },
    data() {
      return {
        visibleArea: {
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          clipLeft: 0,
          clipTop: 0,
          offsetLeft: 0,
          offsetTop: 0,
          areaWidth: 0,
          areaHeight: 0,
        },
        clipElements: [],
        lastRecompute: 0,
        lastRecomputeReason: null,
        needRecompute: false,
        foundRootElement: null,
        checkInt: 0
      }
    },
    mounted() {
      const self = this.$refs.area
      let o = self.parentElement
      while (o) {
        const computedStyle = window.getComputedStyle(o)
        let clipped = false
        switch(computedStyle.overflowX) {
          case 'auto':
          case 'scroll':
          case 'hidden':
            clipped = true
        }
        switch(computedStyle.overflowY) {
          case 'auto':
          case 'scroll':
          case 'hidden':
            clipped = true
        }
        this.clipElements.push({
          element: o,
          width: o.clientWidth,
          height: o.clientHeight,
          clipped
        })
        if(this.rootElement == o) {
          this.foundRootElement = o
          break;
        }
        if(computedStyle.position == 'fixed') break;
        o = o.parentElement
      }
      this.recomputeListenerScroll = (ev) => this.recomputeIfNeeded('scroll')
      this.recomputeListenerResize = () => this.recomputeIfNeeded('resize')
      window.addEventListener('scroll', this.recomputeListenerScroll)
      window.addEventListener('resize', this.recomputeListenerResize)
      for(const clip of this.clipElements) {
        clip.element.addEventListener('scroll', this.recomputeListenerScroll)
      }
      this.checkInt = setInterval(() => this.checkClipElements('unknown'), this.checkInterval)
      if(window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.checkClipElements('resize')
        })
        for(const clip of this.clipElements) {
          this.resizeObserver.observe(clip.element)
        }
        this.resizeObserver.observe(this.$refs.area)
      }
      this.compute('started')
    },
    beforeUnmount() {
      if(this.resizeObserver) this.resizeObserver.disconnect()
      clearInterval(this.checkInt)
      window.removeEventListener('scroll', this.recomputeListenerScroll)
      window.removeEventListener('resize', this.recomputeListenerResize)
      for(const clip of this.clipElements) {
        clip.element.removeEventListener('scroll', this.recomputeListenerScroll)
      }
    },
    methods: {
      checkClipElements(reason) {
        let changed = false
        for(const clip of this.clipElements) {
          if(clip.element.clientWidth != clip.width || clip.element.clientHeight != clip.height) {
            clip.width = clip.element.clientWidth
            clip.height = clip.element.clientHeight
            changed = true
          }
        }
        const self = this.$refs.area
        if(self.clientWidth != this.visibleArea.areaWidth
           || self.clientHeight != this.visibleArea.areaHeight) {
          changed = true
        }
        if(changed || this.needRecompute) this.recomputeIfNeeded(reason)
      },
      recomputeIfNeeded(reason) {
        if(this.lastRecomputeReason == reason && Date.now() - this.lastRecompute < this.throttleTime) {
          this.needRecompute = true
          return
        }
        this.compute(reason)
      },
      compute(reason) {
        if(!reason) throw new Error("RECOMPUTE WITH NO REASON!")
        this.lastRecompute = Date.now()
        const self = this.$refs.area
        if(!self) return;
        let vx = self.offsetLeft + self.clientLeft
        let vy = self.offsetTop + self.clientTop // Visible position relative to parent element
        let vw = self.clientWidth
        let vh = self.clientHeight // visible height
        let cx = 0 // clipped pixels amount
        let cy = 0
        let child = self
        const doClip = (w,h) => {
          if(vx < 0) {
            cx += -vx
            vw -= -vx
            vx = 0
          }
          if(vy < 0) {
            cy += -vy
            vh -= -vy
            vy = 0
          }
          if(vx + vw > w) {
            vw = w - vx
          }
          if(vy + vh > h) {
            vh = h - vy
          }
        }
        for(const clip of this.clipElements) {
          vx -= clip.element.scrollLeft || 0
          vy -= clip.element.scrollTop || 0
          const ox = clip.element.offsetLeft + clip.element.clientLeft
          const oy = clip.element.offsetTop + clip.element.clientTop
          if(child.offsetParent == clip.element.offsetParent) {
            vx -= ox
            vy -= oy
            if(clip.clipped) doClip(clip.element.clientWidth, clip.element.clientHeight)
            vx += ox
            vy += oy
          } else {
            if(clip.clipped) doClip(clip.element.clientWidth, clip.element.clientHeight)
            vx += ox
            vy += oy
          }
          child = clip.element
        }
        if(!this.foundRootElement) {
          vx -= document.documentElement.scrollLeft || 0
          vy -= document.documentElement.scrollTop || 0
          doClip(document.documentElement.clientWidth, document.documentElement.clientHeight)
        }
        this.needRecompute = false
        const newVisibleArea = {
          left: Math.max(cx, 0),
          top: Math.max(cy, 0),
          width: vw,
          height: vh,
          clipLeft: cx,
          clipTop: cy,
          clipRight: self.clientWidth - cx - vw,
          clipBottom: self.clientHeight - cy - vh,
          offsetLeft: vx,
          offsetTop: vy,
          areaWidth: self.clientWidth,
          areaHeight: self.clientHeight,
        }
        if(JSON.stringify(newVisibleArea) != JSON.stringify(this.visibleArea)) {
          this.visibleArea = newVisibleArea
          this.$emit('update', newVisibleArea, reason)
        }
      }
    }
  }
</script>

<style scoped>

</style>