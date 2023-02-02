

  // 初始化EventBus
  let EB = new EventBus();


  // 订阅事件
  EB.$on('key1', (name, age) => {
    console.info("我是订阅事件A:", name, age);
  })
  EB.$once("key1", (name, age) => {
    console.info("我是订阅事件B:", name, age);
  })
  EB.$on("key2", (name) => {
    console.info("我是订阅事件C:", name);
  })


  // 发布事件key1
  EB.$emit('key1', "小猪课堂", 26);
  console.info("在触发一次key1")
  EB.$emit('key1', "小猪课堂", 26);
  // 发布事件
  EB.$emit('key2', "小猪课堂");

  
