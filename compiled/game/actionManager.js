import { EventType } from '../interfaces/gameState.js';
/**
 * Manages player actions, putting spells/abilities on the stack, and resolving the stack.
 */
export class ActionManager {
    constructor(gameState, engine, turnManager) {
        this.gameState = gameState;
        this.engine = engine;
        this.turnManager = turnManager; // Store TurnManager
        if (this.gameState.consecutivePriorityPasses === undefined) {
            this.gameState.consecutivePriorityPasses = 0;
        }
    }
    /**
     * Attempts to play a card from a player's hand.
     * This will involve checking playability, paying costs, and putting the spell/permanent on the stack.
     * @param playerId The ID of the player attempting the action.
     * @param cardObjectId The GameObjectId of the card in hand.
     * @param targets Optional targets for the spell/ability.
     */
    playCard(playerId, cardObjectId, targets) {
        console.log(`ActionManager: Player ${playerId} attempting to play card ${cardObjectId}.`);
        // 1. Get Player State
        const playerState = this.engine.getPlayerState(playerId);
        if (!playerState) {
            throw new Error(`ActionManager Error: Player ${playerId} not found.`);
        }
        // 2. Check Turn & Priority
        if (this.gameState.activePlayerId !== playerId) {
            throw new Error(`ActionManager: Player ${playerId} cannot play card, it is not their turn (Active: ${this.gameState.activePlayerId}).`);
        }
        if (this.gameState.priorityPlayerId !== playerId) {
            throw new Error(`ActionManager: Player ${playerId} cannot play card, they do not have priority.`);
        }
        // 3. Check Card Location
        const cardIndex = playerState.hand.indexOf(cardObjectId);
        if (cardIndex === -1) {
            throw new Error(`ActionManager: Card ${cardObjectId} not found in hand of player ${playerId}.`);
        }
        // 4. Get Card Data
        const baseCard = this.engine.getCardFromInstanceId(cardObjectId);
        if (!baseCard) {
            throw new Error(`ActionManager Error: Base card data not found for ${cardObjectId}.`);
        }
        // 5. Check Playability & Card Type Specific Logic
        if (!baseCard.type) {
            throw new Error(`ActionManager: Card ${cardObjectId} (${baseCard.name}) has no type, cannot be played.`);
        }
        // --- Special Handling for Resource Cards ---
        if (baseCard.type === 'Resource') {
            if (playerState.hasPlayedResourceThisTurn) {
                throw new Error(`ActionManager: Player ${playerId} has already played a resource this turn.`);
            }
            // Resources typically don't have costs, but if they did, check here.
            // For now, assume resources are free to play once per turn.
            // Move card from hand to battlefield directly
            playerState.hand.splice(cardIndex, 1);
            // Ensure the card instance exists in gameObjects and update its zone
            const gameObject = this.gameState.gameObjects[cardObjectId];
            if (!gameObject) {
                // This should ideally not happen if card was in hand and engine.getCardFromInstanceId worked
                throw new Error(`ActionManager Critical Error: GameObject ${cardObjectId} not found when playing resource.`);
            }
            gameObject.currentZone = 'battlefield';
            // Add to player's battlefield structure (assuming a 'resources' array or similar)
            // This might need a more robust way to add to the correct battlefield zone based on card type
            // For now, let's assume a generic way or that stateManager handles it.
            // This part might need to call a stateManager method like `engine.stateManager.moveCardToZone` for consistency
            // For simplicity here, directly manipulating if playerState.battlefield.resources exists.
            if (playerState.battlefield.resources) {
                playerState.battlefield.resources.push(gameObject);
            }
            else {
                // Fallback or error if the structure isn't as expected
                console.warn(`ActionManager: PlayerState for ${playerId} does not have a 'battlefield.resources' array. Card ${cardObjectId} zone updated but not added to specific array.`);
                // Potentially add to a generic 'other' battlefield zone if that exists
                if (playerState.battlefield.other) {
                    playerState.battlefield.other.push(gameObject);
                }
                else {
                    throw new Error(`ActionManager: Cannot place resource ${cardObjectId} on battlefield, 'resources' or 'other' zone not found.`);
                }
            }
            playerState.hasPlayedResourceThisTurn = true;
            console.log(`ActionManager: Player ${playerId} played Resource ${baseCard.name} (${cardObjectId}) directly to battlefield.`);
            this.engine.emitGameEvent(EventType.RESOURCE_PLAYED, {
                playerId: playerId,
                cardId: baseCard.id,
                instanceId: cardObjectId,
                message: `Player ${playerId} played resource ${baseCard.name} onto the battlefield.`
            });
            // Player retains priority, reset passes
            this.gameState.consecutivePriorityPasses = 0;
            this.gameState.priorityPlayerId = playerId;
            console.log(`ActionManager: Priority set to player ${playerId}. Consecutive passes reset.`);
            return; // Action complete for resource card
        }
        // --- End Special Handling for Resource Cards ---
        // TODO: Implement timing restrictions (e.g., sorcery only on main phase, empty stack) for non-resource cards.
        //       This check should ideally happen before cost payment for other card types.
        // 6. Check and Pay Cost
        const cardCost = baseCard.cost;
        if (!cardCost || Object.keys(cardCost).length === 0) {
            console.log(`ActionManager: Card ${cardObjectId} (${baseCard.name}) has no mana cost or is free.`);
            // Proceed if no cost (e.g., land or free spell)
        }
        else {
            // Check if affordable
            if (!this.engine.resourceManager.canAffordCost(playerId, cardCost)) {
                throw new Error(`ActionManager: Player ${playerId} cannot afford card ${cardObjectId} (${baseCard.name}). Cost: ${JSON.stringify(cardCost)}, Pool: ${JSON.stringify(playerState.manaPool)}`);
            }
            // Spend the mana
            let allManaPaidSuccessfully = true;
            for (const [color, amount] of Object.entries(cardCost)) {
                if (amount && amount > 0) { // Ensure amount is defined and positive
                    const paid = this.engine.resourceManager.spendMana(playerId, color, amount);
                    if (!paid) {
                        allManaPaidSuccessfully = false;
                        // Optional: Log which specific mana payment failed before throwing the more general error
                        console.error(`ActionManager Error: Failed to spend ${amount} of ${color} mana for card ${cardObjectId} (${baseCard.name}).`);
                        break;
                    }
                }
            }
            if (!allManaPaidSuccessfully) {
                throw new Error(`ActionManager Error: Failed to spend mana for ${cardObjectId} (${baseCard.name}) despite affordability check. This indicates an issue with ResourceManager.`);
            }
            console.log(`ActionManager: Player ${playerId} paid cost for ${baseCard.name}.`);
        }
        // 7. Validate Targets (Basic Implementation)
        const requiresTargets = this.checkIfCardRequiresTargets(baseCard);
        if (requiresTargets && (!targets || targets.length === 0)) {
            throw new Error(`ActionManager: Card ${baseCard.name} requires targets but none were provided.`);
        }
        if (!requiresTargets && targets && targets.length > 0) {
            console.log(`ActionManager: Card ${baseCard.name} does not require targets, ignoring provided targets.`);
            targets = undefined; // Clear targets for non-targeted spells
        }
        if (targets && targets.length > 0) {
            const targetValidation = this.validateBasicTargets(baseCard, targets);
            if (!targetValidation.valid) {
                throw new Error(`ActionManager: Target validation failed for ${baseCard.name}: ${targetValidation.error}`);
            }
            console.log(`ActionManager: Target validation passed for ${baseCard.name} with ${targets.length} target(s).`);
        }
        // 8. Move Card to Stack
        // Remove from hand
        playerState.hand.splice(cardIndex, 1);
        // Create stack item
        const stackItem = {
            stackId: this.engine.generateGameObjectId('stack_item'), // Ensure engine has this method
            type: 'Spell', // All cards played from hand are initially 'Spell' on the stack.
            // Resolution logic will determine if it's a permanent entering or an effect resolving.
            sourceCardId: baseCard.id, // ID of the base card definition
            sourceInstanceId: cardObjectId, // Instance ID of the card being played
            controllerId: playerId,
            targets: targets, // Store the chosen targets
            // TODO: Define how effects are structured and applied from the stack item.
            //       This might involve copying relevant abilities/effects from baseCard.
        };
        this.gameState.stack.push(stackItem);
        console.log(`ActionManager: Card ${baseCard.name} (${cardObjectId}) moved to stack as item ${stackItem.stackId}. Stack size: ${this.gameState.stack.length}`);
        this.engine.emitGameEvent(EventType.CARD_PLAYED, {
            playerId: playerId,
            cardId: baseCard.id,
            instanceId: cardObjectId,
            targets: targets,
            message: `Player ${playerId} played ${baseCard.name} onto the stack.`
        });
        // 9. Player Retains Priority
        // Reset consecutive passes as an action has been taken
        this.gameState.consecutivePriorityPasses = 0;
        // The player who took the action gets priority again
        this.gameState.priorityPlayerId = playerId;
        console.log(`ActionManager: Priority set to player ${playerId}. Consecutive passes reset.`);
    }
    /**
     * Checks if a card requires targets based on its rules text.
     * This is a simple implementation - more sophisticated parsing may be needed later.
     * @param card The card to check
     * @returns true if the card requires targets
     */
    checkIfCardRequiresTargets(card) {
        // Simple rules for determining if a card requires targets
        // Creatures and Resources never require targets
        if (card.type === 'Creature' || card.type === 'Resource' || card.type === 'Land') {
            return false;
        }
        // Check rules text for targeting keywords
        const rulesText = card.rulesText?.toLowerCase() || card.text?.toLowerCase() || '';
        // Look for targeting language
        const targetingKeywords = [
            'target',
            'chosen',
            'destroy target',
            'deal damage to target',
            'target creature',
            'target player'
        ];
        return targetingKeywords.some(keyword => rulesText.includes(keyword));
    }
    /**
     * Performs basic target validation.
     * @param card The card being played
     * @param targets The provided targets
     * @returns Validation result with success/failure and error message
     */
    validateBasicTargets(card, targets) {
        // Basic validation rules
        // Most targeted spells require exactly 1 target
        if (targets.length !== 1) {
            return {
                valid: false,
                error: `Expected 1 target, but ${targets.length} were provided.`
            };
        }
        const targetId = targets[0];
        // Check if target exists in game (basic existence check)
        const targetExists = this.gameState.gameObjects[targetId] !== undefined ||
            this.gameState.players.some(p => p.playerId === targetId);
        if (!targetExists) {
            return {
                valid: false,
                error: `Target ${targetId} does not exist in the game.`
            };
        }
        // Additional validation could be added here:
        // - Check if target is a valid type for the spell (creature, player, etc.)
        // - Check if target has protection or shroud
        // - Check if target is in the correct zone
        console.log(`ActionManager: Basic target validation passed for ${card.name} targeting ${targetId}.`);
        return { valid: true };
    }
    /**
     * Placeholder for activating an ability of a card instance.
     * @param playerId The ID of the player attempting the action.
     * @param sourceInstanceId The GameObjectId of the card on the battlefield whose ability is being activated.
     * @param abilityId Identifier for the specific ability (if multiple).
     * @param targets Optional targets for the ability.
     * @returns True if the action was successfully initiated (put on stack), false otherwise.
     */
    activateAbility(playerId, sourceInstanceId, abilityId, targets) {
        console.log(`ActionManager: Player ${playerId} attempting to activate ability '${abilityId}' from ${sourceInstanceId}.`);
        // 1. Get Player State & Check Priority (similar to playCard)
        const playerState = this.engine.getPlayerState(playerId);
        if (!playerState) {
            console.error(`ActionManager Error: Player ${playerId} not found.`);
            return false;
        }
        if (this.gameState.activePlayerId !== playerId || this.gameState.priorityPlayerId !== playerId) {
            console.warn(`ActionManager: Player ${playerId} attempted to activate ability without turn/priority.`);
            return false;
        }
        // 2. Get Source Card Instance & Base Card Data
        const sourceObject = this.gameState.gameObjects[sourceInstanceId];
        if (!sourceObject) {
            console.warn(`ActionManager: Source object ${sourceInstanceId} not found for ability activation.`);
            return false;
        }
        // TODO: Check if the sourceObject is on the battlefield (or appropriate zone)
        // if (sourceObject.currentZone !== 'battlefield') { ... }
        const baseCard = this.engine.getBaseCardData(sourceObject.cardId);
        if (!baseCard) {
            console.error(`ActionManager Error: Base card data not found for ${sourceObject.cardId}.`);
            return false;
        }
        // 3. TODO: Find the specific ability on the baseCard (e.g., using abilityId)
        // For now, we'll assume the ability exists and is valid.
        console.log(`ActionManager: (Placeholder) Assuming ability '${abilityId}' on ${baseCard.name} is valid.`);
        // 4. TODO: Check and Pay Costs for the ability (mana, tapping, sacrificing, etc.)
        console.log(`ActionManager: (Placeholder) Assuming costs for ability '${abilityId}' are paid.`);
        // 5. Create StackItem for the ability
        const stackItem = {
            stackId: `stack_ability_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'Ability',
            sourceCardId: baseCard.id, // Base card definition ID
            sourceInstanceId: sourceInstanceId, // Instance ID of the card activating
            controllerId: playerId,
            targets: targets || [],
            // effectDetails: { abilityId: abilityId } // Could store abilityId here for resolution
        };
        // 6. Add to gameState stack
        this.gameState.stack.push(stackItem);
        console.log(`ActionManager: Ability from ${baseCard.name} added to stack. Stack size: ${this.gameState.stack.length}`);
        // 7. Player retains priority
        console.log(`ActionManager: Player ${playerId} retains priority after activating ability.`);
        this.engine.emitGameEvent(EventType.ABILITY_ACTIVATED, { playerId, sourceCardId: baseCard.id, sourceInstanceId, stackItemId: stackItem.stackId });
        return true;
    }
    /**
     * Player passes priority.
     * If both players pass consecutively, the stack resolves or the turn advances.
     * @param playerId The ID of the player passing priority.
     */
    passPriority(playerId) {
        if (this.gameState.priorityPlayerId !== playerId) {
            throw new Error(`ActionManager Error: Player ${playerId} does not have priority. Current priority: ${this.gameState.priorityPlayerId}.`);
        }
        console.log(`[ActionManager]: Player ${playerId} passed priority.`);
        this.gameState.consecutivePriorityPasses = (this.gameState.consecutivePriorityPasses || 0) + 1;
        console.log(`[ActionManager]: Consecutive passes: ${this.gameState.consecutivePriorityPasses}.`);
        const otherPlayer = this.gameState.players.find(p => p.playerId !== playerId);
        if (!otherPlayer) {
            // This should not happen in a 2-player game setup
            console.error("[ActionManager Error]: Could not find the other player.");
            throw new Error("ActionManager Critical Error: Opponent not found.");
        }
        this.gameState.priorityPlayerId = otherPlayer.playerId;
        console.log(`[ActionManager]: Priority passed to ${otherPlayer.playerId}.`);
        if (this.gameState.consecutivePriorityPasses >= 2) {
            console.log(`[ActionManager]: Both players passed consecutively. Resetting passes and processing stack/turn.`);
            this.gameState.consecutivePriorityPasses = 0; // Reset after both players pass
            if (this.gameState.stack.length > 0) {
                console.log(`[ActionManager]: Stack is not empty. Resolving top item.`);
                this.resolveTopStackItem(); // This method should handle removing the item from stack
                // After resolution, priority goes to the active player
                this.gameState.priorityPlayerId = this.gameState.activePlayerId;
                console.log(`[ActionManager]: Priority set to active player ${this.gameState.activePlayerId} after stack resolution.`);
            }
            else {
                console.log(`[ActionManager]: Stack is empty. Advancing turn state.`);
                this.turnManager.advanceTurnState(); // Changed from advanceStepOrPhase()
            }
        }
        // If consecutive passes < 2, the game state (priorityPlayerId, consecutivePriorityPasses)
        // is updated, and the server will broadcast it. The game waits for the next action.
    }
    /**
     * Resolves the top item on the game stack.
     * Assumes the active player has passed priority and the item is ready to resolve.
     */
    resolveTopStackItem() {
        if (this.gameState.stack.length === 0) {
            console.log("ActionManager: Stack is empty, nothing to resolve.");
            return;
        }
        const topItem = this.gameState.stack.pop();
        if (!topItem) {
            // Should not happen if length check passed, but TS needs check
            return;
        }
        console.log(`ActionManager: Resolving stack item ${topItem.stackId} (Source: ${topItem.sourceCardId})`);
        // Get base card data
        const baseCard = this.engine.getBaseCardData(topItem.sourceCardId); // Assuming engine has a method like this
        if (!baseCard) {
            console.error(`ActionManager Error: Cannot find base card data for ${topItem.sourceCardId} during resolution.`);
            // TODO: What happens to the stack item? Fizzle?
            return;
        }
        // --- Basic Spell Resolution --- 
        if (topItem.type === 'Spell') {
            // If it's a permanent type (Creature, Artifact, Enchantment, Planeswalker, Land?)
            if (['Creature', 'Artifact', 'Enchantment', 'Planeswalker'].includes(baseCard.type)) {
                console.log(`ActionManager: Resolving ${baseCard.type} spell: ${baseCard.name}`);
                // Move/Create the game object on the battlefield
                const success = this.engine.stateManager.moveCardToZone(topItem.controllerId, topItem.sourceInstanceId, // The ID of the specific card instance played from hand
                'stack', // Conceptually moving from stack
                'battlefield');
                if (success) {
                    console.log(`ActionManager: ${baseCard.name} (${topItem.sourceInstanceId}) entered the battlefield under player ${topItem.controllerId}'s control.`);
                    // TODO: Trigger Enter the Battlefield (ETB) effects
                }
                else {
                    console.error(`ActionManager Error: Failed to move ${baseCard.name} (${topItem.sourceInstanceId}) to battlefield.`);
                    // Where should the card go? Graveyard?
                    this.engine.stateManager.moveCardToZone(topItem.controllerId, topItem.sourceInstanceId, 'stack', 'graveyard'); // Failsafe: move to graveyard
                }
            }
            else if (baseCard.type === 'Instant' || baseCard.type === 'Sorcery') {
                console.log(`ActionManager: Resolving ${baseCard.type} spell: ${baseCard.name}`);
                // TODO: Execute the spell's effects based on rules text / abilities
                console.log(`ActionManager: Executing effects for ${baseCard.name}... (Placeholder)`);
                // After effect resolution, move the card to the graveyard
                this.engine.stateManager.moveCardToZone(topItem.controllerId, topItem.sourceInstanceId, 'stack', 'graveyard');
                console.log(`ActionManager: Moved ${baseCard.name} (${topItem.sourceInstanceId}) to graveyard.`);
            }
            else {
                console.warn(`ActionManager: Unhandled spell type resolution for ${baseCard.type}`);
                // Move to graveyard by default?
                this.engine.stateManager.moveCardToZone(topItem.controllerId, topItem.sourceInstanceId, 'stack', 'graveyard');
            }
        }
        else if (topItem.type === 'Ability') {
            console.log(`ActionManager: Resolving Ability... (Placeholder)`);
            // TODO: Resolve ability effects
        }
        else {
            console.warn(`ActionManager: Unhandled stack item type: ${topItem.type}`);
        }
        // After resolution, check State-Based Actions
        console.log("ActionManager: Checking State-Based Actions after resolution.");
        this.engine.stateManager.checkStateBasedActions();
        // After SBAs, priority usually goes to the active player
        // The TurnManager should handle this when notified the stack is resolved/empty
        // TODO: Consider if resolving one item means the stack might still have items.
        // If stack is now empty, TurnManager needs to know to proceed.
        if (this.gameState.stack.length === 0) {
            console.log("ActionManager: Stack is now empty.");
        }
    }
    /**
     * --- Helper methods maybe needed ---
     * canPayCost(playerId, cost) -> boolean (using ResourceManager)
     * payCost(playerId, cost) -> boolean (using ResourceManager)
    */
    /**
     * Allows a player to discard a card from their hand
     * @param playerId The ID of the player discarding the card
     * @param cardObjectId The GameObjectId of the card in hand to discard
     * @returns true if successful, false otherwise
     */
    discardCard(playerId, cardObjectId) {
        console.log(`ActionManager: Player ${playerId} attempting to discard card ${cardObjectId}.`);
        // 1. Get Player State
        const playerState = this.engine.getPlayerState(playerId);
        if (!playerState) {
            console.error(`ActionManager Error: Player ${playerId} not found.`);
            return false;
        }
        // 2. Check if card is in player's hand
        const cardIndex = playerState.hand.indexOf(cardObjectId);
        if (cardIndex === -1) {
            console.error(`ActionManager Error: Card ${cardObjectId} not found in hand of player ${playerId}.`);
            return false;
        }
        // 3. Move card from hand to graveyard
        const success = this.engine.stateManager.moveCardToZone(playerId, cardObjectId, 'hand', 'graveyard');
        if (success) {
            console.log(`ActionManager: Player ${playerId} successfully discarded card ${cardObjectId}.`);
            // Emit a game event for the discard
            // The game event should contain enough information for the client to update
            // and for the server to log correctly.
            // The full gameState might be too much for every event; consider sending specific changes.
            this.engine.emitGameEvent(EventType.CARD_DISCARDED, {
                gameId: this.gameState.gameId, // Add gameId to the payload
                playerId: playerId,
                cardInstanceId: cardObjectId,
                // Potentially add sourceCardId if needed for client display, though instanceId is key
                // newHand: playerState.hand, // Could be sent if client doesn't derive it
                // newGraveyard: playerState.graveyard // Could be sent
                // For now, relying on full gameState update after action
            });
            return true;
        }
        else {
            console.error(`ActionManager Error: Failed to move card ${cardObjectId} from hand to graveyard.`);
            return false;
        }
    }
}
