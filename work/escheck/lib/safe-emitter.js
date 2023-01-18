/**
 * mpx-es-check 事件监听处理
 * @author Black
 */

 module.exports = () => {
    const listeners = Object.create(null)
    // Object.freeze()静态方法冻结一个对象。冻结对象会阻止扩展并使现有属性不可写和不可配置。
    // 无法再更改冻结对象：无法添加新属性，无法删除现有属性，
    // 无法更改其可枚举性、可配置性、可写性或值，并且无法重新分配对象的原型。freeze()返回传入的相同对象。
    return Object.freeze({
      on (eventName, listener) {
        if (eventName in listeners) {
          listeners[eventName].push(listener)
        } else {
          listeners[eventName] = [listener]
        }
      },
      emit (eventName, ...args) {
        if (eventName in listeners) {
          listeners[eventName].forEach(listener => listener(...args))
        }
      },
      eventNames () {
        return Object.keys(listeners)
      }
    })
  }
  