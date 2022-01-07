import Vue from "vue"

const currentTime = new Vue({
  data: {
    now: Date.now()
  },
  created() {
    if(typeof window != 'undefined') {
      setInterval(() => {
        this.now = Date.now()
      }, 1000)
    }
  }
})

export default currentTime