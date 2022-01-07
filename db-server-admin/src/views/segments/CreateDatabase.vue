<template>
  <form class="create-form" @submit="createDatabase">
    <h3>Create Database</h3>
    <span class="form-field">
      <label for="createDatabaseName">Database name</label>
      <input type="text" placeholder="DatabaseName" v-model="createDatabaseName" id="createDatabaseName" />
      <small class="field-error" v-if="createDatabaseError"></small>
    </span>
    <button type="submit" class="button">Create Database</button>
  </form>
</template>

<script>
export default {
  name: "CreateDatabase",
  props: {
  },
  data() {
    return {
      createDatabaseName: '',
      createDatabaseError: ''
    }
  },
  inject: ['workingZone'],
  methods: {
    createDatabase(ev) {
      ev.preventDefault()
      const name = this.createDatabaseName
      this.workingZone.addPromise(`create Database ${name}`,
          api.request(["database", "createDatabase"], name).catch(err => {
            this.createDatabaseError = err
          })
      )
    }
  }
}
</script>

<style scoped>

</style>