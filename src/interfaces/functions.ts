import { GameObjectId, PlayerId, GameState, GameStep, PlayerState, BattlefieldCard } from './gameState'; 
import { Card, Keyword } from './card';

// Function to get base card data
export type GetBaseCardDataFn = (cardId: string) => Card | undefined;

// Function to get a card instance (could be base or modified)
export type GetCardFn = (instanceId: GameObjectId) => Card | undefined; // May need refinement if instance differs significantly

// Function to find a card on the battlefield
export type FindBattlefieldCardFn = (instanceId: GameObjectId) => BattlefieldCard | undefined;

// Function to check if a permanent has a keyword
// Using string for now, will refine if Keyword type is specific
export type HasKeywordFn = (permanentId: GameObjectId, keyword: string) => boolean;

// Function to validate a player action based on step
export type ValidateActionFn = (playerId: PlayerId, requiredStep?: GameStep | null) => boolean;

// Function to emit game events
export type EmitGameEventFn = (eventType: string, data: any) => void;

// Function to get player state
export type GetPlayerStateFn = (playerId: PlayerId) => PlayerState | undefined;

// Function to move a card between zones
export type MoveCardZoneFn = (
    instanceId: GameObjectId,
    fromZone: keyof PlayerState, 
    toZone: keyof PlayerState, 
    targetPlayerId: PlayerId
) => boolean;

// Function to find a card in a specific zone
export type FindCardInZoneFn = (
    playerId: PlayerId, 
    zone: keyof PlayerState, 
    cardObjectId: GameObjectId
) => GameObjectId | BattlefieldCard | undefined;

// General player action validation function
export type GeneralValidatePlayerActionFn = (playerId: PlayerId, actionType: string, details?: any) => boolean;
