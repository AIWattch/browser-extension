export const getStorage = function(obj) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.get([obj]).then((result) => {
        if (Object.keys(result).length !== 0) {
          resolve(result[obj])
        } else {
          reject('emptyKey')
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

export const saveToStorage = function(obj) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.set(obj).then((result) => {
        resolve(result)
      })
    } catch (err) {
      reject(err)
    }
  })
}
