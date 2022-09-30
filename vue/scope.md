CSS 属性选择器通过已经存在的属性名或属性值匹配元素。

/* 存在 title 属性的<a> 元素 */
a[title] {
  color: purple;
}

编译时，会给每个vue文件生成一个唯一的id，会将此id添加到当前文件中所有html的标签上
如<div class="demo"></div>会被编译成<div class="demo" data-v-27e4e96e></div>
2）编译style标签时，会将css选择器改造成属性选择器，如.demo{color: red;}会被编译成.demo[data-v-27e4e96e]{color: red;}
