import { GameState, PlayerId, GamePhase, GameStep, PlayerState, GameObjectId, StackItem, BattlefieldCard } from '../interfaces/gameState';
import { ManaCost, ManaColor, Card, Keyword } from '../interfaces/card';

export class GameEngine {
    private gameState: GameState;

    // Define the order of phases and steps
    private static readonly phaseOrder: GamePhase[] = ['BEGIN', 'MAIN', 'COMBAT', 'MAIN', 'END'];
    private static readonly stepOrder: { [key in GamePhase]: GameStep[] } = {
        'BEGIN': ['UNTAP', 'UPKEEP', 'DRAW'],
        'MAIN': ['MAIN_PRE'], // Represents the single step in the first Main Phase
        'COMBAT': ['COMBAT_BEGIN', 'DECLARE_ATTACKERS', 'DECLARE_BLOCKERS', 'COMBAT_DAMAGE_FIRST', 'COMBAT_DAMAGE_NORMAL', 'COMBAT_END'],
        // Note: The second Main Phase uses the same 'MAIN' key but follows COMBAT
        'END': ['END_STEP', 'CLEANUP'],
    };

    // Helper to get the step sequence for the current phase
    private getCurrentPhaseSteps(): GameStep[] {
        // Handle the two main phases correctly
        if (this.gameState.currentPhase === 'MAIN') {
            const combatPhaseIndex = GameEngine.phaseOrder.indexOf('COMBAT');
            const currentPhaseIndex = GameEngine.phaseOrder.indexOf(this.gameState.currentPhase, combatPhaseIndex + 1); // Find the *second* MAIN
            if (currentPhaseIndex > combatPhaseIndex) {
                return ['MAIN_POST']; // Steps for the second Main Phase
            }
        }
        return GameEngine.stepOrder[this.gameState.currentPhase];
    }

    constructor(initialState: GameState) {
        this.gameState = initialState;
        console.log("GameEngine initialized.");
    }

    private determineFirstPlayer(): PlayerId {
        // Simple random determination for now
        const randomIndex = Math.floor(Math.random() * this.gameState.players.length);
        return this.gameState.players[randomIndex].playerId;
    }

    private shuffleDeck(playerId: PlayerId): void {
        console.log(`Placeholder: Shuffling deck for player ${playerId}`);
        // TODO: Implement actual deck shuffling logic
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (playerState) {
            // Simple array shuffle placeholder
            playerState.library.sort(() => Math.random() - 0.5);
        }
    }

    private drawOpeningHand(playerId: PlayerId, handSize: number = 7): void {
        console.log(`Placeholder: Drawing opening hand for player ${playerId}`);
        // TODO: Implement actual drawing logic, moving cards from library to hand
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (playerState) {
            for (let i = 0; i < handSize && playerState.library.length > 0; i++) {
                const drawnCardId = playerState.library.shift(); // Removes from library
                if (drawnCardId) {
                    playerState.hand.push(drawnCardId);
                }
            }
        }
    }

    public startGame(): void {
        console.log("Starting game...");

        // 1. Initial Setup
        this.gameState.players.forEach(player => {
            this.shuffleDeck(player.playerId);
            this.drawOpeningHand(player.playerId); // Draw opening hands
        });

        // 2. Determine First Player
        const firstPlayerId = this.determineFirstPlayer();
        console.log(`Player ${firstPlayerId} goes first.`);

        // 3. Start First Turn
        this.gameState.turnNumber = 1;
        this.gameState.activePlayerId = firstPlayerId;
        this.gameState.currentPhase = 'BEGIN'; // Start in Beginning Phase
        this.gameState.currentStep = 'UPKEEP'; // Skip Untap and Draw on T1
        this.grantPriority(this.gameState.activePlayerId); // Grant priority for Upkeep actions

        console.log(`Game ${this.gameState.gameId} started. Turn ${this.gameState.turnNumber}. Active player: ${this.gameState.activePlayerId}. Phase: ${this.gameState.currentPhase}, Step: ${this.gameState.currentStep}. Priority: ${this.gameState.priorityPlayerId}`);
    }

    // --- Turn/Phase/Step Management --- //

    private grantPriority(playerId: PlayerId): void {
        this.gameState.priorityPlayerId = playerId;
        console.log(`Priority granted to Player ${playerId}`);
        // TODO: Emit event or notify player
    }

    private clearManaPool(playerId: PlayerId): void {
        const player = this.gameState.players.find(p => p.playerId === playerId);
        if (player && Object.keys(player.manaPool).length > 0) {
            console.log(`Clearing mana pool for Player ${playerId}: ${JSON.stringify(player.manaPool)}`);
            player.manaPool = {}; // Reset to empty object
        }
    }

