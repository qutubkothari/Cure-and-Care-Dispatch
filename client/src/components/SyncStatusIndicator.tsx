import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getQueueStatus } from '../utils/offlineQueue';
import type { QueueStatus } from '../utils/offlineQueue';
import { processQueue, isOnline } from '../utils/offlineSync';

interface SyncStatusIndicatorProps {
  onSyncComplete?: () => void;
}

const SyncStatusIndicator = ({ onSyncComplete }: SyncStatusIndicatorProps) => {
  const [online, setOnline] = useState(isOnline());
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    total: 0,
    pending: 0,
    syncing: false,
    errors: 0
  });
  const [showDetails, setShowDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ processed: number; total: number } | null>(null);

  // Update queue status periodically
  useEffect(() => {
    const updateStatus = async () => {
      const status = await getQueueStatus();
      setQueueStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (syncing || !online) return;

    try {
      setSyncing(true);
      setSyncProgress({ processed: 0, total: queueStatus.total });

      await processQueue((processed, total) => {
        setSyncProgress({ processed, total });
      });

      // Refresh status
      const status = await getQueueStatus();
      setQueueStatus(status);

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = () => {
    if (!online) return 'bg-red-500';
    if (syncing || queueStatus.syncing) return 'bg-blue-500 animate-pulse';
    if (queueStatus.errors > 0) return 'bg-yellow-500';
    if (queueStatus.pending > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!online) return <WifiOff className="w-4 h-4" />;
    if (syncing || queueStatus.syncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (queueStatus.errors > 0) return <AlertCircle className="w-4 h-4" />;
    if (queueStatus.pending > 0) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!online) return 'Offline';
    if (syncing || queueStatus.syncing) return 'Syncing...';
    if (queueStatus.errors > 0) return 'Sync Errors';
    if (queueStatus.pending > 0) return 'Pending Sync';
    return 'Synced';
  };

  return (
    <div className="relative">
      {/* Status Badge */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor()} text-white font-semibold text-sm transition-all hover:opacity-90 shadow-md`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {queueStatus.pending > 0 && (
          <span className="bg-white text-gray-800 px-2 py-0.5 rounded-full text-xs font-bold">
            {queueStatus.pending}
          </span>
        )}
      </button>

      {/* Details Dropdown */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className={`${getStatusColor()} text-white p-4`}>
              <div className="flex items-center gap-2 mb-2">
                {online ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                <span className="font-bold">Sync Status</span>
              </div>
              <div className="text-sm opacity-90">
                {online ? 'Connected to server' : 'No internet connection'}
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-800">{queueStatus.total}</div>
                  <div className="text-xs text-gray-600 mt-1">Total</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">{queueStatus.pending}</div>
                  <div className="text-xs text-orange-600 mt-1">Pending</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{queueStatus.errors}</div>
                  <div className="text-xs text-red-600 mt-1">Errors</div>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
                <span>Last sync:</span>
                <span className="font-semibold">{formatLastSync(queueStatus.lastSyncTime)}</span>
              </div>

              {/* Sync Progress */}
              {syncProgress && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Syncing...</span>
                    <span className="font-semibold">
                      {syncProgress.processed}/{syncProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(syncProgress.processed / syncProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Manual Sync Button */}
              {online && queueStatus.pending > 0 && !syncing && (
                <button
                  onClick={handleManualSync}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </button>
              )}

              {/* Warnings */}
              {queueStatus.errors > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-800">
                      {queueStatus.errors} action{queueStatus.errors > 1 ? 's' : ''} failed after multiple retries.
                      Please check your data and try again.
                    </div>
                  </div>
                </div>
              )}

              {!online && queueStatus.pending > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <WifiOff className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      You're offline. Changes will sync automatically when you reconnect.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
