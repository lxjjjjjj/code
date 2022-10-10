一、jest如何统计代码

jest执行测试的过程

执行jest命令运行的时候会执行jest-cli命令下bin目录的jest文件，执行jest-cli/build/index目录下的run方法，jest通过jest-config包读取全局jest-config.js文件的配置以及cli命令的参数存储为globalConfig，执行jest/core的runCLI命令调用TestScheduler来调用@jest/reporters下的generateEmptyCoverage如果jest/transFormer下的shouldInstrument方法判global.collectCoverage是true就通过jest/transFormer掉用babel-plugin-istanbul插件进行istanbul覆盖率的计算

二、istanbul如何计算覆盖率

( 一 )、istanbul介绍

istanbul主要是通过babel进行代码编译时预插桩，代码插桩类别分别为function statement block三种，主要引用istanbul-lib-coverage包的file-coverage对象保存每个文件不同代码块的计数值以及三种类型在代码中的map 这计数代码存在的行和列。

Statements: 语句覆盖率，所有语句的执行率；

 Branches: 分支覆盖率，所有代码分支如 if、三目运算的执行率； 

Functions: 函数覆盖率，所有函数的被调用率；

 Lines: 行覆盖率，所有有效代码行的执行率

(取statement的start 如果start的count是大于0，这一行代码就是被覆盖了)

除此之外 istanbul还提供了计算结果为true分支的代码覆盖率的计算，需要开启reportLogic=true

( 二 )、istanbul如何实现覆盖率测试

istanbul-lib-instrument

istanbul-lib-coverage

(三)、istanbul会拦截什么类型的代码插入计算覆盖率的语句

istanbul不会给对象类型以及基本类型的语句添加插入语句 new表达式、AssignmentExpression赋值表达式的节点 不会有

const codeVisitor = {
    ArrowFunctionExpression: entries(convertArrowExpression, coverFunction),  
    AssignmentPattern: entries(coverAssignmentPattern),
    BlockStatement: entries(), // ignore processing only
    ExportDefaultDeclaration: entries(), // ignore processing only
    ExportNamedDeclaration: entries(), // ignore processing only
    ClassMethod: entries(coverFunction),
    ClassDeclaration: entries(parenthesizedExpressionProp('superClass')),
    ClassProperty: entries(coverClassPropDeclarator),
    ClassPrivateProperty: entries(coverClassPropDeclarator),
    ObjectMethod: entries(coverFunction),
    ExpressionStatement: entries(coverStatement),
    BreakStatement: entries(coverStatement),
    ContinueStatement: entries(coverStatement),
    DebuggerStatement: entries(coverStatement),
    ReturnStatement: entries(coverStatement),
    ThrowStatement: entries(coverStatement),
    TryStatement: entries(coverStatement),
    VariableDeclaration: entries(), // ignore processing only
    VariableDeclarator: entries(coverVariableDeclarator),
    IfStatement: entries(
        blockProp('consequent'),
        blockProp('alternate'),
        coverStatement,
        coverIfBranches
    ),
    ForStatement: entries(blockProp('body'), coverStatement),
    ForInStatement: entries(blockProp('body'), coverStatement),
    ForOfStatement: entries(blockProp('body'), coverStatement),
    WhileStatement: entries(blockProp('body'), coverStatement),
    DoWhileStatement: entries(blockProp('body'), coverStatement),
    SwitchStatement: entries(createSwitchBranch, coverStatement),
    SwitchCase: entries(coverSwitchCase),
    WithStatement: entries(blockProp('body'), coverStatement),
    FunctionDeclaration: entries(coverFunction),
    FunctionExpression: entries(coverFunction),
    LabeledStatement: entries(coverStatement),
    ConditionalExpression: entries(coverTernary),
    LogicalExpression: entries(coverLogicalExpression)
};

( 四 ) 举个🌰

以 store/index.js 为例

