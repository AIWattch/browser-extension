import "./content.css"
import {getStorage, saveToStorage} from "./storage"

// Init time-based variables
let hasStarted = false
let genImage = false
let startTime, firstTokenTime, lastTokenTime

function setStartTime() {
  startTime = Date.now() / 10000

  // Slight delay to not trigger the final time-based calc step
  setTimeout(() => {
    hasStarted = true
  }, 100)
}

// Wait for any DOM element to be changed
const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((e) => {

        if (!genImage && e.innerText && e.innerText.includes("Processing image")) {
          genImage = true
          console.log("Images not supported yet")
        }

        if (typeof e.className === "string" && e.hasAttributes() && e.getAttribute("aria-label") === "Generated image") {
          genImage = false
        }

        // Check if user presses Enter key within text prompt field
        if (typeof e.className === "string" && e.hasAttributes() && e.getAttribute("id") === "prompt-textarea") {
          e.addEventListener("keydown", (key) => {
            if (key.code === "Enter") {
              setStartTime()
            }
          })
        }

        // Check if user clicks on "send prompt" button
        if (typeof e.className === "string" && e.hasAttributes() && e.getAttribute("data-testid") === "send-button") {

          e.addEventListener("click", () => {
            setStartTime()
          })
        }

        if (typeof e.className === "string" && e.hasAttributes() && e.getAttribute("data-message-author-role") === "assistant") {
          firstTokenTime = Date.now() / 10000
        }

        // Wait until the "submit" button is available again
        if (hasStarted && typeof e.className === "string" && e.hasAttributes() && e.getAttribute("data-testid") === "composer-speech-button-container") {

          hasStarted = false

          // Check if "submit" button internal state has changed - this tells us the response has finished
          if (!genImage && e.children[0] && e.children[0].getAttribute("data-state") === "closed") {

            const allNodes = document.querySelectorAll('article');
            lastTokenTime = Date.now() / 10000

            // Calculate timestamp math
            getStorage('config').then((r) => {
              const initialPhase = firstTokenTime - startTime;
              const streamingPhase = lastTokenTime - firstTokenTime;
              const compTime = streamingPhase + (initialPhase * r.networkLatency.value)
              // console.log(`${streamingPhase} + ${initialPhase} * ${r.networkLatency.value}`)

              if (allNodes.length !== 0) {
                const outputNode = allNodes[allNodes.length - 1];

                const outputText = outputNode.innerText.replace("ChatGPT said:","");
                const inputText = allNodes[allNodes.length - 2];
                const textNodes = [];
                textNodes.push({'type': 'inputTokens', 'content': inputText.innerText});
                textNodes.push({'type': 'outputTokens', 'content': outputText});

                outputFinished(textNodes, compTime)
              }
            });
          }
        }
      })
    } 
  }
})

observer.observe(document.body, { childList: true, subtree: true })

function outputFinished(textNodes, compTime) {
  console.log('ChatGPT output finished')

  // Calculate both input/output token count
  const allTokens = []
  textNodes.forEach((node) => {
    const token = calcTokens(node)
    allTokens.push(token)
  })

  // Combine both token ammounts in to one object
  Promise.all(allTokens).then((res) => {
    let mergedTokens = {}
    res.forEach((r) => {
      let objName = Object.keys(r)[0]
      let objValue = Object.values(r)[0]
      mergedTokens[objName] = objValue
    })

    getStorage('system').then((r) => {
      // Determine which calculation method to use
      if (r.calcMethod === "timeBased") {
        // Make all time based calculations
        calcTime(compTime)
          .then((energyUsed) => calcTimeEmissions(energyUsed))
          .then((timeEmissions) => sumTimeEmissions(compTime, timeEmissions))
          .then((sumTimes) => {
            saveToStorage({'user': sumTimes})
            return sumTimes
          }).then((r) => {
            updateUI(r)
          })
      } else {
        // Make all token based calculations
        getStorage('user')
          .then((obj) => calcEmissions(mergedTokens, obj))
          .then((res) => {
            return res
          }).then((r) => {
            saveToStorage({'user' : r})
            return r
          }).then((r) => {
            updateUI(r)
          })
      }
    })

  }).catch((err) => {
      console.error(err)
    })
}
//
const calcTime = function(compTime) {
  return new Promise(function (resolve, reject) {
    getStorage('config').then((r) => {
      const totalEnergy = r.basePower.value * r.utilizationFactor.value * compTime * r.PUE.value / 3600000
      resolve(totalEnergy)
    })
  })
}

const calcTimeEmissions = function(energyUsed) {
  return new Promise(function (resolve, reject) {
    getStorage('config').then((r) => {
      const timeEmissions = energyUsed * r.gridFactor.value / 1000
      resolve(timeEmissions)
    })
  })
}