    public advanceStep(): void {
        this.clearManaPool(this.gameState.activePlayerId);
        this.clearManaPool(this.gameState.players.find(p => p.playerId !== this.gameState.activePlayerId)!.playerId);

        const currentPhase = this.gameState.currentPhase;
        const currentStep = this.gameState.currentStep;
        let nextStep: GameStep | undefined = undefined;
        let nextPhase: GamePhase | undefined = undefined;

        console.log(`Advancing step from ${currentPhase} - ${currentStep}`);

        switch (currentPhase) {
            case 'BEGIN':
                if (currentStep === 'UNTAP') nextStep = 'UPKEEP';
                else if (currentStep === 'UPKEEP') nextStep = 'DRAW';
                else if (currentStep === 'DRAW') this.advancePhase(); // End of Begin Phase
                break;
            case 'MAIN': // Handles both Pre and Post combat main phases
                 // Main phase only has one step, so advancing step moves to the next phase
                 this.advancePhase();
                 break;
            case 'COMBAT':
                switch (currentStep) {
                    case 'COMBAT_BEGIN':
                        nextStep = 'DECLARE_ATTACKERS';
                        this.gameState.priorityPlayerId = this.gameState.activePlayerId; // Active player gets priority to declare
                        break;
                    case 'DECLARE_ATTACKERS':
                        nextStep = 'DECLARE_BLOCKERS';
                        // Priority was passed to non-active player in declareAttackers action
                        break;
                    case 'DECLARE_BLOCKERS':
                        nextStep = 'COMBAT_DAMAGE_FIRST';
                        // Check if any creatures have First Strike
                        const hasFirstStrike = this._doesAnyCreatureHaveKeyword('First Strike');
                        if (hasFirstStrike) {
                            console.log("Entering First Strike Combat Damage Step.");
                            this._assignCombatDamage(true); // Assign first strike damage
                            this._checkStateBasedActions(); // Check for deaths etc.
                            // Priority is passed back to active player after blockers are declared.
                            // They get priority *before* first strike damage resolves (implicitly handled by passing priority in declareBlockers).
                            // Then, after first strike damage and SBAs, players get priority again before normal damage.
                            this.gameState.priorityPlayerId = this.gameState.activePlayerId;
                        } else {
                             console.log("No First Strike creatures. Skipping First Strike Damage Step.");
                             // Directly assign normal damage if no first strike
                             this._assignCombatDamage(false); // Assign normal damage
                             this._checkStateBasedActions(); // Check for deaths etc.
                             nextStep = 'COMBAT_DAMAGE_NORMAL'; // Jump to normal damage step logic (SBAs checked, priority needs passing)
                            this.gameState.priorityPlayerId = this.gameState.activePlayerId;
                        }
                        break;
                    case 'COMBAT_DAMAGE_FIRST':
                        nextStep = 'COMBAT_DAMAGE_NORMAL';
                         console.log("Entering Normal Combat Damage Step.");
                        // Assign normal damage (only for creatures without first strike if first strike happened)
                        // Note: _assignCombatDamage needs adjustment to handle this distinction, or we filter here.
                        // Current implementation assigns *all* non-first-strike damage.
                        this._assignCombatDamage(false);
                        this._checkStateBasedActions(); // Check SBAs again
                        this.gameState.priorityPlayerId = this.gameState.activePlayerId; // Active player gets priority
                        break;
                    case 'COMBAT_DAMAGE_NORMAL':
                        nextStep = 'COMBAT_END';
                        this.gameState.priorityPlayerId = this.gameState.activePlayerId; // Active player gets priority
                        break;
                    case 'COMBAT_END':
                        nextPhase = 'MAIN';
                        nextStep = 'MAIN_PRE'; // Correct step for start of main phase
                        this._clearCombatState(); // Clear attackers/blockers
                        this.gameState.priorityPlayerId = this.gameState.activePlayerId; // Active player gets priority
                        break;
                }
                break;
            case 'END':
                if (currentStep === 'END_STEP') {
                    nextStep = 'CLEANUP';
                    this.gameState.priorityPlayerId = this.gameState.activePlayerId; // Active player gets priority briefly, though usually nothing happens.
                } else if (currentStep === 'CLEANUP') {
                    // --- Cleanup Actions --- //                    
                    console.log("Performing Cleanup Step actions...");

                    // Get active player
                    const activePlayerState = this.gameState.players.find(p => p.playerId === this.gameState.activePlayerId);

                    if (activePlayerState) {
                        // 1. Active player discards down to max hand size (if necessary)
                        const handSize = activePlayerState.hand.length;
                        const maxHandSize = activePlayerState.maxHandSize; // Assuming this exists on PlayerState
                        if (handSize > maxHandSize) {
                            console.log(` > Player ${activePlayerState.playerId} must discard ${handSize - maxHandSize} cards (Hand: ${handSize}/${maxHandSize}).`);
                            // TODO: Implement discard choice mechanism. 
                            // This should pause game progression and wait for player action.
                            // For now, we'll just log and continue.
                            // In a real implementation, we might set a state like 'AWAITING_DISCARD' 
                            // and *not* clear nextStep/nextPhase here.
                        }

                        // 2. Clear damage marked on creatures
                        let damageClearedCount = 0;
                        this.gameState.players.forEach(player => { // Damage cleared for ALL players
                            player.battlefield.creatures.forEach(creature => {
                                if (creature.damageMarked > 0) {
                                    creature.damageMarked = 0;
                                    damageClearedCount++;
                                }
                            });
                        });
                        if (damageClearedCount > 0) {
                             console.log(` > Cleared marked damage from ${damageClearedCount} creatures.`);
                        }

                        // 3. End "until end of turn" effects (TODO)
                         console.log(` > Ending 'until end of turn' effects (Placeholder).`);

                        // 4. Check for triggered abilities from cleanup (rare, but possible)
                        // If any trigger, players get priority again, and *another* cleanup step happens after.
                        // For now, we assume no triggers and proceed to end the turn.

                        // 5. Advance turn (handled by advancePhase which is called if no nextStep/nextPhase set)
                         console.log("Cleanup Step finished (for now - discard not implemented).");
                        // No next step/phase here; advancePhase will handle turn change.
                        nextStep = undefined; // Explicitly prevent step change within this phase
                    }
                }
                break;
        }

        // Check if we determined the next step within the current phase
        if (nextStep && !nextPhase) {
            this.gameState.currentStep = nextStep;
            console.log(`Advanced to Step: ${this.gameState.currentStep}`);
            // Priority is usually handled within the step transition logic above
            // If priority wasn't explicitly set, it might need to be passed here based on rules.
            // Re-evaluate if grantPriority(this.gameState.priorityPlayerId) is needed here.
        } 
        // Check if we determined the next phase
        else if (nextPhase) {
            const newPhaseSteps = this.getCurrentPhaseSteps();
            if (newPhaseSteps.length === 0) {
                 console.error(`Error: No steps defined for phase ${nextPhase}`);
                 return; // Avoid getting stuck
            }
            // If nextStep wasn't explicitly set for the new phase (e.g., MAIN_PRE was set above), use the first step.
            const entryStep = nextStep && newPhaseSteps.includes(nextStep) ? nextStep : newPhaseSteps[0];

            this.gameState.currentPhase = nextPhase;
            this.gameState.currentStep = entryStep; 
            console.log(`Advanced to Phase: ${this.gameState.currentPhase}, Step: ${this.gameState.currentStep}`);
            // Priority is usually granted to the active player at the start of a new phase/step
            this.grantPriority(this.gameState.activePlayerId); 
        } 
        // If neither nextStep nor nextPhase is set, it might indicate the end of the turn or an issue.
        else if (!nextStep && !nextPhase && currentPhase === 'END' && currentStep === 'CLEANUP'){
            // End of turn logic was handled in advancePhase, this is expected.
             console.log("Cleanup step finished, turn end handled by advancePhase.");
        }
         else {
            // This case should ideally not be reached if all transitions are handled.
            // If it is, it means we are stuck in a step without a defined transition.
            console.warn(`Warning: No next step or phase determined from ${currentPhase} - ${currentStep}.`);
        }
    }