import mpx, { createStore } from '@mpxjs/core';
const store = (cov_1re7qjo3ii().s[0]++, createStore({
  state: {
    count: 0,
    compData: {},
    someCompShow: false
  },
  mutations: {
    setSomeCompShow(state, payload) {
      cov_1re7qjo3ii().f[0]++;
      cov_1re7qjo3ii().s[1]++;
      state.someCompShow = payload;
    },

    setCompData(state, payload) {
      cov_1re7qjo3ii().f[1]++;
      cov_1re7qjo3ii().s[2]++;
      state.compData = payload;
    }

  },
  actions: {
    requestAction({
      commit
    }, options) {
      cov_1re7qjo3ii().f[2]++;
      cov_1re7qjo3ii().s[3]++;
      return mpx.xfetch.fetch(options).then(res => {
        cov_1re7qjo3ii().f[3]++;
        cov_1re7qjo3ii().s[4]++;
        return res;
      }).then(res => {
        cov_1re7qjo3ii().f[4]++;
        cov_1re7qjo3ii().s[5]++;

        if ((cov_1re7qjo3ii().b[1][0]++, (cov_1re7qjo3ii().cov_1re7qjo3ii_temp = +res.errno === 0, (cov_1re7qjo3ii().cov_1re7qjo3ii_temp ? cov_1re7qjo3ii().bT[1][0]++ : null), cov_1re7qjo3ii().cov_1re7qjo3ii_temp)) || (cov_1re7qjo3ii().b[1][1]++, (cov_1re7qjo3ii().cov_1re7qjo3ii_temp = res.errno === undefined, (cov_1re7qjo3ii().cov_1re7qjo3ii_temp ? cov_1re7qjo3ii().bT[1][1]++ : null), cov_1re7qjo3ii().cov_1re7qjo3ii_temp))) {
          cov_1re7qjo3ii().b[0][0]++;
          cov_1re7qjo3ii().s[6]++;
          return Promise.resolve(res);
        } else {
          cov_1re7qjo3ii().b[0][1]++;
          cov_1re7qjo3ii().s[7]++;
          // 800501是支付接口的登录失效
          return Promise.reject(res);
        }
      }).catch(e => {
        cov_1re7qjo3ii().f[5]++;
        cov_1re7qjo3ii().s[8]++;
        // 错误抛出
        return Promise.reject(e);
      });
    },

    fetchCompData({
      dispatch,
      state,
      commit
    }) {
      cov_1re7qjo3ii().f[6]++;
      cov_1re7qjo3ii().s[9]++;
      return dispatch('requestAction', {
        url: '/api/somePackage/getCompData'
      }).then(res => {
        cov_1re7qjo3ii().f[7]++;
        cov_1re7qjo3ii().s[10]++;
        commit('setCompData', res.data);
      }).catch(e => {
        cov_1re7qjo3ii().f[8]++;
        cov_1re7qjo3ii().s[11]++;
        console.error('get comp data catch some error', e);
      });
    }

  }
}));

computeSimpleTotals(property) {
      let stats = this[property];

        if (typeof stats === 'function') {
            stats = stats.call(this);
        }

        const ret = {
            total: Object.keys(stats).length,
            covered: Object.values(stats).filter(v => !!v).length,
            skipped: 0
        };
        ret.pct = percent(ret.covered, ret.total);
        return ret;
    }

s: {
    '0': 1,
    '1': 1,
    '2': 12,
    '3': 12
},
f: {
   '0': 1,
   '1': 12,
   '2': 12,
   '3': 12,
   '4': 12,
   '5': 0,
   '6': 12,
   '7': 12,
   '8': 0
},
 b: { '0': [ 12, 0 ], '1': [ 12, 0 ] }, 
 _coverageSchema: '1a1c01bbd47fc00a2c39e90264f33305004495a9',
 hash: '6a8698b4d45d137a2b49a59b597ca9fd9de16f6a'
}

