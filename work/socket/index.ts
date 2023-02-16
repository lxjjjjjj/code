import { watch } from '@mpxjs/core'
import store from 'store/index'
import { throttle } from 'common/js/util'
import Omega from 'common/js/omega'
import { baseInfoConfig } from './util'

interface Socket {
  new(s:string, obj: Obj): DidiSocket
}

let DidiPushWebapp: any

let socket: DidiSocket | null
let socketPromise: Promise<unknown> | null
let socketUnWatch: () => void
const didiSocketPromise = require.async<{ default: Socket }>('@didi/didiSocket/src/didiSocketMp.js?root=map')
const didiSocketRoot = require.async<{ default: Obj }>('@didi/didiSocket/src/didi_protocol_webapp.js?root=map')

export async function initSocket () {
  if (socket) return socket
  let login = store.state.login
  let openid = store.state.openid
  let socketUrl = 'wss://wsgwp.diditaxi.com.cn/push'
  const DidiSocketClass = (await didiSocketPromise).default
  DidiPushWebapp = (await didiSocketRoot).default.DidiPushWebapp
  socket = new DidiSocketClass(socketUrl, {
    phone: login.phone,
    token: login.token,
    appId: baseInfoConfig.APPID,
    deviceId: openid
  })
  // 建立重连机制
  initReconnect(socket)
  // 长连接埋点
  checkSocket(socket)
  return socket
}

function watchToken () {
  return new Promise((resolve) => {
    if (store.state.login.token) {
      resolve(store.state.login.token)
      return
    }
    socketUnWatch = watch(() => store.state.login.token, {
      handler(newVal, oldVal) {
        if (newVal) {
          resolve(newVal)
        } else if (oldVal) {
          destorySocket()
        }
      },
      immediate: true
    })
  })
}

export async function getDidiSocket () {
  try {
    if (socketPromise) return socketPromise
    await watchToken()
    return await initSocket()
  } catch (error) {
    sendOmega('socket_error', 'socket发生错误', { error })
  }
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

function sendOmega(key: string, tag: string, obj: Obj = {}) {
  try {
    Omega.trackEvent(key, tag, Object.assign({
      // phone: store.state.login.phone,
      openid: store.state.openid,
      mode: __mpx_mode__
    }, obj))
  } catch (e) {
  }
}

// 初始化自动重连
function initReconnect (socket: DidiSocket) {
  // 重连策略优化,长连接断开后立刻重连,添加限流限制5秒之内最多重连两次
  let reconnectHandler = throttle(() => {
    // sendOmega('try_socket_reconnect', '触发重连')
    socket.reconnect()
  }, 5000)
  socket.on('close', reconnectHandler)
  socket.on('error', reconnectHandler)
}

function checkSocket (socket: DidiSocket) {
  let seenConnect = false
  let seenOpen = false
  let seenConnected = false
  let seenError = false
  let seenClose = false

  socket.on('connect', () => {
    sendOmega('socket_connect', '尝试连接')
    if (!seenConnect) {
      seenConnect = true
      sendOmega('first_socket_connect', '第一次尝试连接')
    }
  })

  socket.on('open', () => {
    sendOmega('socket_opened', '连接打开')
    if (!seenOpen) {
      seenOpen = true
      sendOmega('first_socket_opened', '第一次连接打开')
    }
  })

  socket.on('connected', () => {
    sendOmega('socket_connected', '连接成功')

    if (!seenConnected) {
      seenConnected = true
      sendOmega('first_socket_connected', '第一次连接成功')
    }
  })

  socket.on('error', (error: any) => {
    sendOmega('socket_error', '连接错误', { error })
    if (!seenError) {
      seenError = true
      sendOmega('first_socket_error', '第一次连接错误', { error })
    }
  })

  socket.on('close', (error: any, kickoff: any) => {
    sendOmega('socket_close', '连接被关闭', { error, kickoff })
    if (!seenClose) {
      seenClose = true
      sendOmega('first_socket_close', '第一次连接被关闭', { error, kickoff })
    }
  })

  socket.on('pushMessage', (type: string, payload: any) => {
    try {
      let pushMsgType = DidiPushWebapp.PushMessageType[type]
      let msgName = /^kPushMessageType(.*)/.exec(pushMsgType)![1]
      let msgClass = DidiPushWebapp[msgName]
      let pushMsg = msgClass.decode(payload)
      console.log(`got pushMsg:${msgName}`, pushMsg)
      sendOmega('wyc_xcx_push_message_bt', '收到push消息', { push_msg: pushMsg })
      // 消息分发
      socket.emitEvent(msgName, [pushMsg])
    } catch (e) {
    }
  })
}
