import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

window.Vue = Vue
Vue.use(ElementUI)

import VueI18n from 'vue-i18n'
import messages from './translations'
import appState from './appState'

const i18n = new VueI18n({
  locale: appState.getCurrentLanguage(),
  fallbackLocale: 'english',
  messages,
})

Vue.use(VueI18n)

import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import store from './store'

const app = new Vue({
  i18n,
  store,
  el: '#app',
  render: (h) => h(App),
})