computeBranchTotals(property) {
        const stats = this[property];
        const ret = { total: 0, covered: 0, skipped: 0 };

        Object.values(stats).forEach(branches => {
            ret.covered += branches.filter(hits => hits > 0).length;
            ret.total += branches.length;
        });
        ret.pct = percent(ret.covered, ret.total);
        return ret;
    }

( 五 ) 某些vistor做的事情

1、忽略某部分测试代码的覆盖率

如果某些分支代码比较难测试 可以通过

https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md

比如 如果想要忽略某些分支代码

hintFor(node) {
        let hint = null;
        if (node.leadingComments) {
            node.leadingComments.forEach(c => {
                const v = (
                    c.value || /* istanbul ignore next: paranoid check */ ''
                ).trim();
                const groups = v.match(COMMENT_RE);
                if (groups) {
                    hint = groups[1];
                }
            });
        }
        return hint;
    }
function coverIfBranches(path) {
    const n = path.node;
    const hint = this.hintFor(n);
    const ignoreIf = hint === 'if';
    const ignoreElse = hint === 'else';
    const branch = this.cov.newBranch('if', n.loc);

    if (ignoreIf) {
        this.setAttr(n.consequent, 'skip-all', true);
    } else {
        this.insertBranchCounter(path.get('consequent'), branch, n.loc);
    }
    if (ignoreElse) {
        this.setAttr(n.alternate, 'skip-all', true);
    } else {
        this.insertBranchCounter(path.get('alternate'), branch);
    }
}

2、正常加入代码统计与计数代码

function coverStatement(path) {
    this.insertStatementCounter(path);
}
insertStatementCounter(path) {
        /* istanbul ignore if: paranoid check */
        if (!(path.node && path.node.loc)) {
            return;
        }
        const index = this.cov.newStatement(path.node.loc);
        const increment = this.increase('s', index, null);
        this.insertCounter(path, increment);
    }

( 六 ) visiState提供的某些方法

hintFor(node) {
        let hint = null;
        if (node.leadingComments) {
            node.leadingComments.forEach(c => {
                const v = (
                    c.value || /* istanbul ignore next: paranoid check */ ''
                ).trim();
                const groups = v.match(COMMENT_RE);
                if (groups) {
                    hint = groups[1];
                }
            });
        }
        return hint;
    }


insertStatementCounter(path) {
        /* istanbul ignore if: paranoid check */
        if (!(path.node && path.node.loc)) {
            return;
        }
        const index = this.cov.newStatement(path.node.loc);
        const increment = this.increase('s', index, null);
        this.insertCounter(path, increment);
    }

三、sourceMap问题

.ts文件会自动传入编译为js之前的代码 所以可以对应上行数，在istanbul生成列表数据的时候用到

四、目前存在的问题

example.mpx编译之后 js部分是一段字符串

components/example.mpx

目前istanbul内部没有专门针对于对象的拦截器

即便有了拦截器 js代码是一段字符串 字符串拦截器不会拦截这个这个字符串进行插入代码计算覆盖率

1.1、解决办法1

将字符串节点使用babel/parse方法将字符串编译成新的AST树，使用istanbul提供的visitor和state进行编译 ，观察到babel插件提供了不同于babel/parser之后的path路径，babel plugin提供了一个区别于babel/traverse库的traverse方法，除了第一个visitor拦截器之外，还可以穿入第二个参数visitState提供计算覆盖率以及各种方法的对象

忽略template、json 和 style 使用babel/parser的方法将js字符串代码变成ast树，将原有的path.traverse方法赋值给新的path路径，因为相当于更改了文件内容，所以会影响miniprogram-simulate对于代码的解析 没有了json的usingComponents，所以此方法行不通。

1.2、解决办法2

给istanbul原有的codeVisitor拦截器加上对于解析对象的拦截，然后将AssignmentExpression节点的right的js代码执行istanbul提供的拦截器 但是最外层是一个modules.export对象 本意是保留right然后直接赋值right 但是依然会影响miniprogram-simulate的编译

五、探究vue是如何实现代码测试的

vue编译完的代码

