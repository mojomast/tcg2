import { GameEvent, GameState, EventType } from '../interfaces/gameState';
import store from '../store/store';
import { setGameStateFromServer, setLocalPlayerId } from '../store/slices/gameSlice';

// Type definitions for the global io (from CDN)
declare global {
  interface Window {
    io: any; // This is the socket.io client instance from the CDN
  }
}

const io = window.io;

// Debug: Check if Socket.IO client was loaded from CDN and basic functionality
if (typeof io !== 'function') {
  console.error('[socketService]: Socket.IO client (io) not found on window. Ensure CDN script is loaded before this service.');
} else {
  console.log('[socketService]: Socket.IO client from CDN detected.');
  try {
    // Test socket creation without auto-connecting to prevent immediate connection attempts here.
    const testSocket = io('http://localhost:3000', { autoConnect: false });
    console.log('[socketService]: Test socket instance created successfully (type:', typeof testSocket, '). Connect method type:', typeof testSocket.connect);
    testSocket.close(); // Close the test socket as it's not used further.
  } catch (e: any) {
    console.error('[socketService]: Failed to create test socket instance:', e.message);
  }
}

const SERVER_URL = 'http://localhost:3000';
console.log('[socketService] Target SERVER_URL for connection:', SERVER_URL);

class SocketService {
  private socket: any | null = null; // Using 'any' due to CDN loading; ideally, Socket from 'socket.io-client' types
  private serviceInstanceId: string;

