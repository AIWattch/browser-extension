// TODO: handle logged in and logged out states (if needed)

import "/src/content.css.js"
import {getStorage, saveToStorage} from "/src/storage.js.js"

const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((e) => {
        if (typeof e.className === "string" && e.className === "mt-3 w-full empty:hidden")  {
          outputFinished()
        }
      })
    }
  }
})

observer.observe(document.body, { childList: true, subtree: true })

function outputFinished() {
  console.log('ChatGPT output finished')

  setTimeout(() => {
    let allNodes = document.querySelectorAll('article')
    let inputText = allNodes[allNodes.length - 2]
    let outputText = allNodes[allNodes.length - 1]
    let textNodes = [inputText, outputText]

    const allTokens = []
    textNodes.forEach((node) => {
      const token = calcTokens(node)
      allTokens.push(token)
    })

    Promise.all(allTokens).then((res) => {
      let obj = {}
      res.forEach((r) => {
        let objName = Object.keys(r)[0]
        let objValue = Object.values(r)[0]
        obj[objName] = objValue
      })

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
  }, 1000)
}

const calcTokens = function(textNode) {
  return new Promise(function (resolve, reject) {

    let lastMsg = textNode.querySelector('.text-message')
    let msgContent = lastMsg.textContent
    let msgLength = lastMsg.textContent.length
    let msgType = lastMsg.getAttribute('data-message-author-role')

    let prevTokens = 0
    if (msgType === 'user') msgType = 'inputTokens'
    if (msgType === 'assistant') msgType = 'outputTokens'

    getStorage('config').then((r) => {
      const newTokens = msgLength / r.charsPerToken

      getStorage('user').then((userObj) => {
        const prevTokens = userObj[msgType]
        const updatedTokens = prevTokens + newTokens 
        resolve({[msgType] : updatedTokens})
      })
    })
  })
}

const calcEmissions = function(obj) {
  return new Promise(function (resolve, reject) {

    const inputTokens = obj["inputTokens"]
    const outputTokens = obj["outputTokens"]

    getStorage('config').then((r) => {
      const totalEnergy = (inputTokens * r.inputFactor + outputTokens * r.outputFactor) * r.PUE
      const totalEmissions = totalEnergy * r.gridFactor
      return totalEmissions
    }).then((r) => {
      obj["totalEmissions"] = r 
      resolve(obj)
    })
  })
}

function updateUI(obj) {
  let stats
  const parentId = "user-stats"
  const checkExists = document.querySelector(`#${parentId}`)

  if (checkExists) {
    stats = checkExists.querySelector('span')

    getStorage('ui').then((r) => {
      checkExists.style.top = r.yPos
      checkExists.style.left = r.xPos
    })

    handleMouse(checkExists)

  } else {
    const parentDiv = document.createElement('div')
    parentDiv.id = parentId 
    stats = document.createElement('span')

    getStorage('ui').then((r) => {
      parentDiv.style.top = r.yPos
      parentDiv.style.left = r.xPos
    })

    handleMouse(parentDiv)

    parentDiv.insertAdjacentElement('afterbegin', stats)
    document.body.insertAdjacentElement('afterbegin', parentDiv)
  }

  stats.textContent = `Input tokens: ${obj.inputTokens} \r\n`
  stats.textContent += `Output tokens: ${obj.outputTokens} \r\n`
  stats.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)}gCO2e/kWh \r\n`
}

const initConfig = function() {
  return new Promise(function (resolve, reject) {
    // *** test clear
    //chrome.storage.local.remove('ui')
    //chrome.storage.local.clear()

    const storageKeys = ['ui','config','user']

    storageKeys.forEach((value) => {
      getStorage(value).then((r) => {
        console.log(`${value} values loaded OK`)
        console.log(r)

        if (value === 'user') {
          updateUI(r)
        }
      }).catch((err) => {
        if (err === "emptyKey") {
          console.log(`No ${value} values found`)

          const obj = {}
          if (value === 'user') {
            obj['user'] = {}
            obj['user']['inputTokens'] = 0
            obj['user']['outputTokens'] = 0
            obj['user']['totalEmissions'] = 0
          } else if (value === 'config') {
            obj['config'] = {}
            obj['config']['charsPerToken'] = 4
            obj['config']['gridFactor'] = 383
            obj['config']['inputFactor'] = 0.0000001
            obj['config']['outputFactor'] = 0.0000002
            obj['config']['PUE'] = 1.125
          } else if (value === 'ui') {
            obj['ui'] = {}
            obj['ui']['xPos'] = "0px" 
            obj['ui']['yPos'] = "80%"
          }

          saveToStorage(obj).then((s) => {
            console.log(`${value} values saved OK`)
          })
        } else {
          console.error(err)
        }
      })
    })
  })
}

initConfig()

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
