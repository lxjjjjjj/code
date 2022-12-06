const state = {
    // init传入公共参数
    config: {},
    // 登录信息，初始为空
    login: null,
    // 百川平台配置（场景弹窗）
    popList: {
      scene_map: {},
      doc_map: {}
    },
    // 开屏弹窗点击同意后，记录下来，进入homeScene的时候再去调用sign授权homeScene。防止开屏弹窗和homeScene同时弹。
    needAsignhomeScene: false,
    // 承装相关法律的webview-page路径
    webviewUrl: '/mp-authorize-webview/pages/webview-page/index',
    apiData: {
      scene: '',
      scene_list: [],
      extraData: null,
      path: '',
      agree: () => {},
      disagree: () => {}
    }
  };
  export default state;