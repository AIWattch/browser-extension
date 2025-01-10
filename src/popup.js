import "./content.css"
import {getStorage, saveToStorage} from "./storage"
import {doInitConfig} from "./content"

function showUserStats() {
  getStorage('user').then((obj) => {
    const userStats = document.querySelector('.stats')
    const calcMiles = (obj.totalEmissions / 400).toString().substring(0,3)

    userStats.textContent = `Input tokens: ${obj.inputTokens}\r\n`
    userStats.textContent += `Output tokens: ${obj.outputTokens}\r\n`
    userStats.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)} gCO2e\r\n\n`
    userStats.textContent += `🚗 Your AI drive: ${calcMiles} miles\r\n`
    
  }).catch((err) => {
    if (err === "emptyKey") {
      doInitConfig().then((r) => {
        showUserStats()
      })
    } else {
      console.log(err)
    }
  })
}

const infoBtn = document.querySelector('#more-info')
infoBtn.href = chrome.runtime.getURL('./src/how-does-it-work.html')

const adminBtn = document.querySelector('#admin-page')
adminBtn.href = chrome.runtime.getURL('./src/admin.html')

showUserStats()
