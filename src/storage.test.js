// Unit tests for the storage utility functions.
import { describe, it, expect, vi } from 'vitest';

// Mock chrome.storage.local API to simulate browser storage behavior in a Node.js environment.
// This allows testing the storage functions without a browser.
const mockStorage = {};

// Define a global chrome object with a mocked storage.local property.
global.chrome = {
  storage: {
    local: {
      // Mock the get function: it should return an object with requested keys or an empty object.
      get: vi.fn((keys) => {
        const result = {};
        // keys can be a string or an array of strings
        const keysToGet = Array.isArray(keys) ? keys : [keys];
        keysToGet.forEach(key => {
          if (Object.prototype.hasOwnProperty.call(mockStorage, key)) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }),
      // Mock the set function: it should merge the provided object into the mock storage.
      set: vi.fn((obj) => {
        Object.assign(mockStorage, obj);
        return Promise.resolve();
      }),
      // Mock the remove function: it should delete the specified keys from the mock storage.
      remove: vi.fn((keys) => {
        if (Array.isArray(keys)) {
          keys.forEach(key => delete mockStorage[key]);
        } else {
          delete mockStorage[keys];
        }
        return Promise.resolve();
      }),
    },
  },
};

// Import the functions to be tested.
import { saveToStorage, getStorage } from './storage';

describe('storage', () => {
  // A basic passing test to ensure the testing environment is set up correctly.
  it('should pass', () => {
    expect(true).toBe(true);
  });

  // Test case for the saveToStorage function.
  it('saveToStorage should save data to chrome.storage.local', async () => {
    const dataToSave = { key1: 'value1' };
    await saveToStorage(dataToSave);
    // Expect chrome.storage.local.set to have been called with the correct data.
    expect(chrome.storage.local.set).toHaveBeenCalledWith(dataToSave);
  });

  // Test case for the getStorage function when the key exists.
  it('getStorage should retrieve data from chrome.storage.local', async () => {
    const dataToSave = { key1: 'value1' };
    await saveToStorage(dataToSave); // Save data first to ensure it exists
    const retrievedData = await getStorage('key1');
    // Expect chrome.storage.local.get to have been called with the correct key.
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['key1']);
    // Expect the retrieved data to be the correct value.
    expect(retrievedData).toBe('value1');
  });

  // Test case for the getStorage function when the key does not exist.
  it('getStorage should reject with emptyKey if key does not exist', async () => {
    // Expect the promise returned by getStorage to be rejected with 'emptyKey'.
    await expect(getStorage('nonexistentKey')).rejects.toBe('emptyKey');
    // Expect chrome.storage.local.get to have been called with the nonexistent key.
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['nonexistentKey']);
  });
}); 