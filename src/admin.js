import "./content.css"
import {getStorage, saveToStorage} from "./storage"

function displayConfig() {
  getStorage('config').then((obj) => {
    const mainDiv = document.querySelector('.main')

    for (let [key, value] of Object.entries(obj)) {
      const container = document.createElement('div')
      container.className = 'config-container'

      const item = document.createElement('span')
      item.className = 'config-item'
      item.innerText = key
      const configValue = document.createElement('input')
      configValue.type = 'number'
      configValue.className = 'config-value'
      configValue.value = value

      container.appendChild(item)
      container.appendChild(configValue)

      mainDiv.appendChild(container)
    }
  })
}

displayConfig()
