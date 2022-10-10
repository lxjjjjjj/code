# 上线平台
用于管理小程序的上线记录、需求收集、自动化的实现一键出体验码，上线文件留存，所有上线操作有详细记录等等能力，并且近期还会提供上线前的质量监测分析，性能测速等一系列保障小程序的上线安全性与稳定性的能力。

## 鉴权登陆系统的前后端实现(首页和设置页面前后端)  
1、后端服务部分 建立权限数据库，调用主数据接口传参数以及实现数据的加密存储。
2、权限校验部分
按钮权限 --- 使用指令实现  
```
createApp(App)
  .use(store)
  .use(router)
  .directive('permission', dirPermission)
  .mount('#app')
```
```
import store from '@/store'
import type { DirectiveBinding } from 'vue'

function checkPermission(el: any, binding: DirectiveBinding) {
  const { value } = binding
  if (!Array.isArray(value)) throw new Error(`need roles! Like v-permission="[1, 2]"`)

  const role = store.state.userInfo.role
  const hasRole = value.includes(role)

  if (!hasRole) {
    el.parentNode && el.parentNode.removeChild(el)
  }
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
  update(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  }
}
```
页面鉴权 --- 路由跳转鉴权
```

import { watch } from 'vue'
import store from '@/store'
import router, { settingRoutes } from './index'
import {
  USER_INFO,
  S_USER_INFO,
  AUTH_ROLE,
  DEFAULT_APP_NAME
} from '@/common/js/const'
import mockCooke from '../common/js/cookie'

export function getCookie(key) {
  const cookie = document.cookie.split('; ')
  for (let i = 0, len = cookie.length; i < len; i++) {
    const cur = cookie[i].split('=')
    if (key === cur[0]) {
      return cur[1]
    }
  }
  return ''
}
const whiteList = ['/join-up', '/no-auth']

function getToken(key: string) {
  let userInfo
  try {
    userInfo = JSON.parse(decodeURIComponent(getCookie(key) || '{}'))
  } catch (e) {
    console.error(e)
  }
  return userInfo || {}
}

function changeToken(role: number | string) {
  if(role === '' || role === -1) { // 游客身份
    router.removeRoute('setting')
  } else {
    if (AUTH_ROLE.includes(role as number)) {
      router.addRoute(settingRoutes)
    } else {
      router.removeRoute('setting')
    }
  }
}

if (import.meta.env.VITE_CONFIG_MODE === 'local') {
  // 线上 s_userinfo 为 httponly 属性，所以前端页面展示读取 cookie 中的 userInfo，服务端读取 s_userinfo
  if (!getCookie(S_USER_INFO)) {
    document.cookie = S_USER_INFO + '=' + encodeURIComponent(JSON.stringify(mockCooke))
  }
  if (!getCookie(USER_INFO)) {
    document.cookie = USER_INFO + '=' + encodeURIComponent(JSON.stringify(mockCooke))
  }
}
// 从cookie中解析出用户信息
const userInfo = getToken(USER_INFO)
store.commit('setUserInfo', {
  name: userInfo.username || '',
  nameCn: userInfo.opNameCn || '',
  headImg: userInfo.headImg || ''
})

router.beforeEach(async (to, from, next) => {
  // 确认appName是否存在且appName不是:app_name
  const appName = store.state.appName
  const { app_name } = to.params // 当 to.matched 为空时，app_name 是空
  let app: string = ''
  if (!app_name) {
    console.error('路径参数为空: ', to.params)
    app = DEFAULT_APP_NAME
  } else if (app_name === ':app_name') {
    console.error('路径参数有误: ', to.params)
    app = DEFAULT_APP_NAME
  } else {
    app = app_name as string
  }
  if (app !== appName) {
    console.error('路径参数和store不一致: ', { app, app_name, appName })
    // 清空 userInfo
    store.commit('clearUserInfo', { userId: '' }) // userId = '' 才会重新请求用户信息
    store.commit('setAppName', app)
  }
  const { userId } = store.state.userInfo
  let userInfo = { userId: -1, role: -1 }
  if (userId === '') {
    try {
      // 获取用户信息 userId、role
      userInfo = await store.dispatch('fetchRoleByProjectName')
      changeToken(userInfo.role)
      if (userInfo.userId === -1) throw new Error('获取userId以及role有误')
    } catch (e) { // 若获取用户角色失败，就以游客身份进入
      console.log(e)
      console.log('游客')
    }
    if (userInfo.role === -1 && to.path.includes('/setting')) { // 当前用户无权限且跳转目标路径是setting，则跳转到大首页
      return next('/publish-manage/list/' + app)
    } else if (to.matched.length === 0) {
      return next({ path: userInfo.userId ? to.path : '/' })
    }
  }
  if (whiteList.includes(to.path)) {
    return next()
  }
  if (to.path.indexOf(':app_name') === -1) {
    next()
  } else {
    next({ path: to.path.replace(':app_name', app) })
  }
})

```
## 质量检测

1、async.waterfall实现流水线一套流程。熟练写async完成流水线流程

oe平台构建完代码之后触发webhook请求上线平台接口 -> oeNotice接口接收构建完的项目文件 -> 文件上传到gift上以便于上线代码出现问题之后找问题 -> 本地解析下载的代码进行质量分析 -> 每次质量分析都要将分析的文件上传以便于追溯历史 -> 等到本次publish上线之后会删除没有上线的patch代码的质量分析文件 -> 以往publish的代码只保存最近五次的上线质量分析文件

2、写sql代替js的循环遍历查找

3、对于体积检测的分析对比
需要找到最近一次上线的patch的体积文件。分析出体积对比的diff

4、自动化流水线的重试操作的实现 通过流水线的step判断实现流水线某个步骤的重试

5、在oe容器构建后加入一个shell脚本写的流程轮询请求上线平台的质量检测接口判断是否有结果并且是否阻断后续流程
