// Replace imported functions with direct implementations
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

// More robust approach to find chat elements
function findChatMessages() {
  let messages = [];
  
  // Try multiple selector strategies for maximum compatibility
  
  // Strategy 1: data-attributes (newest ChatGPT)
  const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
  const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
  
  if (userMessages.length > 0 && assistantMessages.length > 0) {
    userMessages.forEach(el => {
      messages.push({
        type: 'inputTokens',
        content: el.innerText,
        element: el
      });
    });
    
    assistantMessages.forEach(el => {
      messages.push({
        type: 'outputTokens',
        content: el.innerText,
        element: el
      });
    });
    
    return messages;
  }
  
  // Strategy 2: New ChatGPT interface class-based approach
  const messageContainers = document.querySelectorAll('.group');
  if (messageContainers.length > 0) {
    messageContainers.forEach(container => {
      // Try to determine if user or assistant
      const isUserMessage = container.classList.contains('dark:bg-gray-800') || 
                           container.classList.contains('bg-gray-50');
      const isAssistantMessage = !isUserMessage;
      
      if (isUserMessage || isAssistantMessage) {
        messages.push({
          type: isUserMessage ? 'inputTokens' : 'outputTokens',
          content: container.innerText,
          element: container
        });
      }
    });
    
    return messages;
  }
  
  // Strategy 3: Classic approach with .prose and .markdown
  const proseElements = document.querySelectorAll('.prose');
  const markdownElements = document.querySelectorAll('.markdown');
  
  if (proseElements.length > 0 || markdownElements.length > 0) {
    proseElements.forEach(el => {
      messages.push({
        type: 'inputTokens',
        content: el.innerText,
        element: el
      });
    });
    
    markdownElements.forEach(el => {
      messages.push({
        type: 'outputTokens',
        content: el.innerText.replace("ChatGPT", ""),
        element: el
      });
    });
  }
  
  return messages;
}

// Wait for any DOM element to be changed
const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {

    // Debug logging for new nodes
    mutation.addedNodes.forEach(n => {
      console.log("New node added:", n);
    });
    
    if (mutation.type === 'childList') {
      const messages = findChatMessages();
      
      // Process unprocessed messages
      const unprocessedMessages = messages.filter(msg => 
        !msg.element.dataset.processed
      );
      
      if (unprocessedMessages.length > 0) {
        // Get the latest user and assistant messages
        const latestUserMessage = unprocessedMessages.filter(msg => msg.type === 'inputTokens').pop();
        const latestAssistantMessage = unprocessedMessages.filter(msg => msg.type === 'outputTokens').pop();
        
        if (latestUserMessage && latestAssistantMessage) {
          // Mark as processed
          latestUserMessage.element.dataset.processed = "true";
          latestAssistantMessage.element.dataset.processed = "true";
          
          const textNodes = [
            {type: 'inputTokens', content: latestUserMessage.content},
            {type: 'outputTokens', content: latestAssistantMessage.content}
          ];
          
          outputFinished(textNodes);
        }
      }
    } 
  }
});

// Periodic check as a fallback
setInterval(() => {
  const messages = findChatMessages();
  
  // Identify unprocessed messages
  const unprocessedMessages = messages.filter(msg => 
    !msg.element.dataset.processed
  );
  
  if (unprocessedMessages.length > 0) {
    // Find latest unprocessed user and assistant messages
    const latestUserMessage = unprocessedMessages.filter(msg => msg.type === 'inputTokens').pop();
    const latestAssistantMessage = unprocessedMessages.filter(msg => msg.type === 'outputTokens').pop();
    
    if (latestUserMessage && latestAssistantMessage) {
      // Mark as processed
      latestUserMessage.element.dataset.processed = "true";
      latestAssistantMessage.element.dataset.processed = "true";
      
      const textNodes = [
        {type: 'inputTokens', content: latestUserMessage.content},
        {type: 'outputTokens', content: latestAssistantMessage.content}
      ];
      
      outputFinished(textNodes);
    }
  }
}, 2000);

function outputFinished(textNodes) {
  console.log('ChatGPT output finished');

  // Calculate both input/output token count
  const allTokens = [];
  textNodes.forEach((node) => {
    const token = calcTokens(node);
    allTokens.push(token);
  });

  // Combine both token amounts into one object
  Promise.all(allTokens).then((res) => {
    let obj = {};
    res.forEach((r) => {
      let objName = Object.keys(r)[0];
      let objValue = Object.values(r)[0];
      obj[objName] = objValue;
    });

    // Make all emission based calculations
    calcEmissions(obj).then((res) => {
      return res;
    }).then((r) => {
      saveToStorage({'user' : r});
      return r;
    }).then((r) => {
      updateUI(r);
    });

  }).catch((err) => {
    console.error(err);
  });
}

