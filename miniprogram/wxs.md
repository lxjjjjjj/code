微信小程序的架构微信小程序的架构分为 app-service 和 page-frame，分别运行于不同的线程。

你在开发时写的所有 JS 都是运行在 app-service线程里的，

而每个页面各自的 WXML/WXSS 则运行在 page-frame 中。

app-service 与 page-frame 之间通过桥协议通信（包括 setData 调用、canvas指令和各种DOM事件），涉及消息序列化、跨线程通信与evaluateJavascript()。

这个架构的好处是：分开了业务主线程和显示界面，即便业务主线程非常繁忙，也不会阻塞用户在 page-frame 上的交互。一个小程序可以有多个 page-frame（webview），页面间切换动画比SPA更流畅。

坏处是：在 page-frame 上无法调用业务 JS。跨线程通信的成本很高，不适合需要频繁通信的场景。业务 JS 无法直接控制 DOM。

=====引入WXS针对微信小程序架构的缺点，微信团队推出了 WXS。WXS 就是在 page-frame 中运行的 JS，可以对 view 数据做一些变换。

WXS 对性能的贡献就只有一点：与 WXML 是在同一个线程运行的，避免了跨线程通信的开销。别的性能上的提升？

完全没有。一个例子：编译前的代码var getMax = function(array) {
  var max = undefined;
  for (var i = 0; i < array.length; ++i) {
    max = max === undefined ?
      array[i] :
      (max >= array[i] ? max : array[i]);
  }
  return max;
}

module.exports.getMax = getMax;
编译后的代码function np_0() {
  var nv_module = {
    nv_exports: {}
  };
  var nv_getMax = (function (nv_array) {
    var nv_max = undefined;
    for (var nv_i = 0; nv_i < nv_array.nv_length; ++nv_i) {
      nv_max = nv_max === undefined ?
        nv_array[((nt_2 = (nv_i), 'Number' === nt_2.nv_constructor ?
          nt_2 :
          "nv_" + nt_2))] :
        (
          nv_max >= nv_array[
            (
              (nt_0 = (nv_i),
                'Number' === nt_0.nv_constructor ?
                nt_0 :
                "nv_" + nt_0)
            )] ?
          nv_max :
          nv_array[(
            (
              nt_1 = (nv_i), 'Number' === nt_1.nv_constructor ?
              nt_1 :
              "nv_" + nt_1
            )
          )]
        )
    };
    return (nv_max)
  });
  nv_module.nv_exports.nv_getMax = nv_getMax;
  return nv_module.nv_exports;
}
可以看到，基本没有什么变化，循环还是那个循环，性能在哪里？实测也是比原始代码慢 75%wxs vs js · jsPerf======结论WXS 是在微信小程序 page-frame 上运行的，在性能上的优化是在一定程度上缓解了微信小程序架构中跨线程通信的开销。脱离这个场景与 JS 相比则没有任何性能优势。

# 微信提供的wxs的事件处理方法