  constructor() {
    this.serviceInstanceId = `SocketServiceInstance_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[${this.serviceInstanceId}] INSTANCE CREATED`);
  }

  connect(): void {
    console.log(`[${this.serviceInstanceId}] connect() CALLED. Current socket state:`, this.socket ? { connected: this.socket.connected, id: this.socket.id } : null);

    if (this.socket && this.socket.connected) {
      console.log(`[${this.serviceInstanceId}]: Already connected with socket ID: ${this.socket.id}`);
      return;
    }

    if (this.socket) {
      console.log(`[${this.serviceInstanceId}]: Socket exists but not connected (ID: ${this.socket.id}), attempting to reconnect existing instance.`);
      this.socket.connect(); // Attempt to reconnect existing instance
      // Listeners should already be attached from the initial creation
      return;
    }

    console.log(`[${this.serviceInstanceId}]: Creating new socket connection to ${SERVER_URL}...`);
    this.socket = io(SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,       // Reduced delay
      reconnectionDelayMax: 10000,   // Max delay
      timeout: 10000,                // Connection timeout
      transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
      // autoConnect: true, // Default is true, explicit for clarity if needed
    });
    console.log(`[${this.serviceInstanceId}]: New socket instance created (ID before connect: ${this.socket.id}). Attaching listeners...`);

    // --- Attach all listeners only once for the new socket instance ---
    this.socket.on('connect', () => {
      console.log(`[${this.serviceInstanceId}]: Successfully CONNECTED to server. Socket ID: ${this.socket?.id}`);
      // Server might send 'player_id_assigned' or 'test_event' upon connection.
    });

    this.socket.on('disconnect', (reason: string, details?: any) => {
      console.error(`[${this.serviceInstanceId}]: DISCONNECTED. Reason: ${reason}`, details ? `Details: ${JSON.stringify(details)}` : '');
      if (reason === 'io server disconnect') {
        console.log(`[${this.serviceInstanceId}]: Disconnection was initiated by the server.`);
      }
      // Do not set this.socket to null here if we want to allow reconnection attempts using the same instance.
      // If connect() is called again, it will use this.socket.connect() if this.socket is not null.
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error(`[${this.serviceInstanceId}]: CONNECTION ERROR: ${error.message}`, error);
    });

    this.socket.on('error', (error: Error) => {
      console.error(`[${this.serviceInstanceId}]: GENERAL SOCKET ERROR: ${error.message}`, error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`[${this.serviceInstanceId}]: Reconnect attempt #${attemptNumber}...`);
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error(`[${this.serviceInstanceId}]: RECONNECT ERROR: ${error.message}`, error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error(`[${this.serviceInstanceId}]: All reconnect attempts FAILED.`);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`[${this.serviceInstanceId}]: Successfully RECONNECTED after ${attemptNumber} attempts. New Socket ID: ${this.socket?.id}`);
    });

    this.socket.onAny((eventName: string, ...args: any[]) => {
      // Avoid logging for very frequent events if necessary, e.g., ping/pong
      if (eventName !== 'pong' && eventName !== 'ping') {
         console.log(`[${this.serviceInstanceId}] CAUGHT EVENT (onAny): '${eventName}'`, args.length > 0 ? args : '<no_args>');
      }
    });

    this.socket.on('test_event', (data: { message: string }) => {
      console.log(`[${this.serviceInstanceId}]: Received 'test_event' from server:`, data);
    });

    this.socket.on('player_id_assigned', (data: { playerId: string; playerName?: string }) => {
      if (!this.socket?.connected) {
        console.warn(`[${this.serviceInstanceId}]: Received 'player_id_assigned' but socket is not connected. Ignoring.`);
        return;
      }
      console.log(`[${this.serviceInstanceId}]: 'player_id_assigned' received: PlayerID=${data.playerId}, Name=${data.playerName}`);
      const playerName = data.playerName || `Player ${data.playerId.substring(0, 5)}`;
      // The name will be updated by the setLocalPlayerId reducer
      // Also set localPlayerId if this event is authoritative for it
      store.dispatch(setLocalPlayerId(data.playerId)); 
    });

    this.socket.on('game_event', (eventData: GameEvent) => {
      console.log(`[${this.serviceInstanceId}]: Received 'game_event' from server. Type: ${eventData.type}`, eventData.payload);

      if (!eventData || !eventData.type) {
        console.warn(`[${this.serviceInstanceId}]: Received invalid 'game_event' (no type):`, eventData);
        return;
      }

      switch (eventData.type) {
        case EventType.GAME_STATE_UPDATE:
          if (eventData.payload?.gameState) {
            console.log(`[${this.serviceInstanceId}]: Dispatching setGameStateFromServer for GAME_STATE_UPDATE.`);
            store.dispatch(setGameStateFromServer(eventData.payload.gameState as GameState));
          } else {
            console.warn(`[${this.serviceInstanceId}]: GAME_STATE_UPDATE event missing gameState payload:`, eventData.payload);
          }
          break;
        case EventType.GAME_READY:
          if (eventData.payload?.gameState) {
            console.log(`[${this.serviceInstanceId}]: Dispatching setGameStateFromServer for GAME_READY.`);
            store.dispatch(setGameStateFromServer(eventData.payload.gameState as GameState));
          } else {
            console.warn(`[${this.serviceInstanceId}]: GAME_READY event missing gameState payload:`, eventData.payload);
          }
          break;
        // PLAYER_ID_ASSIGNED is handled by its own listener now, but can be a game_event too.
        // case EventType.PLAYER_ID_ASSIGNED: 
        //   if (eventData.payload?.playerId) {
        //     console.log(`[${this.serviceInstanceId}]: Dispatching setLocalPlayerId from game_event.`);
        //     store.dispatch(setLocalPlayerId(eventData.payload.playerId as string));
        //   } else {
        //     console.warn(`[${this.serviceInstanceId}]: PLAYER_ID_ASSIGNED event missing playerId payload:`, eventData.payload);
        //   }
        //   break;
        default:
          console.warn(`[${this.serviceInstanceId}]: Received 'game_event' with unhandled type '${eventData.type}':`, eventData.payload);
      }
    });

    // Explicitly call connect if autoConnect is false or to ensure connection attempt
    // If autoConnect is true (default), this might be redundant but generally harmless.
    // this.socket.connect(); // Already called if this.socket was null and newly created. If autoConnect is false, then it's needed.
    console.log(`[${this.serviceInstanceId}]: All listeners attached. Socket ID after setup: ${this.socket.id}. Attempting connection if not already.`);
  }

  disconnect(): void {
    if (this.socket) {
      console.log(`[${this.serviceInstanceId}]: disconnect() called. Disconnecting socket ID: ${this.socket.id}`);
      this.socket.disconnect();
      // Consider if socket instance should be nulled or listeners removed if it's not meant to be reused.
      // For now, allow connect() to reuse and call .connect() on the existing instance.
      // this.socket = null; 
    } else {
      console.log(`[${this.serviceInstanceId}]: disconnect() called, but no active socket instance.`);
    }
  }

  // Generic event listener registration (e.g., for UI components)
  on(eventName: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(eventName, callback);
    } else {
      console.warn(`[${this.serviceInstanceId}]: Cannot register listener for '${eventName}'. Socket not initialized. Call connect() first.`);
    }
  }

  // Generic event listener removal
  off(eventName: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(eventName, callback);
    } else {
      console.warn(`[${this.serviceInstanceId}]: Cannot unregister listener for '${eventName}'. Socket not initialized.`);
    }
  }

  emit(eventName: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName, data);
      console.log(`[${this.serviceInstanceId}]: Emitted event '${eventName}' with data:`, data);
    } else {
      console.warn(`[${this.serviceInstanceId}]: Cannot emit event '${eventName}'. Socket not connected or not initialized. Current socket:`, this.socket);
    }
  }

  // --- Game-specific emit actions ---
  emitJoinGame(gameId: string, playerId: string): void {
    this.emit('join_game', { gameId, playerId });
  }

  emitDiscardCard(playerId: string, cardInstanceId: string): void {
    this.emit('discard_card', { playerId, cardInstanceId });
  }

  emitPassTurn(playerId: string): void {
    this.emit('pass_turn', { playerId });
  }

  getSocket(): any | null { // Return type 'any' due to CDN loading
    return this.socket;
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
