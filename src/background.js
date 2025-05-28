// Get message from admin console and send to current ChatGPT session
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  let tabs = await chrome.tabs.query({})
  tabs.forEach(function (tab) {
    if (tab.url.includes("chatgpt.com") && msg.type === "updateConfig") {
      chrome.tabs.sendMessage(tab.id, {type: "updateConfig", config: msg.config})
    }
  })
})
