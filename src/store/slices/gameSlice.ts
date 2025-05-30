import { createSlice, PayloadAction, ThunkAction, Action } from '@reduxjs/toolkit';
import {
  PlayerId as ServerPlayerId,
  GameObjectId as ServerGameObjectId,
  BattlefieldCard as ServerBattlefieldCard,
  StackItem as ServerStackItem,
  GameState as ServerGameState,
  PlayerState as ServerPlayerState,
  GameEvent,
  EventType,
  ManaPool,
  GamePhase as ServerGamePhase,
  GameStep as ServerGameStep
} from '../../interfaces/gameState.js';
import { Card } from '../../interfaces/card.js';
import { v4 as uuidv4 } from 'uuid'; 
import { TEST_GAME_ID, TEST_PLAYER_1_ID, TEST_PLAYER_2_ID } from '../../config/constants'; 
import socketService from '../../services/socketService';
import { RootState } from '../store'; // For AppThunk type

// AppThunk type definition
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Client-side representation of PlayerState
export interface PlayerState {
  playerId: string;
  name: string; // Will be set to 'You (id)' or 'Opponent (id)'
  life: number;
  manaPool: ManaPool;
  hand: ServerGameObjectId[];
  handSize: number;
  library: ServerGameObjectId[]; 
  deckSize: number; // Number of cards in library, derived from library.length or deck_count
  graveyard: ServerGameObjectId[];
  battlefield: ServerGameObjectId[]; // Combined list of all player's cards on battlefield
  hasPlayedResourceThisTurn: boolean;
  energy: number;
  poisonCounters: number;
  deck_count: number; // Explicit count from server for library size
}

// Client-side game state
export interface GameState {
  localPlayerId: string | null;
  gameId: string | null;
  turnNumber: number;
  activePlayerId: string | null;
  priorityPlayerId: string | null;
  currentPhase: ServerGamePhase | null;
  currentStep: ServerGameStep | null;
  players: PlayerState[]; // Array of 2 players
  gameObjects: { [id: ServerGameObjectId]: ServerBattlefieldCard };
  stack: ServerGameState['stack']; 
  gameLog: string[];
  winner: string | null;
  consecutivePriorityPasses: number;
  attackers: ServerGameState['attackers'];
  blockers: ServerGameState['blockers'];
  gameEnded: boolean; // Add missing gameEnded property
  startingPlayerId: string | null; // Add missing startingPlayerId property
}

const initialPlayerStatePlaceholder: PlayerState = {
  playerId: '',
  name: 'Waiting for player...', 
  life: 0,
  manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
  hand: [],
  handSize: 0,
  library: [],
  deckSize: 0,
  graveyard: [],
  battlefield: [],
  hasPlayedResourceThisTurn: false,
  energy: 0,
  poisonCounters: 0,
  deck_count: 0,
};

const initialState: GameState = {
  localPlayerId: null,
  gameId: null,
  turnNumber: 0,
  activePlayerId: null,
  priorityPlayerId: null,
  currentPhase: null, 
  currentStep: null,
  // Initialize with two placeholder player states
  players: [
    { ...initialPlayerStatePlaceholder, name: 'Player Slot 1' }, 
    { ...initialPlayerStatePlaceholder, name: 'Player Slot 2' }
  ],
  gameObjects: {},
  stack: [],
  gameLog: [],
  winner: null,
  consecutivePriorityPasses: 0,
  attackers: {},
  blockers: {},
  gameEnded: false, // Initialize gameEnded to false
  startingPlayerId: null, // Initialize startingPlayerId to null
};

const createInitialBattlefieldCard = (
  card: Card, 
  instanceId: ServerGameObjectId, 
  ownerId: ServerPlayerId,
  zone: ServerBattlefieldCard['currentZone'] = 'battlefield'
): ServerBattlefieldCard => {
  return {
    ...card,
    instanceId,
    cardId: card.id, 
    currentZone: zone,
    ownerId: ownerId,
    controllerId: ownerId, 
    tapped: card.isTapped || false,
    summoningSickness: card.type === 'Creature', 
    damageMarked: 0,
    counters: {},
    attachments: [],
  };
};

const p1Id: ServerPlayerId = TEST_PLAYER_1_ID;
const p2Id: ServerPlayerId = TEST_PLAYER_2_ID;

const initialForestBearInstanceId = uuidv4();
const initialQuickGrowthInstanceId = uuidv4();
const initialVerdantLandInstanceId = uuidv4();

