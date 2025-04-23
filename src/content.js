import "./content.css"
import {getStorage, saveToStorage} from "./storage"

let seenMessages = new Set();

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === 'ARTICLE' && !seenMessages.has(node)) {
          seenMessages.add(node);

          const content = node.innerText.replace("ChatGPT", "").trim();
          if (!content) return;

          const isOutput = node.querySelector('div.markdown') !== null;

          outputFinished([
            {
              type: isOutput ? 'outputTokens' : 'inputTokens',
              content: content
            }
          ]);
        }
      });
    }
  }
});

const mainArea = document.querySelector("main");
if (mainArea) {
  observer.observe(mainArea, { childList: true, subtree: true });
}

function outputFinished(textNodes) {
  console.log('ChatGPT output finished')

  // Calculate both input/output token count
  const allTokens = []
  textNodes.forEach((node) => {
    const token = calcTokens(node)
    allTokens.push(token)
  })

  // Combine both token ammounts in to one object
  Promise.all(allTokens).then((res) => {
    let obj = {}
    res.forEach((r) => {
      let objName = Object.keys(r)[0]
      let objValue = Object.values(r)[0]
      obj[objName] = objValue
    })

    // Make all emission based calculations
    calcEmissions(obj).then((res) => {
      return res
    }).then((r) => {
      saveToStorage({'user' : r})
      return r
    }).then((r) => {
      updateUI(r)
    })

  }).catch((err) => {
    console.error(err)
  })
}

const calcTokens = function(textNode) {
  return new Promise(function (resolve, reject) {

    const msgContent = textNode.content
    const msgLength = textNode.content.length
    const msgType = textNode.type 

    let prevTokens = 0

    // Get previous stored user data for calculations
    getStorage('config').then((r) => {
      const newTokens = msgLength / r.charsPerToken.value

      getStorage('user').then((userObj) => {
        const prevTokens = userObj[msgType]
        const updatedTokens = Math.ceil(prevTokens + newTokens)
        resolve({[msgType] : updatedTokens})
      })
    })
  })
}

const calcEmissions = function(obj) {
  return new Promise(function (resolve, reject) {

    const inputTokens = obj["inputTokens"]
    const outputTokens = obj["outputTokens"]

    // Equations for emission calculations
    getStorage('config').then((r) => {
      const totalEnergy = (inputTokens * r.inputFactor.value + outputTokens * r.outputFactor.value) * r.PUE.value
      const totalEmissions = totalEnergy * r.gridFactor.value
      return totalEmissions
    }).then((r) => {
      obj["totalEmissions"] = r 
      resolve(obj)
    })
  })
}

// Check if UI already exists or not
const getUI = function() {
  return new Promise(function (resolve, reject) {

    const parentId = "user-stats"
    const parentExists = document.querySelector(`#${parentId}`)

    if (parentExists) {
      const statsElem = parentExists.querySelector('span')

      resolve([parentExists, statsElem])
    } else {
      const parentDiv = document.createElement('div')
      const statsElem = document.createElement('span')
      parentDiv.id = parentId 
      parentDiv.insertAdjacentElement('afterbegin', statsElem)
      document.body.insertAdjacentElement('afterbegin', parentDiv)

      resolve([parentDiv, statsElem])
    }
  })
}

