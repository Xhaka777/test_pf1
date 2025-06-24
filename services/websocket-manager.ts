import { AppState, AppStateStatus } from 'react-native';
import { getWSSBaseUrl } from '@/api/services/api';
import { MessageType, parseWebSocketMessage } from '@/api/services/web-socket-parser';
import { WssRoutes } from '@/api/types';

export interface WebSocketConnection {
  id: string;
  url: string;
  socket: WebSocket | null;
  subscriptionMessage?: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: string) => void;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  isManuallyDisconnected: boolean;
  messageType?: MessageType;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocketConnection> = new Map();
  private appStateSubscription: any;
  private appState: AppStateStatus = 'active';
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeAppStateListener();
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private initializeAppStateListener(): void {
    this.appState = AppState.currentState;
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    console.log(`[WebSocketManager] App state changed: ${this.appState} -> ${nextAppState}`);
    
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground - reconnect all connections
      console.log('[WebSocketManager] App came to foreground, reconnecting...');
      this.reconnectAll();
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background - pause reconnection attempts
      console.log('[WebSocketManager] App went to background');
      this.pauseReconnectionAttempts();
    }
    
    this.appState = nextAppState;
  };

  public createConnection(config: {
    id: string;
    endpoint: WssRoutes;
    subscriptionMessage?: string;
    onMessage?: (data: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: string) => void;
    maxReconnectAttempts?: number;
    messageType?: MessageType;
  }): string {
    const { id, endpoint, subscriptionMessage, maxReconnectAttempts = 5, messageType } = config;
    
    // Close existing connection if it exists
    this.closeConnection(id);

    const url = getWSSBaseUrl() + endpoint;
    
    const connection: WebSocketConnection = {
      id,
      url,
      socket: null,
      subscriptionMessage,
      onMessage: config.onMessage,
      onOpen: config.onOpen,
      onClose: config.onClose,
      onError: config.onError,
      reconnectAttempts: 0,
      maxReconnectAttempts,
      reconnectDelay: 1000,
      isManuallyDisconnected: false,
      messageType
    };

    this.connections.set(id, connection);
    this.connect(id);
    
    return id;
  }

  private connect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.isManuallyDisconnected) {
      return;
    }

    // Clear any existing reconnect timeout
    this.clearReconnectTimeout(connectionId);

    console.log(`[WebSocketManager] Connecting to ${connection.url}`);

    try {
      connection.socket = new WebSocket(connection.url);

      connection.socket.onopen = () => {
        console.log(`[WebSocketManager] Connection ${connectionId} opened`);
        connection.reconnectAttempts = 0;
        connection.onOpen?.();

        // Send subscription message if provided
        if (connection.subscriptionMessage && connection.socket?.readyState === WebSocket.OPEN) {
          connection.socket.send(connection.subscriptionMessage);
        }
      };

      connection.socket.onmessage = (event: MessageEvent) => {
        try {
          let parsedData;
          
          if (connection.messageType) {
            parsedData = parseWebSocketMessage(event.data, connection.messageType);
          } else {
            parsedData = JSON.parse(event.data);
          }
          
          connection.onMessage?.(parsedData);
        } catch (error) {
          console.error(`[WebSocketManager] Failed to parse message for ${connectionId}:`, error);
        }
      };

      connection.socket.onerror = (error: Event) => {
        console.error(`[WebSocketManager] Connection ${connectionId} error:`, error);
        connection.onError?.(`WebSocket connection error for ${connectionId}`);
      };

      connection.socket.onclose = (event: CloseEvent) => {
        console.log(`[WebSocketManager] Connection ${connectionId} closed:`, event.code, event.reason);
        connection.onClose?.();
        
        // Only attempt reconnection if not manually disconnected
        if (!connection.isManuallyDisconnected && !event.wasClean) {
          this.scheduleReconnect(connectionId);
        }
      };

    } catch (error) {
      console.error(`[WebSocketManager] Failed to create connection ${connectionId}:`, error);
      connection.onError?.(`Failed to create WebSocket connection: ${error}`);
      this.scheduleReconnect(connectionId);
    }
  }

  private scheduleReconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.isManuallyDisconnected) {
      return;
    }

    if (connection.reconnectAttempts >= connection.maxReconnectAttempts) {
      console.log(`[WebSocketManager] Max reconnection attempts reached for ${connectionId}`);
      connection.onError?.(`Connection failed after ${connection.maxReconnectAttempts} attempts`);
      return;
    }

    // Don't reconnect if app is in background
    if (this.appState.match(/inactive|background/)) {
      console.log(`[WebSocketManager] App in background, skipping reconnect for ${connectionId}`);
      return;
    }

    const delay = Math.min(connection.reconnectDelay * Math.pow(2, connection.reconnectAttempts), 30000);
    connection.reconnectAttempts++;

    console.log(`[WebSocketManager] Scheduling reconnection ${connection.reconnectAttempts} for ${connectionId} in ${delay}ms`);

    const timeout = setTimeout(() => {
      this.connect(connectionId);
    }, delay);

    this.reconnectTimeouts.set(connectionId, timeout);
  }

  private clearReconnectTimeout(connectionId: string): void {
    const timeout = this.reconnectTimeouts.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(connectionId);
    }
  }

  public closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    console.log(`[WebSocketManager] Closing connection ${connectionId}`);
    
    connection.isManuallyDisconnected = true;
    this.clearReconnectTimeout(connectionId);

    if (connection.socket) {
      connection.socket.onopen = null;
      connection.socket.onmessage = null;
      connection.socket.onerror = null;
      connection.socket.onclose = null;
      
      if (connection.socket.readyState === WebSocket.OPEN || connection.socket.readyState === WebSocket.CONNECTING) {
        connection.socket.close(1000, 'Manual disconnect');
      }
      connection.socket = null;
    }

    this.connections.delete(connectionId);
  }

  public reconnectConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.warn(`[WebSocketManager] Connection ${connectionId} not found for reconnection`);
      return;
    }

    console.log(`[WebSocketManager] Manual reconnection requested for ${connectionId}`);
    connection.reconnectAttempts = 0;
    connection.isManuallyDisconnected = false;
    this.clearReconnectTimeout(connectionId);
    this.connect(connectionId);
  }

  public getConnectionStatus(connectionId: string): ConnectionStatus {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket) {
      return 'disconnected';
    }

    switch (connection.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSED:
      case WebSocket.CLOSING:
        return 'disconnected';
      default:
        return 'error';
    }
  }

  public sendMessage(connectionId: string, message: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || connection.socket.readyState !== WebSocket.OPEN) {
      console.warn(`[WebSocketManager] Cannot send message to ${connectionId}: connection not ready`);
      return false;
    }

    try {
      connection.socket.send(message);
      return true;
    } catch (error) {
      console.error(`[WebSocketManager] Failed to send message to ${connectionId}:`, error);
      return false;
    }
  }

  private reconnectAll(): void {
    console.log('[WebSocketManager] Reconnecting all connections...');
    this.connections.forEach((connection, connectionId) => {
      if (!connection.isManuallyDisconnected && this.getConnectionStatus(connectionId) !== 'connected') {
        this.reconnectConnection(connectionId);
      }
    });
  }

  private pauseReconnectionAttempts(): void {
    console.log('[WebSocketManager] Pausing reconnection attempts...');
    this.reconnectTimeouts.forEach((timeout, connectionId) => {
      clearTimeout(timeout);
    });
    this.reconnectTimeouts.clear();
  }

  public getAllConnections(): Array<{ id: string; status: ConnectionStatus; url: string }> {
    return Array.from(this.connections.entries()).map(([id, connection]) => ({
      id,
      status: this.getConnectionStatus(id),
      url: connection.url
    }));
  }

  public cleanup(): void {
    console.log('[WebSocketManager] Cleaning up all connections...');
    
    // Close all connections
    const connectionIds = Array.from(this.connections.keys());
    connectionIds.forEach(id => this.closeConnection(id));

    // Clear all timeouts
    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts.clear();

    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  // Static cleanup method for app shutdown
  public static cleanup(): void {
    if (WebSocketManager.instance) {
      WebSocketManager.instance.cleanup();
      WebSocketManager.instance = null as any;
    }
  }
}