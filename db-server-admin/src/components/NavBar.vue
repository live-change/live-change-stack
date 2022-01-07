<template>
  <header class="navbar">
    <div class="navbar-content" ref="content">
      <span class="navbar-item navbar-brand">
        <router-link :to="{ name: 'databases'}" tag="a" class="navbar-brand-link">
          <img src="/logo.svg" class="navbar-logo" /> Live Change Database Admin
        </router-link>
      </span>
      <router-link tag="a" :to="{ name:'databases' }"
                   class="navbar-link navbar-item">
        <span>Databases</span>
      </router-link>
    </div>
  </header>
</template>

<script>
  import i18n from "i18n"
  import api from "@/api"

  export default {
    name: "NavBar",
    reactive: {
    },
    data() {
      return {

      }
    },
    computed: {
      i18n() { return i18n().navBar },
      lang() { return i18n.config.language },
    },
    mounted() {
    },
    beforeDestroy() {
    },
    watch: {
    /*  '$route.params.query': {
        handler: function(search) {
          this.query = search
        },
        deep: true,
        immediate: true
      }*/
    },
    methods: {
      setLanguage(lang) {
        console.log("SET LANG", lang)
        i18n.config.language = lang
        document.cookie = `language=${lang}; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
      }
    }
  }
</script>

<style scoped>
</style>
