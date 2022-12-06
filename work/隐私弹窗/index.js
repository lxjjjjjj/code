import store from './store/index';
class Authorize {
  // 初始化
  init(config) {
    store.commit('setConfig', config)
  }
  updateConfig(config) {
    if (config && config.lang && config.lang !== store.state.config.lang) {
      store.commit('updateConfig', config)
      store.dispatch('getPopList')
    } else {
      store.commit('updateConfig', config)
    }
  }
  // 调用方通过api方式调用组件展示，需要提前获取百川所有的场景值
  getPopList(params) {
    store.dispatch('getPopList', params, true)
  }
  // 全局api调用展示组件
  showAuthorize(data) {
    store.commit('setApiData', data)
  }
  // 获取开屏弹窗，是否同意状态，点同意会resolve
  getAuthIndexStatus() {
    if (!this.authIndexStatusPromise) {
      // 获取index弹窗是否被引用，如果被引用则不做处理，如果未引用主动触发getIndexStatusResolve()
      // 即外部调用getAuthIndexStatus但未引index组件也会得到resolve状态，不能卡着
      this.getIndexAttachStatus()

      this.authIndexStatusPromise =  new Promise((resolve) => {
        if (this.isIndexStatusResolved) {
          resolve(true)
        } else {
          this.getIndexStatusResolve = resolve
        }
      })
    }
    return this.authIndexStatusPromise
  }

  getIndexStatusResolve() {
    this.isIndexStatusResolved = true
  }
  // 获取当前小程序初始化阶段是否引入了开屏弹窗
  getIndexAttachStatus() {
    setTimeout(() => {
      // 这里可以认为没有引index组件，但是调用了getAuthIndexStatus，所以将getAuthIndexStatus状态resolve
      // 真机实测开屏页面从js开始调用到组件attach，不超过200ms，所以这里用800ms作为限制
      if(!this.isIndexAttachResolved) {
        this.getIndexStatusResolve(true)
      }
    }, 800)
  }

  indexAttachResolve() {
    this.isIndexAttachResolved = true
  }

  signHomeScene(login) {
    return store.dispatch('signHomeSceneAction', login)
  }
}

const authorize = new Authorize();
export default authorize;
