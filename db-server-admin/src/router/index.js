import Vue from 'vue'
import VueRouter from 'vue-router'
import Databases from '../views/Databases.vue'
import Database from '../views/Database.vue'
import Object from '../views/Object.vue'
import RangeView from '../views/RangeView.vue'
import Query from '../views/Query.vue'
import Request from '../views/Request.vue'
import PageNotFound from "@/components/errors/PageNotFound.vue"

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'databases',
    component: Databases
  },
  {
    path: '/database/:databaseName',
    name: 'database',
    component: Database,
    props: true
  },
  {
    path: '/table/:databaseName/:viewName',
    name: 'table',
    component: RangeView,
    props: (route) => ({
      ...route.params,
      viewType: 'Table',
      readOnly: false
    })
  },
  {
    path: '/index/:databaseName/:viewName',
    name: 'index',
    component: RangeView,
    props: (route) => ({
      ...route.params,
      viewType: 'Index',
      readOnly: false
    })
  },
  {
    path: '/log/:databaseName/:viewName',
    name: 'log',
    component: RangeView,
    props: (route) => ({
      ...route.params,
      viewType: 'Log',
      readOnly: false
    })
  },
  {
    path: '/table/:databaseName/:viewName/:objectId',
    name: 'tableObject',
    component: Object
  },
  {
    path: '/query/:databaseName/:queryString',
    name: 'query',
    component: Object,
  },
  {
    path: '/request/:databaseName/:method/:requestArgs',
    name: 'query',
    component: Object,
  },
  { name: 'pageNotFound', path: '*', component: PageNotFound }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