cov_llj2bs837.s[0]++;

(function () {
  "use strict";

  cov_llj2bs837.f[0]++;

  var _interopRequireDefault = (cov_llj2bs837.s[1]++, require("/Users/didi/Desktop/vue-jest/vue-jest-demo/node_modules/@babel/runtime/helpers/interopRequireDefault"));

  var _interopRequireWildcard = (cov_llj2bs837.s[2]++, require("/Users/didi/Desktop/vue-jest/vue-jest-demo/node_modules/@babel/runtime/helpers/interopRequireWildcard"));

  cov_llj2bs837.s[3]++;
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  cov_llj2bs837.s[4]++;
  exports.default = void 0;
  var tslib_1 = (cov_llj2bs837.s[5]++, _interopRequireWildcard(require("tslib")));

  var _vuePropertyDecorator = (cov_llj2bs837.s[6]++, require("vue-property-decorator"));

  var _utils = (cov_llj2bs837.s[7]++, _interopRequireDefault(require("@/utils")));

  var _api = (cov_llj2bs837.s[8]++, _interopRequireDefault(require("@/api")));

  cov_llj2bs837.s[9]++;
  let FetchData = class FetchData extends _vuePropertyDecorator.Vue {
    constructor() {
      cov_llj2bs837.f[1]++;
      cov_llj2bs837.s[10]++;
      super(...arguments);
      cov_llj2bs837.s[11]++;
      this.msg = '数据加载中...';
    }

    created() {
      cov_llj2bs837.f[2]++;
      cov_llj2bs837.s[12]++;
      this.getUser();
    }

    getUser() {
      cov_llj2bs837.f[3]++;
      const param = (cov_llj2bs837.s[13]++, {
        id: _utils.default.getRandomNum(1, 10)
      });
      cov_llj2bs837.s[14]++;
      console.log('param', param);
      cov_llj2bs837.s[15]++;

      _api.default.getUsers(param).then(res => {
        cov_llj2bs837.f[4]++;
        cov_llj2bs837.s[16]++;
        console.log('res', res);
        cov_llj2bs837.s[17]++;

        if (Array.isArray(res)) {
          cov_llj2bs837.b[0][0]++;
          cov_llj2bs837.s[18]++;
          this.msg = res[0].username;
        } else {
          cov_llj2bs837.b[0][1]++;
        }
      });
    }

  };
  cov_llj2bs837.s[19]++;
  FetchData = tslib_1.__decorate([(0, _vuePropertyDecorator.Component)({
    name: 'FetchData'
  })], FetchData);

  var _default = (cov_llj2bs837.s[20]++, FetchData); //# sourceMappingURL=module.jsx.map


  cov_llj2bs837.s[21]++;
  exports.default = _default;
})();

var defaultExport = (cov_llj2bs837.s[22]++, module.exports.__esModule ? (cov_llj2bs837.b[1][0]++, module.exports.default) : (cov_llj2bs837.b[1][1]++, module.exports));

var __vue__options__ = (cov_llj2bs837.s[23]++, typeof defaultExport === "function" ? (cov_llj2bs837.b[2][0]++, defaultExport.options) : (cov_llj2bs837.b[2][1]++, defaultExport));

cov_llj2bs837.s[24]++;

__vue__options__.render = function render() {
  cov_llj2bs837.f[5]++;

  var _vm = (cov_llj2bs837.s[25]++, this);

  var _h = (cov_llj2bs837.s[26]++, _vm.$createElement);

  var _c = (cov_llj2bs837.s[27]++, (cov_llj2bs837.b[3][0]++, _vm._self._c) || (cov_llj2bs837.b[3][1]++, _h));

  cov_llj2bs837.s[28]++;
  return _c('div', {
    staticClass: "fetch"
  }, [_vm._v(_vm._s(_vm.msg))]);
};

cov_llj2bs837.s[29]++;
__vue__options__.staticRenderFns = [];

六、补充

example.mpx改完之后

