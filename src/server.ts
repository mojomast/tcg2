import express, { Express, Request, Response } from 'express';
import http from 'http'; 
import { Server } from 'socket.io'; 
import { GameEngine } from './game/gameEngine'; 

// --- Placeholder --- 
// This would normally involve managing multiple game instances
// and associating sockets with players/games.
let gameEngine: GameEngine | null = null; // Placeholder for a single game instance for now
// Function to get player ID from socket (needs implementation)
const getPlayerIdFromSocket = (socket: any): string => 'player1'; // Placeholder
// Function to get GameEngine instance (needs implementation)
const getGameEngineForSocket = (socket: any): GameEngine | null => gameEngine; // Placeholder
// --- End Placeholder ---

const app: Express = express();
const port = process.env.PORT || 3001; 

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Badass TCG Server is running!');
});

// Initialize a placeholder game engine (remove in real implementation)
if (!gameEngine) {
    // gameEngine = new GameEngine(/* initial game state or config */); 
    console.warn('[server]: Placeholder GameEngine created. Implement proper game management.');
}

io.on('connection', (socket) => {
  console.log(`[socket]: Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[socket]: Client disconnected: ${socket.id}`);
    // TODO: Handle player leaving game instance if necessary
  });

  // --- Game Action Listeners --- 

  // Listener for declaring attackers
  socket.on('declare_attackers', (attackerIds: string[]) => {
    console.log(`[socket ${socket.id}]: Received declare_attackers`, attackerIds);
    const playerId = getPlayerIdFromSocket(socket);
    const currentEngine = getGameEngineForSocket(socket);
    if (currentEngine) {
        try {
            const success = currentEngine.declareAttackers(playerId, attackerIds);
            console.log(`[gameEngine]: declareAttackers result for ${playerId}: ${success}`);
            // TODO: Emit game state update to clients
        } catch (error: any) {
            console.error(`[gameEngine]: Error processing declare_attackers for ${playerId}:`, error.message);
            // TODO: Emit error back to the specific client
            socket.emit('game_error', { message: error.message }); 
        }
    } else {
        console.error(`[server]: No GameEngine found for socket ${socket.id}`);
         socket.emit('game_error', { message: 'Game not found.' }); 
    }
  });

  // Listener for declaring blockers
  socket.on('declare_blockers', (blockerMap: Record<string, string>) => { // { blockerId: attackerId }
    console.log(`[socket ${socket.id}]: Received declare_blockers`, blockerMap);
    const playerId = getPlayerIdFromSocket(socket);
    const currentEngine = getGameEngineForSocket(socket);
    if (currentEngine) {
        try {
            const success = currentEngine.declareBlockers(playerId, blockerMap);
            console.log(`[gameEngine]: declareBlockers result for ${playerId}: ${success}`);
            // TODO: Emit game state update to clients
        } catch (error: any) {
            console.error(`[gameEngine]: Error processing declare_blockers for ${playerId}:`, error.message);
            // TODO: Emit error back to the specific client
            socket.emit('game_error', { message: error.message }); 
        }
    } else {
        console.error(`[server]: No GameEngine found for socket ${socket.id}`);
         socket.emit('game_error', { message: 'Game not found.' }); 
    }
  });

  // --- End Game Action Listeners ---
});

httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
