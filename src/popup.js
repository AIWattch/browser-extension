import "./popup.css"
import {getStorage, saveToStorage} from "./storage"
import {doInitConfig} from "./content"

function showUserStats() {
  const statsElem = document.querySelector('.stats')

  getStorage('system').then((r) => {
    getStorage('user').then((obj) => {
      if (r.calcMethod === "timeBased") {
        statsElem.textContent = `Computation time: ${obj.compTime} \r\n`
        statsElem.textContent += `Total emissions: ${obj.timeEmissions.toString().substring(0,6)} kgCO2e\r\n`
      } else {
        const calcMiles = (obj.totalEmissions / 400).toString().substring(0,4)
        statsElem.textContent = `Input tokens: ${obj.inputTokens} \r\n`
        statsElem.textContent += `Output tokens: ${obj.outputTokens} \r\n`
        statsElem.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)} gCO2e \r\n`
        statsElem.textContent += `🚗 Your AI drive: ${calcMiles} miles\r\n`
      }
    }).catch((err) => {
        if (err === "emptyKey") {
          doInitConfig().then((r) => {
            showUserStats()
          })
        } else {
          console.log(err)
        }
      })
  })
}

const infoBtn = document.querySelector('#more-info')
infoBtn.href = chrome.runtime.getURL('./src/how-does-it-work.html')

const adminBtn = document.querySelector('#admin-page')
adminBtn.href = chrome.runtime.getURL('./src/admin.html')

showUserStats()
