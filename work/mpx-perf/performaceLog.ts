import { EventBus } from "./eventCenter"
import { blockByMode, findLast, getCurrentPage, pickFromMap } from "./utils"

export interface IRouteInfo {
  path?: string
  info?: string
  desc?: string
  start?: number
  context?: any
}

interface IRouteStart extends IRouteInfo {
  type?: 'route' | 'appLaunch'
  start_time?: number
  referrer?: string
}

interface ILogData {
  key: string
  info: string
  desc?: string
  duration: number
  start: number
  path: string
}

interface IStartData {
  type: 'route' | 'appLaunch' | 'time' | 'virtualRoute'
  start_info: string
  start_time: number
  referrer: string
  path: string
  pageId?: string
}

// 系统内置信息info类型
export type SysInfo = `sys_${string}`


export interface IPerfData {
  // todo 添加 start_info 用户调用start方法添加的标识
  id: string // 在默认的route信息中为空字符串 end info
  pageId?: string // id 为 sys_ready 时存在
  start_time: number
  referrer: string
  is_first: 0 | 1
  /** 
   * appLaunch：拉起小程序
   * route： 路由跳转
   * virtualRoute ：虚拟路由跳转，用户route方式方式调用
   * time：自定义起点，用户time方式调用
   */
  type: 'route' | 'appLaunch' | 'time' | 'virtualRoute' // start msg
  start_info: string
  end_info: SysInfo | string
  path: string
  duration: number
  logs: ILogData[]
}

/** wx 原生性能数据 */
interface PerformanceEntry extends WechatMiniprogram.PerformanceEntry { }

/** MpxPerformance配置 */
export interface IOptions {
  timeout: number
  maxDuration: number
}

/**
 * 根据页面或者组件实例返回对应的pageId
 * @param e 页面实例
 * @returns pageId
 */
const getPageIdByIns = (e?: { getPageId(): string, $page: { mpxCid: number }, mpxCid: number } | string) => {
  if (typeof e === 'string') return e // 当传入path时，直接当作id返回
  const path = getCurrentPage().route // 兜底数据，如果没有传入信息或者获取pageid失败则使用 path 作为判断依据
  if (__mpx_mode__ === 'wx') {
    return e?.getPageId() || path
  }
  if (__mpx_mode__ === 'ali') {
    let cid = e?.$page ? e.$page.mpxCid : e?.mpxCid
    return typeof cid === 'number' ? `pageId:${cid}` : path
  }
  return path
}

/**
 * 根据性能数据创建logs
 */
const createLog = (path = '', ...perfs: (PerformanceEntry | undefined | false)[]) => (perfs.filter(p => !!p) as PerformanceEntry[]).map(p => ({
  key: 'route',
  info: 'sys_' + p.name + '_' + (p.packageName || p.moduleName || ''),
  path,
  duration: p.duration,
  start: p.startTime
} as ILogData))



