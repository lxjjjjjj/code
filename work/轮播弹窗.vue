<template>
    <view class="multi-container">
        <view class="multi-swiper-wrapper">
        <view class="multi-swiper-container {{move ? 'move' : ''}}" style="{{swiperStyle}}{{widthStyle}}" catchtouchmove="stopDefault" catchlongtap="stopDefault" bindtouchstart="handlerTouchStart" bindtouchend="handlerTouchEnd">
            <view wx:for="{{cloneImageArr}}" class="multi-swiper-item {{swiperNowCurrent === index ? 'multi-swiper-active' : ''}}" style="{{ move ? '' : 'transition: opacity 0s'}}">
            <image src="{{item}}" bindtap="clickImg" data-index="{{dotNum}}" binderror="imgError(item, $event)"></image>
            </view>
        </view>
        </view>
        <view class="poplayer-swiper-dots">
        <view wx:for="{{imageArr}}" class="poplayer-swiper-dot {{dotNum === index ? 'poplayer-swiper-active' : ''}}"></view>
        </view>
    </view>
  </template>
  <script>
  import { createComponent } from '@mpxjs/core'
  createComponent({
    data: {
      timer: null,
      swiperNowCurrent: 0,
      swiperStyle: '',
      move: false,
      cloneImageArr: [],
      animateTimer: null,
      swiperTouchStart: {},
      dotNum: 0
    },
    properties: {
        imageArr: Array
    },
    watch: {
      imageArr: {
        handler(val) {
          if(val?.length >= 2 && this.multiStyle === 1) {
            this.cloneImageArr = val.concat(val).concat(val)
            this.autoplay()
          }
        },
        immediate: true
      },
      swiperNowCurrent: {
        handler(val) {
          this.dotNum = val % this.imageArr.length
        },
        immediate: true
      },
      dotNum: {
        handler(val) {
          this.triggerEvent('currentChange', val)
        },
        immediate: true
      }
    },
    computed: {
      interval() {
        return this.timing > 0 ? this.timing * 1000 : 5 * 1000
      },
      widthStyle() {
        const unit = __mpx_mode__ === 'ali' ? 'rem' : 'rpx'
        const multiple = __mpx_mode__ === 'ali' ? 0.01 : 1
        return `width: ${554 * multiple * this.cloneImageArr.length}${unit}`
      }
    },
    methods: {
      clickImg (e) {
        const index = e.target && e.target.dataset && e.target.dataset.index
        this.triggerEvent('clickimg', this.link || index) // index 有值时，说明是多帧轮播图，this.link为空
      },
      handlerTouchStart(e) {
        clearInterval(this.timer)
        this.swiperTouchStart = e.changedTouches[0].clientX
      }, 
      handlerTouchEnd(e) {
        if(e.changedTouches[0].clientX - this.swiperTouchStart > 0) {
          this.swiperNowCurrent--
          this.moveHandler()
          this.autoplay()
        } else {
          this.swiperNowCurrent++
          this.moveHandler()
          this.autoplay()
        }
      },
      stopDefault () {
        return false
      },
      moveHandler() {
        this.move = true
        this.animateTimer && clearTimeout(this.animateTimer)
        const unit = __mpx_mode__ === 'ali' ? 'rem' : 'rpx'
        const multiple = __mpx_mode__ === 'ali' ? 0.01 : 1
        this.swiperStyle = `left: ${108 * multiple - this.swiperNowCurrent * 554 * multiple}${unit};`
        this.animateTimer = setTimeout(() => {
          this.move = false
          if (this.swiperNowCurrent >= 2 * this.imageArr.length - 1) {
            this.swiperNowCurrent = this.swiperNowCurrent % this.imageArr.length === 0 ? this.imageArr.length : this.swiperNowCurrent % this.imageArr.length
            this.swiperStyle = `left: ${108 * multiple - this.swiperNowCurrent * 554 * multiple}${unit};`
          }
          if (this.swiperNowCurrent <= 0) {
            this.swiperNowCurrent = (this.imageArr.length + this.swiperNowCurrent)
            this.swiperStyle = `left: ${108 * multiple - this.swiperNowCurrent * 554 * multiple}${unit};`
          }
        }, 400);
      },
      autoplay() {
        this.timer = setInterval(() => {
          this.swiperNowCurrent++ 
          this.moveHandler()
        }, this.interval)
      }
    }
  })
  </script>
  <style lang="stylus">
  .multi-container
    /*use rpx*/
    height 748rpx
  .multi-swiper-wrapper
    position fixed
    top 0
    left 50%
    transform translateX(-50%)
    /*use rpx*/
    height: 712rpx
    width 100vw
    overflow scroll
    .multi-swiper-container
      /*use rpx*/
      left: 108rpx;
      position fixed
      top 0
      height: 712rpx
    .move
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    .multi-swiper-item
      /*use rpx*/
      width 534rpx
      /*use rpx*/
      height 712rpx
      /*use rpx*/
      margin-right 20rpx
      display inline-block
      opacity 0.5
      image
        width 100%
        height 100%
    .multi-swiper-active
      /*use rpx*/
      width 534rpx
      /*use rpx*/
      height 712rpx
      opacity 1
      /*use rpx*/
      margin-right 20rpx
      display inline-block
      transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1) 0.2s;
      image
        width 100%
        height 100%
    .multi-swiper-wrapper-active
      margin-left 30px
    .multi-swiper-wrapper-normal
      margin-left 0px
  .pope-cover
    position: absolute
    width: 100%
    height: 100%
    top: 0
    bottom: 0
    left: 0
    right: 0
  .pop-layer-wrapper
    .pop-layer-content
      display: gird
      position: absolute
      top: 50%
      left: 50%
      width: 71.2%
      max-width: 295px
      transform: translate(-50%, -50%)
      margin: 10px 0
  .poplayer-swiper-dots
      position absolute
      /*use rpx*/
      top 712rpx
      left 50%
      transform translateX(-50%)
      display flex
      /*use rpx*/
      margin-top 24rpx
      align-items center
  .poplayer-swiper-dot
    width 6px
    height 6px
    border-radius 50%
    opacity: 0.3;
    background: #FFFFFF;
    &:not(:first-child)
      /*use rpx*/
      margin-left 10rpx
  .poplayer-swiper-active
    width 6px
    height 6px
    opacity: 1;
    background: #FF6400;
    border-radius 50%
  </style>
   