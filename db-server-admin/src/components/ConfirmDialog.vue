<template>
  <div class="confirm-holder">
    <div class="card text-center">
      <div class="card-body">
        <div class="card-title">{{ title }}</div>
        <p class="card-text">{{ text }}</p>
        <button class="btn btn-danger card-link" @click="yesClick">{{ yes }}</button>
        <button class="btn btn-primary card-link" @click="noClick">{{ no }}</button>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ConfirmDialog",
    props: {
      title: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      },
      yes: {
        type: String,
        default: "Yes"
      },
      no: {
        type: String,
        default: "No"
      }
    },
    methods: {
      yesClick() {
        this.$emit("yes")
        this.$emit("close")
      },
      noClick() {
        this.$emit("no")
        this.$emit("close")
      }
    }
  }
</script>
