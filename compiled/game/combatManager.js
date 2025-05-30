export class CombatManager {
    constructor(gameState, turnManager, // Accept null
    stateManager, validateFn, getCardFn, findBattlefieldFn, hasKeywordFn) {
        this.gameState = gameState;
        this.turnManager = turnManager;
        this.stateManager = stateManager;
        this.validatePlayerActionFn = validateFn;
        this.getCardFromInstanceIdFn = getCardFn;
        this.findBattlefieldCardFn = findBattlefieldFn;
        this.hasKeywordFn = hasKeywordFn;
    }
    // Setter for TurnManager dependency
    setTurnManager(turnManager) {
        this.turnManager = turnManager;
    }
    // Placeholder for logic when the active player declares attackers
    declareAttackers(playerId, attackers) {
        console.log(`CombatManager: Player ${playerId} declares attackers.`);
        if (!this.validatePlayerActionFn(playerId, 'DECLARE_ATTACKERS')) {
            return; // Validation failed (wrong player or step)
        }
        // TODO: More detailed validation (are creatures? controlled by player? untapped? valid targets?)
        // Example validation:
        for (const attackerId in attackers) {
            const card = this.getCardFromInstanceIdFn(attackerId);
            const battlefieldCard = this.findBattlefieldCardFn(attackerId);
            // Basic validation: exists, is a creature. Control is implicitly checked by finding it on player's battlefield.
            if (!card || card.type !== 'Creature' || !battlefieldCard) {
                console.error(`Invalid attacker: ${attackerId}`);
                // TODO: Should this reject the whole action or just the invalid attacker?
                return;
            }
            if (battlefieldCard?.tapped) {
                console.error(`Invalid attacker: ${attackerId} is tapped.`);
                return;
            }
            // Check for summoning sickness
            if (battlefieldCard?.summoningSickness) {
                console.error(`Invalid attacker: ${attackerId} (${card.name}) has summoning sickness.`);
                // TODO: Decide if this rejects the whole attack or just this attacker
                // For now, let's reject the whole attack for simplicity in this phase
                return;
            }
            // TODO: Check if the target player/planeswalker is valid
        }
        // Tap attackers unless they have Vigilance
        for (const attackerId in attackers) {
            const battlefieldCard = this.findBattlefieldCardFn(attackerId);
            if (battlefieldCard) { // Should always be true due to prior validation
                const hasVigilance = this.hasKeywordFn(attackerId, 'Vigilance');
                if (!hasVigilance) {
                    battlefieldCard.tapped = true;
                    console.log(`CombatManager: Attacker ${attackerId} tapped.`);
                }
                else {
                    console.log(`CombatManager: Attacker ${attackerId} has Vigilance, does not tap.`);
                }
            }
        }
        this.gameState.attackers = attackers; // Update gameState
        console.log("Attackers declared:", attackers);
        // After declaring, priority passes back to the active player
        this.turnManager.grantPriority(playerId); // Use non-null assertion
    }
    // Placeholder for logic when the defending player declares blockers
    declareBlockers(playerId, blockers) {
        console.log(`CombatManager: Player ${playerId} declares blockers.`);
        if (!this.validatePlayerActionFn(playerId, 'DECLARE_BLOCKERS')) {
            return; // Validation failed (wrong player or step)
        }
        if (playerId === this.gameState.activePlayerId) {
            console.error("Error: Active player cannot declare blockers.");
            return;
        }
        // TODO: More detailed validation
        for (const blockerId in blockers) {
            const blockedAttackerId = blockers[blockerId];
            const blockerCard = this.getCardFromInstanceIdFn(blockerId);
            const blockerBattlefieldCard = this.findBattlefieldCardFn(blockerId);
            const attackerBattlefieldCard = this.findBattlefieldCardFn(blockedAttackerId);
            // Basic validation: exists, is a creature controlled by the player.
            if (!blockerCard || blockerCard.type !== 'Creature' || !blockerBattlefieldCard) {
                console.error(`Invalid blocker: ${blockerId} is not a valid creature for player ${playerId}.`);
                return; // Reject action
            }
            if (blockerBattlefieldCard?.tapped) {
                console.error(`Invalid blocker: ${blockerId} is tapped.`);
                return; // Reject action
            }
            if (!attackerBattlefieldCard || !this.gameState.attackers[blockedAttackerId]) {
                console.error(`Invalid blocker: Cannot block ${blockedAttackerId} as it's not a declared attacker.`);
                return; // Reject action
            }
            // Flying check
            const attackerHasFlying = this.hasKeywordFn(blockedAttackerId, 'Flying');
            if (attackerHasFlying) {
                const blockerHasFlying = this.hasKeywordFn(blockerId, 'Flying');
                const blockerHasReach = this.hasKeywordFn(blockerId, 'Reach');
                if (!blockerHasFlying && !blockerHasReach) {
                    const attackerCard = this.getCardFromInstanceIdFn(blockedAttackerId);
                    console.error(`Invalid block: ${blockerCard?.name} (${blockerId}) cannot block ${attackerCard?.name} (${blockedAttackerId}) because it has Flying, and the blocker lacks Flying or Reach.`);
                    // TODO: Decide if this rejects the whole block declaration or just this specific block.
                    // For now, rejecting the whole declaration for simplicity.
                    return; // Reject action
                }
            }
            // TODO: Add checks for other keyword interactions like 'Cannot Block'
        }
        this.gameState.blockers = blockers; // Update gameState
        console.log("Blockers declared:", blockers);
        // After blockers, priority passes back to the active player
        this.turnManager.grantPriority(this.gameState.activePlayerId); // Use non-null assertion
    }
    // Needs to handle first strike and regular damage steps
    assignCombatDamage(isFirstStrikeStep) {
        console.log(`Assigning combat damage (First Strike: ${isFirstStrikeStep})...`);
        const attackers = this.gameState.attackers;
        const blockers = this.gameState.blockers;
        Object.keys(attackers).forEach(attackerId => {
            const attackerBattlefieldCard = this.findBattlefieldCardFn(attackerId);
            const attackerCard = this.getCardFromInstanceIdFn(attackerId);
            if (!attackerBattlefieldCard || !attackerCard || attackerCard.type !== 'Creature')
                return;
            // Determine if this creature deals damage in this step
            const hasFirstStrike = this.hasKeywordFn(attackerId, 'First Strike');
            const hasDoubleStrike = this.hasKeywordFn(attackerId, 'Double Strike');
            const dealsDamageThisStep = (isFirstStrikeStep && (hasFirstStrike || hasDoubleStrike)) || (!isFirstStrikeStep && !hasFirstStrike) || (!isFirstStrikeStep && hasDoubleStrike);
            if (!dealsDamageThisStep)
                return;
            let damageToDeal = attackerCard.attack ?? 0;
            const targetPlayerId = attackers[attackerId];
            let blocked = false;
            // Find blockers assigned to this attacker
            Object.keys(blockers).forEach(blockerId => {
                if (blockers[blockerId] === attackerId) {
                    blocked = true;
                    const blockerBattlefieldCard = this.findBattlefieldCardFn(blockerId);
                    const blockerCard = this.getCardFromInstanceIdFn(blockerId);
                    if (!blockerBattlefieldCard || !blockerCard || blockerCard.type !== 'Creature')
                        return;
                    // Assign damage to blocker
                    console.log(` > ${attackerCard.name} assigns ${damageToDeal} damage to ${blockerCard.name}`);
                    blockerBattlefieldCard.damageMarked += damageToDeal;
                    // Assign damage back to attacker
                    const blockerDamage = blockerCard.attack ?? 0;
                    const blockerHasFirstStrike = this.hasKeywordFn(blockerId, 'First Strike');
                    const blockerHasDoubleStrike = this.hasKeywordFn(blockerId, 'Double Strike');
                    const blockerDealsDamageThisStep = (isFirstStrikeStep && (blockerHasFirstStrike || blockerHasDoubleStrike)) || (!isFirstStrikeStep && !blockerHasFirstStrike) || (!isFirstStrikeStep && blockerHasDoubleStrike);
                    if (blockerDamage > 0 && blockerDealsDamageThisStep) {
                        console.log(` > ${blockerCard.name} assigns ${blockerDamage} damage to ${attackerCard.name}`);
                        attackerBattlefieldCard.damageMarked += blockerDamage;
                    }
                    // TODO: Handle trample
                    damageToDeal = 0; // No more damage to player if blocked (without trample)
                }
            });
            // Assign remaining damage to player if unblocked
            if (!blocked && damageToDeal > 0) {
                const targetPlayer = this.gameState.players.find(p => p.playerId === targetPlayerId);
                if (targetPlayer) {
                    console.log(` > ${attackerCard.name} assigns ${damageToDeal} damage to Player ${targetPlayerId}`);
                    targetPlayer.life -= damageToDeal;
                }
            }
        });
        console.log("Finished assigning damage for this step.");
        // Check State-Based Actions after damage
        this.stateManager.checkStateBasedActions();
        // Priority passing is handled by TurnManager after SBA checks
        // The TurnManager.advanceStepOrPhase() method should grant priority appropriately.
        // We might need to signal TurnManager that combat damage has resolved.
        // For now, assume TurnManager handles the next priority grant after SBA check.
    }
    // Placeholder for checking if any combat creature has specific keywords
    // Replaces _doesAnyCreatureHaveKeyword from original engine
    checkKeywords(...keywords) {
        console.log(`Checking for keywords: ${keywords.join(', ')}`);
        // TODO: Iterate through attackers and blockers
        // TODO: Check if any creature has one of the specified keywords
        return false; // Placeholder
    }
    // Replaces _clearCombatState from original engine
    cleanupCombat() {
        console.log("Cleaning up combat state...");
        // Clear attacker/blocker status at the end of combat.
        this.gameState.attackers = {};
        this.gameState.blockers = {};
        // Also clear damage marked on creatures
        this.gameState.players.forEach(player => {
            player.battlefield.creatures.forEach(c => c.damageMarked = 0);
            // Add other permanent types if they can take damage
        });
    }
}
