import axios from 'axios';
import {
  getQueue,
  removeFromQueue,
  updateQueueAction,
  setSyncingStatus,
  updateLastSyncTime,
  calculateBackoff
} from './offlineQueue';
import type { QueuedAction } from './offlineQueue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Process queued actions
export const processQueue = async (onProgress?: (processed: number, total: number) => void): Promise<void> => {
  const queue = await getQueue();
  
  if (queue.length === 0) {
    console.log('No queued actions to process');
    return;
  }

  console.log(`Processing ${queue.length} queued actions...`);
  await setSyncingStatus(true);

  let processed = 0;
  const total = queue.length;

  for (const action of queue) {
    // Skip if max retries reached
    if (action.retryCount >= 5) {
      console.log(`Skipping action ${action.id} - max retries reached`);
      continue;
    }

    // Apply exponential backoff for retries
    if (action.retryCount > 0) {
      const backoff = calculateBackoff(action.retryCount);
      console.log(`Waiting ${backoff}ms before retry ${action.retryCount + 1}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }

    try {
      await executeAction(action);
      await removeFromQueue(action.id);
      console.log(`Action ${action.id} executed successfully`);
      processed++;
      
      if (onProgress) {
        onProgress(processed, total);
      }
    } catch (error: any) {
      console.error(`Failed to execute action ${action.id}:`, error);
      
      // Update retry count and error
      await updateQueueAction(action.id, {
        retryCount: action.retryCount + 1,
        lastError: error.message || 'Unknown error'
      });

      // If max retries reached, notify user
      if (action.retryCount + 1 >= 5) {
        console.error(`Action ${action.id} failed after max retries`);
      }
    }
  }

  await setSyncingStatus(false);
  await updateLastSyncTime();
  
  console.log(`Queue processing complete. ${processed}/${total} actions synced.`);
};

// Execute a single queued action
const executeAction = async (action: QueuedAction): Promise<void> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const url = `${API_URL}${action.endpoint}`;

  switch (action.method) {
    case 'POST':
      await axios.post(url, action.data, config);
      break;
    case 'PUT':
      await axios.put(url, action.data, config);
      break;
    case 'PATCH':
      await axios.patch(url, action.data, config);
      break;
    default:
      throw new Error(`Unsupported method: ${action.method}`);
  }
};

// Auto-sync when online
export const startAutoSync = (interval: number = 30000): (() => void) => {
  let intervalId: NodeJS.Timeout | null = null;
  let isProcessing = false;

  const sync = async () => {
    if (isProcessing) return;
    
    try {
      isProcessing = true;
      await processQueue();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    } finally {
      isProcessing = false;
    }
  };

  // Start interval
  intervalId = setInterval(sync, interval);

  // Initial sync
  sync();

  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

// Handle online/offline events
export const setupNetworkListeners = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  const handleOnline = async () => {
    console.log('Network: ONLINE');
    if (onOnline) onOnline();
    
    // Auto-sync when coming back online
    try {
      await processQueue();
    } catch (error) {
      console.error('Failed to sync after coming online:', error);
    }
  };

  const handleOffline = () => {
    console.log('Network: OFFLINE');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Check if online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export default {
  processQueue,
  startAutoSync,
  setupNetworkListeners,
  isOnline
};
