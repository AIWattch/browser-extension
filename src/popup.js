import "./popup.css"
import {getStorage, saveToStorage} from "./storage"
import {doInitConfig} from "./content"

function showUserStats() {
  const statsElem = document.querySelector('.stats')

  getStorage('system').then((r) => {
    getStorage('user').then((obj) => {
      if (r.calcMethod === "timeBased") {
        statsElem.textContent = `Computation time: ${obj.compTime.toString().substring(0,4)} seconds\r\n`
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

const showPopup = document.querySelector('#show-popup')
getStorage('system').then((r) => {
  if (!r.showPopup) {
    showPopup.style.display = 'block'
    showPopup.innerText = 'Click to show popup'

    showPopup.addEventListener('click', () => {
      getStorage('system').then((obj) => {
        obj.showPopup = true
        saveToStorage({'system': obj})
      })

      chrome.runtime.sendMessage({ type: 'updateConfig' })
      showPopup.style.display = 'none'
    })
  } else {
    showPopup.style.display = 'none'
  }
})

const infoBtn = document.querySelector('#more-info')
infoBtn.href = chrome.runtime.getURL('./src/how-does-it-work.html')

const adminBtn = document.querySelector('#admin-page')
adminBtn.href = chrome.runtime.getURL('./src/admin.html')

const reviewBtn = document.querySelector("#leave-a-review")
reviewBtn.href = "https://chromewebstore.google.com/detail/ai-wattch/meacendfnhnjbkmfbfogbmekkhnamffn/reviews"

showUserStats()
