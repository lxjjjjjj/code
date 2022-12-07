/**
 * 首页下拉营销专区observe埋点部分代码
 */
import Store from '../../store'

let OmegaObserver
const observerList = ['welfare', 'marketing', 'epidemic', 'epidemic_v2']

export default {
  data: {
    observeNum: 0, // 监听卡片展示的数据
    showOmegaMap: {} // 初始omegaMap
  },
  computed: {
    ...Store.mapState(['homeWidgets']),
    realObserveList() {
      // TODO: 通用mixin 不限制动态组件数组和需要监听的组件数组
      return Object.keys(this.layouts).filter(v => observerList.includes(v))
    }
  },
  pageLifetimes: {
    show () {
      if (this.isHide) {
        this.observeNum = 0
        this.observeOmega()
      }
    },
    hide () {
      OmegaObserver && OmegaObserver.disconnect()
    }
  },
  detached() {
    OmegaObserver && OmegaObserver.disconnect()
  },
  watch: {
    'realObserveList, homeWidgets': {
      handler(val) {
        if (val?.[0]?.length && val?.[1]?.length) {
          this.$nextTick(() => {
            this.observeOmega()
          })
        }
      }
    },
    'observeNum, realObserveList': {
      handler(val) {
        if (val[1].length) {
          const observeObj = ['25', '50', '75', '95'].reduce((acc, cur) => { acc[cur] = false; return acc }, {})
          this.showOmegaMap = {
            ...this.showOmegaMap,
            [val[1][val[0]]]: observeObj
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    observeOmega () {
      const that = this
      if (OmegaObserver) {
        OmegaObserver.disconnect()
      }
      // const bottomTabBar = this.isIphoneX ? -84 : -64
      const target = __mpx_mode__ === 'wx' ? this : my
      const t = [0.25, 0.5, 0.75, 0.95]
      OmegaObserver = target.createIntersectionObserver({
        thresholds: t
      })
      const observeKey = this.realObserveList[this.observeNum]
      const isWidget = observeKey === 'epidemic' || observeKey === 'marketing' || observeKey === 'epidemic_v2'
      try {
        OmegaObserver.relativeTo('#home-layout', {
          bottom: 0
        }).observe(`#${observeKey}`, (res) => {
          t.forEach(v => {
            if (res.intersectionRatio >= v) {
              if (((v === 0.25 || v === 0.75) && isWidget) || (v === 0.95 && !isWidget) || v === 0.5) {
                that.showOmegaMap[observeKey][String(v * 100)] = true
              }
              if ((v === 0.75 && isWidget) || (v === 0.95 && !isWidget)) {
                this.observeNum <= this.realObserveList.length && (this.observeNum += 1)
                OmegaObserver.disconnect()
                that.observeOmega()
              }
            }
          })
        })
      } catch (err) {
        console.log('OmegaObserver err', err)
      }
    }
  }
}