    private advancePhase(): void {
        const currentPhaseIndex = GameEngine.phaseOrder.indexOf(this.gameState.currentPhase);
        // Calculate the index of the *current* phase occurrence (handling the two MAIN phases)
        let phaseOccurrenceIndex = GameEngine.phaseOrder.indexOf(this.gameState.currentPhase);
        if (this.gameState.currentPhase === 'MAIN' && currentPhaseIndex < GameEngine.phaseOrder.indexOf('COMBAT')) {
           // If it's the first MAIN phase, search from the beginning
        } else {
            // Otherwise (COMBAT, second MAIN, END), search from after COMBAT if needed
           const combatIndex = GameEngine.phaseOrder.indexOf('COMBAT');
           phaseOccurrenceIndex = GameEngine.phaseOrder.indexOf(this.gameState.currentPhase, combatIndex + (this.gameState.currentPhase === 'MAIN' ? 0 : -1));
        }

        let nextPhaseIndex = phaseOccurrenceIndex + 1;

        // Handle looping back to Begin phase and advancing turn
        if (nextPhaseIndex >= GameEngine.phaseOrder.length) {
            this.nextTurn();
        } else {
            this.gameState.currentPhase = GameEngine.phaseOrder[nextPhaseIndex];
            // Start at the first step of the new phase
            const newPhaseSteps = this.getCurrentPhaseSteps(); // Recalculate steps for the new phase
            this.gameState.currentStep = newPhaseSteps[0];

            console.log(`Advanced to Phase: ${this.gameState.currentPhase}, Step: ${this.gameState.currentStep}`);
            // Clear pools before granting priority in the new step
            this.gameState.players.forEach(p => this.clearManaPool(p.playerId)); 
            this.grantPriority(this.gameState.activePlayerId);
        }
    }

    private nextTurn(): void {
        // 1. Increment Turn Counter
        this.gameState.turnNumber++;
        console.log(`--- Advancing to Turn ${this.gameState.turnNumber} ---`);

        // 2. Switch Active Player
        const currentActivePlayerIndex = this.gameState.players.findIndex(p => p.playerId === this.gameState.activePlayerId);
        const nextActivePlayerIndex = (currentActivePlayerIndex + 1) % this.gameState.players.length;
        this.gameState.activePlayerId = this.gameState.players[nextActivePlayerIndex].playerId;
        console.log(`Active player is now: ${this.gameState.activePlayerId}`);

        // 3. Reset Phase and Step to Beginning
        this.gameState.currentPhase = 'BEGIN';
        this.gameState.currentStep = 'UNTAP'; // Start with the Untap step

        // 4. Perform Turn-Based Actions (Untap)
        this.untapStep(this.gameState.activePlayerId);

        // 5. Grant Priority for the new step
        console.log(`Advanced to Phase: ${this.gameState.currentPhase}, Step: ${this.gameState.currentStep}`);
        // Clear pools before granting priority in the new turn's first step
        this.gameState.players.forEach(p => this.clearManaPool(p.playerId));
        this.grantPriority(this.gameState.activePlayerId);
    }

    // Placeholder for turn-based actions like untapping permanents
    private untapStep(playerId: PlayerId): void {
        console.log(`Executing Untap Step for Player ${playerId}`);
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (playerState) {
            // Untap all permanents controlled by the player
            [...playerState.battlefield.creatures, ...playerState.battlefield.resources, ...playerState.battlefield.enchantments].forEach(card => {
                if (card.isTapped) {
                    card.isTapped = false;
                    console.log(` > Untapped ${this.gameState.gameObjects[card.objectId]?.name ?? card.objectId}`);
                }
            });
            // Reset summoning sickness for creatures that survived the previous turn
            // TODO: This needs refinement - only reset for creatures present since start of *this* player's *last* turn
            // playerState.battlefield.creatures.forEach(c => c.summoningSickness = false);

        }
    }

    // --- Resource Management --- //

    private generateResources(playerId: PlayerId): void {
        const player = this.gameState.players.find(p => p.playerId === playerId);
        if (player) {
            // Placeholder: Add 1 generic mana during upkeep
            // TODO: Implement actual resource generation based on controlled permanents
            const currentMana = player.manaPool.colorless ?? 0;
            player.manaPool.colorless = currentMana + 1;
            console.log(`Player ${playerId} generated 1 colorless mana (placeholder). Pool: ${JSON.stringify(player.manaPool)}`);
        }
    }

    private canPayCost(playerState: PlayerState, cost: ManaCost): boolean {
        const pool = { ...playerState.manaPool }; // Create a copy to simulate spending
        let genericCost = cost.colorless ?? 0;

        // Check and simulate spending colored mana first
        for (const color of ['R', 'U', 'G', 'B', 'W'] as ManaColor[]) {
            const required = cost[color] ?? 0;
            const available = pool[color] ?? 0;
            if (available < required) {
                return false; // Not enough specific colored mana
            }
            pool[color] = available - required; // Simulate spending
        }

        // Check if remaining mana can cover generic cost
        let remainingManaTotal = 0;
        for (const color of ['R', 'U', 'G', 'B', 'W', 'colorless'] as (ManaColor | 'colorless')[]) {
             remainingManaTotal += pool[color] ?? 0;
        }

        return remainingManaTotal >= genericCost;
    }

