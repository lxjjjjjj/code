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

2、写sql代替js的循环遍历查找 学习数据库语句

3、对于体积检测的分析对比
需要找到最近一次上线的patch的体积文件。分析出体积对比的diff

4、自动化流水线的重试操作的实现 通过流水线的step判断实现流水线某个步骤的重试

5、在oe容器构建后加入一个shell脚本写的流程轮询请求上线平台的质量检测接口判断是否有结果并且是否阻断后续流程


# 小程序日常开发总结
## 个人中心改版
### 背景
个人中心作为日均pv 180w+，日均uv120w+仅次于首页的页面可以承担起更多营销的业务需求，将个人中心做了全面的改造升级。支持接入多个业务方服务以及核心部分服务。
#### 难点
##### 难点一 如何接入不同功能的不同模块样式实验
优先级高的卡片排序靠前可以优先出现在用户视口中。同样的功能但是不同卡片样式也会影响用户的喜好，需要探索出大部分用户偏爱的卡片样式。因此要不断更改卡片优先级和支持多种样式的卡片实验探索出营销的最佳实验结果。
###### 方案：动态渲染
根据服务端返回的数据卡片id，获取对应的卡片组件。并根据卡片id顺序从上到下动态渲染卡片。目前接入的实验有：新旧会员入口实验、新旧我的福利实验、新旧好赚好省实验，并取得了不错的实验效果
##### 难点二 满足业务接入的多样性
为了更好的接入多个业务方，满足多个业务方需求。业务频道支持多种样式卡片，为各个业务方接入提供多种样式   
###### 方案： 同一张卡片支持多种样式
针对业务频道模块的不同形态将卡片分为三种样式，三种样式都支持翻页功能。
###### 结果
抽象出一个组件可以兼容三种样式类型和六种情况卡片。
   
##### 难点三 提升个人中心体验
存在单个模块图片超过六张，整个页面加载图片50+，需要优化。

###### 方案：优化图片加载
* 单个模块   将加载图片操作放到任务队列中执行，实现分批加载，同一个模块中可能存在图片过多的情况，根据第一屏最多能展示的图片个数将整个图片划分成多个队列加载。
* 多个模块   采用滚动监听实现懒加载图片，使用intersectionObserver监听，鉴于持续的滚动坚挺会消耗页面性能，所以在第一次监听之后将监听器销毁。当模块滑动到距离页面底部0px时加载模块图片，底部导航占据页面底部64px的高度提供了一个缓冲时间，用户不至于看到没加载图片时的空白部分。

###### 结果
微信体验分评分从70+上升到90+

##### 难点四 保障个人中心页面稳定性
###### 方案
* 书写了个人中心的单测流程，保证代码质量。
* 做好边界条件处理和兜底逻辑，在上线前列好checklist，回归测试。
##### 难点五 接口返回时间长
需要调用多个业务方下游接口且接口内容多，导致接口返回时间长
###### 方案 骨架屏
在接口请求数据没有返回时展示骨架屏页面，提升用户在等待接口数据返回的体验，可以将营销接口和个人中心信息接口拆分请求

## 首页及打车页资源位迭代
### 背景
主卡运营区位于首页中间更加醒目，可以承担很多营销活动的引流。所以在首页主卡接入了领任务以及领取券跳转活动的营销需求。		
### 难点
支持多个业务场景，如何在不发版的情况下，不同功能区兼容不同活动需求。接入多个业务需求满足各种场景下的引流营销需求，支持多种样式和功能，和其他组件联动功能。组件在多个地方引用，组件内部维护数据请求。方便其他各个页面接入组件。
### 方案
根据配置动态渲染主卡不同功能
组件根据配置数据动态渲染卡片内容，卡片内容多种多样，分为倒计时、领任务、进度、倒计时天数、倒计时时分秒和主副标题等。
* 按钮功能  1.跳转任务落地页链接，2.订阅微信消息功能，3.调用领任务接口领取任务三种功能。
* 领取任务之后会展示进度条，
* 领取券后会展示倒计时时间。
* 点击主卡 也会跳转到相关活动页面，展示更多此活动的券数据。

