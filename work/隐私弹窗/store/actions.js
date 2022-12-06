import request from '../../utils/request';
import { getStorage, setStorage } from '../../utils/mpx-proxy'
import { Omega } from '@didi/tracker-mpapp'

export default {
  // 尝试拉取百川配置，先从登录态判断是否要拉取
  async tryGetConfig ({ state, dispatch }, defaultLogin) {
    let isLogin = state.config.isLogin
    if (!isLogin) {
      return
    }

    let login = defaultLogin || null
    if (!login) {
      login = await isLogin()
    }
    let isLoginSuccess = !!(login && login.token && login.uid) // 是否已登录
    let isFirstGetLogin = !state.login // 是否首次获取登录状态
    
    // 如果是首次请求isLogin，无论是否登录都要getPopList
    // 否则就是非首次请求，如果是已登录且uid有变化，也要getPopList
    // 最后如果非首次并且未登录，就存一下login
    if (isFirstGetLogin || (isLoginSuccess && login.uid !== state.login.uid)) { // 首次请求login，登不登录都要 先存登录态，后拉取config。
      dispatch('saveLogin', login)
      await dispatch('getPopList')
    } else if (!isLoginSuccess) {
      dispatch('saveLogin', login)
    }
  },

  saveLogin({ commit }, login) {
    if (login && login.token && login.uid) {
      commit('loginSuccess', login)
    } else {
      commit('loginFail')
    }
  },

  // 拉取百川授权配置
  getPopList ({ state, commit }, params) {
    let data = {
      appid: state.config.appid || '',
      appVersion: state.config.appVersion || '',
      lang: state.config.lang || '',
      scene_list: JSON.stringify(state.config.sceneList || []), 
      scene_str: state.config.scene_str || '', 
      caller: state.config.caller || ''
    }
    params && Object.assign(data, params)
    if (state.login && state.login.token) {
      data.token = state.login.token
    } else {
      data.signed_doc_list = JSON.stringify(getStorage('signed_doc_list') || [])
    }

    return request({
      url: '/gulfstream/confucius/api/privacy/app/popList',
      method: 'GET',
      data
    }).then((data) => {
      if (data) {
        commit('setPopList', data)
      }
    })
  },

  // 签署协议
  sign ({ state, commit }, sceneData) {
    // 如果是登录的，将已签署状态回传
    if (state.login && state.login.token) {
      let data = {
        token: state.login.token,
        doc_id: sceneData.docid,
        scene: sceneData.scene,
        appid: state.config.appid || '',
        appVersion: state.config.appVersion || '',
        lang: state.config.lang || '',
        caller: state.config.caller || ''
      }
      return request({
        url: '/gulfstream/confucius/api/privacy/app/sign',
        method: 'POST',
        data
      }).then(() => {
        commit('signUpdatePopList', sceneData.scene)
      })
    } else {
      // 未登录将docid存到本地
      let localList = getStorage('signed_doc_list')
      if (!localList) {
        localList = [sceneData.docid]
      } else if (localList.indexOf(sceneData.docid) === -1) {
        localList.push(sceneData.docid)
      }
      setStorage('signed_doc_list', localList)
      // 防止进入同一场景反复授权
      commit('signUpdatePopList', sceneData.scene)
    }
  },
  // 签署homescene
  async signHomeSceneAction ({ state, dispatch }, login) {
    Omega.trackEvent('pub_loginaction_suc_presign_en', '准备进行登录后的静默签署', {
      appid: state.config.appid || ''
    })
    await dispatch('tryGetConfig', login)

    let homeScene = state.config.homeScene || 'app'
    let sceneMap = state.popList && state.popList.scene_map || {}
    let docid = sceneMap[homeScene]
    if (docid) {
      await dispatch('sign', {
        scene: homeScene,
        docid: docid
      }).then(() => {
        Omega.trackEvent('pub_sign_suc_after_loginaction_en', '静默签署成功', {
          appid: state.config.appid || '',
          scene: homeScene,
          docid: docid
        })
      })
    } else {
      Omega.trackEvent('pub_loginaction_suc_noneed_sign_en', '登录后静默签署-已签署过首页场景', {
        appid: state.config.appid || ''
      })
    }
  }
};
