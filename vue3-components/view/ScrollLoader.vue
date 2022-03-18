<template>
  <visible-area @update="setVisibleArea" ref="area">
    <div class="scroll-top-fill" :style="{ height: topFill + 'px' }"></div>
    <slot v-if="isLoadingTop" name="loadingTop" v-bind="{ connectionProblem: isLoadingTopTooLong }"
          ref="topLoading">
    </slot>
    <div class="scroll-data" v-for="(row, index) in visibleState.rows" :ref="'row_'+index" :id="rowId(row)"
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
  import { reactive, ref } from "vue"
  import VisibleArea from "./VisibleArea.vue"
  import currentTime from "../utils/currentTime.mjs"
  import { getScrollParent } from "../utils/dom.mjs"

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
      autoScrollRoute: {
        type: Function,
        default: null
      },
      savedScrollPosition: {
        type: String,
        default: null
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
        default: row => row.id //row.bucketId + '_' + row.itemId
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
        visibleRows: [],
        bucketSizes: [],
        rowSizes: [],
        bucketsSize: []
      }
    },
    computed: {
      visibleState() {
        this.log("BUCKETS", this.buckets.length)
        const rows = this.buckets
          .flatMap((bucket, bucketId) => {
            this.log("BUCKET", bucket)
            if(bucket.state != 'ready' && bucket.state != 'closing') return []
            let rows = bucket.range.reverse
                ? bucket.items.map((item, itemId) => ({ ...item, bucketId, itemId })).reverse()
                : bucket.items.map((item, itemId) => ({ ...item, bucketId, itemId }))
            if(bucket.softClose) {
              if(bucket.softClose.lte) rows = rows.filter(item => item.id <= bucket.softClose.lte)
              if(bucket.softClose.gte) rows = rows.filter(item => item.id >= bucket.softClose.gte)
            }
            return rows
          })
        this.log("ROWS", rows.length)
        return {
          rows,
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
        if(!this.autoScrollRoute) return
        const rowId = this.rowIdPrefix + scrollPos.row
        const oldRowId = oldScrollPos && this.rowIdPrefix + oldScrollPos.row
        if(rowId === undefined) return
        if(this.isLoading) return
        if(this.firstLoading) return
        if(scrollPos.rowId == 0 && scrollPos.offset == 0 && !this.savedScrollPosition) return
        delete this.$router.hashScrollLocks[oldRowId]
        this.$router.hashScrollLocks[rowId] = true
        const atTop = (this.visibleArea.clipTop == 0 && (!scrollPos.rowId))
        const hash = atTop ? '' : "#" + rowId
        if(this.$router.currentRoute.hash != hash)  {
          this.$router.replace({ ...this.autoScrollRoute(atTop ? null : rowId), hash })
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
        const rowSizes = this.rowSizes
        this.log("COMPUTE VISIBLE ROWS")
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
      computeScrollPosition(visibleArea) {
        if(this.stickyEnd && visibleArea.clipBottom < 10) {
          return 'end'
        }
        const clipTop = visibleArea.clipTop
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
              const element = this.$refs['row_'+rowId]
              //this.log(bucketId, itemId, "ELEMENT", element, "AT", rowTop)
              if(element) {
                /*this.log(bucketId, itemId, "ITEM", JSON.stringify(item),
                    "IS", element )
                this.log("AT", rowTop, "+", element.offsetHeight, "=", rowTop + element.offsetHeight, '>', clipTop)*/
                if(rowTop + element.offsetHeight > clipTop || itemId == bucket.items.length-1 )
                  return {
                    row: this.rowName({ ...item, bucketId, itemId }),
                    offset: clipTop - rowTop,
                    rowId
                  }
                rowId ++
                rowTop += element.offsetHeight
              } else {
                return {
                  row: this.rowName({ ...item, bucketId, itemId }),
                  offset: clipTop - top,
                  rowId
                }
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
            offset: clipTop - top,
            rowId
          }
        }
      },
      measureRows() {
        //console.trace("MEASURE")
        const elements = Object.keys(this.$refs)
          .filter(key => key.slice(0,4) == 'row_')
          .map(key => this.$refs[key])
          .filter(key => !!key)
        if(!elements) return []
        for(const element of elements) {
          if(!element) debugger
        }
        const measurements = elements.map(element => ({
          offsetTop: element.offsetTop, offsetHeight: element.offsetHeight, element
        }))
        if(measurements.length == 0) return 0
        if(measurements.length == 1) return [ measurements[0].offsetHeight ]
        measurements.sort((a, b) => a.offsetTop - b.offsetTop)
        this.log("MEASUREMENTS", measurements)
        const rowDistance = (measurements[1].offsetTop - measurements[0].offsetTop) - measurements[0].offsetHeight
        const rowSizes = measurements.map(m => m.offsetHeight + rowDistance)
        return rowSizes
      },
      measureBuckets(rowSizes) {
        if(!rowSizes) rowSizes = this.measureRows()
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
      scrollTo(to) {
        this.ignoreNextScroll = true
        this.scrollParent.scrollTop = to
        setTimeout(() => {
          this.ignoreNextScroll = false
        }, 500)
      },
      scrollToPosition(pos) {
        //console.trace("SP!")
        this.log("SCROLL POS", JSON.stringify(pos))
        if(!pos) return
        if(pos == 'end') {
          this.log("SCROLL TO END!")
          this.scrollTo(this.$el.offsetTop + this.$el.offsetHeight - this.scrollParent.clientHeight)
          return
        }
        const element = document.getElementById(this.rowIdPrefix + pos.row)
        if(element) {
          this.log("FOUND ELEMENT", element, element.offsetTop)
          const elementTop = element.offsetTop
          this.log("SCROLL TO", elementTop + pos.offset)
          this.scrollTo(elementTop + pos.offset)
        } else {
          this.log("SCROLL ELEMENT NOT FOUND")
        }
      },
      loadMoreIfNeeded() {
        this.log("LOAD MORE IF NEEDED!", !!this.visibleArea, this.buckets.length)
        if(!this.visibleArea) return
        if(this.buckets.length == 0) return
        const firstBucket = this.buckets[0]
        const lastBucket = this.buckets[this.buckets.length - 1]

        const visibleTop = this.visibleArea.top
        const visibleBottom = this.visibleArea.top + this.visibleArea.height
        const top = visibleTop - this.topMargin
        const bottom = visibleBottom + this.bottomMargin

        const topEnd = this.topFill + (this.$refs.topLoading ? this.$refs.topLoading.offsetHeight : 0)
        const bottomEnd = topEnd + this.bucketsSize

        this.log("TOP", top, "<", topEnd, '=', top < topEnd)
        if(firstBucket) {
          this.log("FIRST", JSON.stringify(firstBucket.range), "ST", firstBucket.state,
              "ITEMS", firstBucket.items.length)
        } else this.log("NO FIRST BUCKET!")

        this.log("BOTTOM", bottom, ">", bottomEnd, '=', bottom > bottomEnd)
        if(lastBucket) {
          this.log("LAST", JSON.stringify(lastBucket.range), "ST", lastBucket.state,
              "ITEMS", lastBucket.items.length)
        } else this.log("NO LAST BUCKET!")

        if(top < topEnd && firstBucket.state == 'ready'
            && ( firstBucket.range.gt || firstBucket.range.gte || firstBucket.items.length == this.bucketSize )) {
          if(this.readMode != 'index' || firstBucket.range.gt != 0)
            this.loadTop()
        }

        if(bottom > bottomEnd && lastBucket.state == 'ready'
            && ( lastBucket.range.lt || lastBucket.range.lte || lastBucket.items.length == this.bucketSize )
            && lastBucket.range.lt != "\xFF\xFF\xFF\xFF") {
          this.loadBottom()
        }
      },
      setVisibleArea(visibleArea, reason) {
        this.log("HANDLE VISIBLE AREA CHANGE!!! REASON:", reason, "IGNORE SCROLL", this.ignoreNextScroll)
        const oldVisibleArea = this.visibleArea
        this.log("NEW", JSON.stringify(visibleArea))
        this.log("OLD", JSON.stringify(oldVisibleArea))

        if(!this.scrollParent) {
          this.log("IGNORE VISIBLE AREA CHANGE BECAUSE NO SCROLL PARENT!")
          this.visibleArea = visibleArea
          return
        }

        const sizeChanged = !oldVisibleArea ||
            ( visibleArea.areaWidth != oldVisibleArea.areaWidth
                || visibleArea.areaHeight != oldVisibleArea.areaHeight )

        const resized = sizeChanged || reason == 'resize'

        let rowSizes = this.rowSizes
        let bucketSizes = this.bucketSizes

        this.log("NEED MEASURE?", resized, bucketSizes.length != this.buckets.length)
        /// Measure all
        if(resized || bucketSizes.length != this.buckets.length) {
          rowSizes = this.measureRows()
          bucketSizes = this.measureBuckets(rowSizes)
        }

        if(resized) {
          //const oldScrollPosition = this.computeScrollPosition(oldVisibleArea)

          if((!this.scrollPosition || typeof this.scrollPosition == 'object')
              && oldVisibleArea) { // recompute old scroll position
            //this.scrollPosition = this.computeScrollPosition(oldVisibleArea)
          }

          const sp = this.scrollPosition
          if(sp && ((typeof sp != 'object') ||(sp.rowId > 0 && sp.offset > 0))) {
            this.scrollToPosition(this.scrollPosition)
          }
        }

        this.computeVisibleRows()

        if(resized || bucketSizes.length != this.buckets.length) {
          /// Save measurements:
          this.rowSizes = rowSizes
          this.bucketSizes = bucketSizes
          this.bucketsSize = this.bucketSizes.reduce((a, b) => a + b, 0)
          for(let i = 0; i < this.bucketSizes.length; i++) {
            if(this.buckets[i]) {
              this.buckets[i].height = this.bucketSizes[i]
            }
          }
        }

        this.visibleArea = visibleArea

        if(reason == 'scroll') {
          if(this.ignoreNextScroll) {
            this.ignoreNextScroll = false
          } else {
            this.scrollPosition = this.computeScrollPosition(this.visibleArea)
          }
        }

        this.loadMoreIfNeeded()
      },
      getNextBucketRange() {
        switch(this.readMode) {
          case 'id': {
            const lastBucket = this.buckets[this.buckets.length - 1]
            if(!lastBucket) return {
              gt:''
            }
            if(lastBucket.lte) return {
              gt: lastBucket.lte
            }
            if(lastBucket.lt) return {
              gte: lastBucket.lt
            }
            if(!lastBucket.items.length) throw new Error("ADD NEXT BUCKET AFTER EMPTY BUCKET")
            return {
              gt: lastBucket.items[lastBucket.range.reverse ? 0 : lastBucket.items.length-1].id
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
            if(!firstBucket) return {
              lt: '\xFF\xFF\xFF\xFF',
              reverse: true
            }
            if(firstBucket.gte) return {
              lt: firstBucket.lte,
              reverse: true
            }
            if(firstBucket.gt) return {
              lte: firstBucket.lt,
              reverse: true
            }
            if(!firstBucket.items.length) throw new Error("ADD PREV BUCKET BEFORE EMPTY BUCKET")
            return {
              lt: firstBucket.items[firstBucket.range.reverse ? firstBucket.items.length - 1 : 0].id,
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
        const bucket = reactive({
          state: 'free',
          range: this.rangeCut({ ...range, limit: this.bucketSize }),
          height: 0,
          observable: null,
          items: [],
          error: null,
          softClose: null
        })
        bucket.stateObserver = (s, v, id, el) => {
          if(bucket.state == 'free') {
            console.trace("BUCKET SIGNAL IN STATE FREE")
            return
          }
          this.log("SIGNAL", s, "BUCKET", JSON.stringify(bucket.range), "DP:", JSON.stringify(bucket.daoPath),
              "IN STATE", bucket.state, "ARGS", JSON.stringify([v, id, el]))
          if(bucket.state == 'closing' && v.length == 0) {
            console.error("BUCKET CLOSING EMPTY!?!?")
          }
          if(bucket.state == 'loading' && s == 'set' && v) {
            bucket.state = v.length > 0 ? 'ready' : 'empty'
            this.handleLoaded(bucket, v)
          } else if((bucket.state == 'empty' || bucket.state == 'closing') && (s == 'putByField' || s == 'push')) {
            bucket.state = 'ready'
            this.handleLoaded(bucket, [ el ])
          } else if((bucket.state == 'empty' || bucket.state == 'closing') && s == 'set') {
            bucket.state = 'ready'
            this.handleLoaded(bucket, v)
          }
          this.$nextTick(() => {
            this.loadMoreIfNeeded()
            /*if(bucket.items.length == this.bucketSize || // check if bucket is full
                ((bucket.range.gt || bucket.range.gte) && (bucket.range.lt || bucket.range.lte))) {
              this.loadMoreIfNeeded()
            }*/
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
              lt: bucket.range.lt || undefined,
              lte: !bucket.range.lt && bucket.items[0].id || undefined,
              reverse: true
            } : {
              gt: bucket.range.gt || undefined,
              gte: !bucket.range.gt && bucket.items[0].id || undefined,
              lte: bucket.items[bucket.items.length - 1].id
            }
            this.log("CLOSE RANGE", range)
            if(this.hardClose) {
              bucket.range = range
              this.loadBucket(bucket, true)
            } else {
              let gt = range.gte || range.gt
              let lt = range.lte || range.lt
              if(gt && lt && gt > lt) {
                bucket.softClose = { lte: range.gte, gte: range.lte, gt: range.lt, lt: range.gt }
              } else {
                bucket.softClose = range
              }
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
        const firstBucket = this.buckets[0]
        this.log("FIRST BUCKET CLOSE?", firstBucket.range, firstBucket.items.length)
        if(firstBucket) this.closeBucket(firstBucket)
        const bucket = this.createBucket(range)
        this.buckets.unshift(bucket)
        return bucket
      },
      async loadEndBucket() {
        const range = { lt: '\xFF\xFF\xFF\xFF', reverse: true, limit: this.bucketSize }
        const daoPath = this.what({ ...range })
        const lastItems = await this.$api.get(daoPath)
        lastItems.reverse()
        this.log("LAST ITEMS LOADED", lastItems)
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
        bucket.observable = this.$api.observable(bucket.daoPath)
        this.log("BUCKET PATH", JSON.stringify(bucket.daoPath))
        //console.log("API DAO", api)
        this.log("BUCKET OBSERVABLE CACHED DATA", bucket.observable.list)
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
        this.log("START LOADING")
        if(this.startPosition) {
          this.scrollPosition = this.startPosition
        }
        if(this.savedScrollPosition) {
          const position = this.savedScrollPosition
          this.log("LOADING SAVED SCROLL", position)
          delete this.$router.hashScrollLocks[position] // unlock scroll
          if(position.slice(0, this.rowIdPrefix.length) == this.rowIdPrefix) {
            this.scrollPosition = { row: +position.slice(this.rowIdPrefix.length), offset: 0, rowId: Infinity }
            this.log("SAVED SCROLL POSITION", this.scrollPosition)
          }
        }
        if(this.scrollPosition) {
          if(this.scrollPosition == 'end') {
            this.topFill = (this.topMargin * 1.5) | 0
            this.log("LOAD END BUCKET BECAUSE SCROLL IS ON END")
            const bucket = await this.loadEndBucket()
            return
          }
          const start = this.scrollPosition.row
          this.topFill = (this.topMargin * 1.5) | 0
          this.log("LOAD BUCKET AT", start)
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
          this.$emit('loaded')
        }
      },
      finishFirstLoading() {
        if(!this.firstLoading) return
        this.log("FIRST LOADING FINISHED")
        this.firstLoading = false
        this.$emit('loadedFirst')
      },
    },
    mounted() {
      this.log("MOUNTED!")
      this.scrollParent = getScrollParent(this.$el)
      if(this.scrollParent) {
        this.log("SCROLL PARENT FOUND", this.scrollParent)
        const va = this.visibleArea
        this.visibleArea = null
        this.setVisibleArea(va, 'start')
      } else {
        this.log("NO SCROLL PARENT!!!")
      }
    },
    created() {
      if(typeof window != 'undefined') {
        window.sl = this
      }
      if(this.propagateLoading) {
        this.log("PROPAGATE LOADING")
        this.loadingTask = this.loadingZone.started({ name: `scrollLoader buckets` })
        setTimeout(() => {
          if(!this.isLoading && this.loadingTask) {
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