import "./admin.css"
import {getStorage, saveToStorage} from "./storage"
import {doInitConfig} from "./content"

function setOptionsVisible(calcType) {

  const allConfigItems = document.querySelectorAll('.config-container')

  allConfigItems.forEach((item) => {
    if (item.classList.toString().includes(calcType) || (item.classList.toString().includes('all'))) {
      item.style.display = 'flex'
    } else {
      item.style.display = 'none'
    }
  })
}

function displayConfig() {
  getStorage('config').then((obj) => {
    const mainDiv = document.querySelector('.main')
    mainDiv.replaceChildren()

    // Populate the admin panel with retrieved data
    for (let [key, value] of Object.entries(obj)) {
      const container = document.createElement('div')
      container.className = 'config-container'
      container.classList.add(value.calcType)

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

      if (value.calcType !== 'all') {
        container.style.display = 'none'
      }
    }
  }).catch((err) => {
      if (err === 'emptyKey') {
        resetConfig()
      } else {
        console.error(err)
      }
    })

  getStorage('system').then((obj) => {
    if (obj.calcMethod === "timeBased") {
      toggleCalcSelect.value = "time-based"
    } else {
      toggleCalcSelect.value = "token-based"
    }

    setOptionsVisible(obj.calcMethod)
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
  const obj = {}
  obj['system'] = {}

  if (toggleCalcSelect.value === "time-based") {
    obj['system']['calcMethod'] = 'timeBased'
    setOptionsVisible('timeBased')
  } else {
    obj['system']['calcMethod'] = 'tokenBased'
    setOptionsVisible('tokenBased')
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

const toggleCalcSelect = document.querySelector('#calc-type')
toggleCalcSelect.addEventListener('change', toggleCalcMethod)

displayConfig()
