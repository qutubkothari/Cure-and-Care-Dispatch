/**
 * Offline GPS Tracking Manager
 * Handles location tracking when driver's mobile loses connection
 */

interface QueuedLocation {
  id: string;
  deliveryId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
  status: string;
}

class OfflineTrackingManager {
  private watchId: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInterval: number | null = null;
  private readonly QUEUE_KEY = 'gps_location_queue';
  private readonly MAX_QUEUE_SIZE = 500; // Max locations to store

  constructor() {
    this.initOnlineListeners();
    this.startBackgroundSync();
  }

  /**
   * Listen for online/offline events
   */
  private initOnlineListeners(): void {
    window.addEventListener('online', () => {
      console.log('📡 Connection restored - syncing queued locations...');
      this.isOnline = true;
      this.syncQueuedLocations();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Connection lost - queuing locations locally...');
      this.isOnline = false;
    });
  }

  /**
   * Start continuous GPS tracking
   */
  startTracking(deliveryId: string, status: string = 'IN_TRANSIT'): void {
    if (this.watchId !== null) {
      console.warn('Tracking already active');
      return;
    }

    if (!('geolocation' in navigator)) {
      alert('GPS not supported on this device');
      return;
    }

    // Request permission and start tracking
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: QueuedLocation = {
          id: crypto.randomUUID(),
          deliveryId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: new Date().toISOString(),
          status
        };

        if (this.isOnline) {
          // Send immediately if online
          this.sendLocation(location);
        } else {
          // Queue for later if offline
          this.queueLocation(location);
          console.log('📍 Location queued (offline):', location);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('❌ Please enable location permissions in your browser settings');
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('⚠️ GPS position unavailable - continuing with queue');
            break;
          case error.TIMEOUT:
            console.warn('⏱️ GPS timeout - retrying...');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Always get fresh location
      }
    );

    console.log('✅ GPS tracking started for delivery:', deliveryId);
  }

  /**
   * Stop tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('🛑 GPS tracking stopped');
    }

    // Sync any remaining queued locations
    this.syncQueuedLocations();
  }

  /**
   * Send location to backend
   */
  private async sendLocation(location: QueuedLocation): Promise<boolean> {
    try {
      const response = await fetch('/api/tracking/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(location)
      });

      if (response.ok) {
        console.log('✅ Location sent:', location.timestamp);
        return true;
      } else {
        console.error('❌ Location send failed:', response.status);
        // Queue it for retry
        this.queueLocation(location);
        return false;
      }
    } catch (error) {
      console.error('❌ Network error sending location:', error);
      // Queue it for retry
      this.queueLocation(location);
      return false;
    }
  }

  /**
   * Save location to local queue
   */
  private queueLocation(location: QueuedLocation): void {
    try {
      const queue = this.getQueue();
      
      // Prevent queue from growing too large
      if (queue.length >= this.MAX_QUEUE_SIZE) {
        console.warn('⚠️ Queue full - removing oldest location');
        queue.shift(); // Remove oldest
      }

      queue.push(location);
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      
      // Show notification to user
      this.showOfflineNotification(queue.length);
    } catch (error) {
      console.error('Failed to queue location:', error);
    }
  }

  /**
   * Get queued locations
   */
  private getQueue(): QueuedLocation[] {
    try {
      const data = localStorage.getItem(this.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sync all queued locations to backend
   */
  async syncQueuedLocations(): Promise<void> {
    const queue = this.getQueue();
    
    if (queue.length === 0) {
      return;
    }

    console.log(`🔄 Syncing ${queue.length} queued locations...`);

    const successfulIds: string[] = [];

    for (const location of queue) {
      const success = await this.sendLocation(location);
      if (success) {
        successfulIds.push(location.id);
      }
    }

    // Remove successfully synced locations
    const remainingQueue = queue.filter(loc => !successfulIds.includes(loc.id));
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(remainingQueue));

    console.log(`✅ Synced ${successfulIds.length} locations, ${remainingQueue.length} remaining`);
    
    if (remainingQueue.length === 0) {
      this.showSyncSuccessNotification();
    }
  }

  /**
   * Background sync every 30 seconds
   */
  private startBackgroundSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncQueuedLocations();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Show offline notification to driver
   */
  private showOfflineNotification(queueSize: number): void {
    // Check if notification already shown
    const lastShown = parseInt(localStorage.getItem('offline_notif_shown') || '0');
    const now = Date.now();
    
    // Show once per minute max
    if (now - lastShown < 60000) return;
    
    localStorage.setItem('offline_notif_shown', now.toString());
    
    // Show UI notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div>
        <div class="font-semibold">Offline Mode</div>
        <div class="text-sm">${queueSize} locations queued</div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
  }

  /**
   * Show sync success notification
   */
  private showSyncSuccessNotification(): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <div>
        <div class="font-semibold">Back Online</div>
        <div class="text-sm">All locations synced!</div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Get queue size for UI display
   */
  getQueueSize(): number {
    return this.getQueue().length;
  }

  /**
   * Check if currently online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cleanup on app close
   */
  cleanup(): void {
    this.stopTracking();
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Singleton instance
export const offlineTracker = new OfflineTrackingManager();
