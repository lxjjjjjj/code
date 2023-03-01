该window.postMessage()方法安全地启用对象之间的跨域通信Window；例如，在页面和它生成的弹出窗口之间，或者在页面和嵌入其中的 iframe 之间。

通常，当且仅当它们源自的页面共享相同的协议、端口号和主机（也称为“同源策略”） 时，允许不同页面上的脚本相互访问。window.postMessage()提供了一种受控机制来安全地规避此限制（如果使用得当）。

从广义上讲，一个窗口可以获得对另一个窗口的引用（例如，通过 targetWindow = window.opener），然后 MessageEvent在其上使用 调度一个targetWindow.postMessage()。然后接收窗口可以根据需要自由处理此事件。window.postMessage() 传递给（即“消息”）的参数通过事件对象暴露给接收窗口。

postMessage(message, targetOrigin)
postMessage(message, targetOrigin, transfer)

参数

message
要发送到其他窗口的数据。使用结构化克隆算法对数据进行序列化 。这意味着您可以将各种数据对象安全地传递到目标窗口，而不必自己序列化它们。

targetOrigin
指定此窗口的来源必须是要分派的事件，可以是文字字符串"*"（表示无首选项）或 URI。如果在计划调度事件时此窗口文档的方案、主机名或端口与中提供的不匹配targetOrigin，则不会调度事件；只有当所有三个都匹配时，事件才会被调度。该机制提供了对消息发送位置的控制；例如，如果postMessage()用于传输密码，则此参数必须是一个 URI，其来源与包含密码的消息的预期接收者相同，以防止恶意第三方拦截密码。如果您知道其他窗口的文档应该位于何处，请始终提供特定的targetOrigin，而不是。*未能提供特定目标会泄露您发送到任何感兴趣的恶意站点的数据。

transfer 选修的
与消息一起传输的 一系列可传输对象。这些对象的所有权交给了目标端，它们在发送端不再可用。

无返回值


# 派发的事件
window.addEventListener("message", (event) => {
  if (event.origin !== "http://example.org:8080")
    return;

  // …
}, false);

派发消息的属性是：

data
从另一个窗口传递的对象。

origin
调用了当时发送消息的窗口的来源 。postMessage该字符串是协议和“://”、主机名（如果存在）和“:”的串联（如果端口存在并且与给定协议的默认端口不同）。典型来源的示例是https://example.org（暗示 port 443），http://example.net（暗示 port 80）和http://example.com:8080。请注意，不能保证此原点是该窗口的当前或未来原点，该窗口 postMessage 自调用以来可能已导航到其他位置。

source
window对发送消息的对象 的引用；您可以使用它在两个不同来源的窗口之间建立双向通信。