[mdn](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)

visibilitychange当其选项卡的内容变得可见或已隐藏时，将在文档上触发该事件。

addEventListener('visibilitychange', (event) => { });

onvisibilitychange = (event) => { };


当用户导航到新页面、切换选项卡、关闭选项卡、最小化或关闭浏览器，或者在移动设备上从浏览器切换到不同的应用程序时，visibilityState此事件会触发。hidden过渡到hidden是页面可靠观察到的最后一个事件，因此开发人员应将其视为用户会话的可能结束（例如，发送分析数据）。


document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'visible') {
    backgroundMusic.play();
  } else {
    backgroundMusic.pause();
  }
});
