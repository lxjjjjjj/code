// custom-tab-bar里获取底导位置信息的函数

getTabBarPosByNavId(navId) { 
    // 获取底导元素位置信息
    // navId是底导的id
    if (!navId) {
        return
    }
    this.createSelectorQuery()
        .select(`#${navId}`)
        .boundingClientRect().exec(rect => {
        if (rect && rect[0]) {
            let { left, top, right, bottom } = rect[0]
            let center = { // 圆点位置坐标
                x: (left + right) / 2,
                y: (top + bottom) / 2
            }
            if (this.isIphoneX) {
                center.y = center.y + 5
            }
            // 判断是否居中，如果居中，则不展示(避免和关闭按钮重叠)
            if ((systemInfo.screenWidth / 2 - 15) < center.x && center.x < (systemInfo.screenWidth / 2 + 15)) return
            // 直径 115px
            let diameter = (115 + 16) / 2 // (单位: px)
            let pos = {
                top: center.y - diameter / 2,
                right: center.x + diameter / 2,
                bottom: center.y + diameter / 2,
                left: center.x - diameter / 2,
                width: diameter,
                height: diameter,
                ...center
            }
            getApp().eventBus.emit('setPopLayerGuideBoxPos', pos)
        }
        })
}
    
// 监听底导元素计算位置事件


attached () {
      // 接收到来自弹窗的事件之后再进行底导位置的计算
      this.eventBus = getApp().eventBus
      if (this.eventBus) {
        this.eventBus.un('getPositionByNavIdTabBar')
        this.eventBus.on('getPositionByNavIdTabBar', (navId) => {
          this.getTabBarPosByNavId(navId)
        })
      }
    }

// 什么时候触发的计算位置
getPopLayerGuideBoxPos(target: { targetType: string, targetId: string }) {
    let { targetType, targetId } = target
    if (!targetType || !targetId) return
    // let boxPos = state.popLayerGuideBoxPos
    // if (boxPos.targetId === targetId && boxPos.targetType === targetType && state.popLayerGuideBoxPos.pos) return // 有值则不需要再次获取
    let pages = getCurrentPages() || []
    let last = pages[pages.length - 1]
    if (last.route !== 'home/pages/index') { // 不是首页，则不执行后续操作
      if (this.state.popLayerGuideBoxPos.pos) {
        this.commit('setPopLayerGuideBoxPos', {}) // 如果不是首页且有box位置信息，则需要清空
      }
      return
    }
    let eventName = ''
    // targetType 1 金刚位; 2 底导
    if (+targetType === 1) {
      eventName = 'getPositionByNavIdKing'
    } else if (+targetType === 2) {
      eventName = 'getPositionByNavIdTabBar'
    }
    if (eventName === '') return
    getApp().eventBus.emit(eventName, targetId)
    getApp().eventBus.un('setPopLayerGuideBoxPos') // 避免多次调用
    getApp().eventBus.on('setPopLayerGuideBoxPos', (pos: Obj) => {
      // commit('setPopLayerGuideBoxPos', pos)
      let payload = (pos && pos.height) ? {
        pos,
        targetId,
        targetType
      } : {}
      this.commit('setPopLayerGuideBoxPos', payload)
    })
    this.commit('setPopLayerGuideBoxPos', {}) // 获取本次位置信息时，需清空上次位置信息
  }



triggerGetGuideBox() {
    this.getPopLayerGuideBoxPos({
          targetId: this.popup.guide_id,
          targetType: this.popup.guide_type
        })
    }
      
watch:{
    popup:{
        this.triggerGetGuideBox
    }
}
    


// 画样式


<view class="mask-wrap" wx:if="{{isGuide && guideLineHeight > 0}}" style="{{guideMaskStyle}}" bindtap="clickLayer">
        <view class="ring-wrap" catchtap="guideMaskClick"><view class="ring"></view></view>
        <view class="line {{directionDown ? 'direction-down' : ''}}" style="{{guideLineStyle}}"></view>
      </view>
    guideMaskStyle() {
      if (!this.canDrawGuideLine || this.guideLineHeight < this.getGuideObj.miniGuideLine) {
        return ''
      }
      let pos = this.popLayerGuideBoxPos
      Object.keys(pos).forEach(key => {
        pos[key] = Math.floor(pos[key]) // fix Android某些机型下出现白边问题
      })
      let bottom = systemInfo.screenHeight < pos.bottom ? 0 : systemInfo.screenHeight - pos.bottom
      let borderWidth = `border-width: ${pos.top}px ${systemInfo.screenWidth - pos.right}px ${bottom}px ${pos.left}px`
      return `width: ${pos.width}px; height: ${pos.width}px; ${borderWidth}`
    },
    guideLineStyle() {
      if (!this.canDrawGuideLine || this.guideLineHeight < this.getGuideObj.miniGuideLine) {
        return ''
      }
      let h = this.guideLineHeight
      let up = `top: ${-h}px`
      if (this.directionDown) {
        up = `bottom: ${-h}px`
      }
      return `height: ${h}px; ${up}`
    },
    slotContentStyle() { // 计算slot内容偏移量
      if (!this.canDrawGuideLine) {
        return {}
      }
      if (this.guideLineHeight === this.getGuideObj.miniGuideLine) { // 只有指示线是固定值时，才需要动态计算content内容位置偏移
        let top = 0
        if (this.directionDown) { // 引导线向下
          top = this.popLayerGuideBoxPos.bottom + this.guideLineHeight
        } else { // 引导线向上
          top = this.popLayerGuideBoxPos.top - this.guideLineHeight - this.layerSlotContentRect.height
        }
        if (top > this.getGuideObj.minTopDis && (top + this.layerSlotContentRect.height + this.getGuideObj.minBottomDis) < systemInfo.screenHeight) { // 安全判断: 顶部&底部不能超出屏幕
          return {
            style: `transform: translate(-50%, 0); top: ${top}px`,
            top
          }
        }
      }
      return {}
    },


