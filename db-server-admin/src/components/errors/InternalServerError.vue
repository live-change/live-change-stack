<template>
  <div class="modal-holder">
    <div class="card full-width" role="document">
      <h2>{{i18n.title}}</h2>
      <p>{{i18n.description}}</p>
      <h5>{{i18n.devInfo}}</h5>
      <ol>
        <li v-for="error in errors" :key="error.task.name+':'+error.reason" class="error">
          {{ taskType }} of <b>{{ error.task.name }}</b> failed because of error <b>{{ error.reason }}</b>
        </li>
      </ol>
      <div class="buttons">
        <button type="button" class="button" @click="reloadPage">{{i18n.closeButton}}</button>
      </div>
    </div>
  </div>
</template>

<script>
  import i18n from 'i18n'
  export default {
    name: "InternalServerError",
    props: {
      errors: {
        type: Array
      },
      taskType: {
        type: String,
        default: "Loading"
      }
    },
    computed: {
      i18n() { return i18n().internalServerError  }
    },
    methods: {
      reloadPage() {
        typeof document !== 'undefined' && document.location.reload()
      }
    }
  }
</script>

<style scoped>
  .modal {
    display: block;
    background: rgba(10,0,0,0.3);
  }
</style>