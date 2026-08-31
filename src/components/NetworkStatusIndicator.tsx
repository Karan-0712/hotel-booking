import React from 'react';
import { useNetworkStatus } from '../context/NetworkStatusContext.tsx';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const NetworkStatusIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isOnline, isSyncing, triggerSync, lastSyncedAt } = useNetworkStatus();

  if (compact) {
    return (
      <button
        onClick={() => triggerSync()}
        disabled={isSyncing}
        title={
          isOnline
            ? `Online • Synced ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'now'}`
            : 'Offline Mode • Local storage active. Click to retry sync'
        }
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
          isOnline
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70'
            : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 animate-pulse'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
        {isSyncing ? (
          <>
            <RefreshCw className="w-3 h-3 animate-spin text-[#947139]" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        ) : isOnline ? (
          <>
            <Wifi className="w-3 h-3 text-emerald-600 hidden sm:inline" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-amber-600" />
            <span>Offline Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div
      className={`px-3 py-1.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
        isOnline
          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200 animate-pulse" />
        )}
        <div>
          <span className="font-semibold">
            {isOnline ? 'System Online & Synchronized' : 'Offline Mode (Local Storage Active)'}
          </span>
          <p className="text-[10px] opacity-80">
            {isOnline
              ? `Cloud database & POS connected • Last sync: ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'now'}`
              : 'All check-ins, folios, and bookings continue to work locally and will sync when reconnected.'}
          </p>
        </div>
      </div>

      <button
        onClick={() => triggerSync()}
        disabled={isSyncing}
        className="px-2.5 py-1 rounded-lg bg-white border border-black/10 hover:bg-black/5 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#947139]' : ''}`} />
        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
      </button>
    </div>
  );
};
