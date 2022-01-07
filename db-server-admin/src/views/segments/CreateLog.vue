<template>
  <form class="create-form" @submit="createLog">
    <h3>Create Log</h3>
    <span class="form-field">
      <label for="createLogName">Log name</label>
      <input type="text" placeholder="LogName" v-model="createLogName" id="createLogName" />
      <small class="field-error" v-if="createLogError"></small>
    </span>
    <button type="submit" class="button">Create Log</button>
  </form>
</template>

<script>
export default {
  name: "CreateLog",
  props: {
    databaseName: {
      type: String
    }
  },
  data() {
    return {
      createLogName: '',
      createLogError: ''
    }
  },
  inject: ['workingZone'],
  methods: {
    createLog(ev) {
      ev.preventDefault()
      const LogName = this.createLogName
      this.workingZone.addPromise(`create Log ${name} in ${this.databaseName})`,
          api.request(["database", "createLog"], this.databaseName, LogName ).catch(err => {
            this.createLogError = err
          })
      )
    }
  }
}
</script>

<style scoped>

</style>