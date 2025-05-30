import { EventType } from '../interfaces/gameState';
export class TurnManager {
    constructor(gameState, engine, resourceManager, stateManager) {
        this.combatManager = null; // Can be null if not set immediately
        this.gameState = gameState;
        this.engine = engine;
        this.resourceManager = resourceManager;
        this.stateManager = stateManager;
    }
    setCombatManager(combatManager) {
        this.combatManager = combatManager;
    }
    getCurrentPhaseSteps() {
        const currentPhase = this.gameState.currentPhase;
        if (currentPhase === 'MAIN') {
            // Differentiate between first and second main phase based on current step
            if (this.gameState.currentStep === 'MAIN_POST') {
                return ['MAIN_POST']; // Only MAIN_POST if we are in it
            }
            else {
                return TurnManager.stepOrder['MAIN'];
            }
        }
        return TurnManager.stepOrder[currentPhase] || [];
    }
    // Grant priority to a player. Does not reset pass count by itself.
    grantPriority(playerId) {
        console.log(`TurnManager: Granting priority to player ${playerId}.`);
        this.gameState.priorityPlayerId = playerId;
        // Consecutive passes are reset by calling resetConsecutivePasses() explicitly 
        // after a game state change (stack resolution, step/phase advance).
        // TODO: Emit event for priority change
    }
    // Resets the consecutive pass counter.
    resetConsecutivePasses() {
        console.log('TurnManager: Resetting consecutive priority passes to 0.');
        this.gameState.consecutivePriorityPasses = 0;
    }
    advanceTurnState() {
        console.log(`Advancing turn state from ${this.gameState.currentPhase} - ${this.gameState.currentStep}`);
        this.gameState.priorityPlayerId = null; // Clear priority during transition
        // --- State-Based Actions Check before advancing step/phase --- 
        // Rule 117.5. Each time a player would get priority, the game first performs all applicable state-based actions
        // (see rule 704), then rule 405.6g is applied, then triggered abilities are put on the stack (see rule 603,
        // “Handling Triggered Abilities”). Then the player gets priority.
        const gameEndedAfterSBA = this.stateManager.checkStateBasedActions();
        if (gameEndedAfterSBA) {
            console.log("TurnManager: Game ended due to SBAs before advancing turn state.");
            return; // Game over, no further advancement.
        }
        // TODO: Handle triggered abilities that might go on stack now.
        this.advanceStep();
        // After advancing step (which might advance phase/turn), grant priority
        // unless it's a step where no player gets priority (e.g., UNTAP, CLEANUP completion without triggers)
        if (this.gameState.currentStep !== 'UNTAP' && !(this.gameState.currentStep === 'CLEANUP' && !this.stateManager.cleanupRequiresPriority())) {
            this.grantPriority(this.gameState.activePlayerId);
            this.resetConsecutivePasses(); // Reset consecutive passes after granting priority
        }
    }
    advanceStep() {
        // Clear mana pools at the end of *most* steps/phases (Rule 500.4)
        // Exception: Mana pools don't empty as steps and phases end during the combat phase (500.4)
        // This is often done at the *end* of a step, before moving to the next.
        // Let's ensure it happens before step-specific actions of the *new* step if it's a phase change.
        const currentPhaseSteps = this.getCurrentPhaseSteps();
        let currentStepIndex = currentPhaseSteps.indexOf(this.gameState.currentStep);
        if (currentStepIndex === -1) {
            console.error(`Critical Error: Current step ${this.gameState.currentStep} not found in phase ${this.gameState.currentPhase}. Resetting to MAIN_PRE.`);
            this.gameState.currentPhase = 'MAIN';
            this.gameState.currentStep = 'MAIN_PRE';
            // currentStepIndex = 0; // No longer strictly needed here if we proceed to performStepEntryActions
            // but getCurrentPhaseSteps() will be called again by performStepEntryActions's internal logic if it relies on it.
            // For clarity, let's ensure the state is set, and performStepEntryActions will use the new state.
            // Potentially throw an error or reset to a safe state
        }
        // --- Actions at the END of the current step, before moving to the next ---
        if (this.gameState.currentPhase !== 'COMBAT' && this.gameState.currentStep !== 'UNTAP') {
            // Mana pools empty at the end of each step, except for steps in the combat phase and the untap step.
            console.log(`Clearing mana pools at end of ${this.gameState.currentStep}`);
            this.gameState.players.forEach(player => {
                this.resourceManager.clearManaPool(player.playerId);
            });
        }
        if (currentStepIndex < currentPhaseSteps.length - 1) {
            // Advance to the next step in the current phase
            this.gameState.currentStep = currentPhaseSteps[currentStepIndex + 1];
            console.log(`Advanced to step: ${this.gameState.currentPhase} - ${this.gameState.currentStep}`);
        }
        else {
            // End of current phase, advance to the next phase
            this.advancePhase();
        }
        // --- Perform Actions for the START of the NEW step/phase ---
        this.performStepEntryActions(this.gameState.currentStep, this.gameState.currentPhase);
    }
    advancePhase() {
        const currentPhase = this.gameState.currentPhase;
        let currentPhaseActualIndex = TurnManager.phaseOrder.indexOf(currentPhase);
        // Special handling for the two Main Phases
        if (currentPhase === 'MAIN') {
            const combatIndex = TurnManager.phaseOrder.indexOf('COMBAT'); // Should be 2
            // If current step is MAIN_PRE (or similar first main phase step) and we are at the first 'MAIN' in phaseOrder
            if (this.gameState.currentStep === 'MAIN_PRE' && currentPhaseActualIndex === TurnManager.phaseOrder.indexOf('MAIN')) {
                // We are moving from the first Main phase
            }
            else {
                // We are moving from the second Main phase (MAIN_POST)
                // Find the index of the second 'MAIN' in phaseOrder
                const secondMainIndex = TurnManager.phaseOrder.indexOf('MAIN', combatIndex + 1);
                if (secondMainIndex !== -1) {
                    currentPhaseActualIndex = secondMainIndex;
                }
            }
        }
        const nextPhaseIndex = currentPhaseActualIndex + 1;
        if (nextPhaseIndex >= TurnManager.phaseOrder.length) {
            // End of the final phase (End/Cleanup), start the next turn
            this.nextTurn();
        }
        else {
            // Advance to the next phase
            this.gameState.currentPhase = TurnManager.phaseOrder[nextPhaseIndex];
            const newPhaseSteps = this.getCurrentPhaseStepsForPhase(this.gameState.currentPhase);
            if (!newPhaseSteps || newPhaseSteps.length === 0) {
                console.error(`Error: No steps found for new phase ${this.gameState.currentPhase}`);
                this.gameState.currentPhase = 'MAIN'; // Fallback
                this.gameState.currentStep = 'MAIN_PRE';
                return;
            }
            this.gameState.currentStep = newPhaseSteps[0];
            console.log(`Advanced to Phase: ${this.gameState.currentPhase}, Step: ${this.gameState.currentStep}`);
            // If moving to Combat phase, mana pools don't empty until end of Combat phase.
            // If moving to other phases, mana pools typically empty at end of previous step/phase.
            // This is handled in advanceStep now.
        }
    }
    getCurrentPhaseStepsForPhase(phase) {
        if (phase === 'MAIN')
            return TurnManager.stepOrder['MAIN'];
        return TurnManager.stepOrder[phase] || [];
    }
    nextTurn() {
        const nextTurnNumber = this.gameState.turnNumber + 1;
        console.log(`--- Advancing to Turn ${nextTurnNumber} ---`);
        // 1. Switch Active Player
        this.gameState.activePlayerId = this.engine.getOpponentId(this.gameState.activePlayerId);
        console.log(`Active player is now: ${this.gameState.activePlayerId}`);
        // 2. Increment Turn Counter
        this.gameState.turnNumber = nextTurnNumber;
        // 3. Reset Phase and Step to Beginning
        this.gameState.currentPhase = 'BEGIN';
        this.gameState.currentStep = 'UNTAP';
        // 4. Reset 'has played resource' flag for the new active player
        const activePlayerState = this.engine.getPlayerState(this.gameState.activePlayerId);
        if (activePlayerState) {
            activePlayerState.hasPlayedResourceThisTurn = false;
            activePlayerState.landPlayedThisTurn = false; // Also reset this if distinct
        }
        console.log(`Starting Turn ${this.gameState.turnNumber}. Active Player: ${this.gameState.activePlayerId}. Phase: ${this.gameState.currentPhase}, Step: ${this.gameState.currentStep}`);
    }
    performStepEntryActions(step, phase) {
        const activePlayerId = this.gameState.activePlayerId;
        const activePlayer = this.engine.getPlayerState(activePlayerId);
        if (!activePlayer) {
            console.error(`TurnManager Error: Active player ${activePlayerId} not found during step entry actions.`);
            return;
        }
        console.log(`TurnManager: Performing entry actions for ${phase} - ${step} for player ${activePlayerId}`);
        switch (step) {
            case 'UNTAP':
                console.log(`TurnManager: --- UNTAP STEP for ${activePlayerId} ---`);
                this.untapStepAction(activePlayerId);
                // Reset turn-based flags
                activePlayer.hasPlayedResourceThisTurn = false;
                activePlayer.landPlayedThisTurn = false; // Assuming this is also reset here
                console.log(`TurnManager: Reset hasPlayedResourceThisTurn and landPlayedThisTurn for player ${activePlayerId}.`);
                // No priority is received during the untap step automatically.
                // The game proceeds to the upkeep step.
                this.advanceStep(); // Automatically move to upkeep after untap actions
                break;
            case 'UPKEEP':
                console.log("UPKEEP step: Handling upkeep triggers (placeholder). Active player will get priority.");
                // TODO: Handle upkeep triggers. They go on stack. Then AP gets priority.
                this.stateManager.checkStateBasedActions();
                break;
            case 'DRAW':
                this.drawStepAction(activePlayerId);
                this.stateManager.checkStateBasedActions(); // Check SBAs (e.g. drawing from empty library)
                // TODO: Handle triggered abilities from drawing. They go on stack. Then AP gets priority.
                break;
            case 'MAIN_PRE':
            case 'MAIN_POST':
                console.log(`${step}: Active player will get priority.`);
                this.stateManager.checkStateBasedActions();
                break;
            case 'COMBAT_BEGIN':
                console.log("Beginning of Combat step. Active player will get priority.");
                this.stateManager.checkStateBasedActions();
                break;
            case 'DECLARE_ATTACKERS':
                console.log("Declare Attackers step. Active player declares attackers, then gets priority.");
                // Actual declaration is an action. AP gets priority to declare.
                this.stateManager.checkStateBasedActions();
                break;
            case 'DECLARE_BLOCKERS':
                console.log("Declare Blockers step. Non-active player declares blockers, then AP gets priority.");
                // Actual declaration is an action. NAP gets priority to declare.
                this.stateManager.checkStateBasedActions();
                break;
            case 'FIRST_STRIKE_DAMAGE':
                console.log("First Strike Damage step.");
                if (this.combatManager?.checkKeywords('First Strike', 'Double Strike')) {
                    console.log("TurnManager: Assigning First Strike damage.");
                    this.combatManager?.assignCombatDamage(true); // true for first strike
                    this.stateManager.checkStateBasedActions(); // Check for deaths etc.
                    // TODO: Handle triggers from damage/death. Then AP gets priority.
                }
                else {
                    console.log("Skipping First Strike damage as no creatures have First/Double Strike.");
                }
                break;
            case 'COMBAT_DAMAGE':
                console.log("Combat Damage step.");
                // Check if any creatures are still in combat that would deal normal damage
                // This check might be more sophisticated in CombatManager
                if (Object.keys(this.gameState.attackers).length > 0) { // Simplified check
                    console.log("TurnManager: Assigning normal Combat damage.");
                    this.combatManager?.assignCombatDamage(false); // false for regular combat damage
                    this.stateManager.checkStateBasedActions();
                    // TODO: Handle triggers from damage/death. Then AP gets priority.
                }
                else {
                    console.log("Skipping normal Combat Damage as no creatures in combat or all dealt first strike.");
                }
                break;
            case 'COMBAT_END':
                console.log("End of Combat step. Active player will get priority.");
                this.combatManager?.cleanupCombat();
                this.stateManager.checkStateBasedActions();
                break;
            case 'END_STEP':
                console.log("End Step. 'At the beginning of the end step' triggers happen, then AP gets priority.");
                // TODO: Handle end step triggers. They go on stack. Then AP gets priority.
                this.stateManager.checkStateBasedActions();
                break;
            case 'CLEANUP':
                this.cleanupStepAction(activePlayerId);
                // If SBAs or triggers occurred, AP gets priority and another cleanup step happens.
                // This is handled by the loop in advanceTurnState via cleanupRequiresPriority().
                break;
            default:
                console.log(`No specific entry actions for step: ${step}. Active player usually gets priority.`);
                this.stateManager.checkStateBasedActions();
                break;
        }
    }
    untapStepAction(playerId) {
        console.log(`Executing Untap Step for Player ${playerId}`);
        this.resourceManager.untapPermanents(playerId);
        // Summoning sickness wears off at the beginning of the turn, before untap.
        // This should be handled in nextTurn() or as part of player state reset for the turn.
        const playerState = this.engine.getPlayerState(playerId);
        if (playerState) {
            playerState.battlefield.creatures.forEach(c => {
                if (c.summoningSickness) {
                    // More precise: sickness wears off if it was continuously controlled since start of *this* turn.
                    // For simplicity now, just remove it if it's their untap step.
                    c.summoningSickness = false;
                }
            });
        }
    }
    drawStepAction(playerId) {
        console.log(`Draw Step for Player ${playerId}`);
        // First turn draw is skipped for the starting player (Magic rule)
        if (this.gameState.turnNumber === 1 && playerId === this.gameState.startingPlayerId) {
            console.log(`Player ${playerId} skips draw on turn 1.`);
            return;
        }
        this.engine.playerDrawCard(playerId);
    }
    cleanupStepAction(activePlayerId) {
        console.log("Cleanup Step actions for player: ", activePlayerId);
        const activePlayer = this.engine.getPlayerState(activePlayerId);
        if (!activePlayer)
            return;
        // 1. Active player discards down to maximum hand size (usually 7)
        const maxHandSize = activePlayer.maxHandSize ?? 7;
        while (activePlayer.hand.length > maxHandSize) {
            // TODO: Implement discard choice mechanism. For now, discard last.
            const cardToDiscardInstanceId = activePlayer.hand.pop();
            if (cardToDiscardInstanceId) {
                console.log(`Player ${activePlayer.playerId} discarding ${cardToDiscardInstanceId} due to hand size.`);
                // Move card to graveyard
                this.engine.moveCardZone(cardToDiscardInstanceId, 'hand', 'graveyard', activePlayer.playerId);
            }
        }
        // 2. Damage marked on permanents wears off, and “until end of turn” and “this turn” effects end.
        this.gameState.players.forEach(player => {
            Object.values(player.battlefield).flat().forEach((card) => {
                if (card.damageMarked > 0) {
                    console.log(`Removing ${card.damageMarked} damage from ${card.name} (${card.instanceId})`);
                    card.damageMarked = 0;
                }
            });
            // TODO: Remove temporary effects (needs effect tracking system)
        });
        console.log("'Until end of turn' effects end. Damage removed from permanents.");
        // 3. Check State-Based Actions. If any occur, players get priority, and another cleanup step happens.
        // This is handled by the loop in advanceTurnState via cleanupRequiresPriority().
        this.stateManager.checkStateBasedActions();
        // TODO: Handle triggered abilities that trigger here.
    }
    passPriority(playerId) {
        if (this.gameState.priorityPlayerId !== playerId) {
            console.warn(`Player ${playerId} tried to pass priority but does not have it.`);
            return;
        }
        console.log(`Player ${playerId} passes priority.`);
        this.gameState.consecutivePriorityPasses++;
        if (this.gameState.stack.length > 0) {
            // Stack is not empty
            if (this.gameState.consecutivePriorityPasses >= this.gameState.players.length) { // >= 2 for 2 players
                // All players passed, resolve top of stack
                console.log("All players passed with items on stack. Resolving top item...");
                this.engine.actionManager.resolveTopStackItem(); // Call ActionManager to resolve
                // After resolution, check SBAs, then active player gets priority.
                const gameEnded = this.stateManager.checkStateBasedActions();
                if (!gameEnded) {
                    // TODO: Handle triggered abilities from resolution/SBAs
                    this.grantPriority(this.gameState.activePlayerId);
                    this.resetConsecutivePasses(); // Reset consecutive passes after granting priority for new state
                }
                else {
                    console.log("Game ended after stack resolution and SBAs.");
                }
            }
            else {
                // Not all players passed, give priority to the next player in turn order (opponent in 2P game)
                const opponentId = this.engine.getOpponentId(playerId);
                this.grantPriority(opponentId); // This now only sets priorityPlayerId
                // this.resetConsecutivePasses(); // REMOVED: Do not reset passes here
            }
        }
        else {
            // Stack is empty
            if (this.gameState.consecutivePriorityPasses >= this.gameState.players.length) {
                // All players passed on an empty stack, advance turn state
                console.log("All players passed on an empty stack. Advancing turn state...");
                this.advanceTurnState(); // This will reset passes and grant priority for the new step/phase (or not, for UNTAP/CLEANUP)
            }
            else {
                // Not all players passed, give priority to the next player
                const opponentId = this.engine.getOpponentId(playerId);
                this.grantPriority(opponentId); // This now only sets priorityPlayerId
                // this.resetConsecutivePasses(); // REMOVED: Do not reset passes here
            }
        }
    }
    /**
     * Allows the active player to explicitly pass their turn.
     * This is different from passing priority. Passing the turn moves directly to the next player's turn.
     * This is generally used when a player has no more actions in their main phase and the stack is empty.
     * @param playerId The ID of the player attempting to pass the turn.
     * @returns true if the turn was successfully passed, false otherwise.
     */
    passTurn(playerId) {
        console.log(`TurnManager: Player ${playerId} attempting to pass turn.`);
        // 1. Validate it's the player's turn
        if (this.gameState.activePlayerId !== playerId) {
            console.warn(`TurnManager: Player ${playerId} cannot pass turn, it is not their turn.`);
            return false;
        }
        // Optional: Add more conditions if needed, e.g., player must have priority, stack must be empty.
        // For now, we allow passing the turn if it's the active player's turn.
        // Example:
        // if (this.gameState.priorityPlayerId !== playerId) {
        //     console.warn(`TurnManager: Player ${playerId} cannot pass turn, they do not have priority.`);
        //     return false;
        // }
        // if (this.gameState.stack.length > 0) {
        //     console.warn(`TurnManager: Player ${playerId} cannot pass turn, the stack is not empty.`);
        //     return false;
        // }
        console.log(`TurnManager: Player ${playerId} is passing the turn.`);
        // 2. Proceed to the next turn using the existing nextTurn logic.
        // nextTurn handles phase transitions, active player switching, etc.
        this.nextTurn();
        // Emit a game event for turn passed
        // Ensure EventType.TURN_PASSED is defined in your interfaces/gameState.ts
        this.engine.emitGameEvent(EventType.TURN_PASSED, {
            previousPlayerId: playerId,
            newActivePlayerId: this.gameState.activePlayerId,
            newTurnNumber: this.gameState.turnNumber
            // Consider adding gameState: this.gameState if clients need the full state update immediately from this event
        });
        return true;
    }
}
// Standard MTG turn structure
TurnManager.phaseOrder = ['BEGIN', 'MAIN', 'COMBAT', 'MAIN', 'END'];
TurnManager.stepOrder = {
    'BEGIN': ['UNTAP', 'UPKEEP', 'DRAW'],
    'MAIN': ['MAIN_PRE'], // Represents the first main phase (MAIN_POST for second)
    'COMBAT': ['COMBAT_BEGIN', 'DECLARE_ATTACKERS', 'DECLARE_BLOCKERS', 'FIRST_STRIKE_DAMAGE', 'COMBAT_DAMAGE', 'COMBAT_END'],
    'END': ['END_STEP', 'CLEANUP'],
};
