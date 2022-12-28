[原文链接](https://juejin.cn/post/6978728619782701087)
# 定性区别
观察者是经典软件设计模式中的一种，但发布订阅只是软件架构中的一种消息范式。

# 组成区别

观察者模式本身只需要2个角色便可成型，即观察者和被观察者，其中被观察者是重点。
发布订阅需要至少3个角色来组成，包括发布者、订阅者和发布订阅中心，其中发布订阅中心是重点。

# 各自实现

## 观察者模式实现
观察者模式一般至少有一个可被观察的对象 Subject ，可以有多个观察者去观察这个对象。二者的关系是通过被观察者主动建立的，被观察者至少要有三个方法——添加观察者、移除观察者、通知观察者。当被观察者将某个观察者添加到自己的观察者列表后，观察者与被观察者的关联就建立起来了。此后只要被观察者在某种时机触发通知观察者方法时，观察者即可接收到来自被观察者的消息。

被观察者
```
class Subject {

  constructor() {
    this.observerList = [];
  }

  addObserver(observer) {
    this.observerList.push(observer);
  }

  removeObserver(observer) {
    const index = this.observerList.findIndex(o => o.name === observer.name);
    this.observerList.splice(index, 1);
  }

  notifyObservers(message) {
    const observers = this.observeList;
    observers.forEach(observer => observer.notified(message));
  }

}
```
观察者
```
class Observer {

  constructor(name, subject) {
    this.name = name;
    if (subject) {
      subject.addObserver(this);
    }
  }

  notified(message) {
    console.log(this.name, 'got message', message);
  }

}
```
```
const subject = new Subject();
const observerA = new Observer('observerA', subject);
const observerB = new Observer('observerB');
subject.addObserver(observerB);
subject.notifyObservers('Hello from subject');
subject.removeObserver(observerA);
subject.notifyObservers('Hello again');
```
上面的代码分别实现了观察者和被观察者的逻辑，其中二者的关联有两种方式：

观察者主动申请加入被观察者的列表
被观察者主动将观察者加入列表

前者会在观察者对象创建之初显式声明要被加入到被观察者的通知列表内，后者则是在观察者创建实例后由被观察者主动将其添加进列表。

## 发布订阅

发布订阅核心基于一个中心来建立整个体系。其中发布者和订阅者不直接进行通信，而是发布者将要发布的消息交由中心管理，订阅者也是根据自己的情况，按需订阅中心中的消息。

让我们来想象一下邮件系统，你可以作为订阅者订阅某个网站的通知，邮件系统在其中充当发布订阅中心的角色，而发布者则是你订阅的网站。
整个链路是从你的订阅开始，虽然在你订阅之前，别人可能已经订阅过某些网站并不断接收来自网站更新所发出的消息。你的订阅动作是在某个你想订阅的网站填入自己的邮箱，如果这一步以邮件系统为中心，那么则是在的邮箱内记录这个网站信息，后续当网站有内容更新时，邮件系统会及时接收到并向你发送邮件，以达到通知你这个订阅者的目的。

1）降级为观察者模式

这里说的是以邮件系统为中心，假如以网站为中心，那么你对于网站就相当于一个观察者，你希望观察网站的一举一动，即网站内容的更新。那么订阅动作本身便成了你让网站将你的邮箱加入网站维护的观察者列表。这样当网站有内容更新后，便会通知所有观察者，也就是订阅者，这时发布订阅模型则退化成了观察者模式。

2）升级为发布订阅
可以看出，此时网站和用户间其实是有耦合的，也就是网站除了要维护自身功能外，还需要维护订阅者列表，并且在内容更新后完成通知工作。这样在用户和网站之间有一部分关系是维护在网站内部的。如果网站想把这部分任务抽离出来，自然便恢复至发布订阅模型，即建立单独的消息中心来管理发布者和订阅者之间的关系以及接收变化和通知消息的工作。

经过这样的对比，我们可以知道为什么要区分观察者模式和发布订阅，以及它们之间的差别。

3）与观察者模式的关联

但区别在于观察者模式中的被观察者需要在每次自身改变后都绑定式地触发对观察者的通知，因为这是观察者模式这一模式所要实现的核心，也就是类似事件处理系统的机制，**被观察者有义务针对自身的变化给出响应式的反馈到观察者们，这就是为什么说观察者模式是松耦合的，因为被观察者的功能不纯粹，要包含一部分观察者和自身关系的逻辑。**
而发布订阅与之的区别在于，因为发布者把消息通知的权限交由发布订阅中心管理，发布者只需关心自身的发布逻辑，而不会直接和其所发布内容的订阅者直接通信。订阅者也如此，其只关心向发布订阅中心注册自己想要接收通知的栏目，并实现自己在接收到通知后的逻辑，而无需关心消息来自何方，发布者是谁。因此**发布者和订阅者由于发布订阅中心的出现而完全解耦。**
由于发布订阅中心这一中间层的出现，对于生产方和消费方的通信管理变得更加的可管理和可拓展。比如这样同样可以实现通过观察者模式实现的事件机制，即消息中心在接收到新的消息发布后即时通知到该类目下的所有订阅者，只不过此时的发布者与消息中心的关系为一对一，并且消息中心与订阅者为一对多，消息中心只相当于发布者的一层代理。

发布订阅中心

```
class PubSub {
  constructor() {
    this.messages = {};
    this.listeners = {};
  }
  publish(type, content) {
    const existContent = this.messages[type];
    if (!existContent) {
      this.messages[type] = [];
    }
    this.messages[type].push(content);
  }
  subscribe(type, cb) {
    const existListener = this.listeners[type];
    if (!existListener) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(cb);
  }
  notify(type) {
    const messages = this.messages[type];
    const subscribers = this.listeners[type] || [];
    subscribers.forEach((cb, index) => cb(messages[index]));
  }
}
```
发布者
```
class Publisher {
  constructor(name, context) {
    this.name = name;
    this.context = context;
  }
  publish(type, content) {
    this.context.publish(type, content);
  }
}

```
订阅者
```
class Subscriber {
  constructor(name, context) {
    this.name = name;
    this.context = context;
  }
  subscribe(type, cb) {
    this.context.subscribe(type, cb);
  }
}

```
使用
```
const TYPE_A = 'music';
const TYPE_B = 'movie';
const TYPE_C = 'novel';

const pubsub = new PubSub();

const publisherA = new Publisher('publisherA', pubsub);
publisherA.publish(TYPE_A, 'we are young');
publisherA.publish(TYPE_B, 'the silicon valley');
const publisherB = new Publisher('publisherB', pubsub);
publisherB.publish(TYPE_A, 'stronger');
const publisherC = new Publisher('publisherC', pubsub);
publisherC.publish(TYPE_C, 'a brief history of time');

const subscriberA = new Subscriber('subscriberA', pubsub);
subscriberA.subscribe(TYPE_A, res => {
  console.log('subscriberA received', res)
});
const subscriberB = new Subscriber('subscriberB', pubsub);
subscriberB.subscribe(TYPE_C, res => {
  console.log('subscriberB received', res)
});
const subscriberC = new Subscriber('subscriberC', pubsub);
subscriberC.subscribe(TYPE_B, res => {
  console.log('subscriberC received', res)
});

pubsub.notify(TYPE_A);
pubsub.notify(TYPE_B);
pubsub.notify(TYPE_C);
```