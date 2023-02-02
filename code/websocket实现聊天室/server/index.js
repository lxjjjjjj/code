// 后端在编写之前要先安装ws模块，打开控制台输入 npm i ws -s

const ws = require('ws');
;((ws)=>{
    const server = new ws.Server({port:8000});
    const init = () => {
        bindEvent();
    }

    function bindEvent() {
        server.on('open',handleOpen);
        server.on('close',handleClose);
        server.on('error',handleError);
        server.on('connection',handleConnection);
    }
    function handleOpen(){
        console.log('WebSocket open');
    }
    function handleClose(){
        console.log('WebSocket close');
    }
    function handleError(){
        console.log('WebSocket error');
    }
    function handleConnection(ws){
        console.log('WebSocket connection');
        ws.on('message',handleMessage);
    }
    function handleMessage(msg){
        console.log('WebSocket message');
        console.log(msg);
        server.clients.forEach(function(c){
            c.send(msg);
        })
    }
    init();
})(ws);


// 1.message事件存放于connection事件的参数里的，所以要在connection中绑定message事件。
// 2.connection就是代表通信是否连接成功的事件。
// 3.message的参数就是前端传过来的信息。
// 4.然后要做的就是把接收到的前端信息分发聊天室所有的人。
// 5.在代码的最顶部，我们实例化了一个ws模块的Server对象。
// 6.Server对象里有一个clients属性，所有登录在聊天室的人都挂载在这个clients属性上。
// 7.所以我们只需要forEach循环把接收到的前端信息分发给每一个人即可。
// 8.其实到现在为止我们就完成了一个最基本的基于WebSocket技术的原生JavaScript实现的聊天室。