sourceFilePath /Users/didi/Desktop/mpx-unit-test-demo/mpx-unit-test-demo/src/components/example.mpx
generate(path) cov_r8gp6bjm4().s[0]++;
global.currentModuleId = "m/Users/didi/Desktop/mpx-unit-test-demo/mpx-unit-test-demo/src/components/example.mpx";
cov_r8gp6bjm4().s[1]++;
global.currentResource = "/Users/didi/Desktop/mpx-unit-test-demo/mpx-unit-test-demo/src/components/example.mpx";
cov_r8gp6bjm4().s[2]++;
global.currentCtor = global.Component;
cov_r8gp6bjm4().s[3]++;
global.currentCtorType = "component";
cov_r8gp6bjm4().s[4]++;
global.currentSrcMode = "wx";
cov_r8gp6bjm4().s[5]++;
global.currentInject = {
  moduleId: "m/Users/didi/Desktop/mpx-unit-test-demo/mpx-unit-test-demo/src/components/example.mpx",
  render: function render() {
    cov_r8gp6bjm4().f[0]++;
    cov_r8gp6bjm4().s[6]++;
    (cov_r8gp6bjm4().b[1][0]++, this._c("mpxShow", this.mpxShow)) || (cov_r8gp6bjm4().b[1][1]++, this._c("mpxShow", this.mpxShow) === undefined) ? (cov_r8gp6bjm4().b[0][0]++, '') : (cov_r8gp6bjm4().b[0][1]++, 'display:none;');
    cov_r8gp6bjm4().s[7]++;
    "default component content " + this._c("compData.status", this.compData.status);
    cov_r8gp6bjm4().s[8]++;

    if (this._c("successContent", this.successContent)) {
      cov_r8gp6bjm4().b[2][0]++;
      cov_r8gp6bjm4().s[9]++;

      this._c("successContent", this.successContent);
    } else {
      cov_r8gp6bjm4().b[2][1]++;
    }

    cov_r8gp6bjm4().s[10]++;

    if (this._c("timeDeferFlag", this.timeDeferFlag)) {
      cov_r8gp6bjm4().b[3][0]++;
      cov_r8gp6bjm4().s[11]++;

      this._c("timeDeferFlag", this.timeDeferFlag);
    } else {
      cov_r8gp6bjm4().b[3][1]++;
    }

    cov_r8gp6bjm4().s[12]++;

    if (this._c("someClassShowOne", this.someClassShowOne)) {
      cov_r8gp6bjm4().b[4][0]++;
    } else {
      cov_r8gp6bjm4().b[4][1]++;
    }

    cov_r8gp6bjm4().s[13]++;

    if (this._c("someClassShowTwo", this.someClassShowTwo)) {
      cov_r8gp6bjm4().b[5][0]++;
    } else {
      cov_r8gp6bjm4().b[5][1]++;
    }

    cov_r8gp6bjm4().s[14]++;

    if (this._c("someClassShowThree", this.someClassShowThree)) {
      cov_r8gp6bjm4().b[6][0]++;
    } else {
      cov_r8gp6bjm4().b[6][1]++;
    }

    cov_r8gp6bjm4().s[15]++;
    ({
      tap: [["changeSomeClassShowTwoFlag", this._c("flagValue", this.flagValue)]]
    });
    cov_r8gp6bjm4().s[16]++;

    if (this._c("compStatus", this.compStatus) === 1) {
      cov_r8gp6bjm4().b[7][0]++;
    } else {
      cov_r8gp6bjm4().b[7][1]++;
      cov_r8gp6bjm4().s[17]++;

      if (this._c("compStatus", this.compStatus) === 2) {
        cov_r8gp6bjm4().b[8][0]++;
      } else {
        cov_r8gp6bjm4().b[8][1]++;
        cov_r8gp6bjm4().s[18]++;

        if (this._c("compStatus", this.compStatus) === 3) {
          cov_r8gp6bjm4().b[9][0]++;
        } else {
          cov_r8gp6bjm4().b[9][1]++;
        }
      }
    }

    cov_r8gp6bjm4().s[19]++;

    if (this._c("someCompShow", this.someCompShow)) {
      cov_r8gp6bjm4().b[10][0]++;
    } else {
      cov_r8gp6bjm4().b[10][1]++;
    }

    cov_r8gp6bjm4().s[20]++;

    this._i(this._c("listData2", this.listData2), function (item, index) {
      cov_r8gp6bjm4().f[1]++;
      cov_r8gp6bjm4().s[21]++;
      item;
    });

    cov_r8gp6bjm4().s[22]++;

    this._r();
  }
};
/* script */