[微信提供的wxs的事件处理方法](https://developers.weixin.qq.com/miniprogram/dev/framework/view/interactive-animation.html)


# 一个wxs写的drag-view

drag-view.mpx

```
<template>
  <view>
    <view class="xpanel-wrap {{isScroll ? 'is-scroll' : ''}} wrapper-class" catchtouchmove="catchXpanelTouchMove" style="{{xpanelStyle}}" id="slot-wrap">
      <!-- 微信使用wxs来实现touchmove的响应方法，减少逻辑层与渲染层通信 -->
      <view wx:if="{{__mpx_mode__ === 'wx'}}"
            change:isSmallMap="{{xpanelWxs.menuIdObserver}}" isSmallMap="{{fullScreen}}"
            change:isBigMap="{{xpanelWxs.bigMapObserver}}" isBigMap="{{resetFull}}"
            change:isscroll="{{xpanelWxs.isScrollObserver}}" isscroll="{{isScroll}}"
            change:defaultheight="{{xpanelWxs.defaultHeightObserver}}" defaultheight="{{defaultHeight}}"
            change:smallheight="{{xpanelWxs.smallHeightObserver}}" smallheight="{{smallHeight}}"
            change:resetwxs="{{xpanelWxs.resetObserver}}" resetwxs="{{resetWxs}}"
            change:slotwrapheight="{{xpanelWxs.slotWrapHeightObserver}}" slotwrapheight="{{slotWrapHeight}}"
            change:isPageDrag="{{xpanelWxs.pageDragObserver}}" isPageDrag="{{aliDrag}}"
            change:rebound="{{xpanelWxs.reboundObserver}}" rebound="{{rebound}}"
            bindtouchmove="{{xpanelWxs.onTouchMove}}"
            bindtouchstart="{{xpanelWxs.onTouchStart}}"
            bindtouchend="{{xpanelWxs.onTouchEnd}}"
      >
        <slot name="xpanel-top"></slot>
        <slot name="xpanel-main"></slot>
        <wxs src="./xpannel-view.wxs" module="xpanelWxs" />
      </view>
      <view wx:else
            bindtouchmove="xpanelTouchMove"
            bindtouchstart="xpanelTouchStart"
            bindtouchend="xpanelTouchEnd"
      >
        <slot name="xpanel-top"></slot>
        <slot name="xpanel-main"></slot>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
  import mpx, { createComponent } from '@mpxjs/core'
  // import { getSystemInfo } from 'common/js/util'
  // import Store from '@plugin/base-plugin/store'
  // import store from '../../store/index'

  let iscurrentTop = false
  let iscurrentMove = false
  let currentPosition = true
  let animationRuning = false

  createComponent({
    options: {
      multipleSlots: true
    },
    externalClasses: ['wrapper-class'],
    data: {
      // slotWrapHeight: systemInfo.windowHeight,
      touchStart: {} as Obj,
      startMoveY: 0,
      moveY: 0,
      resetWxs: 0,
      transition: 'none'
    },
    properties: {
      isScroll: { // 是否可滚动
        type: Boolean,
        value: true
      },
      defaultHeight: { // 可滚动情况默认露出底部的高度
        type: Number,
        value: 311
      },
      isCustomNav: {
        type: Boolean,
        value: false
      },
      smallHeight: {
        type: Number,
        value: 311
      },
      fullScreen: { // 自动拉起全屏
        type: Boolean,
        value: false
      },
      resetFull: { // 自动取消全屏
        type: Number,
        value: 0
      },
      aliDrag: { // 针对支付宝做的是否可以往下拖
        type: Boolean,
        value: true
      },
      navigatorHeight: {
        type: Number,
        value: 0
      },
      rebound: {
        type: Boolean,
        value: true
      },
      customBar: {
        type: Boolean,
        value: false
      }
    },
    computed: {
      // ...store.mapState(['isPageDrag', 'isSmallMap', 'isBigMap']),
      getSystemInfo () {
        // 因为导入的getSystemInfo函数使用了闭包，变量可能是之前页面的信息，在这样重新获取一次
        let systemInfo = {} as any
        try {
          systemInfo = mpx.getSystemInfoSync()
        } catch (e) {}
        const screenHeight = systemInfo.screenHeight || 0
        const titleBarHeight = systemInfo.titleBarHeight || 0
        // 微信没有titleBarHeight属性，但是有时候windowHeight和screenHeight返回的值一样，导致无法计算真实内容的高度
        const statusBarHeight = systemInfo.statusBarHeight || 0
        const windowHeight = systemInfo.windowHeight || 0
        const navHeight = windowHeight === screenHeight ? (titleBarHeight + statusBarHeight) : 0
        const customBar = this.customBar ? 0 : navHeight
        // 模拟器进来和金刚位进来的支付宝获取的高度没有减去顶部标题栏的高度
        return { windowHeight, navHeight: customBar }
      },
      xpanelStyle () {
        // if (!this.isScroll) return 'top:auto; bottom:0'
        let defaultTop = this.getSystemInfo.windowHeight - this.defaultHeight - this.getSystemInfo.navHeight
        return `transform:translateY(${-this.moveY}px);top:${defaultTop}px; bottom:auto;transition:${this.transition};`
      },
      slotWrapHeight () {
        return this.getSystemInfo.windowHeight - this.getSystemInfo.navHeight - this.navigatorHeight
      }
    },
    detached () {
      currentPosition = true
    },
    methods: {
      // ...store.mapMutations(['setState']),
      myevent (args: { isPageScroll: boolean }) {
        this.triggerEvent('endTip', { isPageScroll: args.isPageScroll })
        // this.setState({
        //   isPageScroll: args.isPageScroll
        // })
      },
      // resetScroll () {
      //   this.resetWxs++
      //   this.moveY = 0
      //   setTimeout(() => {
      //     this.getScrollHeight()
      //   }, 500)
      // },
      xpanelTouchMove (event : TouchEvent) {
        // xpannel是否可以下拉，isPageDrag=true表示可以往下拉
        if (!this.aliDrag || animationRuning) {
          return
        }
        // 滑动xpannel判断move方法是否被触发
        if (!iscurrentMove) {
          iscurrentMove = true
        }
        const touches = event.touches || []
        if (touches.length > 1 || !this.isScroll) return
        let moveY = 0
        if (this.touchStart && this.touchStart.pageY) {
          moveY = this.startMoveY + this.touchStart.pageY - touches[0].pageY
        }
        // console.error('move event, moveY:', moveY, ',this.moveY:', this.moveY, ',this.slotWrapHeight:', this.slotWrapHeight, ',this.defaultHeight:', this.defaultHeight)
        if (!this.rebound && moveY < 0) {
          return
        }
        // 低于最小default
        // if (moveY < 0) return
        // 超过容器最大高度
        if (moveY > (this.slotWrapHeight - this.defaultHeight)) {
          this.moveY = this.slotWrapHeight - this.defaultHeight
          iscurrentTop = true
          return
        }
        iscurrentTop = false
        this.moveY = moveY
      },
      xpanelTouchStart (event :TouchEvent) {
        iscurrentMove = false
        const touches = event.touches || []
        if (touches.length > 1 || !this.isScroll) return
        this.touchStart = event.touches[0]
        this.startMoveY = this.moveY
        this.transition = 'none'
      },
      xpanelTouchEnd (event: TouchEvent) {
        // xpannel是否可以下拉
        if (!this.aliDrag || animationRuning) {
          return
        }
        // 正常的下拉逻辑
        if (iscurrentMove) {
          if (iscurrentTop) {
            // 已经是吸顶了
            this.myevent({ isPageScroll: true })
            currentPosition = false
          } else {
            // 自动吸顶，或者归位
            const startClientY = this.touchStart.pageY
            const endClientY = event.changedTouches[0].pageY
            const currentVal = Math.abs(endClientY - startClientY)
            let moveY = 0
            if (currentVal < 50) {
              // 滑动的距离太小了返回到原来的位置
              moveY = currentPosition ? 0 : (this.slotWrapHeight - this.defaultHeight)
            } else {
              if (endClientY < startClientY) {
                // 自动吸顶
                // moveY = this.slotWrapHeight - this.defaultHeight
                // currentPosition = false
                // this.myevent({ isPageScroll: true })
                if (this.startMoveY + currentVal > 0) {
                  moveY = this.slotWrapHeight - this.defaultHeight
                  currentPosition = false
                  this.myevent({ isPageScroll: true })
                } else {
                  moveY = 0
                  currentPosition = true
                  this.myevent({ isPageScroll: false })
                }
              }
              if (endClientY > startClientY) {
                // 自动归位
                moveY = 0
                currentPosition = true
                this.myevent({ isPageScroll: false })
                // moveY = this.smallHeight - this.defaultHeight
                if (this.startMoveY - currentVal > 0) {
                  moveY = 0
                } else {
                  moveY = this.smallHeight - this.defaultHeight
                }
              }
            }
            this.transition = '0.2s'
            this.moveY = moveY
            animationRuning = true
            setTimeout(() => {
              animationRuning = false
            }, 500)
          }
        }
        this.touchStart = {}
      },
      catchXpanelTouchMove () {
        return false
      }
      // getScrollHeight() {
      //   this.createSelectorQuery().select('#slot-wrap').boundingClientRect((rect) => {
      //     // console.error('get scroll height,', rect.height)
      //     if (rect && rect.height && rect.height !== this.slotWrapHeight) {
      //       this.slotWrapHeight = rect.height
      //     }
      //   }).exec()
      // }
    },
    watch: {
      fullScreen (val) {
        if (__mpx_mode__ === 'ali' && val && currentPosition) {
          currentPosition = false
          this.myevent({ isPageScroll: true })
          this.transition = '0s'
          this.moveY = this.slotWrapHeight - this.defaultHeight
        }
      },
      resetFull (val) {
        if (__mpx_mode__ === 'ali' && val) {
          currentPosition = true
          this.myevent({ isPageScroll: false })
          this.transition = '0.2s'
          this.moveY = 0
        }
      },
      defaultHeight (val) {
        if (__mpx_mode__ === 'ali' && !currentPosition) {
          currentPosition = false
          this.myevent({ isPageScroll: true })
          this.transition = '0s'
          this.moveY = this.slotWrapHeight - val
        }
      }
    }
  })
</script>

<style lang="stylus">
  .xpanel-wrap
    position absolute
    bottom 0
    width 100%
    z-index 2
    &.is-scroll
      position fixed
      width 100%
      top 1000px
      left 0
</style>

```

xpannel-view.wxs

```
var slotWrapHeight = 0
var defaultHeight = 311
var isScroll = true
var touchStart = {}
var startMoveY = 0
var moveY = 0
var isTop = false
var isMove = false
var animationRuning = false
var currentPosition = true
var isChangeHeight = false
var smallHeight = 311
var isDrag = true
var rebound = true
// 代码只在微信端运行，修改前请仔细阅读文档：https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/01wxs-module.html

var onTouchMove = function(event, ownerInstance, instance) {
  if (!isDrag) {
    return
  }
  if (!isMove) {
    isMove = true
  }
  var touches = event.touches || []
  if (touches.length > 1 || !isScroll) {
    return false
  }
  var onceMoveY = 0
  if (touchStart && touchStart.pageY) {
    onceMoveY = startMoveY + touchStart.pageY - touches[0].pageY
  }
  // console.log('move event, moveY:', moveY, ',oncemoveY:', onceMoveY, ',slotWrapHeight:', slotWrapHeight, ',defaultHeight:', defaultHeight)
  if (!rebound && onceMoveY < 0 || touches[0].pageY < 0) {
    return
  }
  // 低于最小default
  // if (onceMoveY < 0) return
  // 超过容器最大高度
  if (onceMoveY > (slotWrapHeight - defaultHeight)) {
    ownerInstance.selectComponent('#slot-wrap').setStyle({
      "transform": "translateY(-" + (slotWrapHeight - defaultHeight) + "px)",
      "transition": "none"
    })
    isTop = true
    return false
  }
  isTop = false

  moveY = onceMoveY
  var instance = ownerInstance.selectComponent('#slot-wrap')
  instance.setStyle({
    "transform": "translateY(" + -moveY + "px)",
    "transition": "none"
  })

  return false
}

var onTouchStart = function(event, ownerInstance, instance) {
  // isTop = false
  isMove = false
  var touches = event.touches || []
  if (touches.length > 1 || !isScroll) return
  touchStart = event.touches[0]
  startMoveY = moveY
}

var onTouchEnd = function(event, ownerInstance) {
  // if (isTop) {
  //   ownerInstance.callMethod('myevent', { isPageScroll: true })
  //   // console.log('已经是最顶部了，可以开始滑动')
  // }
  // 只走start和end事件，没有走move事件，说明是往下移动，xpannel的滑动要阻止
  if (isMove) {
    if (isTop) {
      // 已经是吸顶了
      ownerInstance.callMethod('myevent', { isPageScroll: true })
      currentPosition = false
    } else {
      // 自动吸顶，或者归位
      var startClientY = touchStart.pageY
      var endClientY = event.changedTouches[0].pageY
      var currentVal = Math.abs(endClientY - startClientY)
      if (currentVal < 50) {
        // 滑动的距离太小了返回到原来的位置
        moveY = currentPosition ? 0 : (slotWrapHeight - defaultHeight)
      } else {
        if (endClientY < startClientY) {
          // 自动吸顶
          // moveY = slotWrapHeight - defaultHeight
          // currentPosition = false
          // ownerInstance.callMethod('myevent', { isPageScroll: true })
          if (startMoveY + currentVal > 0) {
            moveY = slotWrapHeight - defaultHeight
            currentPosition = false
            ownerInstance.callMethod('myevent', { isPageScroll: true })
          } else {
            moveY = 0
            currentPosition = true
            ownerInstance.callMethod('myevent', { isPageScroll: false })
          }
        }
        if (endClientY > startClientY) {
          // 自动归位
          moveY = 0
          currentPosition = true
          ownerInstance.callMethod('myevent', { isPageScroll: false })
          // moveY = smallHeight - defaultHeight
          if (startMoveY - currentVal > 0) {
            moveY = 0
          } else {
            moveY = smallHeight - defaultHeight
          }
        }
      }
      var instance = ownerInstance.selectComponent('#slot-wrap')
      instance.setStyle({
        "transform": "translateY(" + -moveY + "px)",
        "transition": "0.2s"
      })
    }
  }
  touchStart = {}
}

var menuIdObserver = function(newVal, oldVal, ownerInstance, instance) {
  // var slotWrap = ownerInstance.selectComponent('#slot-wrap')
  // moveY = 0
  // slotWrap.setStyle({
  //   "transform": "none",
  //   "transition": "all .2s ease-out"
  // })
  // 自动拉起小地图，这个操作只会执行一次，就是在行程中的时候
  if (newVal && currentPosition) {
    moveY = slotWrapHeight - defaultHeight
    currentPosition = false
    ownerInstance.callMethod('myevent', { isPageScroll: true })
    var instance = ownerInstance.selectComponent('#slot-wrap')
    instance.setStyle({
      "transform": "translateY(-" + moveY + "px)",
      "transition": "0.2s"
    })
  }
}

var bigMapObserver = function(newVal, oldVal, ownerInstance, instance) {
  if (newVal) {
    moveY = 0
    currentPosition = true
    ownerInstance.callMethod('myevent', { isPageScroll: false })
    var instance = ownerInstance.selectComponent('#slot-wrap')
    instance.setStyle({
      "transform": "translateY(-" + moveY + "px)",
      "transition": "0.2s"
    })
  }
}

var isScrollObserver = function(newVal, oldVal, ownerInstance, instance) {
  isScroll = newVal
  // moveY = 0
  // if (newVal === false) {
  //   var slotWrap = ownerInstance.selectComponent('#slot-wrap')
  //   slotWrap.setStyle({
  //     "transform": "none",
  //     "transition": "all .2s ease-out"
  //   })
  // }
}

var resetObserver = function(newVal, oldVal, ownerInstance, instance) {
  // console.log('resetObserver')
  var slotWrap = ownerInstance.selectComponent('#slot-wrap')
  moveY = 0
  slotWrap.setStyle({
    "transform": "none",
    "transition": "all .2s ease-out"
  })
}

var defaultHeightObserver = function(newVal, oldVal, ownerInstance, instance) {
  console.log(newVal, 'defaultHeightObserver')
  defaultHeight = newVal
  var slotWrap = ownerInstance.selectComponent('#slot-wrap')
  if (!currentPosition) {
    // 小地图模式需要微调一下位置
    moveY = slotWrapHeight - defaultHeight
    slotWrap.setStyle({
      "transform": "translateY(-" + moveY + "px)"
    })
    return
  }
  slotWrap.setStyle({
    "transition": "all .2s ease-out"
  })
}

var smallHeightObserver = function(newVal, oldVal, ownerInstance, instance) {
  smallHeight = newVal
}

var slotWrapHeightObserver = function(newVal, oldVal, ownerInstance, instance) {
  // console.log(1111, newVal, oldVal)
  if (newVal) {
    slotWrapHeight = newVal
  }
}

var pageDragObserver = function(newVal) {
  isDrag = newVal
}

var reboundObserver = function(newVal) {
  rebound = newVal
}

module.exports = {
  onTouchMove: onTouchMove,
  onTouchStart: onTouchStart,
  onTouchEnd: onTouchEnd,
  menuIdObserver: menuIdObserver,
  isScrollObserver: isScrollObserver,
  defaultHeightObserver: defaultHeightObserver,
  slotWrapHeightObserver: slotWrapHeightObserver,
  resetObserver: resetObserver,
  bigMapObserver: bigMapObserver,
  smallHeightObserver: smallHeightObserver,
  pageDragObserver: pageDragObserver,
  reboundObserver: reboundObserver
};

```

touch事件中的touches、targetTouches和changedTouches


```
touches: 当前屏幕上所有触摸点的列表;
 
targetTouches: 当前对象上所有触摸点的列表;
 
changedTouches: 涉及当前(引发)事件的触摸点的列表
 
通过一个例子来区分一下触摸事件中的这三个属性：
 
1. 用一个手指接触屏幕，触发事件，此时这三个属性有相同的值。
 
2. 用第二个手指接触屏幕，此时，touches有两个元素，每个手指触摸点为一个值。当两个手指触摸相同元素时，
targetTouches和touches的值相同，否则targetTouches 只有一个值。changedTouches此时只有一个值，
为第二个手指的触摸点，因为第二个手指是引发事件的原因
 
3. 用两个手指同时接触屏幕，此时changedTouches有两个值，每一个手指的触摸点都有一个值
 
4. 手指滑动时，三个值都会发生变化
 
5. 一个手指离开屏幕，touches和targetTouches中对应的元素会同时移除，而changedTouches仍然会存在元素。
 
6. 手指都离开屏幕之后，touches和targetTouches中将不会再有值，changedTouches还会有一个值，
此值为最后一个离开屏幕的手指的接触点。
 
2. 触点坐标选取
 
touchstart和touchmove使用: e.targetTouches[0].pageX 或 (jquery)e.originalEvent.targetTouches[0].pageX
 
touchend使用: e.changedTouches[0].pageX 或 (jquery)e.originalEvent.changedTouches[0].pageX
 
3.touchmove事件对象的获取
 
想要在touchmove:function(e,参数一)加一个参数，结果直接使用e.preventDefault()就会 e 报错，处理方法为使用arguments[0]获取event参数
touchmove:function(e,参数一){
　　var e=arguments[0]
　　e.preventDefault()
}
 
```



