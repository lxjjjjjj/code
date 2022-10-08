// 原文链接 https://juejin.cn/post/6844903988647690254
// 闭包 + 循环的方式
function compose(funs) {
    var combin = null;
    for (var i = 0; i < funs.length; i++) {
      combin = (function(i, combin) {
        return combin
          ? function(args) {
              return combin(funs[i](args));
            }
          : function(args) {
              return funs[i](args);
            };
      })(i, combin);
    }
    return combin;
  }
  function compose(funs) {
    var len = funs.length;
    var index = len - 1;
    return function() {
      var result = len ? funs[index].apply(this, arguments) : arguments[0];
      while (--index >= 0) {
        result = funs[index].call(this, result);
      }
      return result;
    };
  }

// 闭包 + 递归方式


function compose(funs) {
    var len = funs.length;
    var index = len - 1;
    return function() {
      var result = len ? funs[index].apply(this, arguments) : arguments[0];
      while (--index >= 0) {
        result = funs[index].call(this, result);
      }
      return result;
    };
  }