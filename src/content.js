// TODO: handle logged in and logged out states (if needed)
// TODO: when scrolled up, end of output doesnt detect
// TODO: show UI on tab load with persistent (x,y) pos

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
    let inputText = document.querySelector('article:nth-last-child(2)')
    let outputText = document.querySelector('article:last-child')
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

    // TODO: get charsPerToken value here || 4
    const charsPerToken = 4
    const newTokens = msgLength / charsPerToken

    getStorage('user').then((userObj) => {
      const prevTokens = userObj[msgType]
      const updatedTokens = prevTokens + newTokens 
      resolve({[msgType] : updatedTokens})
    })
  })
}

const getStorage = function(obj) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.get([obj]).then((result) => {
        if (Object.keys(result).length !== 0) {
          resolve(result[obj])
        } else {
          reject('emptyKey')
        }
      })
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}

const saveToStorage = function(obj) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.set(obj).then((result) => {
        resolve(result)
      })
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}

const calcEmissions = function(obj) {
  return new Promise(function (resolve, reject) {

    const inputTokens = obj["inputTokens"]
    const outputTokens = obj["outputTokens"]

    // TODO: get from storage || or defaults if undefined
    const gridFactor = 383
    const inputFactor = 0.0000001
    const outputFactor = 0.0000002
    const PUE = 1.125

    const totalEnergy = (inputTokens * inputFactor + outputTokens * outputFactor) * PUE
    const totalEmissions = totalEnergy * gridFactor

    obj["totalEmissions"] = totalEmissions
    resolve(obj)
  })
}

// TODO attach to UI parent div
// use exisiting css styles light/dark mode
function updateUI(obj) {

  console.log('update UI...')
  let elementId = Object.keys(obj)[0]
  // TODO: change to parent div not document 
  const checkExists = document.querySelector(`#${elementId}`)

  if (checkExists) {
    checkExists.remove()
  }

  const span = document.createElement('pre')
  span.id = elementId
  span.textContent = JSON.stringify(obj)
  span.style.cssText =
    'background-color: #424242; color: white; padding: 2px; width: 100%; box-sizing: border-box;'
  document.body.insertAdjacentElement('afterbegin', span)
}

const initConfig = function() {
  return new Promise(function (resolve, reject) {
    // test clear
    //chrome.storage.local.remove('user')

    // Check user values
    getStorage('user').then((r) => {
      console.log('User values loaded OK')
      console.log(r)
    }).catch((err) => {
      if (err === "emptyKey") {
        console.log('No user values found')

        const u = {}
        u['user'] = {}
        u['user']['inputTokens'] = 0
        u['user']['outputTokens'] = 0
        u['user']['totalEmissions'] = 0

        saveToStorage(u).then((s) => {
          console.log('User values saved OK')
        })
      } else {
        console.error(err)
      }
    })

    // Check config values
    getStorage('config').then((r) => {
      console.log('Config values loaded OK')
      console.log(r)
    }).catch((err) => {
      if (err === "emptyKey") {
        console.log('No config values found')

        const c = {}
        c['config'] = {}
        c['config']['charsPerToken'] = 4
        c['config']['gridFactor'] = 383
        c['config']['inputFactor'] = 0.0000001
        c['config']['outputFactor'] = 0.0000002
        c['config']['PUE'] = 1.125

        saveToStorage(c).then((s) => {
          console.log('Config values saved OK')
        })
      } else {
        console.error(err)
      }
    })
  })
}

initConfig()
