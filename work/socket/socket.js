import { throttle } from 'common/js/util'
import store from '../../store/index'
// import GulfCommonStore from '../../commonStore'
import mpx from '@mpxjs/core'
const Omega = getApp().Omega

export default function initSocket () {
  getApp().getDidiSocket().then((socket) => {
    listen(socket)
  }).catch(() => {
    console.warn('行程页获取socket失败')
  })
}

function sendOmega(key, tag, obj = {}) {
  try {
    const Omega = getApp().Omega
    Omega.trackEvent(key, tag, Object.assign({
      phone: store.state.phone,
      openid: store.state.openid,
      oid: store.state.oid,
      status: store.state.status,
      substatus: store.state.subStatus,
      mode: __mpx_mode__
    }, obj))
  } catch (e) {
  }
}

function listen (socket) {
  if (!socket.connected) {
    store.commit('setState', {
      doFast: true
    })
  }
  // 有个开启快轮询的降级开关 doFast
  socket.on('connected', () => {
    console.log('socket_connect_gulfstream')
    store.commit('setState', {
      doFast: false
    })
  })
  socket.on('error', (e) => {
    console.log('socket_error_gulfstream', e)
    store.commit('setState', {
      doFast: true
    })
  })

  socket.on('packetLenDiffError', (data) => {
    sendOmega('socket_packet_len_error', '包长度不一致', { data })
  })
  socket.on('messageCbError', (e) => {
    // 此处就是catch到有任何错误都会降级为快轮询
    sendOmega('socket_message_cb_error', '数据接收回调报错', { e })
    store.commit('setState', {
      hasSocketError: true
    })
  })
  // 测试通用弹窗
  // setTimeout(() => {
  //   const body = {}
  //   body.dialogue =
  //     {
  //       type: 1,
  //       title: "Driver's Protection Measures Report",
  //       subTitle: '司务员在行程中可免费等待x分钟。如你需要延长等待时间，需付出额外费用。',
  //       background: 'https://dpubstatic.udache.com/static/dpubimg/1895fa4b-c406-490e-b3d0-427813695cff.png',
  //       // "documentation":[
  //       //   "Health Kit - Checked",
  //       //   "Mask - Checked",
  //       //   "Disinfection - Done",
  //       //   "Body Temperature - Checked",
  //       //   "Please scan the Health Kit QR code for registration before the start of the ride."
  //       // ],
  //       button: "Got it, I'm ready"
  //     }
  //   // {
  //   //   type: 2,
  //   //   title: '拼车共享出行 经济实惠,测试测试  测试测试测试 测试测试 测试测试',
  //   //   style: 3,
  //   //   subtitle: '为同行乘客考虑，你需要：为同行乘客考虑，你需要：为同行乘客考虑，你需要：',
  //   //   background: 'http://img-hxy021.didistatic.com/static/carsceneimg/do1_PPaeItZYsaTfA2eKqcVW',
  //   //   button: '我知道了',
  //   //   documentation: [
  //   //     '准时上车',
  //   //     '叫车后不能更改目的地',
  //   //     '遵守系统接送顺序'
  //   //   ],
  //   //   icons: [{
  //   //     icon: 'http://img-hxy021.didistatic.com/static/carsceneimg/do1_PPaeItZYsaTfA2eKqcVW',
  //   //     text: '我知道了'
  //   //   },
  //   //   {
  //   //     icon: 'http://img-hxy021.didistatic.com/static/carsceneimg/do1_PPaeItZYsaTfA2eKqcVW',
  //   //     text: '我知道了'
  //   //   },
  //   //   {
  //   //     icon: 'http://img-hxy021.didistatic.com/static/carsceneimg/do1_PPaeItZYsaTfA2eKqcVW',
  //   //     text: '我知道了'
  //   //   }]
  //   // }
  //   store.commit('setState', {
  //     upgradeDialogCfg: Object.assign({ show: true }, body.dialogue)
  //   })
  // }, 2000)

  // 拼车司机修改座位
  /* setTimeout(() => {
    let cardDialog = {
      behavior: '由于您实际乘车人数与订单不符',
      buttons: [
        {
          text: '了解拼车五定守则',
          url: 'https://page.udache.com/passenger/apps/carpool-education/index.html'
        },
        {
          text: '我知道了',
          url: ''
        }
      ],
      consequence: '司机已将人数更新为{2人}，费用增加{0元}',
      sub_content: '根据{拼车五定守则}，实际上车人数不能多于呼叫前选择的乘车人数（含婴儿、儿童）',
      top_pic_url: 'https://dpubstatic.udache.com/static/dpubimg/bGiYom_zd8/1544770467094_banner.png'
    }
    store.dispatch('dialog', {
      type: 'card-popup',
      title: cardDialog.behavior,
      subTitle: cardDialog.consequence,
      content: cardDialog.sub_content,
      buttons: cardDialog.buttons,
      topImgUrl: cardDialog.top_pic_url
    })
  }) */

  // 测试行程中通用弹窗
  // recommondMsg: "{"oid":"TlRjNE1EYzVNamMzTkRVMU9UVTFORGN5","dialogue":{"type":1,"title":"\u9632\u62a4\u63aa\u65bd\u63d0\u9192","subtitle":"\u6d4b\u5e08\u5085 \u4eacA6516270","background":"https:\/\/pt-starimg.didistatic.com\/static\/starimg\/img\/KwMde3OkTd1655359159743.png","documentation":["\u53e3\u7f69\u3001\u4f53\u6e29\u3001\u6d88\u6740\u5747\u843d\u5b9e","\u4e0a\u8f66\u8bf7\u626b\u5065\u5eb7\u5b9d","\u52ff\u5728\u75ab\u60c5\u98ce\u9669\u533a\u4e0b\u8f66"],"button":"\u6211\u5df2\u6234\u597d\u53e3\u7f69\uff0c\u51c6\u5907\u4e0a\u8f66\u626b\u7801"}}"
  // recommondType: 52
  // wx.WMPushDialog = function () {
  //   let body = JSON.parse('{"oid":"TlRjNE1EYzVNamMzTkRVMU9UVTFORGN5","dialogue":{"type":1,"title":"\u9632\u62a4\u63aa\u65bd\u63d0\u9192","subtitle":"\u6d4b\u5e08\u5085 \u4eacA6516270","background":"https://pt-starimg.didistatic.com/static/starimg/img/KwMde3OkTd1655359159743.png","documentation":["\u53e3\u7f69\u3001\u4f53\u6e29\u3001\u6d88\u6740\u5747\u843d\u5b9e","\u4e0a\u8f66\u8bf7\u626b\u5065\u5eb7\u5b9d","\u52ff\u5728\u75ab\u60c5\u98ce\u9669\u533a\u4e0b\u8f66"],"button":"\u6211\u5df2\u6234\u597d\u53e3\u7f69\uff0c\u51c6\u5907\u4e0a\u8f66\u626b\u7801"}}')
  //   if (body.dialogue && body.dialogue.title) {
  //     store.commit('setState', {
  //       upgradeDialogCfg: Object.assign({ show: true }, body.dialogue)
  //     })
  //   }
  // }
  // 出租车立减金弹窗测试
  // const testData = {
  //   oid: "TWpnNE1qTXdOREU1TkRReU9UazROalky",
  //   dialogue: {
  //     background: "https://img-hxy021.didistatic.com/static/starimg/img/6ioafiFxEH1672833372062.png",
  //     button: "我知道了",
  //     omega_info: {
  //       key: "wyc_ordinary_popup_sw",
  //       params: { popup_type: "2" }
  //     },
  //     style: 2,
  //     subtitle: "立减金仅限本单线上支付可用",
  //     title: "接驾虽漫长，立减金送上\n本单随机立减0.5元,等到享优惠！",
  //     type: 1
  //   }
  // }
  // store.commit('setState', {
  //   upgradeDialogCfg: Object.assign({ show: true }, testData.dialogue)
  // })

  // 处理CommonMsgReq
  socket.on('CommonMsgReq', (msg) => {
    console.log('CommonMsgReq_gulfstream', +msg.recommondType)
    let type = +msg.recommondType
    let body = JSON.parse(msg.recommondMsg)
    switch (type) {
      case 52:
        if (body.dialogue && body.dialogue.title) {
          store.commit('setState', {
            upgradeDialogCfg: Object.assign({ show: true }, body.dialogue)
          })
        }
        if (body.dialogue.title === '您将获赠豪华车出行保障') {
          // todo: 该push有错误，先屏蔽
        }
        // 被@胡曼 2019.9.19注释
        // store.commit('setState', {
        //   slotDialogCfg: body.dialogue || {}
        // })
        break
      // push指令
      case 101: {
        let needRefresh = +body.status !== store.state.status || +body.sub_status !== store.state.subStatus || +body.freeze_status !== store.state.freeze_status
        // 存在new_order_id,判定为改派行为，停止orderDetail刷新
        if (needRefresh && !body.new_order_id) {
          store.dispatch('getOrderDetail')
        }
        let orderChangeFlag = +body.status !== store.state.status || +body.sub_status !== store.state.subStatus || body.line_md5 !== store.state.lineMd5
        if (orderChangeFlag) {
          store.dispatch('fetchNewMsg')
        }
        const stateData = {
          newOid: body.new_order_id,
          lineMd5: body.line_md5,
          isDriverPassengerBothShow: body.is_driver_passenger_both_show === undefined ? 1 : body.is_driver_passenger_both_show,
          timeoutInfo: {
            is_timeout: body.is_timeout,
            timeout_msg: body.timeout_msg
          },
          feeObjectionStatus: body.fee_objection_status
        }
        // GulfCommonStore.commit('setState', {
        //   timeoutInfo: {
        //     is_timeout: body.is_timeout,
        //     timeout_msg: body.timeout_msg
        //   }
        // })
        store.commit('setState', stateData)
        break
      }
      case 151: {
        const safeCard = body.lady_safe || {}
        store.commit('setState', { safeCard })
        break
      }
      // 拼车卡片弹框
      case 33: {
        const cardDialog = body || {}
        store.dispatch('dialog', {
          type: 'card-popup',
          title: cardDialog.behavior,
          subTitle: cardDialog.consequence,
          content: cardDialog.sub_content,
          buttons: cardDialog.buttons,
          topImgUrl: cardDialog.top_pic_url,
          id: 'change_seat_notify_passenger',
        })
        break
      }
      // 轻桔视协议弹框
      case 57: {
        const dialogInfo = body || {}
        store.commit('setState', {
          orangeGuardDialogCfg: Object.assign({ show: true }, dialogInfo?.orange_guard || {})
        })
        break
      }
      // 车载屏个性化内容授权弹框
      case 58: {
        const dialogInfo = body || {}
        dialogInfo.dialogue && store.commit('setState', {
          personalizedAuthorizeDialogCfg: { dialogContent: dialogInfo.dialogue, show: true }
        })
        break
      }
    }
  })

  // 处理OrderRealtimeFeeReq
  socket.on('OrderRealtimeFeeReq', (msg) => {
    store.commit('setState', {
      realTimeTotalFee: msg.totalFee,
      realTimeTotalFeeText: msg.totalFeeText,
      realTimeFeeInfo: msg.feeInfo || []
    })
  })
  // 模拟测试popepush 弹窗资源位消息
  // setTimeout(() => {
  //   store.commit('setCommonPopup', {
  //     type: 'pope',
  //     data: {
  //       mini_app_pope_type: 'pope_bonus_popup',
  //       mini_app_image_url: 'http://img2.imgtn.bdimg.com/it/u=20121295,874455007&fm=26&gp=0.jpg',
  //       mini_app_jump_url: 'https://www.baidu.com',
  //       package_id: 'cxPopup1',
  //       popup_params: JSON.stringify({
  //         bonusAmount: 300,
  //         bonusDeductionYuan: 3,
  //         bonusThreshhold: 600,
  //         expireDate: '下周日24点'
  //       })
  //     }
  //   })
  // }, 5000)

  // 处理POPE消息
  socket.on('POPEActionReq', msg => {
    console.log('POPEActionReq', msg)
    const resData = JSON.parse(msg.data)
    // 拼车行程结束助力红包
    // // 通用pushData 适用于支付后弹窗的情况 http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=401263961
    if (resData.mini_app) {
      store.commit('setCommonPopup', {
        type: 'pope',
        data: resData.mini_app
      })
    }
    // 处理慢必赔
    store.commit('setState', { popeSlowData: resData })
  })
  // 新消息位， unifyReq处理无状态变更类型消息 （新统一模板）
  let getOrderReassignMessageInfoHandler = throttle(() => {
    store.dispatch('getOrderReassignMessageInfo')
  }, 1000, { leading: true })
  socket.on('UnifyReq', msg => {
    let msgBody = JSON.parse(msg.msgBody)
    if (msg.id === 221) {
      store.dispatch('fetchNewMsg')
    } else if (msg.id === 11001) {
      // 拼友推荐
      const infoBody = msgBody || {}
      const leftSecs = Math.floor((infoBody.expire_timestamp * 1000 - Date.now()) / 1000)
      // leftSecs = Math.floor((Date.now() - infoBody.expire_timestamp * 1000) / 1000)
      if (leftSecs > 0 && leftSecs < 100) {
        store.commit('setState', {
          pinyouRecommendInfo: {
            isShow: true,
            title: infoBody.title,
            explainMsg: infoBody.explain_msg,
            confirmMsg: infoBody.confirm_msg,
            expireTimestamp: infoBody.expire_timestamp,
            leftSecs,
            totalSecs: leftSecs,
            relationOid: infoBody.relation_oid
          }
        })
      }
    }
    // 连环派单弹框推送
    if (msg.id === 118) {
      getOrderReassignMessageInfoHandler()
    }
    // 快车排队新形态等待超时
    if (msgBody.need_pull_order_match_card === 1) {
      console.log('快车排队新形态push消息推送')
      store.dispatch('startMatchPolling')
    }
    if (msgBody.show_time) {
      store.commit('setState', {
        destModifyInfo: msgBody
      })
    }
    if (msg.id === 100116) {
      store.commit('updateBonusCard', msgBody.bonus_card)
    }
    // 豪华车行程中等待费
    if (msg.id === 900008) {
      store.commit('setState', {
        waitingFeeData: msgBody
      })
    }
    // D1 异形弹窗
    if (msg.id === 900012) {
      store.commit('setState', {
        d1SpecialShapedDialog: msgBody
      })
    }
    // 代叫订单行程中分享弹框
    if (msg.id === 900040) {
      store.dispatch('dialog', {
        type: 'bottom-popup',
        popupType: 'isCaller',
        title: mpx.i18n.t('local.callCarShareTripDialog.title'),
        subTitle: [
          {
            icon: 'https://dpubstatic.udache.com/static/dpubimg/94301506-898f-40bd-852b-1b748d8a4f20.png',
            text: mpx.i18n.t('local.callCarShareTripDialog.subTitleOne')
          },
          {
            icon: 'https://dpubstatic.udache.com/static/dpubimg/c2bba05c-7cac-42f8-a7c6-e46a5c020359.png',
            text: mpx.i18n.t('local.callCarShareTripDialog.subTitleTwo')
          }
        ],
        confirmBtnIcon: 'https://dpubstatic.udache.com/static/dpubimg/3276d6da-9408-4dbe-ad8b-a021305c5c52.png',
        btnText: mpx.i18n.t('local.callCarShareTripDialog.btnText'),
        cancelText: mpx.i18n.t('local.callCarShareTripDialog.cancelText'),
        cancel: () => {
          Omega.trackEvent('userteam_newdrop_leader_sharepop_close_ck', '代叫订单叫车人行程分享弹框取消点击')
        },
        confirm: () => {
          Omega.trackEvent('userteam_newdrop_leader_sharepop_share_ck', '代叫订单叫车人行程分享弹框确定')
          // 点击确认分享，重新请求一下小助手接口，服务端会返回数据为空并且记录一下用户分享过行程，就不再展示小助手提示用户分享
          // 避免给用户带来不好的体验
          store.dispatch('isCallerOrderSharedSuccessUpdateBubbleInfo', {
            have_shared_trip: 1
          })
        }
      })
      // 上报弹框展示埋点
      Omega.trackEvent('userteam_newdrop_leader_sharepop_sw', '代叫订单叫车人行程分享弹框展示')
    }
    // 乘客迟到弹窗
    if (msgBody?.id === 'late_carpool_notify_passenger') {
      let cardDialog = msgBody.data
      store.dispatch('dialog', {
        type: 'card-popup',
        title: cardDialog.behavior,
        subTitle: cardDialog.consequence,
        content: cardDialog.sub_content,
        buttons: JSON.parse(cardDialog.buttons),
        topImgUrl: cardDialog.top_pic_url,
        id: msgBody.id
      })
    }
  })
}
