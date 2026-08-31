import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface NetworkStatusContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  checkConnection: () => Promise<boolean>;
  triggerSync: () => Promise<void>;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  isSyncing: false,
  lastSyncedAt: null,
  checkConnection: async () => true,
  triggerSync: async () => {},
});

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const online = res.ok;
      setIsOnline(online);
      if (online) setLastSyncedAt(new Date());
      return online;
    } catch {
      // In offline mode, the fetch fails or aborts
      setIsOnline(false);
      return false;
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    await checkConnection();
    // Dispatch custom window event so individual views/components can re-fetch queries
    window.dispatchEvent(new CustomEvent('app:sync-data'));
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedAt(new Date());
    }, 600);
  }, [checkConnection]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial ping
    checkConnection();

    // Check status periodically every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, triggerSync]);

  return (
    <NetworkStatusContext.Provider
      value={{
        isOnline,
        isSyncing,
        lastSyncedAt,
        checkConnection,
        triggerSync,
      }}
    >
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkStatusContext);
