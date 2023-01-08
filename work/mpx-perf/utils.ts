
/** 获取当前页面, 返回undefind时说明在onLaunch或之前调用 */
export const getCurrentPage = () => {
    return getCurrentPages().slice(-1)[0] || {} as WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject>
  }
  
  
  /**
   * 方法装饰器，根据编译环境禁用方法
   * @param value 是否需要被block掉
   */
   export function blockByMode() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (__mpx_mode__ !== 'wx') {
        descriptor.value = () => {
          console.warn(`mpx-performance 在 ${__mpx_mode__} 中暂不支持「${propertyKey}」方法`)
        }
      }
    }
  }
  
  /**
   * 从 Map 数据中获取并删除一个数据
   */
  export const pickFromMap = <K, T>(map: Map<K, T>, key: K) => {
    const result = map.get(key)
    map.delete(key)
    return result
  }
  
  /**
   * Array.prototype.findLast 兼容性不好，这里自己polyfill一下
   * @param arr 要查询的数组
   * @param compare 比较函数
   */
  export const findLast = <T extends any>(arr: T[], compare: (item: T, index: number, obj: T[]) => any): T | undefined => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (compare(arr[i], i, arr)) return arr[i]
    }
  }
  
  /**
   * 用来根据key做Promise缓存，如果是相同的key就返回同一个promise
   * @returns 缓存 Promise 的函数
   */
  // export const cachePromise = () => {
  //   const promiseMap = new Map<string, Promise<any>>
  //   return function (key: string, p?: Promise<any>) {
  //     if(p) promiseMap.set(key, p)
  //     return promiseMap.get(key)
  //   }
  // }
  
  // export const createPromise = <T>() => {
  //   let resolve: (e: T) => any = () => {}
  //   let reject: (e: any) => any = () => {}
  //   let promise = new Promise<T>((res, rej) => {
  //     resolve = res
  //     reject = rej
  //   })
  //   return {
  //     promise,
  //     resolve,
  //     reject
  //   }
  // }
  