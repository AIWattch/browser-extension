import"./modulepreload-polyfill-B5Qt9EMX.js";import{g as o}from"./storage-DDbOanX3.js";function s(){o("user").then(t=>{const e=document.querySelector(".stats"),n=(t.totalEmissions/400).toString().substring(0,3);e.textContent=`Input tokens: ${t.inputTokens}\r
`,e.textContent+=`Output tokens: ${t.outputTokens}\r
`,e.textContent+=`Total emissions: ${t.totalEmissions.toString().substring(0,6)} gCO2e\r

`,e.textContent+=`🚗 Your AI drive: ${n} miles\r
`})}const r=document.querySelector("#more-info");r.href=chrome.runtime.getURL("./src/how-does-it-work.html");const i=document.querySelector("#admin-page");i.href=chrome.runtime.getURL("./src/admin.html");s();
