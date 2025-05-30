import { GameState, PlayerId, GameObjectId, BattlefieldCard, PlayerState, Zone, EventType } from '../interfaces/gameState.js';
import { Card, CardType } from "../interfaces/card.js"; 
import { GameEngine } from './gameEngine.js'; // Import GameEngine

/**
 * Manages checking and applying State-Based Actions (SBAs).
 */
export class StateManager {
    private gameState: GameState;
    private getCardFromInstanceIdFn: (instanceId: GameObjectId) => Card | undefined;
    private engine: GameEngine; // Add reference to GameEngine

    constructor(engine: GameEngine, gameState: GameState, getCardFn: (instanceId: GameObjectId) => Card | undefined) {
        this.engine = engine; // Store GameEngine instance
        this.gameState = gameState;
        this.getCardFromInstanceIdFn = getCardFn;
    }

    /**
     * Checks and applies all relevant state-based actions.
     * This should be called whenever the game state might have changed 
     * in a way that requires SBAs (e.g., after a spell resolves, combat damage is dealt).
     * 
     * @returns {boolean} True if any action was taken, false otherwise.
     */
    public checkStateBasedActions(): boolean {
        let actionTaken = false;
        let continueChecking = true;

        while (continueChecking) {
            continueChecking = false; // Assume no actions taken this iteration

            // 1. Player life <= 0 check
            this.gameState.players.forEach(player => {
                if (!player.hasLost && player.life <= 0) {
                    console.log(`SBA: Player ${player.playerId} has 0 or less life and loses.`);
                    player.hasLost = true;
                    actionTaken = true;
                    continueChecking = true; // Re-check after change
                    
                    // Trigger game end check for life depletion
                    this.engine.checkGameEnd('life_depletion', player.playerId);
                }
            });
            if (continueChecking) continue; // Restart checks if an action occurred

            // 2. Creature health <= 0 or marked lethal damage check
            this.gameState.players.forEach(player => {
                const creaturesToRemove: GameObjectId[] = [];
                const objectsToMove: { objectId: GameObjectId, destination: 'graveyard' }[] = []; // Prepare for moving
                
                player.battlefield.creatures.forEach(creature => {
                    const cardData = this.getCardFromInstanceIdFn(creature.instanceId);
                    // TODO: Calculate current health considering buffs/debuffs
                    const currentHealth = cardData?.health ?? 0; 
                    let isLethal = false;

                    // Check for 0 or less health
                    if (currentHealth <= 0) {
                        console.log(`SBA: Creature ${cardData?.name ?? creature.instanceId} has 0 or less health and is destroyed.`);
                        isLethal = true;
                    } 
                    // Check for lethal damage
                    else if (creature.damageMarked >= currentHealth) {
                         console.log(`SBA: Creature ${cardData?.name ?? creature.instanceId} has lethal damage (${creature.damageMarked} >= ${currentHealth}) and is destroyed.`);
                         isLethal = true;
                    }
                    // TODO: Check for deathtouch damage source

                    if (isLethal && !creaturesToRemove.includes(creature.instanceId)) {
                        creaturesToRemove.push(creature.instanceId);
                        objectsToMove.push({ objectId: creature.instanceId, destination: 'graveyard' });
                    }
                });

                if (creaturesToRemove.length > 0) {
                    // TODO: Use a dedicated 'moveObject' function (maybe in ActionManager or StateManager?) 
                    // that handles removing from source and adding to destination, including triggers.
                    // For now, just filter from battlefield and log.
                    const graveyard = player.graveyard;
                    player.battlefield.creatures = player.battlefield.creatures.filter(c => {
                        if (creaturesToRemove.includes(c.instanceId)) {
                            graveyard.push(c.instanceId); // Add to graveyard array
                            return false; // Remove from battlefield array
                        }
                        return true;
                    });
                    console.log(`Moved ${creaturesToRemove.length} creatures to graveyard for Player ${player.playerId}.`);
                    actionTaken = true;
                    continueChecking = true; // Re-check
                }
            });
            if (continueChecking) continue; 

            // TODO: Add other SBAs (Legend rule, +1/+1 and -1/-1 counters, etc.)

        } // End while loop

        // Check for game win/loss conditions after all SBAs resolve
        // This is now handled by GameEngine.checkGameEnd() calls above, but keep as backup
        if (!this.gameState.gameEnded) { // Only check if game hasn't ended yet
            const activePlayers = this.gameState.players.filter(p => !p.hasLost);
            if (activePlayers.length <= 1) {
                // Trigger final game end check via GameEngine
                this.engine.checkGameEnd('state_based_actions');
            }
        }

        return actionTaken;
    }
    
