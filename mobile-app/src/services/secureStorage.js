import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for secure storage
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_SESSION: 'user_session',
  VENDOR_ID: 'vendor_id',
};

/**
 * Secure Token Manager
 * Uses expo-secure-store for encrypted storage on device
 * Falls back to AsyncStorage on web (with warning)
 */
class SecureTokenManager {
  /**
   * Save data securely
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  static async saveItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        console.warn('SecureStore is not available on web. Using localStorage instead.');
        localStorage.setItem(key, value);
        return;
      }

      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw new Error(`Failed to save ${key} securely`);
    }
  }

  /**
   * Retrieve data securely
   * @param {string} key - Storage key
   * @returns {Promise<string|null>} Stored value or null
   */
  static async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }

      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data securely
   * @param {string} key - Storage key
   */
  static async deleteItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }

      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error deleting ${key}:`, error);
    }
  }

  /**
   * Save authentication token
   * @param {string} token - Auth token
   */
  static async saveAuthToken(token) {
    await this.saveItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Get authentication token
   * @returns {Promise<string|null>} Auth token or null
   */
  static async getAuthToken() {
    return await this.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Save refresh token
   * @param {string} token - Refresh token
   */
  static async saveRefreshToken(token) {
    await this.saveItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Get refresh token
   * @returns {Promise<string|null>} Refresh token or null
   */
  static async getRefreshToken() {
    return await this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Save user session data
   * @param {Object} session - Session object
   */
  static async saveSession(session) {
    await this.saveItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
  }

  /**
   * Get user session data
   * @returns {Promise<Object|null>} Session object or null
   */
  static async getSession() {
    const sessionStr = await this.getItem(STORAGE_KEYS.USER_SESSION);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  /**
   * Save vendor ID
   * @param {string} vendorId - Vendor ID
   */
  static async saveVendorId(vendorId) {
    await this.saveItem(STORAGE_KEYS.VENDOR_ID, vendorId);
  }

  /**
   * Get vendor ID
   * @returns {Promise<string|null>} Vendor ID or null
   */
  static async getVendorId() {
    return await this.getItem(STORAGE_KEYS.VENDOR_ID);
  }

  /**
   * Clear all authentication data
   */
  static async clearAll() {
    await this.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
    await this.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
    await this.deleteItem(STORAGE_KEYS.USER_SESSION);
    await this.deleteItem(STORAGE_KEYS.VENDOR_ID);
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  static async isAuthenticated() {
    const token = await this.getAuthToken();
    return !!token;
  }
}

export default SecureTokenManager;
export { STORAGE_KEYS };
