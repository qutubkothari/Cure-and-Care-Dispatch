import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join rooms
  joinDriverRoom(driverId: string) {
    this.socket?.emit('join-driver', driverId);
  }

  joinAdminRoom() {
    this.socket?.emit('join-admin');
  }

  // Send location update
  sendLocationUpdate(data: any) {
    this.socket?.emit('location-update', data);
  }

  // Listen for events
  onNewDelivery(callback: (data: any) => void) {
    this.socket?.on('new-delivery', callback);
  }

  onDeliveryUpdated(callback: (data: any) => void) {
    this.socket?.on('delivery-updated', callback);
  }

  onDriverLocation(callback: (data: any) => void) {
    this.socket?.on('driver-location', callback);
  }

  onPettyCashSubmitted(callback: (data: any) => void) {
    this.socket?.on('petty-cash-submitted', callback);
  }

  onPettyCashUpdated(callback: (data: any) => void) {
    this.socket?.on('petty-cash-updated', callback);
  }

  // Remove listeners
  offNewDelivery(callback: (data: any) => void) {
    this.socket?.off('new-delivery', callback);
  }

  offDeliveryUpdated(callback: (data: any) => void) {
    this.socket?.off('delivery-updated', callback);
  }

  offDriverLocation(callback: (data: any) => void) {
    this.socket?.off('driver-location', callback);
  }

  offPettyCashSubmitted(callback: (data: any) => void) {
    this.socket?.off('petty-cash-submitted', callback);
  }

  offPettyCashUpdated(callback: (data: any) => void) {
    this.socket?.off('petty-cash-updated', callback);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
