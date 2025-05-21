import "./admin.css"
import {getStorage, saveToStorage} from "./storage"
import {doInitConfig} from "./content"

function displayConfig() {
  getStorage('config').then((obj) => {
    const mainDiv = document.querySelector('.main')
    mainDiv.replaceChildren()

    // Populate the admin panel with retrieved data
    for (let [key, value] of Object.entries(obj)) {
      const container = document.createElement('div')
      container.className = 'config-container'

      const itemValue = value.value
      const item = document.createElement('span')
      item.className = 'config-item'
      item.innerText = value.label
      item.innerText += value.unit ? ` (${value.unit})` : ''
      const configValue = document.createElement('input')
      configValue.id = key
      configValue.type = 'number'
      configValue.className = 'config-value'
      configValue.value = itemValue.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 })

      container.appendChild(item)
      container.appendChild(configValue)

      mainDiv.appendChild(container)
    }
  }).catch((err) => {
      if (err === 'emptyKey') {
        resetConfig()
      } else {
        console.error(err)
      }
    })

  getStorage('system').then((obj) => {
    console.log(obj.calcMethod)
    if (obj.calcMethod === "timeBased") {
      toggleCalcMethodBtn.checked = true
      console.log('enabledlled')
    } else {
      toggleCalcMethodBtn.checked = false
    }
  }).catch((err) => {
      console.error(err)
    })
}

function updateConfig() {
  const allItems = document.querySelectorAll('.config-item')
  const allValues = document.querySelectorAll('.config-value')
  const obj = {}
  obj['config'] = {}

  // Get object keys from displayed data
  getStorage('config').then((obj) => {
    for (let [key, value] of Object.entries(obj)) {
      const keyValue = document.querySelector(`#${key}`).value
      obj[key].value = keyValue
    }

    saveToStorage({'config' : obj}).then((r) => {
      console.log('config values updated OK')
    })
  })
}

function resetConfig() {
  chrome.storage.local.remove('config')
  doInitConfig().then((r) => {
    setTimeout(() => {
      displayConfig()
    }, 50)
    console.log("config values reset to default")
  })
}

function toggleCalcMethod() {
  const calcTypeLabel = document.querySelector("#calc-type")
  const obj = {}
  obj['system'] = {}

  if (toggleCalcMethodBtn.checked === true) {
    obj['system']['calcMethod'] = 'timeBased'
    calcTypeLabel.innerText = "Time based calculation"
  } else {
    obj['system']['calcMethod'] = 'tokenBased'
    calcTypeLabel.innerText = "Token based calculation"
  }

  saveToStorage(obj).then((r) => {
    console.log('config values updated OK')
    chrome.runtime.sendMessage({ type: 'updateConfig', config: obj })
  })
}

const updateConfigBtn = document.querySelector('#update-config-btn')
updateConfigBtn.addEventListener('mouseup', updateConfig)

const resetConfigBtn = document.querySelector('#reset-config-btn')
resetConfigBtn.addEventListener('mouseup', resetConfig)

const toggleCalcMethodBtn = document.querySelector('#enable-time-based-calc')
toggleCalcMethodBtn.addEventListener('click', toggleCalcMethod)

toggleCalcMethod()
displayConfig()
