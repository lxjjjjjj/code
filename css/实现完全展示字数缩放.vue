/*
*  我的钱包-新版个人中心页面
*/
<template>
    <view id="wallet-text" class="wallet-text" wx:if="{{compData.body.coupon_list && compData.body.coupon_list.length}}">
        <view class="wallet-text-item" wx:for="{{compData.body.coupon_list}}" wx:key="title" index="{{index}}" bindtap="jump2Coupon(item)">
            <view class="wallet-card-item-wrapper">
                <view class="wallet-text-text" style="{{textWrapperStyle[index]}}">
                    <scroll-view style="{{textStyle[index]}}" class="wallet-text-text-content" id="sidebar-wallet-text-{{index}}">
                    {{item.value}}
                    </scroll-view>
                </view>
            </view>
        </view>
    </view>
</template>

<script lang='ts'>

createComponent({
  watch: {
    compData: {
      handler(newVal, oldVal) {
        if (newVal.body?.core_list?.length) {
          this.getImgs(newVal.body?.core_list?.length)
        }
        if (newVal.body?.coupon_list?.length) {
          newVal.body.coupon_list.forEach((_: any, index: number) => {
            this.transformWidth(index)
          })
        }
      },
      immediate: true,
      deep: true
    }
  },
  data: {
    textWrapperStyle: [] as string[],
    textStyle: [] as string[]
  },
  computed: {
    compData() {
      return this.mineCards['core_function'] || mineDefault[1]
    }
  },
  methods: {
    transformWidth(index: number) {
      const self = this
      this.createSelectorQuery().select(`#sidebar-wallet-text-${index}`).fields({
        scrollOffset: true,
        size: true
      },function(rect){
        const transformScale = Math.floor(rect.scrollWidth) / 50
        console.log('transformScale', transformScale)
        const widthString = transformScale < 1 ? `width:${rect.scrollWidth}px;` : `width:${rect.scrollWidth / transformScale}px;`;
        self.$set(self.textWrapperStyle, String(index), widthString)
        self.$set(self.textStyle, String(index), `width:${rect.scrollWidth}px;transform: scale(${transformScale > 1 ? 1 / transformScale : 1}) translateX(${ transformScale > 1 ? (rect.scrollWidth  / 2 - 25) * transformScale : 0 }px)`)
      }).exec()
    }
  }
})
</script>

<style lang="stylus">
    .wallet-text
      display flex
      flex-wrap nowrap
      justify-content space-between
      height 60px
      padding-top 7px
      padding-right 15px
      padding-left 15px
    .wallet-text-item
      width 25%
      position relative
      text-align center
      padding-top 10px
      display flex
      flex-direction column
      align-items center
      justify-content center
    .wallet-card-item-wrapper
      position relative
      display flex
      align-items center
      justify-content center
      margin-left 10px
    .wallet-text-text
      font-family DINAlternate-Bold
      font-size 4px
      color #080808
      text-align center
      font-weight 700
      display inline-block
      position relative
      height 20px
      &-content
        width 100%
        white-space nowrap
        overflow auto
        position absolute 
        right 0 
        height 20px
        line-height 20px
    
</style>

<script type="application/json">
  {
    "component": true,
    "usingComponents": {
      "mpx-icon": "@didi/mpx-ui/src/components/icon/icon",
      "service-notice": "../../../components/popup/service-notice"
    }
  }
</script>