// Rest of your existing code remains unchanged
const calcTokens = function(textNode) {
  return new Promise(function (resolve, reject) {
    const msgContent = textNode.content;
    const msgLength = textNode.content.length;
    const msgType = textNode.type;
    
    let prevTokens = 0;

    // Get previous stored user data for calculations
    getStorage('config').then((r) => {
      const newTokens = msgLength / r.charsPerToken.value;

      getStorage('user').then((userObj) => {
        const prevTokens = userObj?.[msgType] || 0;
        const updatedTokens = Math.ceil(prevTokens + newTokens);
        resolve({[msgType] : updatedTokens});
      });
    });
  });
}

const calcEmissions = function(obj) {
  return new Promise(function (resolve, reject) {
    const inputTokens = obj["inputTokens"];
    const outputTokens = obj["outputTokens"];

    // Equations for emission calculations
    getStorage('config').then((r) => {
      const totalEnergy = (inputTokens * r.inputFactor.value + outputTokens * r.outputFactor.value) * r.PUE.value;
      const totalEmissions = totalEnergy * r.gridFactor.value;
      return totalEmissions;
    }).then((r) => {
      obj["totalEmissions"] = r;
      resolve(obj);
    });
  });
}

// Check if UI already exists or not
const getUI = function() {
  return new Promise(function (resolve, reject) {
    const parentId = "user-stats";
    const parentExists = document.querySelector(`#${parentId}`);

    if (parentExists) {
      const statsElem = parentExists.querySelector('span');
      resolve([parentExists, statsElem]);
    } else {
      const parentDiv = document.createElement('div');
      const statsElem = document.createElement('span');
      parentDiv.id = parentId;
      parentDiv.style.position = 'absolute';
      parentDiv.style.zIndex = '9999'; // or higher
      parentDiv.style.backgroundColor = '#fff'; // debug visibility
      parentDiv.style.padding = '10px'; // just for now
      parentDiv.insertAdjacentElement('afterbegin', statsElem);
      document.body.insertAdjacentElement('afterbegin', parentDiv);
      resolve([parentDiv, statsElem]);
    }
  });
}

function updateUI(obj) {
  if (window.location.href.startsWith("chrome-extension://")) return;

  getUI().then((res) => {
    const parentDiv = res[0];
    const statsElem = res[1];

    getStorage('ui').then((r) => {
      parentDiv.style.top = r.yPos;
      parentDiv.style.left = r.xPos;
    }).catch((err) => {
      if (err === 'emptyKey') {
        initConfig('ui');
      } else {
        console.error(err);
      }
    });

    handleMouse(parentDiv);

    const calcMiles = (obj.totalEmissions / 400).toString().substring(0,4);

    statsElem.textContent = `Input tokens: ${obj.inputTokens} \r\n`;
    statsElem.textContent += `Output tokens: ${obj.outputTokens} \r\n`;
    statsElem.textContent += `Total emissions: ${obj.totalEmissions.toString().substring(0,6)} gCO2e \r\n`;
    statsElem.textContent += `🚗 Your AI drive: ${calcMiles} miles\r\n`;

    const checkResetBtn = document.querySelector('.reset-btn');

    // Reset user data to zero with 'Reset button'
    if (!checkResetBtn) {
      const resetBtn = document.createElement('img');
      resetBtn.className = 'reset-btn';
      resetBtn.src = chrome.runtime.getURL('../assets/reset.svg');

      resetBtn.addEventListener('mouseup', function(e) {
        const obj = {};
        obj['user'] = {};
        obj['user']['inputTokens'] = 0;
        obj['user']['outputTokens'] = 0;
        obj['user']['totalEmissions'] = 0;

        saveToStorage(obj).then((s) => {
          console.log('cleared storage OK');
          updateUI(obj.user);
        }).catch((err) => {
          console.log(err);
        });
      }, true);

      parentDiv.appendChild(resetBtn);
    }
  });
}

// Convert export function to regular function
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

const initConfig = function(value) {
  return new Promise(function (resolve, reject) {
    getStorage(value).then((r) => {
      console.log(`${value} values loaded OK`);
      console.log(r);

      if (value === 'user') {
        updateUI(r);
      }
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

// Handle drag/drop logic
function handleMouse(div) {
  let mousePosition;
  let offset = [0,0];
  let isDown = false;

  div.addEventListener('mousedown', function(e) {
    isDown = true;
    offset = [
      div.offsetLeft - e.clientX,
      div.offsetTop - e.clientY
    ];
  }, true);

  document.addEventListener('mouseup', function() {
    isDown = false;

    const obj = {};
    obj['ui'] = {};
    obj['ui']['xPos'] = div.style.left;
    obj['ui']['yPos'] = div.style.top;

    saveToStorage(obj).then((s) => {
      console.log("ui position updated OK");
    });
  }, true);

  document.addEventListener('mousemove', function(event) {
    event.preventDefault();
    if (isDown) {
      mousePosition = {
        x : event.clientX,
        y : event.clientY
      };
      div.style.left = (mousePosition.x + offset[0]) + 'px';
      div.style.top  = (mousePosition.y + offset[1]) + 'px';
    }
  }, true);
}

function getChromeVersion () {     
  var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : false;
}

// Start observing when the page loads
window.addEventListener('load', () => {
  observer.observe(document.body, { childList: true, subtree: true });
  doInitConfig();
});