    private spendMana(playerState: PlayerState, cost: ManaCost): boolean {
        if (!this.canPayCost(playerState, cost)) {
            console.warn(`Player ${playerState.playerId} cannot pay cost ${JSON.stringify(cost)} with pool ${JSON.stringify(playerState.manaPool)}`);
            return false;
        }

        console.log(`Player ${playerState.playerId} attempting to spend cost ${JSON.stringify(cost)} from pool ${JSON.stringify(playerState.manaPool)}`);

        let genericCostRemaining = cost.colorless ?? 0;

        // Spend exact colored mana first
        for (const color of ['R', 'U', 'G', 'B', 'W'] as ManaColor[]) {
            const required = cost[color] ?? 0;
            if (required > 0) {
                playerState.manaPool[color] = (playerState.manaPool[color] ?? 0) - required;
                if (playerState.manaPool[color] === 0) delete playerState.manaPool[color]; // Clean up pool
            }
        }

        // Spend generic cost using remaining mana (prioritize colorless)
        const manaSources: (ManaColor | 'colorless')[] = ['colorless', 'W', 'U', 'B', 'R', 'G']; // Order matters slightly
        for (const source of manaSources) {
            if (genericCostRemaining <= 0) break;
            const available = playerState.manaPool[source] ?? 0;
            if (available > 0) {
                const amountToSpend = Math.min(genericCostRemaining, available);
                playerState.manaPool[source] = available - amountToSpend;
                genericCostRemaining -= amountToSpend;
                if (playerState.manaPool[source] === 0) delete playerState.manaPool[source];
            }
        }

        console.log(` > Mana spent successfully. New pool: ${JSON.stringify(playerState.manaPool)}`);
        return true;
    }

    public tapResource(playerId: PlayerId, resourceObjectId: GameObjectId): void {
        const player = this.gameState.players.find(p => p.playerId === playerId);
        const resourceCard = player?.battlefield.resources.find(r => r.objectId === resourceObjectId);

        if (!player || !resourceCard) {
            console.error(`Cannot tap resource: Player ${playerId} or Resource ${resourceObjectId} not found.`);
            return;
        }

        if (resourceCard.isTapped) {
            console.warn(`Resource ${resourceObjectId} is already tapped.`);
            return;
        }

        // TODO: Check if the player can tap this resource (e.g., timing restrictions)

        console.log(`Player ${playerId} taps resource ${resourceObjectId}`);
        resourceCard.isTapped = true;

        // Placeholder: Add 1 mana of a default type (e.g., colorless)
        // TODO: Determine mana type/amount based on the resource card definition
        const manaType: ManaColor | 'colorless' = 'colorless'; // Default
        const amount = 1;
        const currentMana = player.manaPool[manaType as keyof PlayerState['manaPool']] ?? 0;
        player.manaPool[manaType as keyof PlayerState['manaPool']] = currentMana + amount;
        console.log(` > Added ${amount} ${manaType} mana. Pool: ${JSON.stringify(player.manaPool)}`);

        // Tapping for mana usually doesn't use the stack, so priority doesn't pass here typically.
    }

    // --- Player Actions --- //

    public playCard(playerId: PlayerId, cardObjectId: GameObjectId, targets?: (GameObjectId | PlayerId)[]): boolean {
        console.log(`Attempting action: Player ${playerId} plays card ${cardObjectId}`);

        // 1. Validation: Priority
        if (this.gameState.priorityPlayerId !== playerId) {
            console.warn(`Action failed: Player ${playerId} does not have priority.`);
            return false;
        }

        // 2. Validation: Card in Hand
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (!playerState) {
            console.error(`Action failed: Player state not found for ${playerId}.`);
            return false;
        }
        const cardIndexInHand = playerState.hand.indexOf(cardObjectId);
        if (cardIndexInHand === -1) {
            console.warn(`Action failed: Card ${cardObjectId} not found in Player ${playerId}'s hand.`);
            return false;
        }

        // 3. Get Card Definition
        const cardDefinition = this.gameState.gameObjects[cardObjectId];
        if (!cardDefinition) {
            console.error(`Action failed: Card definition not found for GameObjectId ${cardObjectId}.`);
            return false;
        }
        console.log(` > Card found: ${cardDefinition.name} (${cardDefinition.type})`);

        // 4. Validation: Timing
        const isMainPhase = this.gameState.currentPhase === 'MAIN';
        const stackIsEmpty = this.gameState.stack.length === 0;
        const canPlaySorcerySpeed = isMainPhase && stackIsEmpty;

        if (cardDefinition.type === 'Spell') {
            if (cardDefinition.spellSpeed === 'Sorcery' && !canPlaySorcerySpeed) {
                 console.warn(`Action failed: Cannot play Sorcery [${cardDefinition.name}] during ${this.gameState.currentPhase}/${this.gameState.currentStep} or while stack is not empty.`);
                 return false;
            }
            // Instants can generally be played anytime the player has priority (already checked)
        } else if (cardDefinition.type === 'Creature' || cardDefinition.type === 'Enchantment' || cardDefinition.type === 'Resource') {
            // Non-instants typically require main phase, empty stack
            if (!canPlaySorcerySpeed) {
                console.warn(`Action failed: Cannot play ${cardDefinition.type} [${cardDefinition.name}] during ${this.gameState.currentPhase}/${this.gameState.currentStep} or while stack is not empty.`);
                return false;
            }
        }

        // 5. Validation: Mana Cost
        if (!this.canPayCost(playerState, cardDefinition.cost)) {
            console.warn(`Action failed: Player ${playerId} cannot pay mana cost ${JSON.stringify(cardDefinition.cost)} for ${cardDefinition.name}.`);
            return false;
        }

        // 6. Validation: Targets (Placeholder)
        // TODO: Implement target validation based on cardDefinition.requiresTarget, cardDefinition.targetRules, and provided targets argument
        if (targets && targets.length > 0) {
            console.log(` > Targeting provided: ${targets.join(', ')} (Validation pending)`);
        }

        // --- If all validations pass --- //

        console.log(`All validations passed for playing ${cardDefinition.name}.`);

        // --- State Updates --- //

        // 1. Spend Mana
        if (!this.spendMana(playerState, cardDefinition.cost)) {
            // This should ideally not happen due to canPayCost check, but defensively check.
            console.error(`Failed to spend mana for ${cardDefinition.name} despite passing canPayCost check.`);
            return false;
        }

        // 2. Remove card from hand
        playerState.hand.splice(cardIndexInHand, 1);
        console.log(` > Removed ${cardObjectId} (${cardDefinition.name}) from hand.`);

        // 3. Move card to Stack or Battlefield
        if (cardDefinition.type === 'Spell') {
            // Add to stack
            const stackItem: StackItem = {
                stackId: `stack_${Date.now()}_${Math.random()}`, // Simple unique ID
                type: 'Spell',
                cardId: cardDefinition.id,
                sourceObjectId: cardObjectId, // Track the original object ID from hand
                controllerId: playerId,
                targets: targets || [],
            };
            this.gameState.stack.push(stackItem);
            console.log(` > Added ${cardDefinition.name} to the stack.`);
            // Playing a spell passes priority back to the active player for responses
            this.grantPriority(playerId);

        } else { 
            // Add to Battlefield (Creature, Enchantment, Resource)
            const battlefieldCard: BattlefieldCard = {
                objectId: cardObjectId, // Reuse the ID from hand for the permanent
                cardId: cardDefinition.id,
                controllerId: playerId,
                ownerId: cardDefinition.ownerId, // Assuming ownerId is set in gameState.gameObjects
                isTapped: false,
                summoningSickness: cardDefinition.type === 'Creature', // Creatures have summoning sickness
                counters: [],
                attachments: [],
                damageMarked: 0, // Initialize damage marked
            };

            switch (cardDefinition.type) {
                case 'Creature':
                    playerState.battlefield.creatures.push(battlefieldCard);
                    console.log(` > Added ${cardDefinition.name} to battlefield (Creature). Summoning Sickness: ${battlefieldCard.summoningSickness}`);
                    break;
                case 'Enchantment':
                    playerState.battlefield.enchantments.push(battlefieldCard);
                    console.log(` > Added ${cardDefinition.name} to battlefield (Enchantment).`);
                    break;
                case 'Resource':
                    playerState.battlefield.resources.push(battlefieldCard);
                     console.log(` > Added ${cardDefinition.name} to battlefield (Resource).`);
                    break;
            }
            // Playing a permanent (non-spell) successfully typically means priority passes IF the stack was empty
            // If the stack wasn't empty this action shouldn't have been possible (per validation)
            // So, after a permanent resolves, priority goes to the active player, then non-active.
            // This is handled by the passPriority logic if both pass.
             // For now, playing a permanent doesn't automatically pass priority here.
             // The active player retains priority to potentially play more cards in main phase.
        }

        // TODO: Handle ETB triggers (add to stack after permanent enters)
        // TODO: Handle cast triggers (add to stack when spell is cast)

        return true; 
    }

