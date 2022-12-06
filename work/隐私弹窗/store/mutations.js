const logout = {
    phone: '',
    token: '',
    uid: 0
  };
  export default {
    setConfig(state, config) {
      state.config = config;
    },
    updateConfig(state, config) {
      state.config = Object.assign({}, state.config, config)
    },
    loginSuccess(state, login) {
      state.login = login
    },
    loginFail(state) {
      state.login = logout
    },
    setPopList(state, data) {
      state.popList = data
    },
    signUpdatePopList(state, scene) {
      delete state.popList.scene_map[scene]
    },
    setApiData(state, data) {
      state.apiData = data
    },
    resetApiData(state) {
      state.apiData = {
        scene: '',
        scene_list: [],
        extraData: null,
        path: '',
        agree: () => {},
        disagree: () => {}
      }
    }
  },
    setNeedAsignhomeScene(state, status) {
      state.needAsignhomeScene = status
    }
  };