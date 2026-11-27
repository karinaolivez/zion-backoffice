import { UserProfile } from '@/types';

const SESSION_COOKIE_USERID = process.env.NEXT_PUBLIC_COOKIE_USERID || 'zion-userid';
const SESSION_COOKIE_PROFILE = process.env.NEXT_PUBLIC_COOKIE_PROFILE || 'zion-profile';
const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_TOKEN || 'zion-session';

const STORAGE_KEYS = {
  USER_PROFILE: SESSION_COOKIE_PROFILE,
  AUTH_TOKEN: SESSION_COOKIE_NAME,
  USER_ID: SESSION_COOKIE_USERID,
} as const;

// Storage utility functions - Hybrid localStorage + cookies approach
const storageUtils = {
  // Try localStorage first, fallback to cookies
  set: (name: string, value: string, days: number = 7): void => {
    if (typeof window === 'undefined') return;

    try {
      // Try localStorage first
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn('localStorage not available, using cookies:', error);
    }

    // Always set in cookies as backup
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

      document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`;
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  },

  get: (name: string): string | null => {
    if (typeof window === 'undefined') return null;

    // Try localStorage first
    try {
      const value = localStorage.getItem(name);
      if (value !== null) return value;
    } catch (error) {
      console.warn('localStorage not available, trying cookies:', error);
    }

    // Fallback to cookies
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');

      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
    } catch (error) {
      console.error('Error reading cookie:', error);
    }

    return null;
  },

  remove: (name: string): void => {
    if (typeof window === 'undefined') return;

    // Remove from localStorage
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }

    // Remove from cookies
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`;
    } catch (error) {
      console.error('Error removing cookie:', error);
    }
  },

  removeAll: (prefix?: string): void => {
    if (typeof window === 'undefined') return;

    // Remove from localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!prefix || key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }

    // Remove from cookies
    try {
      const cookies = document.cookie.split(';');

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

        if (!prefix || name.startsWith(prefix)) {
          storageUtils.remove(name);
        }
      }
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  }
};

export const storageService = {
  // Profile management
  setUserProfile: (profile: UserProfile): void => {
    try {
      storageUtils.set(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile to cookies:', error);
    }
  },

  getUserProfile: (): UserProfile | null => {
    try {
      const profile = storageUtils.get(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error retrieving user profile from cookies:', error);
      return null;
    }
  },

  updateUserProfile: (updates: Partial<UserProfile>): void => {
    try {
      const currentProfile = storageService.getUserProfile();
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, ...updates };
        storageService.setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating user profile in cookies:', error);
    }
  },

  removeUserProfile: (): void => {
    try {
      storageUtils.remove(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Error removing user profile from cookies:', error);
    }
  },

  // Auth token management
  setAuthToken: (token: string): void => {
    try {
      storageUtils.set(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token to cookies:', error);
    }
  },

  getAuthToken: (): string | null => {
    try {
      return storageUtils.get(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error retrieving auth token from cookies:', error);
      return null;
    }
  },

  removeAuthToken: (): void => {
    try {
      storageUtils.remove(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing auth token from cookies:', error);
    }
  },

  // User ID management
  setUserId: (userId: string): void => {
    try {
      storageUtils.set(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error saving user ID to cookies:', error);
    }
  },

  getUserId: (): string | null => {
    try {
      return storageUtils.get(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Error retrieving user ID from cookies:', error);
      return null;
    }
  },

  removeUserId: (): void => {
    try {
      storageUtils.remove(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Error removing user ID from cookies:', error);
    }
  },

  // Clear all user data (for logout)
  clearUserData: (): void => {
    try {
      storageUtils.remove(STORAGE_KEYS.USER_PROFILE);
      storageUtils.remove(STORAGE_KEYS.AUTH_TOKEN);
      storageUtils.remove(STORAGE_KEYS.USER_ID);

      // Clear any other user-related cookies
      storageUtils.removeAll('user_');
      storageUtils.removeAll('profile_');
    } catch (error) {
      console.error('Error clearing user data from cookies:', error);
    }
  },

  // Check if user data exists
  hasUserData: (): boolean => {
    return !!(storageService.getUserProfile() && storageService.getAuthToken());
  },
};

export default storageService;