    public declareAttackers(playerId: PlayerId, attackingCreatureIds: GameObjectId[]): boolean {
        console.log(`Attempting action: Player ${playerId} declares attackers: ${attackingCreatureIds.join(', ')}`);

        // 1. Validation: Phase and Step
        if (this.gameState.currentPhase !== 'COMBAT' || this.gameState.currentStep !== 'DECLARE_ATTACKERS') {
            console.warn(`Action failed: Cannot declare attackers during ${this.gameState.currentPhase}/${this.gameState.currentStep}.`);
            return false;
        }

        // 2. Validation: Priority (Must be active player)
        if (this.gameState.priorityPlayerId !== playerId || this.gameState.activePlayerId !== playerId) {
            console.warn(`Action failed: Player ${playerId} cannot declare attackers (Not active player or does not have priority).`);
            return false;
        }

        // 3. Validation: Creatures Exist and Can Attack
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (!playerState) {
            console.error(`Action failed: Player state not found for ${playerId}.`); // Should not happen
            return false;
        }
        const validatedAttackers: BattlefieldCard[] = [];

        for (const creatureId of attackingCreatureIds) {
            const creature = playerState.battlefield.creatures.find(c => c.objectId === creatureId);

            if (!creature) {
                console.warn(`Action failed: Creature ${creatureId} not found on Player ${playerId}'s battlefield.`);
                return false;
            }

            const baseCard = this.gameState.gameObjects[creature.objectId]; // Get base card data for keyword checks

            if (creature.isTapped) {
                 console.warn(`Action failed: Creature ${creature.cardId} (${creatureId}) is tapped.`);
                 return false;
            }

            if (creature.summoningSickness && !baseCard?.keywords?.includes('Haste')) { // Check for Haste
                 console.warn(`Action failed: Creature ${creature.cardId} (${creatureId}) has summoning sickness and no Haste.`);
                return false;
            }

            validatedAttackers.push(creature);
        }

        // --- State Updates --- //
        console.log(`Declare Attackers validated. Updating state...`);

        // 1. Clear previous attackers and set new ones
        this.gameState.attackers = {}; // Clear existing
        this.gameState.attackers = validatedAttackers.reduce((acc, attacker) => ({ ...acc, [attacker.objectId]: this.gameState.players.find(p => p.playerId !== playerId)!.playerId }), {}); // Assign validated map
        const assignmentString = Object.entries(this.gameState.attackers).map(([b, a]) => `${b} -> ${a}`).join('; ');
        console.log(` > Attackers assigned: ${assignmentString || 'None'}`);

        // 2. Tap the attackers (unless they have Vigilance)
        validatedAttackers.forEach(attacker => {
            const baseCard = this.gameState.gameObjects[attacker.objectId]; // Get base card for Vigilance check
            if (!baseCard?.keywords?.includes('Vigilance')) {
                attacker.isTapped = true;
                console.log(` > Creature ${attacker.cardId} (${attacker.objectId}) declared attacking and tapped.`);
            } else {
                 console.log(` > Creature ${attacker.cardId} (${attacker.objectId}) declared attacking (Vigilance - not tapped).`);
            }
        });

        // 3. Pass priority to the non-active player for declaring blockers
        this.passPriority(); // Priority now goes to the opponent

        console.log(`Declare Attackers action completed. Priority passed to ${this.gameState.priorityPlayerId}.`);
        return true;
    }