const initialPlayer1Hand = [initialForestBearInstanceId, initialQuickGrowthInstanceId];
const initialPlayer1Battlefield = [initialVerdantLandInstanceId];

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameStateFromServer: (state, action: PayloadAction<ServerGameState>) => {
      console.log('[gameSlice] setGameStateFromServer - Received action.payload (ServerGameState):', JSON.parse(JSON.stringify(action.payload)));
      const serverState = action.payload;
      console.log('[gameSlice] setGameStateFromServer: Received serverState (action.payload):', JSON.parse(JSON.stringify(serverState)));

      // Update non-player specific parts of the state
      state.gameId = serverState.gameId;
      state.turnNumber = serverState.turnNumber;
      state.activePlayerId = serverState.activePlayerId;
      state.priorityPlayerId = serverState.priorityPlayerId;

      state.currentPhase = serverState.currentPhase;
      state.currentStep = serverState.currentStep;
      state.stack = serverState.stack;
      state.gameLog = serverState.gameLog;
      state.winner = serverState.winner ?? null;
      state.consecutivePriorityPasses = serverState.consecutivePriorityPasses ?? 0;
      state.attackers = { ...(serverState.attackers || {}) };
      state.blockers = { ...(serverState.blockers || {}) };
      state.gameObjects = { ...serverState.gameObjects };
      state.gameEnded = serverState.gameEnded ?? false;
      state.startingPlayerId = serverState.startingPlayerId ?? null;

      // Map server players directly to client state players array
      // The order of players in state.players will now match serverState.players
      state.players = serverState.players.map((serverPlayer: ServerPlayerState, index: number): PlayerState => {
        console.log(`[gameSlice] setGameStateFromServer: Processing serverPlayer ${index + 1} (ID: ${serverPlayer.playerId}): hand from server:`, JSON.parse(JSON.stringify(serverPlayer.hand)), `hand.length: ${serverPlayer.hand.length}`);
        const clientPlayerName = state.localPlayerId === serverPlayer.playerId
          ? `You (${serverPlayer.playerId})`
          : `Opponent (${serverPlayer.playerId})`;

        return {
          playerId: serverPlayer.playerId,
          name: clientPlayerName,
          life: serverPlayer.life,
          manaPool: { ...serverPlayer.manaPool },
          hand: [...serverPlayer.hand], // Create a new array instance
          handSize: serverPlayer.hand.length,
          library: [...serverPlayer.library], // Create a new array instance
          deckSize: serverPlayer.library.length, // Or use serverPlayer.deck_count
          graveyard: [...serverPlayer.graveyard], // Create a new array instance
          battlefield: [
            ...serverPlayer.battlefield.creatures.map((c: ServerBattlefieldCard) => c.instanceId),
            ...serverPlayer.battlefield.resources.map((r: ServerBattlefieldCard) => r.instanceId),
            ...serverPlayer.battlefield.enchantments.map((e: ServerBattlefieldCard) => e.instanceId),
            ...serverPlayer.battlefield.artifacts.map((a: ServerBattlefieldCard) => a.instanceId),
            ...serverPlayer.battlefield.planeswalkers.map((p: ServerBattlefieldCard) => p.instanceId),
            ...serverPlayer.battlefield.other.map((o: ServerBattlefieldCard) => o.instanceId),
          ],
          hasPlayedResourceThisTurn: serverPlayer.hasPlayedResourceThisTurn,
          energy: serverPlayer.energy,
          poisonCounters: serverPlayer.poisonCounters,
          deck_count: serverPlayer.deck_count,
        };
      });
      
      // If after mapping, localPlayerId is set but names aren't 'You'/'Opponent' (e.g. first load),
      // re-apply naming logic. This ensures names are correct even if localPlayerId was set after initial game state.
      if (state.localPlayerId) {
        state.players.forEach(player => {
          if (player.playerId) {
            if (player.playerId === state.localPlayerId) {
              player.name = `You (${player.playerId})`;
            } else {
              player.name = `Opponent (${player.playerId})`;
            }
          }
        });
      }

      console.log('[gameSlice] setGameStateFromServer - State AFTER ALL UPDATES - players:', JSON.parse(JSON.stringify(state.players)));
  console.log('[gameSlice] setGameStateFromServer - State AFTER ALL UPDATES - gameObjects:', JSON.parse(JSON.stringify(state.gameObjects)));
  console.log('[gameSlice] setGameStateFromServer: gameObjects being set:', Object.keys(state.gameObjects).length);
      console.log('[gameSlice] setGameStateFromServer: Final new state players:', JSON.parse(JSON.stringify(state.players.map(p => ({ id: p.playerId, name: p.name, hand: p.hand, handSize: p.handSize, deckSize: p.deckSize })))));
      console.log('[gameSlice] setGameStateFromServer: Final new state localPlayerId:', state.localPlayerId);
    },
    setLocalPlayerId: (state, action: PayloadAction<string>) => {
      console.log('[gameSlice] setLocalPlayerId:', action.payload);
      state.localPlayerId = action.payload;
      // Update names based on the new localPlayerId
      state.players.forEach(player => {
        if (player.playerId) { // Only update if playerId is set
          if (player.playerId === action.payload) {
            player.name = `You (${player.playerId})`;
          } else {
            player.name = `Opponent (${player.playerId})`;
          }
        }
      });
    },
    setPlayerLife: (state, action: PayloadAction<{ playerId: ServerPlayerId, life: number }>) => {
      const player = state.players.find(p => p.playerId === action.payload.playerId);
      if (player) player.life = action.payload.life;
    },
    setCurrentPhase: (state, action: PayloadAction<ServerGamePhase>) => {
      state.currentPhase = action.payload;
    },
  },
});

export const {
  setGameStateFromServer,
  setPlayerLife, 
  setCurrentPhase,
  setLocalPlayerId,
} = gameSlice.actions;

export default gameSlice.reducer;

// Thunks for WebSocket actions
export const playCardViaSocket = (payload: { cardId: string }): AppThunk => async dispatch => {
  // Here, you might want to add some client-side validation or state updates immediately,
  // or wait for the server to confirm the action via a broadcasted game state update.
  socketService.emit('play_card', payload);
};

export const playResourceViaSocket = (payload: { cardId: string }): AppThunk => async dispatch => {
  socketService.emit('play_resource', payload);
};
