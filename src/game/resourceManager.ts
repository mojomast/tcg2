import { GameState, PlayerId, GameObjectId, PlayerState, BattlefieldCard, ManaColor, EventType } from '../interfaces/gameState.js';
import { ManaCost, Card } from '../interfaces/card.js';

// Assuming Zone and CardInZone types exist or are defined elsewhere
import { Zone } from '../interfaces/gameState.js'; 

/**
 * Defines the functions ResourceManager needs from the GameEngine.
 * This breaks the direct dependency cycle.
 */
export interface ResourceManagerDependencies {
    getPlayerStateFn: (playerId: PlayerId) => PlayerState | undefined;
    findBattlefieldCardFn: (permanentId: GameObjectId) => BattlefieldCard | undefined;
    getBaseCardDataFn: (cardId: string) => Card | undefined;
    emitGameEventFn: (eventType: EventType, data: any) => void;
    findCardInZoneFn: (playerId: PlayerId, zone: Zone, cardObjectId: GameObjectId) => GameObjectId | BattlefieldCard | undefined;
    validatePlayerActionFn: (playerId: PlayerId, actionType: string, details?: any) => boolean;
    moveCardZoneFn: (instanceId: GameObjectId, fromZone: Zone, toZone: Zone, targetPlayerId: PlayerId) => boolean;
}

/**
 * Manages player resources (mana pools, tapping/untapping permanents).
 */
export class ResourceManager {
    private gameState: GameState;
    private dependencies: ResourceManagerDependencies;

    constructor(gameState: GameState, dependencies: ResourceManagerDependencies) {
        this.gameState = gameState;
        this.dependencies = dependencies;
    }

    // --- Mana Pool Management ---