## 分包异步化改造
独立分包是小程序中一种特殊类型的分包，可以独立于主包和其他分包运行。**从独立分包中页面进入小程序时，不需要下载主包**。**当用户进入普通分包或主包内页面时，主包才会被下载**。开发者可以按需将某些具有一定功能独立性的页面配置到独立分包中。当小程序从普通的分包页面启动时，需要首先下载主包；而独立分包不依赖主包即可运行，可以很大程度上提升分包页面的启动速度。一个小程序中可以有多个独立分包。独立分包属于分包的一种。普通分包的所有限制都对独立分包有效。独立分包中插件、自定义组件的处理方式同普通分包。**独立分包中不能依赖主包和其他分包中的内容**。在小程序中，不同的分包对应不同的下载单元；因此，除了非独立分包可以依赖主包外，分包之间不能互相使用自定义组件或进行 require。

## 图片加载失败重新加载组件
```
<template>
  <image
    wx:if="{{src}}"
    src="{{url || src}}"
    mode="{{mode}}"
    webp="{{webp}}"
    lazy-load="{{lazyLoad}}"
    show-menu-by-longpress = "{{showMenuByLongPress}}"
    binderror="errHandler"
    bindload="loadHander"
    class="img-preload-wrap"
  />
</template>

<script>
  import { createComponent } from '@mpxjs/core'
  const Omega = getApp().Omega

  createComponent({
    data: {
      url: '',
      requestCount: 0,
      isTry: 0 // 0 不重新请求  1 重新请求
    },
    properties: {
      src: {
        type: String,
        value: ''
      },
      mode: {
        type: String,
        value: 'scaleToFill'
      },
      webp: {
        type: Boolean,
        value: false
      },
      lazyLoad: {
        type: Boolean,
        value: false
      },
      showMenuByLongPress: {
        type: Boolean,
        value: false
      },
      // 以下额外添加的一些功能
      // 是否开启图片加载率分析上报
      imageAnalysis: {
        type: Object,
        value: {
          open: false, // 是否开启图片分析，每次分析都会上报一套omega埋点，请勿批量添加
          tag: '' // 类型标识，会用于分析image的时候
        }
      },
      // 开启在图片加载失败的时候进行一次自动重试操作
      openImageRetry: {
        type: Boolean,
        value: false
      }
    },
    watch: {
      src: {
        handler(val, oldval) {
          if (val && this.imageAnalysis?.open) {
            // 图片链接请求更改，重置状态
            if (oldval) {
              this.url = ''
              this.isTry = 0
              this.requestCount = 0
            }
            this.sendOmegaLog('get')
          }
        },
        immediate: true
      }
    },
    detached() {
      (!this.requestCount && this.src) && this.sendOmegaLog('unload')
    },
    methods: {
      sendOmegaLog(type, e = {}) {
        if (this.imageAnalysis?.open) {
          const maps = {
            get: 'tech_mini_image_data_sw', // 拉取数据
            err: 'tech_mini_image_error_sw', // 图片加载失败
            load: 'tech_mini_image_load_sw', // 加载图片成功
            unload: 'tech_mini_image_unload_sw' // 未执行err和load事件时，触发
          }
          Omega.trackEvent(maps[type], {
            image_src: this.url || this.src,
            tag: this.imageAnalysis?.tag,
            err_msg: e?.detail?.errMsg,
            is_try: this.isTry
          })
        }
      },
      errHandler(e) {
        this.requestCount++
        this.sendOmegaLog('err', e)
        const triggerName = this.isTry ? 'retryError' : 'error'
        this.triggerEvent(triggerName, {
          err: e,
          is_try: this.isTry
        })

        // 请求重试
        if (this.openImageRetry) {
          this.isTry = 1
          this.openImageRetry = false
          this.url = this.src + '?timestamp=' + Date.now()
          this.sendOmegaLog('get')
        }
      },
      loadHander(event) {
        this.requestCount++
        this.triggerEvent('load', event)
        this.sendOmegaLog('load')
      }
    }

  })
</script>

<style lang="stylus" scoped>
  .img-preload-wrap
    height 100%
    width 100%
</style>

```
# mpx转快手
## 背景
Mpx作为一个跨平台编译的工具，支持输出快手小程序为以后业务接入打下基础。
## 方案
mpx将wx作为标准平台和别的平台进行平台差异化抹平，完成跨平台编译实现一份代码输出到多个平台运行。
mpx跨平台编译主要是四部分工作
* api部分 对于不同平台的api抹平。
* template部分 对于不同平台模版指令和组件属性部分。
* json部分 对于不同平台环境文件引入的差异处理和不同平台json配置项的差异处理
* js部分 对于运行时js调用的api和创建组件和页面实例时的生命周期以及options配置的差异处理
## mpx跨平台编译的流程
如下图所示，mpx在跨平台编译的时候，在分别编译template和json时，根据getRulesRunner获取到配置在platform文件夹下的不同平台配置。runtime时做的创建页面和创建组件时的api抹平操作。
## 我主要的工作
* runtime js 根据快手平台的指令规则适配指令名称。
* template 适配微信组件支持但是快手平台不支持的属性，在用户使用时添加warning。
* json 以及编译时在快手环境下引入文件做的差异抹平操作。

