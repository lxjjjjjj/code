/*
*  我的钱包-新版个人中心页面
*/
<template>
    <view class="wallet-card-item-wrapper">
        <view class="wallet-text-text" style="{{textWrapperStyle[index]}}">
            <scroll-view class="wallet-text-text-content" style="{{textStyle[index]}}" id="sidebar-wallet-text-{{index}}">
            <text class="wallet-text-text-int" wx:if="{{item.intValue}}">{{item.intValue}}</text>
            <text class="wallet-text-text-float" wx:if="{{item.floatValue}}" style="font-size: 10px">{{'.' + item.floatValue}}</text>
            </scroll-view>
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
          newVal.body.coupon_list!.forEach((item: any, index: number) => {
            item.value = String(item.value).split('.')
            item.intValue = item.value[0]
            item.floatValue = item.value[1]
            console.log('transformValue', item.intValue, item.floatValue)
            this.transformWidth(index)
          })
        }
      },
      immediate: true
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
        const transformScale = Math.floor(rect.scrollWidth) / 64
        console.log('transformScale', transformScale, rect.scrollHeight)
        const widthString = transformScale < 1 ? `width:${rect.scrollWidth}px;` : `width:${rect.scrollWidth / transformScale}px;`;
        self.$set(self.textWrapperStyle, String(index), widthString)
        const transformWidth = transformScale > 1 ? -(rect.scrollWidth / 2 - 32) * transformScale : 0 
        const transformHeight = transformScale > 1 ? (rect.scrollHeight / 2 - 10) * transformScale : 0 
        // height:${height}px; const height = transformScale > 1 ? rect.scrollHeight / transformScale : rect.scrollHeight
        self.$set(self.textStyle, String(index), `width:${rect.scrollWidth}px;transform: scale(${transformScale > 1 ? 1 / transformScale : 1}) translate(${transformWidth}px, ${transformHeight}px)`)
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
      align-items flex-end
      justify-content center
      margin-left 10px
    .wallet-text-text
      font-family DINAlternate-Bold
      font-size 20px
      color #080808
      text-align center
      font-weight 700
      display inline-block
      position relative
      height 20px
      &-content
        height 24px
        white-space nowrap
        overflow auto
    
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
