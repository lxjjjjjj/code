import mpx from '@mpxjs/core'
import { IOptions, IPerfData, IRouteInfo, MpxPerformance, SysInfo } from './mpxPerformance'

declare module '@mpxjs/core' {
  interface Mpx {
    performance: MpxPerformance
  }
  interface MpxComponentIns {
    $performance: MpxPerformance
    $route(start?: IRouteInfo): void
    $routeLog(routeInfo?: IRouteInfo): void
    $routeEnd(id: string, routeInfo?: IRouteInfo): Promise<IPerfData | undefined>
    $routeEnd(routeInfo?: IRouteInfo): Promise<IPerfData | undefined>
  }
}

export const mpxPerformance = new MpxPerformance()

mpx.mixin({
  onReady() {
    mpxPerformance.routeEnd({
      context: this,
      info: 'sys_ready' as SysInfo,
      desc: '页面自动收集的ready性能统计'
    }, true)
  }
}, 'page')

let installed = false
export default function install(mpx: any, opt: Partial<IOptions> = {}) {
  if (installed) return
  installed = true
  mpxPerformance.setOptions(opt)
  Object.defineProperty(mpx.prototype, '$performance', {
    get() {
      return mpxPerformance
    }
  })
  // add $route $routeLog $routeEnd
  mpx.prototype.$route = function (routeInfo: IRouteInfo = {}) {
    return mpxPerformance.route({ ...routeInfo, context: this })
  }
  mpx.prototype.$routeLog = function (routeInfo: IRouteInfo = {}) {
    return mpxPerformance.routeLog({ ...routeInfo, context: this })
  }
  mpx.prototype.$routeEnd = function (...args: any[]) {
    return typeof args[0] === 'string'
      ? mpxPerformance.routeEnd(args[0], { ...(args[1] || {}), context: this })
      : mpxPerformance.routeEnd({ ...(args[0] || {}), context: this })
  }
  mpx.performance = mpxPerformance
}