export class MpxPerformance {
  /** wx 内置性能列表 */
  private originList: PerformanceEntry[] = [] // launch & route 信息
  private loadPackageMap = new Map<string, PerformanceEntry>() // loadPackage 性能信息
  private evaluateScriptMap = new Map<string, PerformanceEntry>() // evaluateScript 性能信息
  private isLaunching = true // 是否启动中，用于做首节点统计标识
  /** 启动Log，用户在页面实例还未创建时使用 routeLog 进行记录时，记录的logs会存在这个变量中 */
  private launchLogs: ILogData[] = []
  /** 起点信息 */
  private startList: IStartData[] = []
  /** 用于记录startData的消费情况，避免重复触发routeEnd */
  private startWeakCache = new WeakSet<IStartData>()
  /** 临时数据存放 */
  private perfTempLogMap = new Map<string, ILogData[]>()
  /** time log 信息 */
  private timeMap = new Map<string, ILogData[]>()
  /** 产出信息 */
  private perfDataList: IPerfData[] = []
  /** 记录是否是首次访问的性能节点集合 */
  private firstMettingSet = new Set<string>()
  /** 内置订阅发布事件 */
  private bus = new EventBus()
  private timeout = 3000
  private maxDuration = Infinity
  constructor() {
    this.initPerformance()
  }
  /**
   * 配置更新
   */
  setOptions(opt: Partial<IOptions> = {}) {
    if (opt.timeout) this.timeout = opt.timeout
    if (opt.maxDuration) this.maxDuration = opt.maxDuration
  }
  /**
   * 初始化方法，监听微信性能数据
   */
  @blockByMode()
  private initPerformance() {
    const performance = wx.getPerformance()
    const observer = performance.createObserver(entryList => {
      const entreis: PerformanceEntry[] = entryList.getEntries()
      entreis.filter(e => ['loadPackage', 'script'].includes(e.entryType)).forEach(e => {
        // 只收集有 packageName 和 moduleName的信息，也可以理解为忽略异步分包加载的信息。
        // @ts-ignore 微信类型有问题
        if (e.entryType === 'loadPackage' && e.packageName) this.loadPackageMap.set(e.packageName.replace(/^\/?/, ''), e); // 开发者工具中有时候前面不带 / 号，这里统一去掉
        // @ts-ignore 微信类型有问题
        if (e.entryType === 'script' && e.moduleName) this.evaluateScriptMap.set(e.moduleName.replace(/^\/?/, ''), e)
      })
      // 这里针对每一个entries做单独操作，如果返回多个则多次触发
      entreis.filter(e => e.navigationType !== "navigateBack" && e.entryType === 'navigation').forEach(e => {
        // 记录新页面信息
        this.originList.push(e)
        const startData: IRouteStart = { // 记录起点
          type: e.name as IRouteStart['type'],
          start_time: e.startTime,
          // @ts-ignore 微信类型有问题
          referrer: e.referrerPath || '',
          path: e.path
        }
        this.route(startData)
      })
    })
    // @ts-ignore 这里微信的类型有问题，先ignore掉
    observer.observe({ entryTypes: ['navigation', 'loadPackage', 'script'] })
  }
  /** 
   * 添加单次限时监听
   * 主要用于在用户使用routeLog进行打点时，根结点数据还未从wx.getPerformace API返回的问题。
   */
  private addLimitedListener(evt: '__perf__' | '__ready__', fn: AnyFunction, timeoutFn: AnyFunction) {
    this.bus.once(evt, fn)
    setTimeout(() => {
      this.bus.remove(evt, fn)
      timeoutFn()
    }, this.timeout) // 超时自动解除监听
  }
  /**
   * 根据当前路径或者pageId获取对应的起点性能信息
   * @param pathOrId 当前页面path
   */
  private getCurrentRoute(pathOrId: string, isSys = false) {
    const list = isSys ? this.getSysList() : this.getReadyList()
    const popData = list.slice(-1)[0] // 取最新的一个数据
    // 不存在数据或者是数据path和当前path不匹配时，我们认为performance还未返回，添加监听异步返回
    if (!popData || (isSys ? popData.pageId || popData.path !== pathOrId : popData.pageId !== pathOrId)) {
      return new Promise<IStartData>((resolve, reject) => {
        // 未查询到则认为是还在异步返回中，添加监听
        this.addLimitedListener(isSys ? '__perf__' : '__ready__', e => {
          // 系统内置则判断 path，用户设置则判断 pageId
          if (isSys ? e.path === pathOrId : e.pageId === pathOrId) resolve(e) // 新返回的数据path和当前path对应时，则认为是正常返回
          else console.warn(`栈顶页面[${isSys ? '路径' + e.path : '标识' + e.pageId}]与当值[${pathOrId}]不匹配`)
        }, reject.bind(null, '超时未获取到最新页面信息')) // 超时也抛出异常
      })
    }
    return popData // 找到了则直接返回
  }

  /** 获取系统起点数据 */
  private getSysList() {
    return this.startList.filter(e => e.type !== 'virtualRoute') // 忽略掉用户手动调用的 route 节点
  }
  /** 获取系统已装载好的起点数据 */
  private getReadyList() {
    return this.startList.filter(e => !!e.pageId) // 当pageId未被设定时说明页面还未 ready
  }

  /**
   * 调用该方法可以自定义一个虚拟的路由起点
   * @param start 起点信息
   */
  @blockByMode()
  route(start: IRouteStart = {}) {
    const startData: IStartData = { // 记录起点
      type: start.type || 'virtualRoute',
      start_info: start.info || '',
      start_time: start.start_time || Date.now(),
      referrer: start.referrer || '',
      path: start.path || getCurrentPage().route
    }
    // 如果是用户自己调用的 route，则认为已填充实例，直接设置好pageId
    if (startData.type === 'virtualRoute') this.setPageId(startData, getPageIdByIns(start.context || start.path))
    this.startList.push(startData)
    // 触发 ready 监听器
    this.bus.emitOne('__perf__', startData) // 通过emitOne方法触发，当同时返回多个entries时，同时也监听了多个__perf__返回时，可一一触发。
  }
  /**
   * 记录路由相关的节点性能信息
   * @param routeInfo 路由节点信息
   */
  @blockByMode()
  routeLog({ desc = '', info = '', start = 0, context, path }: IRouteInfo = {}) {
    const curPath = context?.route || path || getCurrentPage().route
    const pageId = getPageIdByIns(context || path)
    const log: ILogData = {
      key: 'route',
      desc,
      info,
      path: curPath || '',
      duration: Date.now(), // 先初始化当前时间
      start
    }
    if (this.isLaunching) {
      this.launchLogs.push(log)
    } else {
      this.perfTempLogMap.has(pageId)
        ? this.perfTempLogMap.get(pageId)!.push(log)
        : this.perfTempLogMap.set(pageId, [log])
    }
  }