    /**
     * Adds a specified amount of mana of a given color to a player's mana pool.
     * @param playerId The ID of the player.
     * @param color The color of mana to add.
     * @param amount The amount of mana to add (defaults to 1).
     */
    addMana(playerId: PlayerId, color: ManaColor, amount: number = 1): void {
        // Find the correct player state (assuming players is an array)
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found.`);
            return;
        }
        const pool = playerState.manaPool;
        // Ensure the color entry exists and add mana
        pool[color] = (pool[color] ?? 0) + amount;

        console.log(`ResourceManager: Added ${amount} ${color} mana to player ${playerId}. Pool:`, JSON.stringify(pool));
        this.dependencies.emitGameEventFn(EventType.MANA_POOL_UPDATED, { 
            playerId: playerId, 
            manaPool: { ...pool } // Send a copy
        });
    }

    /**
     * Clears a player's mana pool, typically at the end of steps/phases.
     * @param playerId The ID of the player.
     */
    clearManaPool(playerId: PlayerId): void {
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found.`);
            return;
        }
        const oldPool = { ...playerState.manaPool }; // Copy for logging
        const pool = playerState.manaPool; // Store old pool before clearing

        // Clear the pool by setting keys to undefined
        (Object.keys(pool) as (ManaColor | 'colorless')[]).forEach(color => {
            pool[color] = undefined;
        });

        // Log if the pool actually changed
        if (Object.values(oldPool).some(amount => typeof amount === 'number' && amount > 0)) {
            console.log(`ResourceManager: Cleared mana pool for Player ${playerId}. Old pool:`, oldPool);
            this.dependencies.emitGameEventFn(EventType.MANA_POOL_UPDATED, { 
                playerId: playerId, 
                manaPool: { ...playerState.manaPool } // Send a copy of the now empty pool
            });
        }
    }

    /**
     * Checks if a player can afford a given mana cost with their current pool.
     * @param playerId The player attempting to pay.
     * @param cost The ManaCost object to check against.
     * @returns True if the cost can be paid, false otherwise.
     */
    canPayCost(playerId: PlayerId, cost: ManaCost): boolean {
        const playerState = this.dependencies.getPlayerStateFn(playerId);

        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found for canPayCost.`);
            return false;
        }

        const pool = playerState.manaPool;

        let remainingGenericCost = cost.C || 0;

        const availableManaForGeneric: { [key in ManaColor | 'C']?: number } = { ...pool };

        // 1. Check and deduct specific colored mana requirements

        const requiredColors: ManaColor[] = ['W', 'U', 'B', 'R', 'G'];

        for (const color of requiredColors) {
            const requiredAmount = cost[color];

            if (requiredAmount && requiredAmount > 0) {
                const availableAmount = (availableManaForGeneric[color] as number) || 0;

                if (availableAmount < requiredAmount) {
                    // console.log(`ResourceManager: Player ${playerId} cannot pay cost. Missing ${requiredAmount - availableAmount} ${color} mana.`);
                    return false; // Not enough of this specific color
                }

                // Reduce available mana for generic calculation later
                availableManaForGeneric[color] = availableAmount - requiredAmount;
            }
        }

        // 2. Check if remaining mana can cover the generic cost

        let totalAvailableForGeneric = 0;

        for (const color in availableManaForGeneric) {
            totalAvailableForGeneric += (availableManaForGeneric[color as keyof typeof availableManaForGeneric] as number) || 0;
        }

        // Check if cost has colorless component (now 'C')
        if (cost.C && (cost.C > totalAvailableForGeneric)) {
            // Not enough generic mana to cover the colorless part
            return false;
        }

        // If we reach here, the player can afford the cost
        return true;
    }

    /**
     * Checks if a player can afford a given mana cost.
     * @param playerId The ID of the player.
     * @param cost The mana cost to check.
     * @returns True if the player can afford the cost, false otherwise.
     */
    public canAffordCost(playerId: PlayerId, cost: ManaCost): boolean {
        const playerState = this.dependencies.getPlayerStateFn(playerId);
        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found for cost check.`);
            return false;
        }
        const pool = playerState.manaPool;

        for (const color in cost) {
            const requiredAmount = cost[color as ManaColor] ?? 0;
            const availableAmount = pool[color as ManaColor] ?? 0;
            if (availableAmount < requiredAmount) {
                // console.log(`ResourceManager: Cannot afford cost. Need ${requiredAmount} ${color}, have ${availableAmount}.`);
                return false; // Not enough mana of this color
            }
        }

        return true; // Can afford all parts of the cost
    }

    /**
     * Attempts to spend a specified amount of mana of a given color from a player's pool.
     * @param playerId The ID of the player.
     * @param color The color of mana to spend.
     * @param amount The amount of mana to spend.
     * @returns True if the mana was successfully spent, false otherwise.
     */
    spendMana(playerId: PlayerId, color: ManaColor, amount: number): boolean {
        // Find the correct player state (assuming players is an array)
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found for spending mana.`);
            return false;
        }
        const pool = playerState.manaPool;

        // Check if mana exists and is sufficient, using type assertion
        const currentAmount = pool[color] ?? 0;
        if (currentAmount < amount) {
            return false; // Not enough mana of the specified color
        }

        playerState.manaPool[color] = currentAmount - amount;
        console.log(`ResourceManager: Spent ${amount} ${color} mana from player ${playerId}. Remaining ${color}: ${playerState.manaPool[color]}. Pool:`, JSON.stringify(playerState.manaPool));
        
        this.dependencies.emitGameEventFn(EventType.MANA_POOL_UPDATED, { 
            playerId: playerId, 
            manaPool: { ...playerState.manaPool } // Send a copy
        });
        return true;
    }

    // --- Tapping / Untapping (Example) ---
    // We might move detailed card interaction logic elsewhere eventually,
    // but ResourceManager could handle the resource aspect of tapping.

    /**
     * Taps a permanent for mana (basic example).
     * Assumes the permanent is a basic land.
     * @param playerId The ID of the player controlling the permanent.
     * @param permanentId The ID of the permanent to tap.
     */
    tapForMana(playerId: PlayerId, permanentId: string): void {
        const battlefieldCard = this.dependencies.findBattlefieldCardFn(permanentId); // Get the instance on the battlefield

        if (!battlefieldCard || battlefieldCard.controllerId !== playerId) {
            console.error(`ResourceManager Error: Cannot tap ${permanentId} for player ${playerId}. Not found or not controlled.`);
            return;
        }

        if (battlefieldCard.tapped) {
            console.warn(`ResourceManager: Cannot tap ${permanentId} - already tapped.`);
            return;
        }

        // Get base card data to find the producesMana property
        const baseCard = this.dependencies.getBaseCardDataFn(battlefieldCard.cardId); // Use the base cardId
        if (!baseCard) {
            console.error(`ResourceManager Error: Cannot find base card definition for cardId ${battlefieldCard.cardId} associated with permanent ${permanentId}.`);
            return;
        }

        // Check if the card produces mana
        if (!baseCard.producesMana) {
            console.warn(`ResourceManager: Card ${baseCard.name} (${permanentId}) does not have a 'producesMana' property defined. Cannot tap for mana.`);
            // Maybe allow tapping without mana production? For now, we require producesMana.
            return;
        }

        // Tap the card first
        battlefieldCard.tapped = true;
        console.log(`ResourceManager: Player ${playerId} tapped ${permanentId} (${baseCard.name}).`);

        // Add the specified mana to the pool
        let manaAdded = false;
        const manaToProduce = baseCard.producesMana;
        for (const color in manaToProduce) {
            // Ensure the key is a valid ManaColor or 'C'
            if (Object.prototype.hasOwnProperty.call(manaToProduce, color)) {
                const amount = manaToProduce[color as keyof ManaCost];
                if (amount && amount > 0) {
                    // Type assertion needed because color could be 'C' which isn't ManaColor
                    this.addMana(playerId, color as ManaColor, amount);
                    manaAdded = true;
                    // Log specific mana added inside addMana
                }
            }
        }

        if (!manaAdded) {
            console.warn(`ResourceManager: Tapped ${permanentId} (${baseCard.name}), but it produced no mana according to its producesMana property.`);
        }
    }

    /**
     * Untaps all permanents controlled by a player during their untap step.
     * @param playerId The ID of the player whose permanents should untap.
     */
    untapPermanents(playerId: PlayerId): void {
        console.log(`ResourceManager: Untapping permanents for Player ${playerId}`);
        let untappedCount = 0;
        const playerState = this.gameState.players.find(p => p.playerId === playerId);

        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found for untap.`);
            return;
        }

        // Iterate through each permanent type on the player's battlefield
        (Object.keys(playerState.battlefield) as (keyof PlayerState['battlefield'])[]).forEach(zoneType => {
            const zone = playerState.battlefield[zoneType]; // Access the zone (array of BattlefieldCard)
            zone.forEach((card: BattlefieldCard) => {
                if (card.tapped) { // No need to check controllerId, these are the player's zones
                    card.tapped = false;
                    untappedCount++;
                    // console.log(` - Untapped ${card.objectId} (${this.engine.getCardFromObjectId(card.objectId)?.name})`);
                    // TODO: Emit untap event?
                }
            });
        });

        if (untappedCount > 0) {
            console.log(`Player ${playerId} untapped ${untappedCount} permanents.`);
        }
    }

    /**
     * Toggles the tapped state of a card on the battlefield.
     * @param playerId The ID of the player attempting to tap/untap the card.
     * @param cardInstanceId The instance ID of the card to toggle tap state.
     */
    toggleTapCard(playerId: PlayerId, cardInstanceId: GameObjectId): void {
        console.log(`ResourceManager: Player ${playerId} attempting to toggle tap state of ${cardInstanceId}`);
        
        // Find the card in the game state
        const card = this.gameState.gameObjects[cardInstanceId];
        if (!card) {
            throw new Error(`ResourceManager: Card instance ${cardInstanceId} not found in game objects.`);
        }
        
        // Verify the player owns this card
        if (card.controllerId !== playerId) {
            throw new Error(`ResourceManager: Player ${playerId} does not control card ${cardInstanceId} (controlled by ${card.controllerId}).`);
        }
        
        // Verify the card is on the battlefield
        if (card.currentZone !== 'battlefield') {
            throw new Error(`ResourceManager: Card ${cardInstanceId} is not on the battlefield (currently in ${card.currentZone}).`);
        }
        
        // Toggle the tapped state
        const wasTapped = card.tapped;
        card.tapped = !card.tapped;
        
        console.log(`ResourceManager: Toggled ${card.name} (${cardInstanceId}) from ${wasTapped ? 'tapped' : 'untapped'} to ${card.tapped ? 'tapped' : 'untapped'}`);
        
        // Emit tap event
        this.dependencies.emitGameEventFn(EventType.ZONE_CHANGE, {
            playerId: playerId,
            cardId: card.cardId,
            instanceId: cardInstanceId,
            action: card.tapped ? 'tapped' : 'untapped',
            message: `Player ${playerId} ${card.tapped ? 'tapped' : 'untapped'} ${card.name}.`
        });
    }

    // --- Playing Resources ---
    /**
     * Attempts to play a resource card from a player's hand.
     * Checks if the player is allowed to play a resource this turn.
     * @param playerId The ID of the player attempting to play the resource.
     * @param cardObjectId The GameObjectId of the resource card in the player's hand.
     * @returns True if the resource was successfully played, false otherwise.
     */
    playResource(playerId: PlayerId, cardObjectId: GameObjectId): boolean {
        const playerState = this.dependencies.getPlayerStateFn(playerId);
        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found for playing resource.`);
            return false;
        }

        // Check if resource already played this turn
        if (playerState.hasPlayedResourceThisTurn) {
            console.log(`ResourceManager: Player ${playerId} has already played a resource this turn.`);
            // TODO: Emit game rule violation event?
            return false;
        }

        // Check if the card is actually in the player's hand
        if (!playerState.hand.includes(cardObjectId)) {
            console.error(`ResourceManager Error: Card ${cardObjectId} not found in Player ${playerId}'s hand.`);
            return false;
        }

        // Get card details (Requires engine helper or GameState access)
        const card = this.dependencies.getBaseCardDataFn(cardObjectId); // Assumes such a method exists or will be added
        if (!card) {
            console.error(`ResourceManager Error: Could not find card data for object ID ${cardObjectId}.`);
            return false;
        }

        // Check if the card is actually a resource type (e.g., 'Land')
        if (card.type !== 'Resource' && card.type !== 'Land') { // Check both just in case
            console.log(`ResourceManager: Card ${card.name} (${cardObjectId}) is not a resource type.`);
            return false;
        }

        console.log(`ResourceManager: Player ${playerId} attempting to play resource ${card.name} (${cardObjectId}).`);

        // 3. Check Cost (Resource cards generally cost { colorless: 0 })
        const cost: ManaCost = card.cost || { C: 0 }; // Assume 0 if no cost defined
        if (!this.canPayCost(playerId, cost)) {
            console.warn(`ResourceManager: Player ${playerId} cannot pay cost for resource ${cardObjectId}.`);
            return false; // Should typically not happen for 0-cost resources
        }

        // 4. Pay Cost (even if it's 0)
        const paid = this.payCost(playerId, cost);
        if (!paid) return false;

        // 5. Move card from hand to battlefield
        console.log(`ResourceManager: Attempting to move resource ${cardObjectId} from hand to battlefield for player ${playerId}`);
        const moved = this.dependencies.moveCardZoneFn(cardObjectId, 'hand', 'battlefield', playerId);
        if (!moved) {
             console.error(`ResourceManager Error: Failed to move resource card ${cardObjectId} for player ${playerId}.`);
             return false;
        }

        console.log(`ResourceManager: Played resource ${cardObjectId} for player ${playerId}.`);

        // 6. Apply effects (e.g., enter tapped) - Assert type for gameObject
        const gameObject = this.gameState.gameObjects[cardObjectId];
        if (gameObject) {
            (gameObject as BattlefieldCard).tapped = true; // Assert using BattlefieldCard
            console.log(`ResourceManager: Resource ${cardObjectId} entered tapped.`);
            // TODO: Add mana generation ability logic if needed
        }
        return true;
    }

    /**
     * Attempts to pay a given mana cost from the player's mana pool.
     * Assumes canAffordCost was checked beforehand or calls it internally.
     * @param playerId The player paying the cost.
     * @param cost The ManaCost object to pay.
     * @returns True if the cost was successfully paid, false otherwise.
     */
    payCost(playerId: PlayerId, cost: ManaCost): boolean {
        console.log(`ResourceManager: Attempting to pay cost ${JSON.stringify(cost)} for player ${playerId}.`);
        const playerState = this.dependencies.getPlayerStateFn(playerId);
        if (!playerState) {
            console.error(`ResourceManager Error: Player ${playerId} not found for payCost.`);
            return false;
        }

        // 1. Double-check affordability (optional, but safer)
        if (!this.canAffordCost(playerId, cost)) {
            console.warn(`ResourceManager: Player ${playerId} cannot afford cost ${JSON.stringify(cost)} at the time of payment.`);
            return false;
        }

        const pool = playerState.manaPool;
        let paidSuccessfully = true;
        let remainingGenericCost = cost.C ?? 0;
        const manaToSpendForGeneric: { [key in ManaColor | 'C']?: number } = { ...pool }; // Work on a copy

        // 2. Pay specific colored costs first
        const requiredColors: ManaColor[] = ['W', 'U', 'B', 'R', 'G'];
        for (const color of requiredColors) {
            const requiredAmount = cost[color];
            if (requiredAmount && requiredAmount > 0) {
                if (!this.spendMana(playerId, color, requiredAmount)) {
                    console.error(`ResourceManager Error: Failed to spend required ${requiredAmount} ${color} mana for player ${playerId}, despite canAffordCost passing.`);
                    paidSuccessfully = false;
                    break; // Stop processing if a colored payment fails
                }
                 // Reduce the amount available for generic from our temporary copy
                 if (manaToSpendForGeneric[color]) {
                     manaToSpendForGeneric[color] = (manaToSpendForGeneric[color] as number) - requiredAmount;
                 }
            }
        }

        if (!paidSuccessfully) return false; // Exit if colored mana payment failed

        // 3. Pay generic cost (C)
        if (remainingGenericCost > 0) {
            console.log(`ResourceManager: Paying ${remainingGenericCost} generic cost for player ${playerId}.`);
            // Prioritize spending actual colorless mana first
            const availableColorless = manaToSpendForGeneric.C ?? 0;
            if (availableColorless > 0) {
                const spendAmount = Math.min(remainingGenericCost, availableColorless);
                if (!this.spendMana(playerId, 'C', spendAmount)) {
                    console.error(`ResourceManager Error: Failed to spend ${spendAmount} colorless mana for player ${playerId}.`);
                    paidSuccessfully = false;
                } else {
                    remainingGenericCost -= spendAmount;
                    manaToSpendForGeneric.C = 0; // Mark as used in our copy
                    console.log(`ResourceManager: Spent ${spendAmount} colorless mana. ${remainingGenericCost} generic remaining.`);
                }
            }

            // If generic cost remains, spend colored mana
            if (paidSuccessfully && remainingGenericCost > 0) {
                for (const color of requiredColors) { // Iterate through WUBRG
                    const availableAmount = manaToSpendForGeneric[color] ?? 0;
                    if (availableAmount > 0) {
                        const spendAmount = Math.min(remainingGenericCost, availableAmount);
                        if (!this.spendMana(playerId, color, spendAmount)) {
                            console.error(`ResourceManager Error: Failed to spend ${spendAmount} ${color} mana for generic cost for player ${playerId}.`);
                            paidSuccessfully = false;
                            break; // Stop if spending fails
                        }
                        remainingGenericCost -= spendAmount;
                        manaToSpendForGeneric[color] = 0; // Mark as used in our copy
                         console.log(`ResourceManager: Spent ${spendAmount} ${color} mana for generic. ${remainingGenericCost} generic remaining.`);
                        if (remainingGenericCost <= 0) break; // Stop if generic cost is fully paid
                    }
                }
            }

            // Final check if generic cost was fully paid
            if (remainingGenericCost > 0) {
                console.error(`ResourceManager Error: Could not fully pay ${cost.C} generic mana cost for player ${playerId}. ${remainingGenericCost} remained unpaid.`);
                paidSuccessfully = false;
                // TODO: Implement rollback? This case indicates a logic error in canAffordCost or spendMana.
            }
        }

        if (paidSuccessfully) {
             console.log(`ResourceManager: Successfully paid cost ${JSON.stringify(cost)} for player ${playerId}. Final pool:`, JSON.stringify(playerState.manaPool));
        } else {
             console.error(`ResourceManager: Failed to fully pay cost ${JSON.stringify(cost)} for player ${playerId}.`);
             // TODO: Rollback mana spent? This requires tracking spent mana.
        }

        return paidSuccessfully;
    }
}
