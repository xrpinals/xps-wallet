import Vue from 'vue'
import Vuex from 'vuex'

import getters from './getters'
import account from './modules/account'

Vue.use(Vuex)

const store = new Vuex.Store({
    modules: {
        account
    },
    getters,
    state: {

    },
    mutations: {

    },
})

export default store
