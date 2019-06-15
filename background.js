chrome.app.runtime.onLaunched.addListener(() => {
  chrome.app.window.create('app.html', {
    innerBounds: { width: 600, height: 400 }
  });
});