    public declareBlockers(playerId: PlayerId, blockerAssignments: { [blockerId: GameObjectId]: GameObjectId }): boolean {
        const assignmentString = Object.entries(blockerAssignments).map(([b, a]) => `${b} -> ${a}`).join('; ');
        console.log(`Attempting action: Player ${playerId} declares blockers: ${assignmentString}`);

        // 1. Validation: Phase and Step
        if (this.gameState.currentPhase !== 'COMBAT' || this.gameState.currentStep !== 'DECLARE_BLOCKERS') {
            console.warn(`Action failed: Cannot declare blockers during ${this.gameState.currentPhase}/${this.gameState.currentStep}.`);
            return false;
        }

        // 2. Validation: Priority (Must be non-active player with priority)
        if (this.gameState.priorityPlayerId !== playerId || this.gameState.activePlayerId === playerId) {
            console.warn(`Action failed: Player ${playerId} cannot declare blockers (Not non-active player or does not have priority).`);
            return false;
        }

        // 3. Validation: Creatures and Assignments
        const playerState = this.gameState.players.find(p => p.playerId === playerId);
        if (!playerState) {
            console.error(`Action failed: Player state not found for ${playerId}.`); // Should not happen
            return false;
        }
        const validatedBlockers: { [blockerId: GameObjectId]: GameObjectId } = {};
        const allAttackerIds = Object.keys(this.gameState.attackers);

        for (const blockerId in blockerAssignments) {
            const attackerId = blockerAssignments[blockerId];

            // a) Validate Blocker
            const blockerCreature = playerState.battlefield.creatures.find(c => c.objectId === blockerId);
            if (!blockerCreature) {
                console.warn(`Action failed: Blocker creature ${blockerId} not found on Player ${playerId}'s battlefield.`);
                return false;
            }
            
            // b) Validate Blocker Capabilities
            const blockerObject = this.gameState.gameObjects[blockerId]; // Get base card data for blocker
            if (!blockerObject) { // Ensure blocker card data exists
                console.warn(`Action failed: Base card data not found for blocker ${blockerId}.`);
                return false;
            }
            
            if (blockerCreature.isTapped) {
                console.warn(`Action failed: Blocker ${blockerCreature.cardId} (${blockerId}) is tapped.`);
                return false;
            }
            
            if (blockerObject.keywords?.includes('Cannot Block')) {
                console.warn(`Action failed: Blocker ${blockerCreature.cardId} (${blockerId}) has 'Cannot Block'.`);
                return false;
            }

            // c) Validate Attacker
            if (!allAttackerIds.includes(attackerId)) {
                 console.warn(`Action failed: Creature ${attackerId} is not a declared attacker.`);
                return false;
            }

            // d) Validate Legality (Flying vs Reach/Flying)
            const attackerObject = this.gameState.gameObjects[attackerId]; // Get base card data for attacker
            if (!attackerObject) { // Ensure attacker card data exists
                console.warn(`Action failed: Base card data not found for attacker ${attackerId}.`);
                return false;
            }
            
            // Check if attacker has Flying and blocker doesn't have Flying or Reach
            const attackerHasFlying = attackerObject.keywords?.includes('Flying');
            const blockerHasFlying = blockerObject.keywords?.includes('Flying');
            const blockerHasReach = blockerObject.keywords?.includes('Reach');

            if (attackerHasFlying && !blockerHasFlying && !blockerHasReach) {
                 console.warn(`Action failed: Blocker ${blockerId} cannot block flying attacker ${attackerId} (needs Flying or Reach).`);
                 return false;
            }

            // e) Check if blocker already assigned
            if (validatedBlockers[blockerId]) {
                console.warn(`Action failed: Blocker ${blockerId} assigned to multiple attackers.`);
                return false;
            }

            // TODO: Add validation for multiple blockers per attacker if needed by rules

            validatedBlockers[blockerId] = attackerId;
        }

        // --- State Updates --- //
        console.log(`Declare Blockers validated. Updating state...`);

        // 1. Clear previous blockers and set new ones
        this.gameState.blockers = {}; // Clear existing
        this.gameState.blockers = validatedBlockers; // Assign validated map
        const blockerAssignmentLogString = Object.entries(this.gameState.blockers).map(([b, a]) => `${b} -> ${a}`).join('; ');
        console.log(` > Blockers assigned: ${blockerAssignmentLogString || 'None'}`);

        // 2. Pass priority back to the active player
        // The active player gets priority again before moving to damage step
        this.passPriority();

        console.log(`Declare Blockers action completed. Priority passed to ${this.gameState.priorityPlayerId}.`);
        return true;
    }

    // --- Combat Resolution --- //

