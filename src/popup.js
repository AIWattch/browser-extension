// Direct implementations of the storage functions
function getStorage(obj) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.get([obj], (result) => {
        if (Object.keys(result).length !== 0) {
          resolve(result[obj]);
        } else {
          reject('emptyKey');
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function saveToStorage(obj) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.set(obj, (result) => {
        resolve(result);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Simplified version of doInitConfig for the popup
function doInitConfig() {
  return new Promise(function (resolve, reject) {
    // Just create empty user data
    const obj = {
      'user': {
        'inputTokens': 0,
        'outputTokens': 0,
        'totalEmissions': 0
      }
    };
    
    saveToStorage(obj).then((s) => {
      console.log('User values initialized');
      resolve(s);
    }).catch((err) => {
      reject(err);
    });
  });
}

function showUserStats() {
  getStorage('user').then((obj) => {
    const userStats = document.querySelector('.stats');
    const calcMiles = (obj.totalEmissions / 400).toString().substring(0,4);
    
    // Display all token/emissions data
    userStats.textContent = `Input tokens: ${obj.inputTokens}\r\n`;
    userStats.textContent += `Output tokens: ${obj.outputTokens}\r\n`;
    userStats.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)} gCO2e\r\n\n`;
    userStats.textContent += `🚗 Your AI drive: ${calcMiles} miles\r\n`;
  }).catch((err) => {
    if (err === "emptyKey") {
      doInitConfig().then((r) => {
        showUserStats();
      });
    } else {
      console.log(err);
    }
  });
}

// Setup event listener to ensure DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const infoBtn = document.querySelector('#more-info');
  infoBtn.href = chrome.runtime.getURL('./src/how-does-it-work.html');
  
  const adminBtn = document.querySelector('#admin-page');
  adminBtn.href = chrome.runtime.getURL('./src/admin.html');
  
  showUserStats();
});