## 问题
     在快手app.json中不支持绝对路径，因此在require文件的时候判断一下是快手的app环境加入一个query noPublicPath字段区分资源，如果是快手的app环境则编译出没有绝对路径的资源，如果是别的情况则是绝对路径的资源。这样达到两个部分引入相同资源可以同样有效的结果。
收获

# 滴滴出行小程序改造原子类样式减少包体积
## 背景
    滴滴出行小程序承载了越来越多的功能。包体积不断增大，微信严格限制小程序总体积不能超过30M。css的语义化样式会导致样式体积有很大的冗余，原子类样式将样式拆分，有效的减少了冗余样式。减少包体积可以减少分包加载时间，在异步分包加载的场景下可以更加优化用户体验，同时写原子类样式也可以规范css书写。原子类将样式代码拆分细化，因此相同样式无需写多次重复代码。每个分包下甚至是主包下共用一个样式即可。将分包和主包重复的样式根据自定义权重提取到主包下，各个分包独有的样式提取到分包下可以有效的减少样式冗余。
## 难点
* 1.对于滴滴出行小程序包含这么多分包并且还有第三方业务分包的小程序，如何做到一个分包样式改造成原子类样式，但是不影响其他分包样式的正确书写？达到渐进式改造样式的目的。
* 2.如何将原子类进一步整合，减少样式体积。原子类太多影响模版的可阅读性，并且某几个原子类经常一起使用。多写几个就增加了一部分代码体积，如何减少这部分的体积？
* 3.对于重构成原子类样式之后的各个分包中存在大量相同的原子类样式，怎么进一步减少他们的体积？
* 4.多个分包都要进行原子类样式改造，如何提升生成原子类样式代码速度。提升开发体验？
## 方案
选择windicss 因为unocss在构建过程中会改变代码和mpx不兼容所以pass tailwind由于实现原子类的方法导致构建速度慢、并且没有windicss可以监听配置文件热更新的功能，除此之外windicss还有一些apply插件和shortcuts的特性可以进一步减少代码体积

### 难点一的解决方案：渐进式处理项目的样式变为原子类样式的核心有两点
* windicss提供了生产优化配置项可以只处理指定分包文件下的样式，不会影响其他分包样式。
* 对mpx打包编译后的文件做处理，可以达到改造node_modlues中的第三方业务代码也为原子类样式的目的。
### 难点二的解决方案：如何将原子类进一步整合，减少代码体积，提升模版可阅读性
* 1.对于background，textColor，fontfamily，可以在预设文件中自定义名称，实现在原子类基础上的扩展样式
* 比如display:flex和align-items center可以组合成公共样式 使用windicss提供的@apply方法或者windicss的shortcuts配置可进一步组合样式代码，减少代码体积和模版可阅读性
### 难点三的解决方案：进一步减少包体积，需要提取各个分包下的原子类样式到主包下
* 按照一定的规则提取公共样式到主包和各个分包可以进一步减少包体积，此动作发生在生成原子类样式之后。在生成原子类样式之后配置一些提取样式的规则。达到科学合理的进一步减少包体积。
* 因为主包的样式的代码可以被各个分包引用的条件下，将各个分包的公共样式提取到主包下，可以进一步科学合理的减少包体积
### 难点四的解决方案：对多个分包分别开启子进程进行代码编译运行
* 收集配置要改造的分包，然后分别开启原子类改造编译子进程，并且采用tailwind的衍生版本windicss可以大大提高代码编译速度