function updateUI(obj) {

  // Stops firing internally
  if (window.location.href.startsWith("chrome-extension://")) return

  getUI().then((res) => {
    const parentDiv = res[0]
    const statsElem = res[1]

    getStorage('ui').then((r) => {
      parentDiv.style.top = r.yPos
      parentDiv.style.left = r.xPos
    }).catch((err) => {
      if (err === 'emptyKey') {
        initConfig('ui')
      } else {
        console.error(err)
      }
    })

    handleMouse(parentDiv)

    const calcMiles = (obj.totalEmissions / 400).toString().substring(0,4)

    statsElem.textContent = `Input tokens: ${obj.inputTokens} \r\n`
    statsElem.textContent += `Output tokens: ${obj.outputTokens} \r\n`
    statsElem.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)} gCO2e \r\n`
    statsElem.textContent += `🚗 Your AI drive: ${calcMiles} miles\r\n`

    const checkResetBtn = document.querySelector('.reset-btn')

    // Reset user data to zero with 'Reset button'
    if (!checkResetBtn) {
      const resetBtn = document.createElement('img')
      resetBtn.className = 'reset-btn'
      resetBtn.src = chrome.runtime.getURL('../assets/reset.svg')

      resetBtn.addEventListener('mouseup', function(e) {
        const obj = {}
        obj['user'] = {}
        obj['user']['inputTokens'] = 0
        obj['user']['outputTokens'] = 0
        obj['user']['totalEmissions'] = 0

        saveToStorage(obj).then((s) => {
          console.log('cleared storage OK')
          updateUI(obj.user)
        }).catch((err) => {
          console.log(err)
        })
      }, true)

      parentDiv.appendChild(resetBtn)
    }
  })
}

export const doInitConfig = function() {
  return new Promise(function (resolve, reject) {
    const allKeys = []
    const storageKeys = ['ui','config','user', 'system']

    // Get all storage data for each key
    storageKeys.forEach((key) => {
      allKeys.push = initConfig(key)
    })

    // Process each key of data
    Promise.all(allKeys).then((res) => {
      resolve(res)
    }).catch((err) => {
      console.error(err)
    })
  })
}

const initConfig = function(value) {
  return new Promise(function (resolve, reject) {
    getStorage(value).then((r) => {
      console.log(`${value} values loaded OK`)
      console.log(r)

      if (value === 'user') {
        updateUI(r)
      }
    }).catch((err) => {
      if (err === "emptyKey") {
        console.log(`No ${value} values found`)

        // Default values for all config data
        const obj = {}
        if (value === 'user') {
          obj['user'] = {}
          obj['user']['inputTokens'] = 0
          obj['user']['outputTokens'] = 0
          obj['user']['totalEmissions'] = 0
        } else if (value === 'config') {
          obj['config'] = {}
          obj['config']['charsPerToken'] = {
            value: 4,
            unit: '',
            label: 'Characters Per Token'
          }
          obj['config']['gridFactor'] = {
            value: 383,
            unit: 'gCO2e/kWh',
            label: 'Grid Factor' 
          }
          obj['config']['inputFactor'] = {
            value: 0.000002,
            unit: 'kWh/token',
            label: 'Input Token Factor'
          }
          obj['config']['outputFactor'] = {
            value: 0.00001,
            unit: 'kWh/token',
            label: 'Output Token Factor'
          }
          obj['config']['PUE'] = {
            value: 1.2,
            unit: '',
            label: 'Power Usage Efficiency'
          }
        } else if (value === 'ui') {
          obj['ui'] = {}
          obj['ui']['xPos'] = "68%" 
          obj['ui']['yPos'] = "70%"
        } else if (value === 'system') {
          obj['system'] = {}
          obj['system']['chromeVersion'] = getChromeVersion()
        }

        saveToStorage(obj).then((s) => {
          console.log(`${value} values saved OK`)
          resolve(s)
        })
      } else {
        console.error(err)
      }
    })
  })
}

doInitConfig()

// Handle drag/drop logic
function handleMouse(div) {
  let mousePosition
  let offset = [0,0]
  let isDown = false

  div.addEventListener('mousedown', function(e) {
    isDown = true
    offset = [
      div.offsetLeft - e.clientX,
      div.offsetTop - e.clientY
    ]
  }, true)

  document.addEventListener('mouseup', function() {
    isDown = false

    const obj = {}
    obj['ui'] = {}
    obj['ui']['xPos'] = div.style.left
    obj['ui']['yPos'] = div.style.top

    saveToStorage(obj).then((s) => {
      console.log("ui position updated OK")
    })
  }, true)

  document.addEventListener('mousemove', function(event) {
    event.preventDefault()
    if (isDown) {
      mousePosition = {

        x : event.clientX,
        y : event.clientY

      }
      div.style.left = (mousePosition.x + offset[0]) + 'px'
      div.style.top  = (mousePosition.y + offset[1]) + 'px'
    }
  }, true)
}

function getChromeVersion () {     
  var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : false;
}