    private _assignCombatDamage(isFirstStrike: boolean): void {
        console.log(`Assigning combat damage (${isFirstStrike ? 'First Strike' : 'Normal'})...`);
        const attackersMap = this.gameState.attackers;
        const blockersMap = this.gameState.blockers;
        const involvedCreatureIds = new Set([...Object.keys(attackersMap), ...Object.keys(blockersMap)]);

        // Get involved creature details (battlefield state + base card data)
        const involvedCreatures: { [id: GameObjectId]: BattlefieldCard & Card } = {};
        this.gameState.players.forEach(player => {
            player.battlefield.creatures.forEach(bfCard => {
                if (involvedCreatureIds.has(bfCard.objectId)) {
                    const baseCard = this.gameState.gameObjects[bfCard.objectId];
                    if (baseCard) {
                        involvedCreatures[bfCard.objectId] = { ...bfCard, ...baseCard };
                    }
                }
            });
        });

        // Determine which creatures deal damage this step
        const dealingDamageIds = Object.keys(involvedCreatures).filter(id => {
            const creature = involvedCreatures[id];
            const dealsFirstStrike = creature.keywords?.includes('First Strike'); // Assuming keywords exist
            return isFirstStrike ? dealsFirstStrike : !dealsFirstStrike || creature.keywords?.includes('Double Strike'); // First Strike step: only First Strike creatures, Normal step: all non-First Strike creatures plus Double Strike
        });

        // Calculate damage assignments
        const damageAssignments: { targetId: GameObjectId | PlayerId, amount: number, sourceId: GameObjectId }[] = [];

        // Attackers assign damage
        for (const attackerId of Object.keys(attackersMap)) {
            if (!dealingDamageIds.includes(attackerId)) continue; // Skip if not dealing damage this step

            const attacker = involvedCreatures[attackerId];
            if (!attacker) continue; // Should not happen
            const attackerPower = attacker.power ?? 0;
            const defendingPlayerId = attackersMap[attackerId];
            const attackerHasTrample = attacker.keywords?.includes('Trample'); // Check for Trample

            // Find all blockers for this attacker
            const blockers = Object.entries(blockersMap)
                .filter(([_, assignedAttackerId]) => assignedAttackerId === attackerId)
                .map(([blockerId, _]) => involvedCreatures[blockerId])
                .filter(b => !!b); // Filter out any potential undefined blockers

            if (blockers.length > 0) {
                // Attacker is blocked - assign damage to blocker(s)
                // Basic assignment: deals damage sequentially until attacker's power is used up or blockers are dead
                let remainingAttackerPower = attackerPower;
                for (const blocker of blockers) { // Iterate through assigned blockers
                    if (remainingAttackerPower <= 0) break;

                    const blockerToughness = blocker.toughness ?? 0;
                    // Damage needed to destroy (considering already marked damage)
                    const lethalDamageToBlocker = Math.max(0, blockerToughness - blocker.damageMarked);
                    const damageToAssignToBlocker = Math.min(remainingAttackerPower, lethalDamageToBlocker);

                    if (damageToAssignToBlocker > 0) {
                        damageAssignments.push({ targetId: blocker.objectId, amount: damageToAssignToBlocker, sourceId: attackerId });
                        console.log(` > Attacker ${attackerId} (${attackerPower} power) assigns ${damageToAssignToBlocker} damage to Blocker ${blocker.objectId}.`);
                        remainingAttackerPower -= damageToAssignToBlocker;
                    }
                }

                // Trample damage - excess damage goes to player if attacker has Trample
                if (attackerHasTrample && remainingAttackerPower > 0) {
                    damageAssignments.push({ targetId: defendingPlayerId, amount: remainingAttackerPower, sourceId: attackerId });
                    console.log(` > Attacker ${attackerId} (Trample) assigns ${remainingAttackerPower} excess damage to Player ${defendingPlayerId}.`);
                }
            } else {
                // Attacker is unblocked - assign damage to player
                damageAssignments.push({ targetId: defendingPlayerId, amount: attackerPower, sourceId: attackerId });
                console.log(` > Attacker ${attackerId} (${attackerPower} power) assigns ${attackerPower} damage to Player ${defendingPlayerId}.`);
            }
        }

        // Blockers assign damage
        for (const blockerId of Object.keys(blockersMap)) {
            if (!dealingDamageIds.includes(blockerId)) continue; // Skip if not dealing damage this step

            const blocker = involvedCreatures[blockerId];
            if (!blocker) continue; // Should not happen
            const blockerPower = blocker.power ?? 0;
            const attackerIdBlocked = blockersMap[blockerId];
            const attackerBlocked = involvedCreatures[attackerIdBlocked];

            if (attackerBlocked) {
                damageAssignments.push({ targetId: attackerIdBlocked, amount: blockerPower, sourceId: blockerId });
                console.log(` > Blocker ${blockerId} (${blockerPower} power) assigns ${blockerPower} damage to Attacker ${attackerIdBlocked}.`);
            }
        }

        // Apply the calculated damage
        console.log(`Applying ${damageAssignments.length} damage assignments...`);
        damageAssignments.forEach(({ targetId, amount, sourceId }) => {
            const targetPlayerState = this.gameState.players.find(p => p.playerId === targetId);
            if (targetPlayerState) {
                // Target is a player
                targetPlayerState.life -= amount;
                console.log(`  - Player ${targetId} takes ${amount} damage from ${sourceId}. New life: ${targetPlayerState.life}`);
            } else {
                // Target is a creature
                let targetCreature: BattlefieldCard | undefined;
                for(const player of this.gameState.players) {
                    targetCreature = player.battlefield.creatures.find(c => c.objectId === targetId);
                    if (targetCreature) break;
                }

                if (targetCreature) {
                    targetCreature.damageMarked += amount;
                    console.log(`  - Creature ${targetId} takes ${amount} damage from ${sourceId}. Total marked: ${targetCreature.damageMarked}`);
                } else {
                    console.warn(`  - Damage target ${targetId} not found (player or creature).`);
                }
            }
        });
        console.log("Damage assignment complete for this step.");
    }

    // --- State-Based Actions --- //

