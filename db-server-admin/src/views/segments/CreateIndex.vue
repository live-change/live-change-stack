<template>
  <form class="create-form" @submit="createIndex">
    <h3>Create Index</h3>
    <span class="form-field">
      <label for="createIndexName">Index name</label>
      <input type="text" placeholder="IndexName" v-model="createIndexName" id="createIndexName" />
      <small class="field-error" v-if="createIndexError"></small>
    </span>
    <button type="submit" class="button">Create Index</button>
  </form>
</template>

<script>
export default {
  name: "CreateIndex",
  props: {
    databaseName: {
      type: String
    }
  },
  data() {
    return {
      createIndexName: '',
      createIndexError: ''
    }
  },
  inject: ['workingZone'],
  methods: {
    createIndex(ev) {
      ev.preventDefault()
      const IndexName = this.createIndexName
      this.workingZone.addPromise(`createIndex ${name} in ${this.databaseName})`,
          api.request(["database", "createIndex"], this.databaseName, IndexName ).catch(err => {
            this.createIndexError = err
          })
      )
    }
  }
}
</script>

<style scoped>

</style>