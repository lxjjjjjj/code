import DidiSocket from '@didi/didiSocket/dist/didiSocketMp'
import { watch } from '@mpxjs/core'
import store from '../../store/index'

function throttle (fn, time) {
  let lastArgs
  let waiting = false

  function exec (context, args) {
    fn.apply(context, args)
    waiting = true
    setTimeout(() => {
      waiting = false
      if (lastArgs) {
        exec(context, lastArgs)
        lastArgs = undefined
      }
    }, time)
  }

  return function (...args) {
    if (!waiting) {
      exec(this, args)
    } else {
      lastArgs = args
    }
  }
}

let socket
let socketPromise
let socketUnWatch

export function initSocket () {
  if (socket) {
    return socket
  }
  let socketUrl = 'wss://wsgwp.diditaxi.com.cn/push'
  try {
    socket = new DidiSocket(socketUrl, {
      phone: store.state.phone,
      token: store.state.token
    })
  } catch (e) {
    return
  }
  // 建立重连机制
  initReconnect(socket)
  // 长连接埋点
  checkSocket(socket)
  // 返回实例
  return socket
}

export function getDidiSocket () {
  if (!socketPromise) {
    socketPromise = new Promise((resolve, reject) => {
      socketUnWatch = watch(null, () => store.state.token, {
        handler(newVal, oldVal) {
          if (newVal) {
            const socket = initSocket()
            if (socket) {
              resolve(socket)
            } else {
              reject('socket fail')
            }
          } else if (oldVal) {
            destorySocket()
          }
        },
        immediate: true
      })
    })
  }
  return socketPromise
}

export function destorySocket () {
  socketPromise = null
  if (socketUnWatch) {
    socketUnWatch()
  }
  if (socket) {
    try {
      socket.destroy()
      socket = null
    } catch (e) {

    }
  }
}

// 初始化自动重连
function initReconnect (socket) {
  // 重连策略优化,长连接断开后立刻重连,添加限流限制5秒之内最多重连两次
  let reconnectHandler = throttle((e, kickoff) => {
    if (kickoff) {
      store.dispatch('logout')
    } else {
      socket.reconnect()
    }
  }, 5000)
  socket.on('close', reconnectHandler)
}

function checkSocket (socket) {
  let firstOpened = false
  let firstConnected = false

  // // 埋点,尝试长连接
  // omega.sendOmegaLog('trySocket_sw', {
  //   modal: store.state.modal
  // })
  // // 埋点,支持websocket
  // omega.sendOmegaLog('initSocketSucc_sw', {
  //   modal: store.state.modal
  // })

  // let startTime = +new Date()

  let openTimer = setTimeout(() => {
    // omega.sendOmegaLog('socketOpenTimeout_sw', {
    //   modal: store.state.modal,
    //   ua: navigator.userAgent
    // })
  }, 10000)

  let connectTimer

  socket.on('open', () => {
    if (!firstOpened) {
      firstOpened = true
      clearTimeout(openTimer)
      connectTimer = setTimeout(() => {
        // omega.sendOmegaLog('socketConnectTimeout_sw', {
        //   modal: store.state.modal
        // })
      }, 10000)
      // 埋点,open成功
      // omega.sendOmegaLog('socketOpened_sw', {
      //   time: Math.round((+new Date() - startTime) / 1000),
      //   modal: store.state.modal
      // })
    }
  })

  socket.on('connected', () => {
    console.log('connected')
    if (!firstConnected) {
      firstConnected = true
      clearTimeout(connectTimer)
      // 埋点,建立连接成功
      // omega.sendOmegaLog('socketConnected_sw', {
      //   time: Math.round((+new Date() - startTime) / 1000),
      //   modal: store.state.modal
      // })
    }
  })

  socket.on('error', () => {
    // omega.sendOmegaLog('socketError_sw', {
    //   modal: store.state.modal
    // })
  })

  socket.on('close', (e, kickoff) => {
    if (kickoff) {
      console.log('kickoff')
      // omega.sendOmegaLog('socketKickoff_sw', {
      //   modal: store.state.modal
      // })
    } else {
      console.log('close')
      // omega.sendOmegaLog('socketClosed_sw', {
      //   code: e.code,
      //   time: Math.round((+new Date() - startTime) / 1000),
      //   modal: store.state.modal
      // })
    }
  })

  socket.on('pushMessage', () => {
    // omega.sendOmegaLog('receiveMessageAll_sw', {
    //   modal: store.state.modal
    // })
  })
}
