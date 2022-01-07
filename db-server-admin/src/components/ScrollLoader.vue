<template>
  <visible-area @update="setVisibleArea" ref="area">
    <div class="scroll-top-fill" :style="{ height: topFill + 'px' }"></div>
    <slot v-if="isLoadingTop" name="loadingTop" v-bind="{ connectionProblem: isLoadingTopTooLong }" ref="topLoading">
    </slot>
    <div class="scroll-data" v-for="(row, index) in visibleState.rows" ref="row" :id="rowId(row)"
         :key="rowKey(row)">
      <!--<p>{{ buckets && JSON.stringify(buckets[row.bucketId].range) }} + {{ row.itemId }}</p>-->
      <slot v-bind="{ row, index, rows: visibleState.rows }"></slot>
    </div>
    <slot v-if="isLoadingBottom" name="loadingBottom" v-bind="{ connectionProblem: isLoadingBottomTooLong }"
          ref="bottomLoading">
    </slot>
    <div class="scroll-bottom-fill" :style="{ height: bottomFill + 'px' }"></div>
  </visible-area>
</template>

<script>
  import api from "api"
  import VisibleArea from "@/components/VisibleArea.vue"
  import currentTime from "./utils/currentTime.js"
  import { getScrollParent } from "./utils/dom.js"

  export default {
    name: "ScrollLoader",
    inject: ['loadingZone'],
    components: { VisibleArea },
    props: {
      topMargin: {
        type: Number,
        default: 1000
      },
      bottomMargin: {
        type: Number,
        default: 1000
      },
      what: {
        type: Function,
        required: true
      },
      bucketSize: {
        type: Number,
        default: 20
      },
      readMode: {
        type: String,
        default: 'id'
      },
      rowIdPrefix: {
        type: String,
        default: ''
      },
      autoScrollHash: {
        type: Boolean,
        default: false
      },
      rangeCut: {
        type: Function,
        default: a => a
      },
      startPosition: {
        default: null
      },
      rowKey: {
        type: Function,
        default: row => row.id
      },
      stickyEnd: {
        type: Boolean,
        default: false
      },
      hardClose: {
        type: Boolean,
        default: false
      },
      propagateLoading: {
        type: Boolean,
        default: false
      },
      trackVisibleRows: {
        type: Boolean,
        default: false
      },
      debugLog: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        finished: false,
        visibleArea: null,
        topFill: 0,
        bottomFill: 0,
        buckets: [],
        firstLoading: true,
        scrollPosition: null,
        scrollParentHeight: 0,
        ignoreNextScroll: false,
        loadingTask: null,
        lastVisibleRows: [],
        visibleRows: []
      }
    },
    computed: {
      visibleState() {
        return {
          rows: this.buckets
              .flatMap((bucket, bucketId) => {
                if(bucket.state != 'ready' && bucket.state != 'closing') return []
                let rows = bucket.range.reverse
                    ? bucket.items.map((item, itemId) => ({ ...item, bucketId, itemId })).reverse()
                    : bucket.items.map((item, itemId) => ({ ...item, bucketId, itemId }))
                if(bucket.softClose) {
                  if(bucket.softClose.lte) rows = rows.filter(item => item.id <= bucket.softClose.lte)
                  if(bucket.softClose.gte) rows = rows.filter(item => item.id >= bucket.softClose.gte)
                }
                return rows
              }),
          topLoading: !this.buckets[0] || this.buckets[0].state == 'loading',
          bottomLoading: !this.buckets[0] || this.buckets[0].state == 'loading',
          topFill: this.topFill,
          bottomFill: this.bottomFill
        }
      },
      isLoading() {
        for(const bucket of this.buckets) {
          if(bucket.state == 'loading') return true
        }
        return false
      },
      isLoadingTop() {
        if(this.buckets.length < 2) return false
        const firstBucket = this.buckets[0]
        if(firstBucket && firstBucket.state == 'loading') return true
        return false
      },
      isLoadingBottom() {
        const lastBucket = this.buckets[this.buckets.length - 1]
        if(lastBucket && lastBucket.state == 'loading') return true
        return false
      },
      isLoadingTopTooLong() {
        if(this.buckets.length < 2) return false
        const firstBucket = this.buckets[0]
        if(firstBucket && firstBucket.state == 'loading') return currentTime.now - firstBucket.loadingStarted > 10000
        return false
      },
      isLoadingBottomTooLong() {
        const lastBucket = this.buckets[this.buckets.length - 1]
        if(lastBucket && lastBucket.state == 'loading') return currentTime.now - lastBucket.loadingStarted > 10000
        return false
      }
    },
    watch: {
      visibleRows(rows) {
        //this.log("CURR VISIBLE ROWS", rows.map(r => r.id))
        for(let row of rows) {
          const old = this.lastVisibleRows.find(r => r.id == row.id)
          if(!old) {
            this.log("ROW BECOME VISIBLE", row.text, row.id, row)
            this.$emit('rowVisible', row)
          }
        }
        for(let row of this.lastVisibleRows) {
          const current = rows.find(r => r.id == row.id)
          if(!current) {
            this.log("ROW BECOME HIDDEN", row.text, row.id, row)
            this.$emit('rowHidden', row)
          }
        }
        this.lastVisibleRows = rows.slice()
      },
      scrollPosition(scrollPos, oldScrollPos) {
        if(!scrollPos) return
        if(!this.autoScrollHash) return
        const rowId = this.rowIdPrefix + scrollPos.row
        const oldRowId = oldScrollPos && this.rowIdPrefix + oldScrollPos.row
        if(rowId === undefined) return
        const element = document.getElementById(rowId)
        if(this.isLoading) return
        if(this.firstLoading) return
        if(typeof window == 'undefined') return
        if(scrollPos.rowId == 0 && scrollPos.offset == 0 && !document.location.hash) return
        delete this.$router.hashScrollLocks[oldRowId]
        this.$router.hashScrollLocks[rowId] = true
        const hash = (this.visibleArea.clipTop == 0 && (!scrollPos.rowId))
                     ? '' : "#" + rowId
        if(this.$router.currentRoute.hash != hash)  {
          this.$router.replace({ ...this.$router.currentRoute, hash })
        }
      },
      isLoading(newState, oldState) {
        this.log("LOADING STATE", newState)
        if(this.propagateLoading) {
          if(newState && !this.loadingTask) {
            this.loadingTask = this.loadingZone.started({ name: `scrollLoader buckets` })
          } else if(!newState && this.loadingTask) {
            this.loadingZone.finished(this.loadingTask)
            this.loadingTask = null
          }
        }
        if(newState) this.$emit('loading')
          else this.$emit('loaded')
      },
     /* visibleState(st) {
        this.log("ROWS COUNT", st.rows.length)
      }*/
      visibleState() {
        setTimeout(() => {
          this.log("COMPUTE VISIBLE ROWS BECAUSE VISIBLE STATE CHANGED")
          this.computeVisibleRows()
        }, 20)
      },
      visibleArea() {
        setTimeout(() => {
          this.log("COMPUTE VISIBLE ROWS BECAUSE VISIBLE AREA CHANGED")
          this.computeVisibleRows()
        }, 20)
      }
    },
    methods: {
      log(...args) {
        if(this.debugLog) console.log(...args)
      },
      computeVisibleRows() {
        if(!this.trackVisibleRows) return []
        const visibleState = this.visibleState
        const visibleArea = this.visibleArea
        if(!visibleArea) return []
        if(!visibleState) return []
        let visibleRows = []
        const rowSizes = this.measureRows()
        this.log("RECOMPUTE VISIBLE ROWS")
        const scrollMin = visibleArea.clipTop
        const scrollMax = scrollMin + visibleArea.height
        this.log("SCROLL MIN", scrollMin, " MAX", scrollMax)
        let top = this.topFill
        for(let i = 0; i < rowSizes.length; i++) {
          const size = rowSizes[i]
          const row = visibleState.rows[i]
          const bottom = top + size
          //if(row) this.log("ROW", row.text, "TOP", top, "BOTTOM", bottom)
          if(top < scrollMax && bottom > scrollMin) {
            if(row) visibleRows.push(row)
          }
          top = bottom
        }
        this.visibleRows = visibleRows
      },
      computeScrollPosition() {
        if(!this.visibleArea) return null
        if(this.stickyEnd && this.visibleArea.clipBottom < 10) {
          return 'end'
        }
        const clipTop = this.visibleArea.clipTop
        let top = this.topFill
        if(this.$refs.topLoading) top += this.$refs.topLoading.offsetHeight

        let rowId = 0
        let lastItem, lastBucketId, lastItemId
        for(let bucketId = 0; bucketId < this.buckets.length; bucketId++) {
          const bucket = this.buckets[bucketId]
          //this.log("BUCKET", top, "+", bucket.height, ">", clipTop)
          if(top + bucket.height > clipTop) {
            /*this.log("FOUND BUCKET", bucketId, "WITH", bucket.items.length ,"ITEMS AND", bucket.height, "PIXELS")
            this.log("AT", top + bucket.height, '>', clipTop)*/
            let rowTop = top
            for(let itemId = 0; itemId < bucket.items.length; itemId++) {
              const item = bucket.items[bucket.range.reverse ? bucket.items.length - itemId - 1 : itemId]
              lastItem = item
              lastBucketId = bucketId
              lastItemId = lastItemId
              const element = this.$refs.row && this.$refs.row[rowId]
              //this.log(bucketId, itemId, "ELEMENT", element, "AT", rowTop)
              if(element) {
                /*this.log(bucketId, itemId, "ITEM", JSON.stringify(item),
                    "IS", element )
                this.log("AT", rowTop, "+", element.offsetHeight, "=", rowTop + element.offsetHeight, '>', clipTop)*/
                if(rowTop + element.offsetHeight > clipTop || itemId == bucket.items.length-1 )
                  return { row: this.rowName({ ...item, bucketId, itemId }), offset: clipTop - rowTop, rowId }
                rowId ++
                rowTop += element.offsetHeight
              } else {
                return { row: this.rowName({ ...item, bucketId, itemId }), offset: clipTop - top, rowId }
              }
            }
          } else {
            rowId += bucket.items.length
          }
          top += bucket.height
        }
        if(lastItem) {
          return {
            row: this.rowId({ ...lastItem, bucketId: lastBucketId, itemId: lastItemId }),
            offset: clipTop - top, rowId
          }
        }
      },
      measureRows() {
        const ref = this.$refs.row
        const elements = ref ? ( Array.isArray(ref) ? ref : [ref] ) : null
        if(!elements) return []
        for(const element of elements) {
          if(!element) debugger
        }
        const measurements = elements.map(element => ({
          offsetTop: element.offsetTop, offsetHeight: element.offsetHeight
        }))
        if(measurements.length == 0) return 0
        if(measurements.length == 1) return [ measurements[0].offsetHeight ]
        measurements.sort((a, b) => a.offsetTop - b.offsetTop)
        this.log("MEASUREMENTS", measurements)
        const rowDistance = (measurements[1].offsetTop - measurements[0].offsetTop) - measurements[0].offsetHeight
        const rowSizes = measurements.map(m => m.offsetHeight + rowDistance)
        return rowSizes
      },
      measureBuckets() {
        const rowSizes = this.measureRows()
        this.log("ROW SIZES", rowSizes)
        let rowId = 0
        const bucketSizes = (new Array(this.buckets.length)).fill(0)
        for(let i = 0; i < bucketSizes.length; i++) {
          const bucket = this.buckets[i]
          for(let j = 0; j < bucket.items.length; j++) {
            if(bucket.softClose) {
              if(bucket.softClose.gte && bucket.items[j].id < bucket.softClose.gte) continue
              if(bucket.softClose.lte && bucket.items[j].id > bucket.softClose.lte) continue
            }
            if(rowId < rowSizes.length) bucketSizes[i] += rowSizes[rowId++]
          }
        }
        this.log("BUCKET SIZES", bucketSizes)
        return bucketSizes
      },
      recompute() {
        this.log("RECOMPUTE")
        //console.trace('recompute')
        const visibleArea = this.visibleArea
        if(!visibleArea) return
        const bucketSizes = this.measureBuckets()
        if(bucketSizes.length == 0) return

        const firstBucket = this.buckets[0]
        const lastBucket = this.buckets[this.buckets.length - 1]

        if(firstBucket.state != 'loading' && firstBucket.items.length < this.bucketSize && this.topFill > 0) {
          this.topFill = 0
          this.log("RECOMPUTE IN NEXT TICK! BECAUSE OF LOADING FIRST BUCKET")
          this.$nextTick(() => {
            this.recompute()
          })
          return
        }

        if(lastBucket.state != 'loading' && lastBucket.items.length < this.bucketSize && this.bottomFill > 0) {
          this.bottomFill = 0
          this.log("RECOMPUTE IN NEXT TICK! BECAUSE OF LOADING LAST BUCKET")
          this.$nextTick(() => {
            this.recompute()
          })
          return
        }

        //this.log("VA", JSON.stringify(visibleArea))
        //this.log("BS", JSON.stringify(bucketSizes))
        let visibleBucketsSize = bucketSizes.reduce((a,b) => a+b, 0)
        for(let i = 0; i < bucketSizes.length; i++) {
          if(this.buckets[i]) {
            this.buckets[i].height = bucketSizes[i]
          }
        }
        const visibleTop = visibleArea.top
        const visibleBottom = visibleArea.top + visibleArea.height
        const top = visibleTop - this.topMargin
        const bottom = visibleBottom + this.bottomMargin

        const topEnd = this.topFill + (this.$refs.topLoading ? this.$refs.topLoading.offsetHeight : 0)
        const bottomEnd = topEnd + visibleBucketsSize

        this.log("TOP", top, "<", topEnd)
        this.log("FIRST", JSON.stringify(firstBucket.range), "ST", firstBucket.state,
            "ITEMS", firstBucket.items.length)
        this.log("BOTTOM", bottom, ">", bottomEnd)
        this.log("LAST", JSON.stringify(lastBucket.range), "ST", lastBucket.state,
            "ITEMS", lastBucket.items.length)

        if(top < topEnd && firstBucket.state == 'ready'
            && ( firstBucket.range.gt || firstBucket.range.gte || firstBucket.items.length == this.bucketSize )) {
          this.loadTop()
        }

        if(bottom > bottomEnd && lastBucket.state == 'ready'
            && ( lastBucket.range.lt || lastBucket.range.lte || lastBucket.items.length == this.bucketSize )
            && lastBucket.range.lt != "\xFF\xFF\xFF\xFF") {
          this.loadBottom()
        }
      },
      scrollTo(to) {
        this.ignoreNextScroll = true
        this.scrollParent.scrollTop = to
        setTimeout(() => {
          this.ignoreNextScroll = false
        }, 500)
      },
      scrollToPosition() {
        const pos = this.scrollPosition
        this.log("SP", JSON.stringify(this.scrollPosition))
        if(!pos) return
        if(pos.rowId == 0 && pos.offset == 0) return
        this.log("SCROLL POS", JSON.stringify(pos))
        if(pos == 'end') {
          this.log("SCROLL TO END!")
          this.scrollTo(this.$el.offsetTop + this.$el.offsetHeight - this.scrollParent.clientHeight)
          return
        }
        const element = document.getElementById(this.rowIdPrefix + pos.row)
        if(element) {
          this.log("FOUND ELEMENT", element, element.offsetTop)
          const elementTop = element.offsetTop
          if(pos.offset > 0 || pos.rowId > 0) {
            this.log("SCROLL TO", elementTop + pos.offset)
            this.scrollTo(elementTop + pos.offset)
          }
        } else {
          this.log("SCROLL ELEMENT NOT FOUND")
        }
      },
      setVisibleArea(visibleArea, reason) {
        this.log("HANDLE VISIBLE AREA CHANGE!!! REASON:", reason, "IGNORE SCROLL", this.ignoreNextScroll)
        this.log("NEW", JSON.stringify(visibleArea))
        this.log("OLD", JSON.stringify(this.visibleArea))
        if(!this.scrollParent) return
        const oldVisibleArea = this.visibleArea
        this.visibleArea = visibleArea
        const oldScrollParentHeight = this.scrollParentHeight
        this.scrollParentHeight = this.scrollParent.clientHeight

        if(oldVisibleArea && (visibleArea.areaHeight != oldVisibleArea.areaHeight) && reason!='scroll') {
          this.log("AREA RESIZED")
          this.scrollToPosition()
        } else if(this.scrollPosition == 'end' && reason!='scroll' && (
            (this.scrollParentHeight != oldScrollParentHeight && visibleArea.clipBottom > 0)
        )) {
          this.scrollToPosition()
          this.recompute()
        } else if(!this.ignoreNextScroll) {
          this.log("RECOMPUTE SCROLL POSITION", this.firstLoading, this.isLoading)
          if(this.firstLoading) return
          if(this.isLoading) return
          const newScrollPosition = this.computeScrollPosition()
          this.log("NEW SCROLL POS", newScrollPosition)
          if(newScrollPosition) this.scrollPosition = newScrollPosition
          this.recompute()
        } else {
          this.ignoreNextScroll = false
          this.log("SCROLL TO POSITION BECAUSE VISIBLE AREA CHANGED AND SCROLL IS IGNORED")
          this.scrollToPosition()
          setTimeout(() => {
            console.log("RECOMPUTE AFTER SCROLL TO POSITION WHEN SCROLL IS IGNORED")
            this.recompute()
          })
        }
      },
      getNextBucketRange() {
        switch(this.readMode) {
          case 'id': {
            const lastBucket = this.buckets[this.buckets.length - 1]
            return {
              gt: lastBucket ? lastBucket.items[
                    lastBucket.range.reverse ? 0 : lastBucket.items.length-1
                  ].id : ''
            }
          }
          case 'index': {
            const lastBucket = this.buckets[this.buckets.length - 1]
            return {
              gt: lastBucket ? +lastBucket.range.gt + this.bucketSize : 0
            }
          }
        }
      },
      getPrevBucketRange() {
        switch(this.readMode) {
          case 'id': {
            const firstBucket = this.buckets[0]
            return {
              lt: firstBucket ? firstBucket.items[
                    firstBucket.range.reverse ? firstBucket.items.length - 1 : 0
                  ].id : '',
              reverse: true
            }
          }
          case 'index': {
            const firstBucket = this.buckets[0]
            return {
              gt: firstBucket ? +firstBucket.range.gt - this.bucketSize : -this.bucketSize
            }
          }
        }
      },
      createBucket(range) {
        const bucket = {
          state: 'free',
          range: this.rangeCut({ ...range, limit: this.bucketSize }),
          height: 0,
          observable: null,
          items: [],
          error: null,
          softClose: null
        }
        bucket.stateObserver = (s, v, id, el) => {
          if(bucket.state == 'free') {
            console.trace("BUCKET SIGNAL IN STATE FREE")
            return
          }
          this.log("SIGNAL", s, "BUCKET", JSON.stringify(bucket.range), "IN STATE", bucket.state,
              "ARGS", JSON.stringify([v, id, el]))
          if(bucket.state == 'loading' && s == 'set' && v) {
            bucket.state = v.length > 0 ? 'ready' : 'empty'
            this.handleLoaded(bucket, v)
          } else if((bucket.state == 'empty'|| bucket.state == 'closing') && s == 'putByField') {
            bucket.state = 'ready'
            this.handleLoaded(bucket, [ el ])
          } else if((bucket.state == 'empty'|| bucket.state == 'closing') && s == 'set') {
            bucket.state = 'ready'
            this.handleLoaded(bucket, v)
          }
          this.$nextTick(() => {
            if(bucket.items.length == this.bucketSize) {
              this.recompute()
            }
          })
        }
        return bucket
      },
      closeBucket(bucket) {
        if(bucket.closed) return
        this.log("CLOSE BUCKET", JSON.stringify(bucket.range))
        bucket.closed = true
        switch(this.readMode) {
          case 'id': {
            this.log("BUCKET ITEMS", bucket.items.map(i => i.id).join(', '))
            const range = bucket.range.reverse ? {
              gte: bucket.items[bucket.items.length - 1].id,
              lt: bucket.range.lt,
              lte: !bucket.range.lt && bucket.items[0].id || undefined,
              reverse: true
            } : {
              gt: bucket.range.gt,
              gte: !bucket.range.gt && bucket.items[0].id || undefined,
              lte: bucket.items[bucket.items.length - 1].id
            }
            this.log("CLOSE RANGE", range)
            if(this.hardClose) {
              bucket.range = range
              this.loadBucket(bucket, true)
            } else {
              bucket.softClose = range
            }
            return
          }
          case 'index': {
            return
          }
        }
      },
      addNextBucket(start) {
        const range = start || this.getNextBucketRange()
        this.log("NEXT BUCKET RANGE:", range)
        const lastBucket = this.buckets[this.buckets.length - 1]
        if(lastBucket) this.closeBucket(lastBucket)
        const bucket = this.createBucket(range)
        this.buckets.push(bucket)
        return bucket
      },
      addPrevBucket(start) {
        const range = start || this.getPrevBucketRange()
        this.log("PREV BUCKET RANGE:", range)
        const bucket = this.createBucket(range)
        this.buckets.unshift(bucket)
        return bucket
      },
      async loadEndBucket() {
        const range = { lt: '\xFF\xFF\xFF\xFF', reverse: true, limit: this.bucketSize }
        const daoPath = this.what({ ...range })
        const lastItems = await api.get(daoPath)
        lastItems.reverse()
        console.log("LAST ITEMS LOADED", lastItems)
        const endBucketRange = lastItems.length > 0 ? {
          gte: lastItems[0].id,
          lte: lastItems[lastItems.length - 1].id
        } : {
          gte: '',
          limit: this.bucketSize
        }
        const bucket = this.createBucket(endBucketRange)
        bucket.items = lastItems
        bucket.closed = true
        this.buckets.push(bucket)
        this.loadBucket(bucket, true)
        return bucket
      },
      loadBucket(bucket, closing) {
        bucket.state = closing ? 'closing' : 'loading'
        bucket.loadingStarted = Date.now()
        this.log("LOAD BUCKET", JSON.stringify(bucket.range))
        if(bucket.observable) {
          bucket.observable.unbindProperty(bucket, 'items')
          bucket.observable.unbindErrorProperty(bucket, 'error')
          bucket.observable.unobserve(bucket.stateObserver)
        }
        bucket.daoPath = this.what({ ...bucket.range })
        bucket.observable = api.observable(bucket.daoPath)
        bucket.observable.bindProperty(bucket, 'items')
        bucket.observable.bindErrorProperty(bucket, 'error')
        bucket.observable.observe(bucket.stateObserver)
      },
      unloadBucket(bucket) {
        bucket.state = 'free'
        bucket.observable.unbindProperty(bucket, 'items')
        bucket.observable.unbindErrorProperty(bucket, 'error')
        bucket.observable.unobserve(bucket.stateObserver)
        bucket.observable = null
      },
      loadBottom() {
        const bucket = this.addNextBucket()
        this.loadBucket(bucket)
      },
      loadTop() {
        const bucket = this.addPrevBucket()
        this.loadBucket(bucket)
      },
      rowName(row) {
        switch(this.readMode) {
          case 'id': return row.id
          case 'index': return (+this.buckets[row.bucketId].range.gt + row.itemId)
        }
      },
      rowId(row) {
        return this.rowIdPrefix + this.rowName(row)
      },
      async startLoading() {
        if(typeof window != 'undefined' && this.autoScrollHash) {
          const hash = document.location.hash
          this.$router.hashScrollLocks[hash.slice(1)] = true
          if(hash.slice(1, this.rowIdPrefix.length + 1) == this.rowIdPrefix) {
            this.scrollPosition = { row: +hash.slice(1 + this.rowIdPrefix.length), offset: 0, rowId: Infinity }
          }
        }
        if(this.startPosition) {
          this.scrollPosition = this.startPosition
        }
        if(this.scrollPosition) {
          if(this.scrollPosition == 'end') {
            this.topFill = (this.topMargin * 1.5) | 0
            const bucket = await this.loadEndBucket()
            return
          }
          const start = this.scrollPosition.row
          this.topFill = (this.topMargin * 1.5) | 0
          const bucket = this.addNextBucket({ gt: start })
          this.loadBucket(bucket)
          return
        }
        const firstBucket = this.addNextBucket()
        this.loadBucket(firstBucket)
      },
      handleLoaded(bucket, items) {
        if(!this.isLoading) {
          if(this.firstLoading) this.finishFirstLoading()
          //this.scrollPosition = this.computeScrollPosition()
        }
        this.log("RECOMPUTE AFTER LOAD!")
        this.$nextTick(() => this.recompute())
      },
      finishFirstLoading() {
        if(!this.firstLoading) return
        this.log("FIRST LOADING FINISHED")
        if(typeof window != 'undefined' && this.scrollPosition) {
          if(this.scrollPosition == 'end') {
            this.scrollToPosition()
            this.recompute()
            this.firstLoading = false
            return;
          }
          const rowId = this.scrollPosition.rowId
          const element = document.getElementById(rowId)
          this.log("rowId", rowId, "ELEMENT", element)
          this.log("ITEM", this.visibleState.rows.find(i => this.rowId(i) == rowId))
          if(element) {
            this.scrollToPosition()
            this.firstLoading = false
          } else {
            this.$nextTick(() => {
              const element = document.getElementById(rowId)
              this.log("rowId", rowId, "ELEMENT", element)
              this.log("ITEM", this.visibleState.rows.find(i => this.rowId(i) == rowId))
              if(element) {
                this.scrollToPosition()
              }
              this.firstLoading = false
              //delete this.$router.hashScrollLocks[hash.slice(1)]
            })
          }
        } else {
          this.firstLoading = false
        }
        this.$emit('loadedFirst')
      },
    },
    mounted() {
      this.scrollParent = getScrollParent(this.$el)
    },
    created() {
      if(this.propagateLoading) {
        this.log("PROPAGATE LOADING")
        this.loadingTask = this.loadingZone.started({ name: `scrollLoader buckets` })
        setTimeout(() => {
          if(!this.isLoading) {
            this.loadingZone.finished(this.loadingTask)
            this.loadingTask = null
          }
        }, 50)
      }
      this.startLoading()
    },
    beforeDestroy() {
      this.log("BEFORE DESTROY")
      for(const bucket of this.buckets) {
        if(bucket.observable) this.unloadBucket(bucket)
      }
      if(this.loadingTask) {
        this.log("FINISH LOADING!")
        this.loadingZone.finished(this.loadingTask)
      }
    }
  }
</script>

<style scoped>

</style>