    /**
     * Determines if, after cleanup step actions, players need to receive priority.
     * This is true if any state-based actions were performed or any triggered abilities
     * were put onto the stack during the cleanup step.
     * @returns True if priority should be passed, false otherwise.
     */
    public cleanupRequiresPriority(): boolean {
        // Placeholder: In a full implementation, this would check if SBAs occurred
        // or if any abilities triggered during the cleanup step that require players to get priority.
        // For now, assume no such events require an additional round of priority after cleanup.
        console.log("StateManager: cleanupRequiresPriority check (currently always false).");
        return false; 
    }

    /**
     * Moves a specific card instance between zones for a given player.
     * Updates both the player's zone array and the card object's currentZone property.
     * Note: Does not handle stack items directly, only moves GameObject instances.
     * @param playerId The ID of the card's controller/owner.
     * @param cardObjectId The unique ID of the card instance to move.
     * @param fromZone The zone the card is currently in.
     * @param toZone The zone the card is moving to.
     * @returns True if the move was successful, false otherwise.
     */
    public moveCardToZone(playerId: PlayerId, cardObjectId: GameObjectId, fromZone: Zone, toZone: Zone): boolean {
        console.log(`StateManager: Attempting to move ${cardObjectId} for player ${playerId} from ${fromZone} to ${toZone}.`);

        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        const cardObject = this.gameState.gameObjects[cardObjectId];

        if (!playerState) {
            console.error(`StateManager Error: Player ${playerId} not found for moving card ${cardObjectId}.`);
            return false;
        }
        if (!cardObject) {
            console.error(`StateManager Error: Card object ${cardObjectId} not found in gameObjects.`);
            return false;
        }
        // Sanity check: Does the card think it's in the fromZone?
        if (fromZone !== 'stack' && cardObject.currentZone !== fromZone) {
            console.warn(`StateManager Warning: Card ${cardObjectId} currentZone (${cardObject.currentZone}) does not match expected fromZone (${fromZone}). Proceeding anyway.`);
        }

        // --- Remove from FromZone ---    
        let foundAndRemoved = false;
        if (fromZone === 'stack') {
            // Conceptual removal from stack - nothing to do in playerState arrays
            foundAndRemoved = true; 
            console.log(`StateManager: Conceptual removal from 'stack' for ${cardObjectId}.`);
        } else if (fromZone === 'battlefield') {
            // Iterate through battlefield sub-arrays to find and remove the BattlefieldCard
            const battlefieldZones: (keyof PlayerState['battlefield'])[] = ['creatures', 'resources', 'enchantments', 'artifacts', 'planeswalkers', 'other']; // Add other relevant zones
            for (const bfZone of battlefieldZones) {
                const bfArray = playerState.battlefield[bfZone];
                const index = bfArray.findIndex(card => card.instanceId === cardObjectId);
                if (index > -1) {
                    bfArray.splice(index, 1);
                    foundAndRemoved = true;
                    console.log(`StateManager: Removed ${cardObjectId} from player ${playerId}'s battlefield (${bfZone}).`);
                    break; // Found and removed, exit loop
                }
            }
            if (!foundAndRemoved) {
                console.warn(`StateManager Warning: Card ${cardObjectId} not found on player ${playerId}'s battlefield during move.`);
                // Allow proceeding even if not found, caller might handle specific cases (e.g., token removal)
                foundAndRemoved = true; 
            }
        } else {
            // Handle removal from other zones (hand, graveyard, library, exile)
            const sourceZoneArray = playerState[fromZone as keyof PlayerState] as GameObjectId[] | undefined;
            if (sourceZoneArray && Array.isArray(sourceZoneArray)) {
                const index = sourceZoneArray.indexOf(cardObjectId);
                if (index > -1) {
                    sourceZoneArray.splice(index, 1);
                    foundAndRemoved = true;
                    console.log(`StateManager: Removed ${cardObjectId} from player ${playerId}'s ${fromZone}.`);
                } else {
                    console.warn(`StateManager Warning: Card ${cardObjectId} not found in player ${playerId}'s ${fromZone} array during move.`);
                    foundAndRemoved = true; // Allow proceeding
                }
            } else {
                console.error(`StateManager Error: Invalid or non-array fromZone '${fromZone}' on PlayerState.`);
                return false;
            }
        }

        // If we failed to conceptually remove it, abort.
        if (!foundAndRemoved) {
            console.error(`StateManager Error: Failed to remove ${cardObjectId} from ${fromZone} (or conceptual removal failed). Aborting move.`);
            return false;
        }

        // --- Add to ToZone ---    
        let added = false;
        if (toZone === 'stack') {
            console.error(`StateManager Error: Cannot move GameObject ${cardObjectId} directly to the 'stack' zone array.`);
            // TODO: Rollback removal? This requires more complex state management.
            return false;
        } else if (toZone === 'battlefield') {
            // Find the base card definition using the ID from the GameObject
            const baseCard = this.getCardFromInstanceIdFn(cardObject.cardId);
            if (!baseCard) {
                console.error(`StateManager Error: Cannot find base card data for ${cardObject.cardId} to create battlefield object.`);
                // TODO: Rollback removal?
                return false;
            }

            let hasHaste = false;
            if (baseCard.type === 'Creature' && baseCard.keywords?.includes('Haste')) {
                hasHaste = true;
            }

            const battlefieldCardInstance: BattlefieldCard = {
                ...baseCard, // Spread properties from the base card definition
                instanceId: cardObjectId,
                cardId: baseCard.id, // or cardObject.cardId, ensure this is the definition ID
                currentZone: toZone, // Will be 'battlefield'
                ownerId: cardObject.ownerId, 
                controllerId: playerId, // Player who controls it now
                tapped: false, // Usually enters untapped
                summoningSickness: baseCard.type === 'Creature' ? !hasHaste : false, // Creatures have SS unless Haste. Non-creatures don't.
                damageMarked: 0,
                counters: {},
                attachments: [],
                // Ensure all required fields from BattlefieldCard are present
            };

            // Add to the correct sub-array of battlefield based on card type
            let targetBattlefieldZone: (keyof PlayerState['battlefield']) | null = null;
            switch (baseCard.type) {
                case 'Creature': targetBattlefieldZone = 'creatures'; break;
                case 'Artifact': targetBattlefieldZone = 'artifacts'; break;
                case 'Enchantment': targetBattlefieldZone = 'enchantments'; break;
                case 'Planeswalker': targetBattlefieldZone = 'planeswalkers'; break;
                case 'Land': targetBattlefieldZone = 'resources'; break; // Assuming Lands go to 'resources'
                // Add cases for other types if they can enter the battlefield
                default: targetBattlefieldZone = 'other'; // Fallback or for types like 'Resource' if they are distinct
            }

            if (targetBattlefieldZone) {
                playerState.battlefield[targetBattlefieldZone].push(battlefieldCardInstance);
                added = true;
                console.log(`StateManager: Added ${cardObjectId} (${baseCard.name}) to player ${playerId}'s battlefield (${targetBattlefieldZone}). Summoning Sickness: ${battlefieldCardInstance.summoningSickness}`);
            } else {
                console.error(`StateManager Error: Could not determine target battlefield zone for card type ${baseCard.type} of ${cardObjectId}.`);
                // TODO: Rollback removal?
                return false;
            }

        } else {
            // Handle addition to other zones (hand, graveyard, library, exile)
            const targetZoneArray = playerState[toZone as keyof PlayerState] as GameObjectId[] | undefined;
            if (targetZoneArray && Array.isArray(targetZoneArray)) {
                if (!targetZoneArray.includes(cardObjectId)) {
                    if (toZone === 'graveyard') {
                        console.log(`StateManager DEBUG: Player ${playerId} graveyard BEFORE push for ${cardObjectId}:`, JSON.parse(JSON.stringify(playerState.graveyard)));
                        console.log(`StateManager DEBUG: Player ${playerId} hand BEFORE modification for ${cardObjectId}:`, JSON.parse(JSON.stringify(playerState.hand)));
                    }
                    targetZoneArray.push(cardObjectId);
                    added = true;
                    if (toZone === 'graveyard') {
                        console.log(`StateManager DEBUG: Player ${playerId} graveyard AFTER push for ${cardObjectId}:`, JSON.parse(JSON.stringify(playerState.graveyard)));
                    }
                    console.log(`StateManager: Added ${cardObjectId} to player ${playerId}'s ${toZone}.`);
                } else {
                    console.warn(`StateManager Warning: Card ${cardObjectId} already present in player ${playerId}'s ${toZone}.`);
                    added = true; // Treat as success
                }
            } else {
                console.error(`StateManager Error: Invalid or non-array toZone '${toZone}' on PlayerState.`);
                // TODO: Rollback removal?
                return false;
            }
        }

        // --- Final Update and Event ---    
        if (foundAndRemoved && added) {
            console.log(`StateManager: Successfully moved ${cardObjectId} from ${fromZone} to ${toZone} for player ${playerId}.`);
            
            // Emit ZONE_CHANGE event
            this.engine.emitGameEvent(EventType.ZONE_CHANGE, {
                gameId: this.gameState.gameId, // Add gameId
                cardObjectId: cardObjectId,
                playerId: playerId,
                fromZone: fromZone,
                toZone: toZone,
            });
            
            // Update the main GameObject's zone property
            console.log(`StateManager DEBUG: Card object ${cardObjectId} currentZone BEFORE update: ${cardObject.currentZone}`);
            cardObject.currentZone = toZone;
            console.log(`StateManager DEBUG: Card object ${cardObjectId} currentZone AFTER update: ${cardObject.currentZone}`);
            return true;
        } else {
            console.error(`StateManager Error: Failed to add ${cardObjectId} to ${toZone}. Move operation failed.`);
            // TODO: Rollback removal from fromZone if applicable.
            return false;
        }
    }
}

// Export the dependencies interface
export interface StateManagerDependencies {
    getGameState: () => GameState;
    getCardDataFn: (cardId: string) => Card | undefined; // Function to get base card data
}
