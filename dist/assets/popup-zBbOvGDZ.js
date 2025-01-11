import"./modulepreload-polyfill-B5Qt9EMX.js";import{g as s,d as r}from"./content-BbUgYAyj.js";function n(){s("user").then(t=>{const e=document.querySelector(".stats"),o=(t.totalEmissions/400).toString().substring(0,4);e.textContent=`Input tokens: ${t.inputTokens}\r
`,e.textContent+=`Output tokens: ${t.outputTokens}\r
`,e.textContent+=`Total emissions: ${t.totalEmissions.toString().substring(0,6)} gCO2e\r

`,e.textContent+=`🚗 Your AI drive: ${o} miles\r
`}).catch(t=>{t==="emptyKey"?r().then(e=>{n()}):console.log(t)})}const i=document.querySelector("#more-info");i.href=chrome.runtime.getURL("./src/how-does-it-work.html");const m=document.querySelector("#admin-page");m.href=chrome.runtime.getURL("./src/admin.html");n();
