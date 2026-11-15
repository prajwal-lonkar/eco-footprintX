import { create } from 'zustand';
import type { AuthState, User } from '@type/auth';
import {
  setAccessToken as setTokenInStorage,
  clearAccessToken,
  verifyToken,
  extractUserFromToken,
  getAccessToken,
  isTokenValid,
} from '@utils/tokenHelper';

const USER_KEY = 'user';
const ROLE_SLUG_KEY = 'roleSlug';

// In-memory user storage (primary)
let userMemory: User | null = null;
// In-memory roleSlug storage (primary)
let roleSlugMemory: string | null = null;

/**
 * Get user from memory (primary) or sessionStorage (fallback)
 */
const getUserFromStorage = (): User | null => {
  if (userMemory) return userMemory;
  const stored = sessionStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Get roleSlug from memory (primary) or sessionStorage (fallback)
 */
const getRoleSlugFromStorage = (): string | null => {
  if (roleSlugMemory) return roleSlugMemory;
  return sessionStorage.getItem(ROLE_SLUG_KEY);
};

/**
 * Set roleSlug in both memory and sessionStorage
 */
const setRoleSlugInStorage = (roleSlug: string | null): void => {
  roleSlugMemory = roleSlug;
  if (roleSlug) {
    sessionStorage.setItem(ROLE_SLUG_KEY, roleSlug);
  } else {
    sessionStorage.removeItem(ROLE_SLUG_KEY);
  }
};

/**
 * Clear roleSlug from memory and sessionStorage
 */
const clearRoleSlugFromStorage = (): void => {
  roleSlugMemory = null;
  sessionStorage.removeItem(ROLE_SLUG_KEY);
};

/**
 * Set user in both memory and sessionStorage
 */
const setUserInStorage = (user: User | null, roleSlug?: string | null): void => {
  userMemory = user;
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_KEY);
  }
  // Store roleSlug separately if provided
  if (roleSlug !== undefined) {
    setRoleSlugInStorage(roleSlug);
  }
};

/**
 * Clear user from memory and sessionStorage
 */
const clearUserFromStorage = (): void => {
  userMemory = null;
  sessionStorage.removeItem(USER_KEY);
  clearRoleSlugFromStorage();
};

/**
 * Auth store - keeps user data in memory and sessionStorage
 * Access token is managed separately via tokenHelper (memory + sessionStorage)
 * roleSlug is stored separately from user data
 */
const useAuthStore = create<AuthState>((set, get) => ({
  user: getUserFromStorage(),

  login: async (accessToken: string, roleSlug?: string) => {
    try {
      const payload = await verifyToken(accessToken);
      const user: User = { ...extractUserFromToken(payload) };
      setTokenInStorage(accessToken);
      setUserInStorage(user, roleSlug || null);
      set({ user });
    } catch {
      throw new Error('Token verification failed during login');
    }
  },

  updateAccessToken: async (accessToken: string, roleSlug?: string) => {
    try {
      const payload = await verifyToken(accessToken);
      const user: User = { ...extractUserFromToken(payload) };
      // Preserve existing roleSlug if new one not provided, otherwise use new one
      const roleSlugToStore = roleSlug || getRoleSlugFromStorage();
      setTokenInStorage(accessToken);
      setUserInStorage(user, roleSlugToStore);
      set({ user });
    } catch {
      throw new Error('Token verification failed during refresh');
    }
  },

  getRoleSlug: (): string | null => {
    return getRoleSlugFromStorage();
  },

  logout: () => {
    clearAccessToken();
    clearUserFromStorage();
    localStorage.removeItem('resolutionModalShown');
    // Clear all sessionStorage
    sessionStorage.clear();
    set({ user: null });
  },

  isAuthenticated: (): boolean => {
    const state = get();
    // Check in-memory state first, then fallback to sessionStorage
    return !!state.user || !!getUserFromStorage();
  },
}));

/**
 * Initialize auth state from sessionStorage on app load
 * Recovers user session if valid access token exists or user is in sessionStorage
 */
export const initializeAuth = async (): Promise<void> => {
  const token = getAccessToken();
  const storedUser = getUserFromStorage();
  const storedRoleSlug = getRoleSlugFromStorage();

  // If user exists in sessionStorage, restore it to memory
  if (storedUser) {
    userMemory = storedUser;
    useAuthStore.setState({ user: storedUser });
  }

  // Restore roleSlug to memory if it exists
  if (storedRoleSlug) {
    roleSlugMemory = storedRoleSlug;
  }

  // Verify token if it exists
  if (token) {
    const tokenValid = await isTokenValid();
    if (tokenValid) {
      try {
        // Verify token signature on app initialization
        const payload = await verifyToken(token);
        const user = extractUserFromToken(payload);
        // Preserve existing roleSlug when reinitializing
        setUserInStorage(user, storedRoleSlug);
        useAuthStore.setState({ user });
      } catch {
        // Token verification failed - clear it
        clearAccessToken();
        clearUserFromStorage();
        useAuthStore.setState({ user: null });
      }
    } else {
      // Token exists but is expired - clear it
      clearAccessToken();
      clearUserFromStorage();
      useAuthStore.setState({ user: null });
    }
  } else if (storedUser) {
    // User exists in sessionStorage but no token - clear user
    clearUserFromStorage();
    useAuthStore.setState({ user: null });
  }
};

export default useAuthStore;
