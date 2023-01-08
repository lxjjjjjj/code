export class EventBus {
    private listenerMap: Record<string, AnyFunction[]> = {}
    on(name: string, fn: AnyFunction) {
      if (this.listenerMap[name]) {
        this.listenerMap[name].push(fn)
      } else {
        this.listenerMap[name] = [fn]
      }
    }
    /** 绑定单次消费事件 */
    once(name: string, fn: AnyFunction) {
      const f = (...args: any[]) => {
        fn(...args)
        this.remove(name, f)
      }
      this.on(name, f)
    }
    emit(name: string, ...args: any[]) {
      this.listenerMap[name]?.forEach(fn => fn(...args))
    }
    /**
     * 单次触发事件，期望通过once多次绑定的事件按顺序一一执行，不期望一同执行.
     * 对于其他事件，默认只执行第一个，但该设计实际上使用场景仅限于once绑定的事件，其他场景意义不大。
     * 如：
     * once(A, 1)
     * once(A, 2) // 重复绑定A
     * emitOne(A) // trigger 1
     * emitOne(A) // trigger 2
     * 但是：
     * emit(A) // trigger 1 & 2
    */
    emitOne(name: string, ...args: any[]) {
      this.listenerMap[name]?.[0]?.(...args)
    }
    remove(name: string, fn: AnyFunction) {
      const fns = this.listenerMap[name] || []
      const idx = fns.findIndex(f => f === fn)
      idx > -1 && fns.splice(idx, 1)
    }
    clear(name?: string) {
      if (name) {
        delete this.listenerMap[name]
      } else {
        this.listenerMap = {}
      }
    }
  }