    private _checkStateBasedActions(): boolean { // Return boolean indicating if any SBAs were performed
        console.log("Checking State-Based Actions...");
        let sbAsPerformedThisCheck = false; // Tracks if *any* SBA happened during the entire check cycle
        let sbAsPerformedThisPass = false; // Tracks if an SBA happened in the *current* loop pass
        let loopGuard = 0; // Prevent infinite loops
        const maxLoops = 10; // Arbitrary limit

        do {
            sbAsPerformedThisPass = false; // Reset flag for this pass
            loopGuard++;
            if (loopGuard > maxLoops) {
                 console.error("SBA check loop limit exceeded!");
                 break;
            }

            // Check if game already ended in a previous pass or step
            if (this.gameState.winner) {
                 console.log("SBA Check: Game already ended.");
                 break; // Stop checking SBAs if a winner is determined
            }

            const creaturesToDestroy: { playerId: PlayerId, creatureId: GameObjectId }[] = [];

            // Check players
            for (const playerState of this.gameState.players) {
                 // a) Check for player life loss (Game End Condition)
                 if (playerState.life <= 0 && !this.gameState.winner) { // Check !this.gameState.winner handles simultaneous loss (first check wins for now)
                    console.log(`SBA: Player ${playerState.playerId} has ${playerState.life} life or less.`);
                    // Determine opponent
                    const opponent = this.gameState.players.find(p => p.playerId !== playerState.playerId);
                    if (opponent) {
                        this.gameState.winner = opponent.playerId;
                         console.log(`GAME OVER: Player ${opponent.playerId} wins!`);
                         sbAsPerformedThisCheck = true; // Game ending is an SBA
                         sbAsPerformedThisPass = true; // Mark SBA performed this pass
                         break; // Stop checking further SBAs for this pass once game ends
                    } else {
                         console.error("Could not determine opponent to declare winner."); // Should not happen in 2-player game
                    }
                 }

                 // b) Check creatures for lethal damage
                 for (const creature of playerState.battlefield.creatures) {
                    const baseCard = this.gameState.gameObjects[creature.objectId];
                    const toughness = baseCard?.toughness ?? 0;
                    if (creature.damageMarked > 0 && creature.damageMarked >= toughness) {
                         console.log(`SBA: Creature ${creature.objectId} (${baseCard?.name}) has lethal damage (${creature.damageMarked} >= ${toughness}). Marked for destruction.`);
                         creaturesToDestroy.push({ playerId: playerState.playerId, creatureId: creature.objectId });
                         sbAsPerformedThisCheck = true;
                         sbAsPerformedThisPass = true;
                    }
                 }

                  // TODO: Add other SBAs (e.g., legend rule, 0 toughness creatures)
             }
 
            // Apply destruction
            if (creaturesToDestroy.length > 0) {
                console.log(`Applying destruction for ${creaturesToDestroy.length} creatures...`);
                for (const { playerId, creatureId } of creaturesToDestroy) {
                     const playerState = this.gameState.players.find(p => p.playerId === playerId);
                     if (playerState) {
                         const creatureIndex = playerState.battlefield.creatures.findIndex(c => c.objectId === creatureId);
                         if (creatureIndex > -1) {
                             const destroyedCreature = playerState.battlefield.creatures.splice(creatureIndex, 1)[0];
                             playerState.graveyard.push(destroyedCreature.objectId); // Move ID to graveyard
                             // Note: BattlefieldCard state like counters/damage is lost here.
                             // A more robust implementation might keep the BattlefieldCard instance
                             // in the graveyard or use a different structure.
                             console.log(`  - Moved ${creatureId} from Player ${playerId}'s battlefield to graveyard.`);
                         } else {
                             console.warn(`  - Creature ${creatureId} marked for destruction not found on Player ${playerId}'s battlefield.`);
                         }
                    }
                }
            }

        } while (sbAsPerformedThisPass && loopGuard <= maxLoops);

        if (loopGuard > 1) {
             console.log(`SBA checks completed after ${loopGuard -1} passes.`);
        } else {
             console.log("No SBAs performed.");
        }
        
        return sbAsPerformedThisCheck;
    }

    // --- Helper Methods --- //

    private _doesAnyCreatureHaveKeyword(keyword: Keyword): boolean {
        for (const player of this.gameState.players) {
            for (const creature of player.battlefield.creatures) {
                 const baseCard = this.gameState.gameObjects[creature.objectId];
                 if (baseCard?.keywords?.includes(keyword)) {
                     return true;
                 }
            }
        }
        return false;
    }

    private _clearCombatState(): void {
        console.log("Clearing combat state (attackers/blockers).");
        this.gameState.attackers = {};
        this.gameState.blockers = {};
    }
    
    private _advanceTurn(): void {
        console.log("Advancing turn...");
        // Change active player
        const currentActivePlayerIndex = this.gameState.players.findIndex(p => p.playerId === this.gameState.activePlayerId);
        const nextActivePlayerIndex = (currentActivePlayerIndex + 1) % this.gameState.players.length;
        this.gameState.activePlayerId = this.gameState.players[nextActivePlayerIndex].playerId;
        this.gameState.turnNumber++;

        // Set phase and step to the beginning of the new turn
        this.gameState.currentPhase = 'BEGIN';
        this.gameState.currentStep = 'UNTAP';
        console.log(`New Turn: ${this.gameState.turnNumber}. Active Player: ${this.gameState.activePlayerId}. Phase: ${this.gameState.currentPhase}, Step: ${this.gameState.currentStep}`);

        // Perform Untap actions for the new active player
        const activePlayerUntap = this.gameState.players.find(p => p.playerId === this.gameState.activePlayerId);
        if (activePlayerUntap) {
            console.log(`Untapping permanents for Player ${this.gameState.activePlayerId}...`);
            activePlayerUntap.battlefield.creatures.forEach(c => c.isTapped = false);
            // Untap other permanents (Lands, Artifacts) - TODO
            console.log("Permanents untapped.");
            // Reset 'land played' flag
            activePlayerUntap.hasPlayedResourceThisTurn = false;
        }

        // Grant priority to the new active player for the Untap step
        this.grantPriority(this.gameState.activePlayerId);
    }

    public passPriority(): void {
        const currentPriorityPlayerId = this.gameState.priorityPlayerId;
        const activePlayerId = this.gameState.activePlayerId;
        const nonActivePlayerId = this.gameState.players.find(p => p.playerId !== activePlayerId)?.playerId;

        if (!nonActivePlayerId) {
            console.error("Could not determine non-active player.");
            return; // Should not happen in a 2-player game
        }

        console.log(`Player ${currentPriorityPlayerId} passes priority.`);

        if (currentPriorityPlayerId === activePlayerId) {
            // Active player passed, grant priority to non-active player
            this.grantPriority(nonActivePlayerId);
        } else {
            // Non-active player passed (meaning both players passed consecutively)
            // Check the stack
            if (this.gameState.stack.length === 0) {
                // Stack is empty, advance the game state
                console.log("Both players passed, stack empty. Advancing step.");
                this.advanceStep();
            } else {
                // Stack is not empty, resolve the top item
                console.log("Both players passed, resolving stack item.");
                // TODO: Implement stack resolution logic
                // const resolvedItem = this.gameState.stack.pop(); 
                // this.resolveStackItem(resolvedItem);
                // After resolution, active player gets priority again
                this.grantPriority(activePlayerId);
            }
        }
    }

    public getGameState(): GameState {
        return this.gameState;
    }
}
