// import { createComponent } from '@mpxjs/core'
// import { getWindowHeight } from 'common/js/util'
// import estimateOmega from 'common/js/estimateOmega'
import mpx, { getMixin } from '@didi/mpx'
// const eventBus = getApp().eventBus
const prefix = 'common_mixin'
/**
 * @rawOptions onAppShow 从后台切前台触发方法
 */
const getAppMixin = (type = 'show', isPage = false) => {
  const [onready, onunload] = isPage ? ['onReady', 'onUnload'] : ['ready', 'detached']
  const registName = `${prefix}_on_app_${type}_fn`
  const onApp = type === 'show' ? 'onAppShow' : 'onAppHide'
  const offApp = type === 'show' ? 'offAppShow' : 'offAppHide'
  return getMixin({
    [onready]() {
      // 切到后台时关闭
      const that = this
      this[registName] = (data) => {
        // 支付宝这个方法目前拿不到path，已反馈，暂时兼容下
        if (data && !data.path) {
          // 没有的情况走页面栈
          const pageInstance = getCurrentPages()
          // 防止首次启动拿不到
          data.path = pageInstance?.[pageInstance.length - 1]?.route
        }
        if (isPage) that[onApp]?.(data)
        else that.$rawOptions[onApp]?.call(that, data)
      }
      mpx[onApp](this[registName])
    },
    [onunload]() {
      mpx[offApp](this[registName])
    }
  })
}
/**
 * 用于组件
 * @rawOptions onAppShow 从后台切前台触发方法
 */
export const onAppShowMixin = getAppMixin('show')
/**
 * 用于组件
 * @rawOptions onAppHide 从前台切后台触发方法
 */
export const onAppHideMixin = getAppMixin('hide')
/**
 * 用于页面
 * @rawOptions onAppShow 从后台切前台触发方法
 */
export const pageOnAppShowMixin = getAppMixin('show', true)
/**
 * 用于页面
 * @rawOptions onAppHide 从前台切后台触发方法
 */
export const pageOnAppHideMixin = getAppMixin('hide', true)