  /**
   * 结束路由节点并记录，生成性能信息
   * @param id 唯一路由标识，可不传
   * @param routeInfo 路由节点信息
   */
  async routeEnd(id: string, routeInfo?: IRouteInfo, isSys?: boolean): Promise<IPerfData | undefined>
  async routeEnd(routeInfo?: IRouteInfo, isSys?: boolean): Promise<IPerfData | undefined>
  @blockByMode()
  async routeEnd(...args: any[]) {
    /** 参数处理逻辑 */
    let [x = "", y = {}, isSys = false] = args as [string | IRouteInfo, IRouteInfo | boolean, boolean]
    let id = x as string, routeInfo = y as IRouteInfo
    if (typeof x !== 'string') {
      if (typeof y === 'boolean') isSys = y
      routeInfo = x
      id = ''
    }
    /** 参数处理逻辑结束 */
    if (isSys) return await this.readyEnd(routeInfo)
    const curPath = routeInfo.context?.route || routeInfo.path || getCurrentPage().route // 获取当前路径
    const is_first = this.isFirst(id + curPath)
    const pageId = getPageIdByIns(routeInfo.context || routeInfo.path)
    this.routeLog(routeInfo) // 添加log信息
    const now = Date.now()
    const logs = this.perfTempLogMap.get(pageId) || [] // 获取所有logs
    try {
      const startData = await this.getCurrentRoute(pageId) // 通过path获取当前性能信息
      if (this.startWeakCache.has(startData)) throw `此页面routeEnd已被调用过，请检查routeEnd的调用次数。`
      this.startWeakCache.add(startData)
      // 获取系统性能数据中的 logs 拼接在用户性能信息中
      const sysLogs = findLast(this.perfDataList, e => e.pageId === pageId)?.logs || []
      logs.forEach(log => log.duration -= startData.start_time) // 计算duration
      const perfData: IPerfData = {
        id,
        is_first,
        start_time: startData.start_time,
        referrer: startData.referrer,
        type: startData.type,
        start_info: startData.start_info,
        end_info: routeInfo.info || '',
        path: startData.path,
        duration: now - startData.start_time,
        logs: [...sysLogs, ...logs]
      }
      // 触发routeEnd时，删除缓存过的信息
      this.perfTempLogMap.delete(pageId)
      this.innerTrigger(perfData)
      return perfData
    } catch (err) {
      console.error(err)
      this.perfTempLogMap.delete(pageId)
    }
  }
  /** 内置方法，记录默认的ready节点信息 */
  private async readyEnd({ desc = '', info = '', context }: IRouteInfo = {}) {
    const curPath = context.route || ''
    const is_first = this.isFirst('sys_ready' + curPath)
    const logs: ILogData[] = [...this.launchLogs, {
      key: 'route',
      desc,
      info,
      path: curPath,
      duration: Date.now(), // 先初始化当前时间
      start: 0
    }]
    try {
      const startData = await this.getCurrentRoute(curPath, true) // 通过path获取当前性能信息
      // 主包
      let main = this.isLaunching && pickFromMap(this.loadPackageMap, '__APP__')
      let mainScript = this.isLaunching && pickFromMap(this.evaluateScriptMap, '__APP__')
      // 正则含义：第一步，首位去掉 / 号，之后匹配形如 xxx/ 内容。待确定，分包root是否可以包含 / 字符，如果包含，则需改用 startWith 方法进行判断。
      const packName = curPath.replace(/^\/?/, '').replace(/^(.*?\/).*$/, '$1')
      // 分包
      let pack = pickFromMap(this.loadPackageMap, packName)
      let packScript = pickFromMap(this.evaluateScriptMap, packName)
      const packLoadLog = createLog(curPath, main, pack, mainScript, packScript) // 根据原始性能数据创建 logs 
      logs.forEach(log => log.duration -= startData.start_time) // 计算duration
      packLoadLog.forEach(l => l.start -= startData.start_time) // 由于duration已从性能数据中获得，这里只需要处理start信息
      const pageId = getPageIdByIns(context)
      const perfData: IPerfData = {
        id: 'sys_ready',
        pageId,
        is_first,
        start_time: startData.start_time,
        referrer: startData.referrer,
        type: startData.type,
        start_info: startData.start_info,
        end_info: '',
        path: startData.path,
        duration: logs.slice(-1)[0].duration,
        logs: [...packLoadLog, ...logs]
      }
      this.setPageId(startData, pageId) // 这里不传path是因为ready为内部实现，context是必传的
      this.innerTrigger(perfData)
      this.isLaunching = false // 启动收集至此结束
      this.launchLogs = [] // 启动收集至此结束
      this.bus.emit('__ready__', startData)
      return perfData
    } catch (err) {
      console.error(err)
    }
  }
  private setPageId(start: IStartData, id: string) {
    start.pageId = id
  }
  /**
   * 创建时间性能数据记录起点，后续可通过 timeLog 和 timeEnd 方法补充性能信息
   * @param key 时间统计节点的唯一标识
   * @param routeInfo 当前节点信息
   */
  time(key: string, { desc = '', info = '' }: IRouteInfo = {}) {
    const curPath = getCurrentPage().route
    this.timeMap.set(key, [{
      key,
      duration: Date.now(),
      start: 0,
      desc,
      info,
      path: curPath
    }])
  }
  /**
   * 记录时间节点信息，想要产生最终数据结果，必须通过调用 timeEnd 方法来结束记录
   * @param key 时间统计节点的唯一标识
   * @param routeInfo 当前节点信息
   */
  timeLog(key: string, { desc = '', info = '', start = 0 }: IRouteInfo = {}) {
    if (!this.timeMap.has(key)) return
    const timeData = this.timeMap.get(key)!
    const curPath = getCurrentPage().route
    const log: ILogData = {
      key,
      desc,
      info,
      path: curPath || '',
      duration: Date.now(), // 先初始化当前时间
      start
    }
    timeData.push(log)
  }
  /**
   * 结束时间性能统计操作，必须有与之对应的 time 方法执行时的 key 才能正确记录，否则数据将会被丢弃
   * @param key 时间统计节点的唯一标识
   * @param routeInfo 当前节点信息
   */
  timeEnd(key: string, { desc = '', info = '' }: IRouteInfo = {}): IPerfData | void {
    const is_first = this.isFirst(key)
    // todo 处理方式和route保持一致
    this.timeLog(key, { desc, info })
    const timeLogs = this.timeMap.get(key)!
    if (!timeLogs) return
    const startInfo = timeLogs.shift()!
    const perfData: IPerfData = {
      id: key,
      is_first,
      start_time: startInfo.duration,
      referrer: '',
      type: 'time',
      start_info: startInfo.info,
      end_info: info,
      path: startInfo.path,
      duration: Date.now() - startInfo.duration,
      logs: timeLogs.map(l => {
        l.duration -= startInfo.duration
        return l
      })
    }
    this.timeMap.delete(key) // 记录结束后清除map中的log信息
    this.innerTrigger(perfData)
    return perfData
  }
  /** 内部记录性能统计信息是否是首次统计 */
  private isFirst(id: string) {
    const first = !this.firstMettingSet.has(id)
    this.firstMettingSet.add(id)
    return Number(first) as 0 | 1
  }
  /**
   * 获取性能统计信息
   */
  getPerformanceDataLists({ id, type, start_info, end_info }: Partial<{
    id: string
    type: IStartData['type']
    start_info: string
    end_info: string
  }> = {}): IPerfData[] {
    return this.perfDataList.filter(p => (!id || p.id === id)
      && (!type || p.type === type)
      && (!start_info || p.start_info === start_info)
      && (!end_info || p.end_info === end_info)
    )
  }
  /**
   * 获取 start list 信息
   */
  @blockByMode()
  getStartLists({ type, start_info }: Partial<{
    type: IStartData['type']
    start_info: string
  }> = {}): IStartData[] {
    return this.startList.filter(s => (!type || type === s.type) && (!start_info || start_info === s.start_info))
  }
  /**
   * 监听性能数据的生产
   * @param fn 回调函数，当产生新的性能数据时会触发，并携带性能数据作为参数
   * @returns 结束监听的函数
   */
  observe(fn: (perf: IPerfData) => any) {
    this.bus.on('__observe__', fn)
    return () => this.bus.remove('__observe__', fn)
  }
  private innerTrigger(perfData: IPerfData) {
    // 最后一步处理，过滤掉不合法的 duration 信息
    perfData.logs = perfData.logs.filter(l => l.duration + l.start >= 0 && l.duration + l.start < this.maxDuration)
    this.perfDataList.push(perfData)
    this.bus.emit('__observe__', perfData)
  }
}
