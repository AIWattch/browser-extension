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

const updateConfigBtn = document.querySelector('#update-config-btn')
updateConfigBtn.addEventListener('mouseup', updateConfig)

const resetConfigBtn = document.querySelector('#reset-config-btn')
resetConfigBtn.addEventListener('mouseup', resetConfig)

displayConfig()