const sumTimeEmissions = function(compTime, timeEmissions) {
  return new Promise(function (resolve, reject) {
    getStorage('user').then((obj) => {
      obj['compTime'] = obj.compTime + compTime
      obj['timeEmissions'] = obj.timeEmissions + timeEmissions
      resolve(obj)
    })
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

const calcEmissions = function(tokenObj, obj) {
  return new Promise(function (resolve, reject) {

    Object.assign(obj, tokenObj)

    // Equations for emission calculations
    getStorage('config').then((r) => {
      const totalEnergy = (tokenObj["inputTokens"] * r.inputFactor.value + tokenObj["outputTokens"] * r.outputFactor.value) * r.PUE.value
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

      // Unsolved UI bug needs a short timeout here
      setTimeout(() => {
        document.body.insertAdjacentElement('afterbegin', parentDiv)
      }, 100);

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

    getStorage('system').then((r) => {
      if (r.calcMethod === "timeBased") {
        statsElem.textContent = `Computation time: ${obj.compTime.toString().substring(0,4)} seconds\r\n`
        statsElem.textContent += `Total emissions: ${obj.timeEmissions.toString().substring(0,6)} kgCO2e\r\n`
        const calcMiles = (obj.timeEmissions / 400).toString().substring(0,4)
        statsElem.textContent += `🚗 Your AI drive: ${calcMiles} miles\r\n`
      } else {
        const calcMiles = (obj.totalEmissions / 400).toString().substring(0,4)
        statsElem.textContent = `Input tokens: ${obj.inputTokens} \r\n`
        statsElem.textContent += `Output tokens: ${obj.outputTokens} \r\n`
        statsElem.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)} gCO2e \r\n`
        statsElem.textContent += `🚗 Your AI drive: ${calcMiles} miles\r\n`
      }

      const reviewLink = "https://chromewebstore.google.com/detail/ai-wattch/meacendfnhnjbkmfbfogbmekkhnamffn/reviews"
      statsElem.innerHTML += `\r\n💚 AIWattch? <a target="_blank" href="${reviewLink}">Leave a review</a>`

      const checkResetBtn = document.querySelector('.reset-btn')

      const checkCalcMethodIcon = document.querySelector('.calc-method-indicator')

      if (checkCalcMethodIcon) {
        const calcMethodIcon = document.querySelector('.calc-method-indicator')
        calcMethodIcon.textContent = (r.calcMethod === "timeBased") ? '🕑' : '🪙'
      }

      // Reset user data to zero with 'Reset button'
      if (!checkResetBtn) {
        const resetContainer = document.createElement('div')
        resetContainer.className = 'reset-container'
        const resetBtn = document.createElement('img')
        resetBtn.className = 'reset-btn'
        resetBtn.src = chrome.runtime.getURL('../assets/reset.svg')

        const calcMethodIcon = document.createElement('span')
        calcMethodIcon.className = 'calc-method-indicator'
        calcMethodIcon.textContent = (r.calcMethod === "timeBased") ? '🕑' : '🪙'

        resetContainer.appendChild(calcMethodIcon)
        resetContainer.appendChild(resetBtn)

        resetBtn.addEventListener('mouseup', function(e) {
          const obj = {}
          obj['user'] = {}
          obj['user']['inputTokens'] = 0
          obj['user']['outputTokens'] = 0
          obj['user']['totalEmissions'] = 0
          obj['user']['compTime'] = 0
          obj['user']['timeEmissions'] = 0
          obj['system'] = {}
          obj['system']['calcMethod'] = 'tokenBased'

          saveToStorage(obj).then((s) => {
            console.log('cleared storage OK')
            updateUI(obj.user)
          }).catch((err) => {
              console.log(err)
            })
        }, true)

        parentDiv.appendChild(resetContainer)
      }
    })
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
            obj['user']['compTime'] = 0
            obj['user']['timeEmissions'] = 0
          } else if (value === 'config') {
            obj['config'] = {}
            obj['config']['charsPerToken'] = {
              value: 4,
              unit: '',
              label: 'Characters Per Token',
              calcType: 'tokenBased'
            }
            obj['config']['gridFactor'] = {
              value: 383,
              unit: 'gCO2e/kWh',
              label: 'Grid Factor',
              calcType: 'all'
            }
            obj['config']['inputFactor'] = {
              value: 0.000002,
              unit: 'kWh/token',
              label: 'Input Token Factor',
              calcType: 'tokenBased'
            }
            obj['config']['outputFactor'] = {
              value: 0.00001,
              unit: 'kWh/token',
              label: 'Output Token Factor',
              calcType: 'tokenBased'
            }
            obj['config']['PUE'] = {
              value: 1.1,
              unit: '',
              label: 'Power Usage Efficiency',
              calcType: 'all'
            },
            obj['config']['basePower'] = {
              value: 350,
              unit: 'W',
              label: 'GPU Base Power',
              calcType: 'timeBased'
            },
            obj['config']['utilizationFactor'] = {
              value: 10,
              unit: '%',
              label: 'GPU Utilization',
              calcType: 'timeBased'
            }
            obj['config']['networkLatency'] = {
              value: .1,
              unit: '%',
              label: 'Network Latency',
              calcType: 'timeBased'
            }
          } else if (value === 'ui') {
            obj['ui'] = {}
            obj['ui']['xPos'] = "68%"
            obj['ui']['yPos'] = "70%"
          } else if (value === 'system') {
            obj['system'] = {}
            obj['system']['chromeVersion'] = getChromeVersion()
            obj['system']['calcMethod'] = 'tokenBased'
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

// Get message from background script to update UI
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "updateConfig") {
    getStorage('user').then((r) => {
      updateUI(r)
    })
  }
})

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
