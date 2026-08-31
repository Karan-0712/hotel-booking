import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile } from '../types.ts';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
}

interface AuthContextType {
  user: AppUser | FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  token: string | null;
  isAdmin: boolean;
  adminToken: string | null;
  signUpWithEmail: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
  loginWithGoogle: () => Promise<void>;
  loginAsAdmin: (credentials: { email?: string; password?: string; secretKey?: string }) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocalProfile: (data: Partial<UserProfile>) => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('grand_imperial_user_token');
    } catch {
      return null;
    }
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('grand_imperial_admin_token');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Authenticated fetch wrapper that attaches Bearer token & Admin token
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    let currentToken = token;
    if (auth.currentUser) {
      try {
        currentToken = await auth.currentUser.getIdToken(true);
        setToken(currentToken);
      } catch (e) {
        console.warn('Failed to refresh ID token:', e);
      }
    }

    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    if (adminToken) {
      headers.set('x-admin-token', adminToken);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Restore stored session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('grand_imperial_user_token');
      const storedAdminToken = localStorage.getItem('grand_imperial_admin_token');

      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setToken(storedToken);
            setProfile(data.profile || data.user);
            setUser({
              uid: data.user.uid,
              email: data.user.email,
              displayName: data.user.name || data.user.email?.split('@')[0],
              photoURL: data.profile?.avatar,
              phoneNumber: data.profile?.phone,
            });
            if (data.isAdmin || storedAdminToken) {
              setAdminToken(storedAdminToken || storedToken);
            }
          } else {
            // Stored user token is invalid
            localStorage.removeItem('grand_imperial_user_token');
            setToken(null);
          }
        } catch (e) {
          console.warn('Session verification notice:', e);
        }
      } else if (storedAdminToken) {
        try {
          const res = await fetch('/api/admin/verify', {
            headers: {
              'x-admin-token': storedAdminToken,
            },
          });
          if (res.ok) {
            setAdminToken(storedAdminToken);
            setUser({
              uid: 'admin_master_uid',
              email: 'admin@grandimperialpalace.in',
              displayName: 'Palace General Manager',
            });
            setProfile({
              id: 1,
              uid: 'admin_master_uid',
              email: 'admin@grandimperialpalace.in',
              name: 'Palace General Manager',
              role: 'admin',
              loyaltyPoints: 5000,
            } as any);
          } else {
            localStorage.removeItem('grand_imperial_admin_token');
            setAdminToken(null);
          }
        } catch (e) {
          console.warn('Admin token check:', e);
        }
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  // Database Sign Up
  const signUpWithEmail = async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to sign up.' };
      }

      const { token: sessionToken, user: userData, profile: userProfile, isAdmin: isAdm } = resData;
      setToken(sessionToken);
      try {
        localStorage.setItem('grand_imperial_user_token', sessionToken);
      } catch (err) {
        console.warn(err);
      }

      setUser({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.name,
        phoneNumber: userProfile?.phone,
        photoURL: userProfile?.avatar,
      });
      setProfile(userProfile);

      if (isAdm) {
        setAdminToken(sessionToken);
        try {
          localStorage.setItem('grand_imperial_admin_token', sessionToken);
        } catch (err) {
          console.warn(err);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, error: err.message || 'Network error during sign up.' };
    } finally {
      setLoading(false);
    }
  };

  // Database Login
  const loginWithEmail = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Invalid credentials.' };
      }

      const { token: sessionToken, user: userData, profile: userProfile, isAdmin: isAdm } = resData;
      setToken(sessionToken);
      try {
        localStorage.setItem('grand_imperial_user_token', sessionToken);
      } catch (err) {
        console.warn(err);
      }

      setUser({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.name,
        phoneNumber: userProfile?.phone,
        photoURL: userProfile?.avatar,
      });
      setProfile(userProfile);

      if (isAdm) {
        setAdminToken(sessionToken);
        try {
          localStorage.setItem('grand_imperial_admin_token', sessionToken);
        } catch (err) {
          console.warn(err);
        }
      }

      return { success: true, isAdmin: isAdm };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Network error during login.' };
    } finally {
      setLoading(false);
    }
  };

  // Admin Portal Login
  const loginAsAdmin = async (credentials: { email?: string; password?: string; secretKey?: string }) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setAdminToken(data.token);
        setToken(data.token);
        try {
          localStorage.setItem('grand_imperial_admin_token', data.token);
          localStorage.setItem('grand_imperial_user_token', data.token);
        } catch (err) {
          console.warn('Could not persist admin token to localStorage:', err);
        }

        setUser({
          uid: 'admin_master_uid',
          email: credentials.email || 'admin@grandimperialpalace.in',
          displayName: 'Palace General Manager',
        });
        setProfile({
          id: 1,
          uid: 'admin_master_uid',
          email: credentials.email || 'admin@grandimperialpalace.in',
          name: 'Palace General Manager',
          role: 'admin',
          loyaltyPoints: 5000,
        } as any);

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      return { success: false, error: err.message || 'Network error during admin login' };
    }
  };

  const logoutAdmin = async () => {
    try {
      if (adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: adminToken }),
        });
      }
    } catch (e) {
      console.warn('Error during admin logout:', e);
    } finally {
      setAdminToken(null);
      try {
        localStorage.removeItem('grand_imperial_admin_token');
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const syncUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);
      try {
        localStorage.setItem('grand_imperial_user_token', idToken);
      } catch (err) {
        console.warn(err);
      }

      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: firebaseUser.displayName,
          avatar: firebaseUser.photoURL,
        }),
      });

      if (res.ok) {
        const userProfile: UserProfile = await res.json();
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Failed to sync profile with database:', error);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile || data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const updateLocalProfile = (data: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...data });
    }
  };

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await syncUserProfile(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleAuthProvider);
      await syncUserProfile(result.user);
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setProfile(null);
      setToken(null);
      setAdminToken(null);
      try {
        localStorage.removeItem('grand_imperial_user_token');
        localStorage.removeItem('grand_imperial_admin_token');
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const isAdmin = Boolean(
    adminToken ||
    profile?.role === 'admin' ||
    (user?.email && ['davekaran2006@gmail.com', 'admin@grandimperialpalace.in', 'admin@palace.com'].includes(user.email.toLowerCase()))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        token,
        isAdmin,
        adminToken,
        signUpWithEmail,
        loginWithEmail,
        loginWithGoogle,
        loginAsAdmin,
        logoutAdmin,
        logout,
        refreshProfile,
        updateLocalProfile,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
