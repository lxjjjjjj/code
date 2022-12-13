// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import Vuex from "vuex";
import App from "./App";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    errors: []
  },
  mutations: {
    addError(state, error) {
      state.errors.push(error);
    }
  }
});

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: "#app",
  store,
  components: { App },
  template: "<App/>"
});
