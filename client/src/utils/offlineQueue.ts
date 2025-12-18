import localforage from 'localforage';

// Configure localforage for offline queue
const offlineQueue = localforage.createInstance({
  name: 'CureAndCareDispatch',
  storeName: 'offlineQueue'
});

export interface QueuedAction {
  id: string;
  type: 'delivery-status' | 'proof-upload' | 'petty-cash' | 'location-update' | 'failed-delivery';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface QueueStatus {
  total: number;
  pending: number;
  syncing: boolean;
  lastSyncTime?: number;
  errors: number;
}

// Add action to queue
export const queueAction = async (
  type: QueuedAction['type'],
  endpoint: string,
  method: QueuedAction['method'],
  data: any
): Promise<void> => {
  const action: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    endpoint,
    method,
    data,
    timestamp: Date.now(),
    retryCount: 0
  };

  try {
    const queue = await getQueue();
    queue.push(action);
    await offlineQueue.setItem('queue', queue);
    console.log('Action queued:', action);
  } catch (error) {
    console.error('Failed to queue action:', error);
    throw error;
  }
};

// Get all queued actions
export const getQueue = async (): Promise<QueuedAction[]> => {
  try {
    const queue = await offlineQueue.getItem<QueuedAction[]>('queue');
    return queue || [];
  } catch (error) {
    console.error('Failed to get queue:', error);
    return [];
  }
};

// Remove action from queue
export const removeFromQueue = async (id: string): Promise<void> => {
  try {
    const queue = await getQueue();
    const filtered = queue.filter(action => action.id !== id);
    await offlineQueue.setItem('queue', filtered);
    console.log('Action removed from queue:', id);
  } catch (error) {
    console.error('Failed to remove from queue:', error);
  }
};

// Update action in queue (for retry count, errors)
export const updateQueueAction = async (id: string, updates: Partial<QueuedAction>): Promise<void> => {
  try {
    const queue = await getQueue();
    const index = queue.findIndex(action => action.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await offlineQueue.setItem('queue', queue);
    }
  } catch (error) {
    console.error('Failed to update queue action:', error);
  }
};

// Clear entire queue
export const clearQueue = async (): Promise<void> => {
  try {
    await offlineQueue.setItem('queue', []);
    console.log('Queue cleared');
  } catch (error) {
    console.error('Failed to clear queue:', error);
  }
};

// Get queue status
export const getQueueStatus = async (): Promise<QueueStatus> => {
  try {
    const queue = await getQueue();
    const lastSyncTime = await offlineQueue.getItem<number>('lastSyncTime');
    const syncing = await offlineQueue.getItem<boolean>('syncing');
    
    return {
      total: queue.length,
      pending: queue.filter(a => a.retryCount < 5).length,
      syncing: syncing || false,
      lastSyncTime: lastSyncTime || undefined,
      errors: queue.filter(a => a.retryCount >= 5).length
    };
  } catch (error) {
    console.error('Failed to get queue status:', error);
    return {
      total: 0,
      pending: 0,
      syncing: false,
      errors: 0
    };
  }
};

// Set syncing status
export const setSyncingStatus = async (syncing: boolean): Promise<void> => {
  try {
    await offlineQueue.setItem('syncing', syncing);
  } catch (error) {
    console.error('Failed to set syncing status:', error);
  }
};

// Update last sync time
export const updateLastSyncTime = async (): Promise<void> => {
  try {
    await offlineQueue.setItem('lastSyncTime', Date.now());
  } catch (error) {
    console.error('Failed to update last sync time:', error);
  }
};

// Retry action with exponential backoff
export const calculateBackoff = (retryCount: number): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(Math.pow(2, retryCount) * 1000, 16000);
};

export default offlineQueue;
