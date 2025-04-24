// Remove ES6 imports and implement functions directly
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

function doInitConfig() {
  return new Promise(function (resolve, reject) {
    const allKeys = [];
    const storageKeys = ['ui','config','user', 'system'];

    // Get all storage data for each key
    storageKeys.forEach((key) => {
      allKeys.push = initConfig(key);
    });

    // Process each key of data
    Promise.all(allKeys).then((res) => {
      resolve(res);
    }).catch((err) => {
      console.error(err);
    });
  });
}

function initConfig(value) {
  return new Promise(function (resolve, reject) {
    getStorage(value).then((r) => {
      console.log(`${value} values loaded OK`);
      console.log(r);
    }).catch((err) => {
      if (err === "emptyKey") {
        console.log(`No ${value} values found`);

        // Default values for all config data
        const obj = {};
        if (value === 'user') {
          obj['user'] = {};
          obj['user']['inputTokens'] = 0;
          obj['user']['outputTokens'] = 0;
          obj['user']['totalEmissions'] = 0;
        } else if (value === 'config') {
          obj['config'] = {};
          obj['config']['charsPerToken'] = {
            value: 4,
            unit: '',
            label: 'Characters Per Token'
          };
          obj['config']['gridFactor'] = {
            value: 383,
            unit: 'gCO2e/kWh',
            label: 'Grid Factor' 
          };
          obj['config']['inputFactor'] = {
            value: 0.000002,
            unit: 'kWh/token',
            label: 'Input Token Factor'
          };
          obj['config']['outputFactor'] = {
            value: 0.00001,
            unit: 'kWh/token',
            label: 'Output Token Factor'
          };
          obj['config']['PUE'] = {
            value: 1.2,
            unit: '',
            label: 'Power Usage Efficiency'
          };
        } else if (value === 'ui') {
          obj['ui'] = {};
          obj['ui']['xPos'] = "68%";
          obj['ui']['yPos'] = "70%";
        } else if (value === 'system') {
          obj['system'] = {};
          obj['system']['chromeVersion'] = getChromeVersion();
        }

        saveToStorage(obj).then((s) => {
          console.log(`${value} values saved OK`);
          resolve(s);
        });
      } else {
        console.error(err);
      }
    });
  });
}

function getChromeVersion() {     
  var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : false;
}

function displayConfig() {
  getStorage('config').then((obj) => {
    const mainDiv = document.querySelector('.main');
    mainDiv.replaceChildren();
    
    // Populate the admin panel with retrieved data
    for (let [key, value] of Object.entries(obj)) {
      const container = document.createElement('div');
      container.className = 'config-container';
      const itemValue = value.value;
      const item = document.createElement('span');
      item.className = 'config-item';
      item.innerText = value.label;
      item.innerText += value.unit ? ` (${value.unit})` : '';
      const configValue = document.createElement('input');
      configValue.id = key;
      configValue.type = 'number';
      configValue.className = 'config-value';
      configValue.value = itemValue.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
      container.appendChild(item);
      container.appendChild(configValue);
      mainDiv.appendChild(container);
    }
  }).catch((err) => {
    if (err === 'emptyKey') {
      resetConfig();
    } else {
      console.error(err);
    }
  });
}

function updateConfig() {
  const allItems = document.querySelectorAll('.config-item');
  const allValues = document.querySelectorAll('.config-value');
  const obj = {};
  obj['config'] = {};
  
  // Get object keys from displayed data
  getStorage('config').then((obj) => {
    for (let [key, value] of Object.entries(obj)) {
      const keyValue = document.querySelector(`#${key}`).value;
      obj[key].value = keyValue;
    }
    saveToStorage({'config': obj}).then((r) => {
      console.log('config values updated OK');
    });
  });
}

function resetConfig() {
  chrome.storage.local.remove('config');
  doInitConfig().then((r) => {
    setTimeout(() => {
      displayConfig();
    }, 50);
    console.log("config values reset to default");
  });
}

// Make sure DOM is loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
  const updateConfigBtn = document.querySelector('#update-config-btn');
  updateConfigBtn.addEventListener('mouseup', updateConfig);
  
  const resetConfigBtn = document.querySelector('#reset-config-btn');
  resetConfigBtn.addEventListener('mouseup', resetConfig);
  
  displayConfig();
});