cov_r8gp6bjm4().s[23]++;
"use strict";

var _interopRequireDefault = (cov_r8gp6bjm4().s[24]++, require("@babel/runtime-corejs3/helpers/interopRequireDefault"));

var _objectSpread2 = (cov_r8gp6bjm4().s[25]++, _interopRequireDefault(require("@babel/runtime-corejs3/helpers/objectSpread2")));

var _core = (cov_r8gp6bjm4().s[26]++, require("@mpxjs/core"));

var _index = (cov_r8gp6bjm4().s[27]++, _interopRequireDefault(require("../store/index")));

cov_r8gp6bjm4().s[28]++;
(0, _core.createComponent)({
  properties: {
    successContent: {
      type: String,
      default: ''
    }
  },
  data: {
    listData2: ['手机', '电视', '电脑'],
    // 默认组件data
    someClassShowOne: false,
    someClassShowTwoFlag: false,
    key: 1,
    flagValue: true,
    timeDeferFlag: false
  },

  attached(params) {
    cov_r8gp6bjm4().f[2]++;
    cov_r8gp6bjm4().s[29]++;

    // 参数传递
    if ((cov_r8gp6bjm4().b[12][0]++, params) && (cov_r8gp6bjm4().b[12][1]++, params.key)) {
      cov_r8gp6bjm4().b[11][0]++;
      cov_r8gp6bjm4().s[30]++;
      this.key = params.key;
    } else {
      cov_r8gp6bjm4().b[11][1]++;
    }

    cov_r8gp6bjm4().s[31]++;
    this.fetchCompData();
  },

  computed: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, _index.default.mapState(['compData', 'someCompShow'])), {}, {
    someClassShowTwo() {
      cov_r8gp6bjm4().f[3]++;
      cov_r8gp6bjm4().s[32]++;
      return this.someClassShowTwoFlag;
    },

    compStatus() {
      cov_r8gp6bjm4().f[4]++;
      cov_r8gp6bjm4().s[33]++;
      return (cov_r8gp6bjm4().b[13][0]++, this.compData.status) || (cov_r8gp6bjm4().b[13][1]++, 1);
    }

  }),
  watch: {
    someClassShowOne() {
      cov_r8gp6bjm4().f[5]++;
      cov_r8gp6bjm4().s[34]++;
      this.fetchCompData('someClassShowOne');
    },

    someClassShowTwo() {
      cov_r8gp6bjm4().f[6]++;
      cov_r8gp6bjm4().s[35]++;
      this.fetchCompData('someClassShowTwo');
    }

  },
  methods: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, _index.default.mapActions(['createNumber', 'fetchCompData'])), {}, {
    changeSomeClassShowTwoFlag(flag) {
      cov_r8gp6bjm4().f[7]++;
      cov_r8gp6bjm4().s[36]++;
      this.someClassShowTwoFlag = flag;
    },

    someTimeDeferAction() {
      cov_r8gp6bjm4().f[8]++;

      var _this = (cov_r8gp6bjm4().s[37]++, this);

      cov_r8gp6bjm4().s[38]++;
      setTimeout(function () {
        cov_r8gp6bjm4().f[9]++;
        cov_r8gp6bjm4().s[39]++;
        _this.timeDeferFlag = true;
      }, 10000);
    }

  })
});

