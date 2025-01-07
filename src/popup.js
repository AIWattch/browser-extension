import "./content.css"
import {getStorage, saveToStorage} from "./storage"

function showUserStats() {
  getStorage('user').then((obj) => {
    const userStats = document.querySelector('.stats')

    console.log(obj.inputTokens)
    userStats.textContent = `Input tokens: ${obj.inputTokens} \r\n`
    userStats.textContent += `Output tokens: ${obj.outputTokens} \r\n`
    userStats.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)}gCO2e/kWh \r\n`
  })
}

const infoBtn = document.querySelector('#more-info')
infoBtn.href = chrome.runtime.getURL('./src/how-does-it-work.html')

showUserStats()
