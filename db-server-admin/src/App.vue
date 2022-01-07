<template>
  <div id="app">
    <loading-zone>
      <working-zone>
        <router-view></router-view>
        <overlay-component :overlayModel=overlayModel></overlay-component>
      </working-zone>
    </loading-zone>
  </div>
</template>

<script>
import api from "api"
import '../scss/style.scss'

import { OverlayComponent } from './components/utils/overlayLayer.js'
import overlayModel from './components/utils/overlayModel.js'

export default {
  name: 'App',
  components: { OverlayComponent },
  metaInfo: {
    title: 'Live Change Database',
    titleTemplate: '%s | Live Change Database'
  },
  data() {
    return {}
  },
  methods: {
  },
  computed: {
    overlayModel() {
      return overlayModel
    },
    session() {
      return api.session /// FOR DEBUGING ONLY
    }
  },
  watch: {
    apiVersion(version) {
      console.error(`API VERSION CHANGED TO ${version} DO RELOAD!`)
      /// TODO: show bar notification to user!
    }
  }
}
</script>
