import { ref, onUnmounted, watch, unref } from 'vue'
import { api as useApi } from '@live-change/vue3-ssr'

class Upload {
  constructor(purpose, blob, options = {}) {
    const {
      size = blob.size,
      fileName = blob.name || 'unknown',
      api = useApi(options.appContext),
      service = 'upload',
      endpoint = 'upload',
      view = 'upload'
    } = options

    this.purpose = purpose
    this.blob = blob

    this.api = api

    this.id = api.uid()

    this.url =`${document.location.protocol}//${document.location.host}/api/upload/upload/${purpose}/${fileName}/${this.id}`

    this.state = ref('starting')
    this.error = ref(null)

    let promiseCb
    this.promise = new Promise((resolve, reject) => promiseCb = { resolve, reject })

    this.clientTransferred = ref(0)
    this.serverUpload = ref(null)
    this.serverObservable = api.observable([service, view, { upload: this.id }])
    this.serverObservable.bindProperty(this.serverUpload, 'value')
    onUnmounted(() => {
      if(this.serverObservable) {
        this.serverObservable.unbindProperty(this.serverUpload, 'value')
        this.serverObservable = null
      }
    })
    watch(() => this.serverUpload.value, value => {
      if(value?.state === 'done' && this.serverObservable) {
        this.serverObservable.unbindProperty(this.serverUpload, 'value')
        this.serverObservable = null
      }
    })

    this.xhr = new XMLHttpRequest()

    this.xhr.upload.addEventListener('progress', (evt) => {
      this.clientTransferred.value = evt.loaded
    }, false)
    this.xhr.addEventListener("readystatechange", evt => {
      if(this.xhr.readyState == 4) {
        if(this.xhr.status == 200) {
          this.state.value = 'done'
          promiseCb.resolve(this.id)
        } else {
          this.state.value = 'failed'
          this.error.value = this.xhr.status + " " + this.xhr.responseText
          promiseCb.reject(this.error.value)
        }
      }
    })
    this.xhr.addEventListener( "error", () => {
      this.state.value = 'failed'
      this.state.error = 'XHR error'
      promiseCb.reject(this.error.value)
    })

    this.xhr.open('POST', this.url, true)
    this.xhr.send(blob)
  }

  cancel() {
    if(this.xhr.readyState != 4) {
      this.xhr.abort()
    }
    if(this.serverObservable) {
      this.serverObservable.unbindProperty(this.serverUpload, 'value')
      this.serverObservable = null
    }
  }

  isDone() {
    return unref(this.state) == 'done'
  }
}

export default Upload
