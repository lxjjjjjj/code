在vuejs中，很多功能依赖渲染器来实现，例如Transition、Teleport、Suspense组件，template ref 以及自定义指令。
渲染器也是框架性能的核心。渲染器的实现直接影响框架的性能。vuejs的渲染器不仅仅包含传统的diff算法，还独创了快捷路径的更新方式。能够充分利用编译器提供的信息大大提升更新性能。响应式系统更是要和渲染器相关联。

// 为什么要专门有一个createRenderer，因为渲染器要做成和平台无关的api。所以在渲染器内部有很多浏览器相关的api通过options的方式传入，这样才能做到渲染器和平台无关。渲染器和渲染不同，渲染只是一个动作，渲染器是一个对象
const renderer = createRenderer({
    createElement(tag) {
        return document.createElement(tag)
    },
    setElementText(el, text) {
        el.textContext = text
    },
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor)
    },
    function render(vnode, container) {
        if(vnode) {
            // 新 node 存在，将其与旧node一起传递给patch函数，进行打补丁
            patch(container._vnode, vnode, container)
        }  else {
            // 旧node存在但是新node不存在，就卸载
            if(container._vnode) {
                container.innerHTML = ''
                // 这样的卸载操作是不严谨的，原因有三点
                // 1.容器中的内容可能是由某个或者多个组件渲染的，当卸载操作发生时，应该正确的调用这些组件的beforeUnMount、unmount等生命周期
                // 2.即使内容不是由组件渲染的，有的元素存在自定义指令，我们应该在卸载操作发生时正确执行对应指令的钩子函数
                // 3.使用innerHTML清空容器元素内容的另一个缺陷就是它不会移除绑定在DOM元素上的事件处理函数
                // 所以我们应该拿到元素的node之后在父组件中remove调
                function unmount(vnode) {
                    const parent = vnode.el.parentNode
                    if(parent) {
                        parent.removeChild(vnode.el)
                    }
                }
            }
        }
        container._vnode = vnode
    }
    // 将属性设置相关操作封装到patchProps函数中，并作为渲染器选项传递
    patchProps(el, key, prevValue, nextValue) {
        // 因为有的属性是只读属性，所以不支持设置
        function shouldSetAsProps(el, key, value) {
            if(key === 'form' && el.tagName === 'INPUT') return false
            return key in el
        }
        // 因为HTML Attributes 和 DOM properties 不是一一对应的关系，比如
        // <div class> -> el.className
        // HTML Attributes只维护元素初始值，所以需要提前设置el.xxx来初始化html attributes。并且对于html attrbutes是boolean值的情况 不论什么string都会是true，所以需要特殊处理
        if(shouldSetAsProps(el, key, nextValue)) {
            const type = typeof el[key]
            if(type === 'boolean' && nextValue === '') {
                el[key] = true
            } else {
                el[key] = nextValue
            }
        } else {
            el.setAttribute(key, nextValue)
        }
    },
    function mountElement(vnode, container) {
        const el = createElement(vnode.type)
        if(typeof vnode.children === 'string'){
            setElementText(el, vnode.children)
        } else if(Array.isArray(vnode.children)) {
            vnode.children.forEach(child => {
                patch(null, child, el)
            })
        }
        if(vnode.props) {
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }
        insert(el, container)
    }
})

function createRenderer(options) {
    const {
        createElement,
        insert,
        setElementText
    } = options
    // 在这个作用域下可以定义访问哪些api
    function mountElement(vnode, container) {
        // ...
    }
}

对class的处理
方式一: 指定class为一个字符串<p class="foo bar"></p>
对应的vnode是const vnode = {
    type: 'p',
    props: {
        class: 'foo bar'
    }
}
方式二: 指定class为一个对象<p :class="cls"></p>
const cls = { foo: true, bar: false }
对应的vnode是const vnode = {
    type: 'p',
    props: {
        class: { foo: true, bar: false }
    }
}
方式三: 指定class是包含上述两种类型的数组<p :class="arr"></p>
const arr = [
   {
       'foo bar',
       baz: true
   }
]
对应的vnode是const vnode = {
    type: 'p',
    props: {
        class: [
            'foo bar',
            { baz: true }
        ]
    }
}
我们需要处理
const vnode = {
    type: 'p',
    props: {
        class: normalizeClass([
            'foo bar',
            { baz: true }
        ])
    }
}
对于浏览器中三种设置class的方法(el.className, setAttribute, el.classList) 通过设置1000次样式之后的对比发现el.className的性能最好。于是实现如下


patchProps(el, key, prevValue, nextValue) {
    // ...
    if(key === 'class'){
        el.className = nextValue
    }
    // ...
}


如何处理事件

一般做法是在添加新事件之前remove事件然后再添加但是这样耗费性能所以设置一个函数用来保存调用函数，每次更新只要替换函数就可以了，同时需要考虑一个元素绑定了多个不同事件，和一个元素的一个事件绑定了多次的情况。

事件冒泡与更新时机的问题，

如果父元素上的事件是通过一个响应式数据控制的，一开始响应式值为false，不会触发父元素事件绑定，子元素也有事件绑定没有任何控制条件，点击子元素将响应式的值变为true，此刻理论上父元素还没绑定事件不会被触发click，但是此刻父元素的click事件被触发了，也就是说 父元素的绑定事件发生在了事件冒泡之前。能否将绑定事件的动作放到冒泡发生之后，但是我们不清楚事件冒泡何时结束。vuejs的更新不是在一个异步的微任务队列中进行的吗，那不是自然能够避免这个问题？其实不是，微任务会穿插在由事件冒泡触发的多个事件处理函数之间交叉运行。即使把绑定事件的动作放到微任务队列中执行，也无法避免这个问题。

回顾一下点击子元素之后发生的事情

点击子元素 -》 子元素的事件处理函数执行 -》副作用函数重新执行 -》 渲染器 -》为父元素绑定事件 -》父元素的事件处理函数执行。

事件触发的时间要早于事件处理函数被绑定的时间。这意味着当一个事件触发时，目标元素上还没有绑定相关的事件处理函数，我们可以根据这个特点来解决问题。屏蔽所有绑定时间晚于事件触发时间的事件处理函数的执行。所以事件处理函数该城

patchProps(el, key, prevValue, nextValue) {
    // ...
    if(/^on/.test(key)) {
        const invokers = el._vel || (el._vel = {})
        let invoker = invokers[key]
        const name = key.slice(2).toLowerCase()
        if(nextValue) {
            if(!invoker) {
                invoker = el._vei[key] = (e) => {
                    // e.timestamp是事件执行时间，如果早于事件绑定时间，则不执行事件处理函数
                    if(e.timestamp < invoker.attached) return
                    if(Array.isArray(invoker.value)) {
                        invoker.value.forEach(fn => fn(e))
                    } else {
                        invoker.value(e)
                    }
                }
                invoker.value = nextValue
                invoker.attached = performance.now()
                el.addEventListener(name,invoker)
            }else {
                invoker.value = nextValue
            }
        } else if(invoker) {
            el.removeEventListener(name, invoker)
        }
    }
    // ...
}

