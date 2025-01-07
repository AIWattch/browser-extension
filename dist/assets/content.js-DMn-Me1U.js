import{s as l,g as u}from"./storage-D2uzPJPy.js";const m=new MutationObserver((o,c)=>{for(const s of o)s.type==="childList"&&s.addedNodes.forEach(n=>{if(typeof n.className=="string"&&n.className==="fixed right-4 top-8 my-2 flex max-h-[90vh] flex-col-reverse space-y-2 space-y-reverse overflow-y-auto px-2 py-4"){const e=n.innerText.replace("ChatGPT",""),t=document.querySelectorAll("article"),i=t[t.length-2],r=[];r.push({type:"inputTokens",content:i.innerText}),r.push({type:"outputTokens",content:e}),g(r)}})});m.observe(document.body,{childList:!0,subtree:!0});function g(o){console.log("ChatGPT output finished");const c=[];o.forEach(s=>{const n=h(s);c.push(n)}),Promise.all(c).then(s=>{let n={};s.forEach(e=>{let t=Object.keys(e)[0],i=Object.values(e)[0];n[t]=i}),d(n).then(e=>e).then(e=>(l({user:e}),e)).then(e=>{f(e)})}).catch(s=>{console.error(s)})}const h=function(o){return new Promise(function(c,s){o.content;const n=o.content.length,e=o.type;u("config").then(t=>{const i=n/t.charsPerToken;u("user").then(r=>{const a=r[e],p=Math.ceil(a+i);c({[e]:p})})})})},d=function(o){return new Promise(function(c,s){const n=o.inputTokens,e=o.outputTokens;u("config").then(t=>(n*t.inputFactor+e*t.outputFactor)*t.PUE*t.gridFactor).then(t=>{o.totalEmissions=t,c(o)})})},y=function(){return new Promise(function(o,c){const s="user-stats",n=document.querySelector(`#${s}`);if(n){const e=n.querySelector("span");o([n,e])}else{const e=document.createElement("div"),t=document.createElement("span");e.id=s,e.insertAdjacentElement("afterbegin",t),document.body.insertAdjacentElement("afterbegin",e),o([e,t])}})};function f(o){y().then(c=>{const s=c[0],n=c[1];if(u("ui").then(t=>{s.style.top=t.yPos,s.style.left=t.xPos}),E(s),n.textContent=`Input tokens: ${o.inputTokens} \r
`,n.textContent+=`Output tokens: ${o.outputTokens} \r
`,n.textContent+=`Total emissions: ${o.totalEmissions.toString().substring(0,6)}gCO2e \r
`,!document.querySelector(".reset-btn")){const t=document.createElement("img");t.className="reset-btn",t.src=chrome.runtime.getURL("../assets/reset.svg"),t.addEventListener("mouseup",function(i){const r={};r.user={},r.user.inputTokens=0,r.user.outputTokens=0,r.user.totalEmissions=0,l(r).then(a=>{console.log("cleared storage OK"),f(r.user)}).catch(a=>{console.log(a)})},!0),s.appendChild(t)}})}const T=function(){return new Promise(function(o,c){["ui","config","user","system"].forEach(n=>{u(n).then(e=>{console.log(`${n} values loaded OK`),console.log(e),n==="user"&&f(e)}).catch(e=>{if(e==="emptyKey"){console.log(`No ${n} values found`);const t={};n==="user"?(t.user={},t.user.inputTokens=0,t.user.outputTokens=0,t.user.totalEmissions=0):n==="config"?(t.config={},t.config.charsPerToken=4,t.config.gridFactor=383,t.config.inputFactor=1e-7,t.config.outputFactor=2e-7,t.config.PUE=1.125):n==="ui"?(t.ui={},t.ui.xPos="68%",t.ui.yPos="70%"):n==="system"&&(t.system={},t.system.chromeVersion=k()),l(t).then(i=>{console.log(`${n} values saved OK`)})}else console.error(e)})})})};T();function E(o){let c,s=[0,0],n=!1;o.addEventListener("mousedown",function(e){n=!0,s=[o.offsetLeft-e.clientX,o.offsetTop-e.clientY]},!0),document.addEventListener("mouseup",function(){n=!1;const e={};e.ui={},e.ui.xPos=o.style.left,e.ui.yPos=o.style.top,l(e).then(t=>{console.log("ui position updated OK")})},!0),document.addEventListener("mousemove",function(e){e.preventDefault(),n&&(c={x:e.clientX,y:e.clientY},o.style.left=c.x+s[0]+"px",o.style.top=c.y+s[1]+"px")},!0)}function k(){var o=navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);return o?parseInt(o[2],10):!1}