### mp-common-class cli工具如何提取公共样式介绍
难点一：支持公共样式的多种提取方式       编写postcss插件实现对mpx编译后样式样式代码进行扫描，达到和使用各种css预编译样式没有冲突的效果，根据不同的cli配置参数，置顶合理的分包样式代码提取方案。
* 1.如果只重构了主包的样式就只提取主包的公共样式
* 2.如果只传了重构分包样式的参数没有传提取的部分分包数组，则默认为提取所有分包样式
* 3.如果只传了主包和提取分包的样式，那么就提取主包和全部分包样式
* 4.如果传了主包和部分分包数组，那么就会提取主包和部分分包样式
* 5.如果没有传提取主包样式参数但是传了部分分包数组，那么就会提取部分分包数组样式
难点二：支持根据权重提取公共样式代码       编写postcss插件实现收集样式代码重复的次数，将满足权重的公共样式提取出来，新建公共样式文件，在各个文件中引入公共样式文件，并且在原有样式文件中删除公共样式
￼
结果
    测试在14个文件同时拥有23个相同的原子类样式的情况下，样式体积由原来的8.5k减少到1.06k。模版文件体积增大1.3k。综合样式体积减少了70%+。目前个人中心分包正在改造中。

## 原子类样式在落地过程中方案的不断优化过程
1.小程序有分包多个入口概念 不同于 web项目单一项目入口，

2.我们项目中以node_modules第三方包的方式接入了很多不同业务方的分包代码，不同团队如何互不影响的改造原子类样式。并且不同团队可以维护属于各自的config配置文件。

### 多个分包代码多个进程一起编译减少编译时间
先尝试改造一个分包看一下初步效果，通过配置windicss的按需编译入口扫描需要编译的文件输出原子类样式。在多个分包编译时可以开启多个子进程达到多个分包并行执行原子类样式编译

### 原子类样式无形中增加了template模版体积，如何进一步减少样式体积
分包中众多公共样式可以提取到主包中进一步缩小代码总体积，设计一个postcss插件工具解决，具体流程如下。简单介绍下，根据配置的编译文件入口设定不同的公共样式收集规则，比如 配置了主包和多个分包，就将公共样式提取到主包下，只配置了分包入口的话，只将分包文件下的公共样式打包到分包下的公共文件 

### node_modules方式引入的第三方业务包如何参与改造原子类样式
正常代码中文件嵌套结构复杂没有统一的规范目录，在编译过程中识别分包下资源文件难处理，对dist分包下的文件做处理，目录规范，分包明确。最终解决方案如下，分为两步 1.将原子类样式编译出 2.执行提取公共样式的命令

### 分包样式改造和提取公共样式割裂为两个步骤，并且每次编译都要扫描增加编译时间，降低开发体验
使用npm的方式处理分包样式虽然能满足我们的业务需求但是存在扫描两次代码的缺点。扫描样式之后已经可以掌握所有的公共样式，在输出到各个分包样式之前可以提取公共样式，然后再输出到各个分包中，使用webpack插件未来预计可以利用缓存机制减少开发编译时间。

### 多个团队改造，每个团队如何维护属于不同团队的配置文件
鉴于每个业务有着属于自己业务特定的样式和常用规范。比如常用margin-top 15px之类。因为不同业务配置文件会不相同。此外每个团队维护属于自己团队的配置文件，不同团队开发过程中也不会受其他团队的影响。在配置平台上配置文件，插件会拉取平台配置文件 配置平台 http://promise.intra.xiaojukeji.com/promise#/team/fgBEdy7Cn/project/I7317ciMe/bisheng 配置文件名称需要以分包命名。格式化json工具 https://tool.chinaz.com/tools/jsonformat.aspx。webpack插件内部会根据不同的分包拉区配置平台上不同的配置文件
# 业务接口参数校验
## 背景
线上出现过因为参数漏传而导致的事故，因此参数校验尤为重要。期望有一个统一参数校验功能，通过mpx-fetch可以做到收敛参数校验的工作。因此对mpx-fetch添加参数校验功能。
## 难点
1.如何自定义处理校验错误的结果。(callback实现)
* 可以选择多种处理错误的方式，比如弹窗告警或者阻断请求的发出。
2.对于特殊场景的参数校验，保持请求匹配和参数校验的灵活性。
* 可使用mpx-fetch内置校验规则和请求匹配规则，同时也可以根据用户需求灵活转换。
3.对于常规场景，如何提供完善的校验规则，提示信息详细。
* 支持配置多种校验方式校验不同情况的参数，比如必传校验，枚举类型校验，any类型不校验。
* 支持一个参数值可以是多种类型的校验规则配置。
* 支持不校验所有参数只校验部分参数的功能。
* 支持精准校验参数，比如行程中某个参数变化之后，另一个参数值随之变化成另一个值。(通过传一个函数实现)

## 方案
    在发出接口请求之后，根据配置的校验文件查看是否有相关校验规则匹配该接口。匹配之后通过校验规则校验接口参数，若有错误则通过用户传入配置的自定义函数处理错误信息。比如用户拿到错误后弹窗显示错误信息。
  
