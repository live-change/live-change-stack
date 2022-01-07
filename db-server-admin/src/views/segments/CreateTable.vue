<template>
  <form class="create-form" @submit="createTable">
    <h3>Create table</h3>
    <span class="form-field">
      <label for="createTableName">Table name</label>
      <input type="text" placeholder="tableName" v-model="createTableName" id="createTableName" />
      <small class="field-error" v-if="createTableError"></small>
    </span>
    <button type="submit" class="button">Create Table</button>
  </form>
</template>

<script>
export default {
  name: "CreateTable",
  props: {
    databaseName: {
      type: String
    }
  },
  data() {
    return {
      createTableName: '',
      createTableError: ''
    }
  },
  inject: ['workingZone'],
  methods: {
    createTable(ev) {
      ev.preventDefault()
      const tableName = this.createTableName
      this.workingZone.addPromise(`create table ${name} in ${this.databaseName})`,
          api.request(["database", "createTable"], this.databaseName, tableName ).catch(err => {
            this.createTableError = err
          })
      )
    }
  }
}
</script>

<style scoped>

</style>