￼
### 请求匹配规则
#### 使用自定义请求匹配函数
* 支持使用者自定义接口匹配函数，使用者可以传一个自定义函数，函数的参数是发出请求的信息，可以使用信息在函数内部做一些自定义配置来匹配请求
#### 使用内置请求匹配规则
* 匹配接口的协议、域名、端口、path、请求方式、header、data、params等
* 没有传的条件默认是true，只匹配配置的条件是否匹配
### 参数校验规则
#### 使用自定义参数校验函数
* 支持传入自定义参数校验函数，透传请求信息到用户自定义处理函数中，用户可用自定义函数定制参数校验规则。使用内置参数校验规则

# CI-CD流程自动发送错误信息通知
## 背景
各个业务方向新来的同学在每周合并代码时，或多或少都会遇到各种各样的错误，但是不知道如何正确解决问题。所以在此基础上增加了这些特殊错误提示通过dc消息给到每个合并代码的同学
## 难点
* bash脚本在机器构建的过程中，如何收集错误并且单独发送给分支构建人错误信息以及解决方法。
* 如何做到单独发送dc通知到某个分支的构建人，
* 并且可以提供详细的错误信息提供解决错误的链接，减少值班人和新同事的疑惑。
## 方案
主要分为收集不同类型的错误以及发送通知两部分
* 难点一的解决方案：在脚本执行不同的构建命令时会抛出不同的错误码，收集错误建立一个和错误码对应的消息提示map。
* 难点二的解决方案：调研dc服务的类型，将信息发送给分支构建人，并且在消息中配置相关修改错误的文件便于构建人修改错误。

# Mpx-jest编译优化与代码覆盖率如何实现的调研
## 1.引入swc/jest进行编译
* 背景：小程序代码众多，编译速度慢。将基于babel编译转化成基于swc编译。swc的出现就是为了替换babel，因此babel的功能swc都支持，并且swc基于rust语言编写，rust语言更接近机器语言执行更快。兼容webpack环境的require.context方法的实现在jest环境下setup环境初始化的global对象中写require，(require.context 是webpack的一个api，通过执行require.context()函数，来获取指定的文件夹内的特定文件)
```
global.require2 = {
  context: (base = '.', scanSubDirectories = false, regularExpression = /\.js$/) => {
    const files = {}
    function readDirectory(directory) {
      // 读取该目录下所有file文件和包含子目录
      fs.readdirSync(directory).forEach((file) => {
        const fullPath = path.resolve(directory, file)
        if (fs.statSync(fullPath).isDirectory()) {
          if (scanSubDirectories) readDirectory(fullPath) // 递归找到子目录下所有文件
          return
        }
        if (!regularExpression.test(fullPath)) return // 找到js文件不是js文件返回
        const fileName = fullPath.split('/')[fullPath.split('/').length - 1]
        files[fileName] = true
      })
    }
    readDirectory(path.resolve(__dirname, '../src/' + base))
    function Module(file) {
      const myFile = path.resolve(__dirname, '../src/' + base, file)
      return fs.readFileSync(myFile, 'UTF-8')
    }
    Module.keys = () => Object.keys(files)
    return Module
  }
}
```
* 结果：测试代码速度从40s提升到20s。

## 2.写单测遇到的问题
* 背景：因为jest是在node环境中编译，在项目代码中没有webpack提供的require.context方法，所以在jest运行单测的时候就会报错，
* 结果：在jest的config中建立一个全局require.context方法模拟webpack的require.context方法来搜索文件。

3.调研jest覆盖率，提升mpx测试代码覆盖率的准确性
* 背景：在查看单测的代码覆盖率时发现，mpx的代码代码覆盖率都是100%但这并不是测试代码的真实代码覆盖率，探究其原因，提高单测覆盖率的准确性，并且分享如何写代码提升代码单测覆盖率，比如能写if语句就不写map方法取值判断，分享istanbul如何使用插值的方法实现代码覆盖率的计算
* 结果： 覆盖率百分之百的原因是因为mpx编译后的文件js代码为字符串，jest使用istanbul统计代码覆盖率，istanbul识别整个代码为一个代码块，所以代码块只要执行，整个js代码的覆盖率就是100%，了解到问题之后，采用将代码编译成可以执行的一个function代码，istanbul可以正确识别代码中的声明语句与block语句。完成测试代码插槽统计代码覆盖率。处理mpx编译后的代码是一个自执行function解决这个问题