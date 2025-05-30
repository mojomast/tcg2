import { GameEngine } from '../gameEngine';
import { TurnManager } from '../turnManager';
import { GameState, PlayerState, PlayerId, GamePhase, GameStep } from '../../interfaces/gameState';
import { createMockGameState, createMockPlayerState } from '../../utils/testUtils'; // Assuming test utils exist

describe('TurnManager', () => {
    let gameState: GameState;
    let engine: GameEngine;
    let turnManager: TurnManager;
    const player1Id: PlayerId = 'player1';
    const player2Id: PlayerId = 'player2';

    beforeEach(() => {
        // Instantiate engine correctly, it will create the initial gameState
        // Provide minimal mock decklists (empty arrays) to avoid constructor errors
        const mockDecklists = {
            [player1Id]: [],
            [player2Id]: [],
        };
        engine = new GameEngine([player1Id, player2Id], mockDecklists);
        gameState = engine.gameState; // Access gameState from the engine
        turnManager = engine.turnManager;

        // Default setup: Player 1 is active, has priority
        gameState.activePlayerId = player1Id;
        gameState.priorityPlayerId = player1Id;
        gameState.consecutivePriorityPasses = 0;
    });

    describe('passPriority', () => {
        it('should pass priority to the opponent and increment the pass count', () => {
            expect(gameState.priorityPlayerId).toBe(player1Id);
            expect(gameState.consecutivePriorityPasses).toBe(0);

            turnManager.passPriority(player1Id);

            expect(gameState.priorityPlayerId).toBe(player2Id);
            expect(gameState.consecutivePriorityPasses).toBe(1);
        });

        it('should reset priority to the active player and reset pass count after two consecutive passes', () => {
             // P1 starts with priority
             turnManager.passPriority(player1Id); // P1 passes -> P2 has priority, count = 1
             expect(gameState.priorityPlayerId).toBe(player2Id);
             expect(gameState.consecutivePriorityPasses).toBe(1);

             // Simulate P2 passing priority immediately (stack resolves).
             // In the real engine, this would trigger stack resolution first.
             // Here, we directly call passPriority again, assuming the stack is empty.
             turnManager.passPriority(player2Id);

             // Expect priority to return to the active player (P1) and count reset to 0
             expect(gameState.priorityPlayerId).toBe(player1Id);
             expect(gameState.consecutivePriorityPasses).toBe(0);
         });

         it('should not pass priority if the wrong player tries to pass', () => {
             expect(gameState.priorityPlayerId).toBe(player1Id);

             // Player 2 tries to pass when Player 1 has priority
             turnManager.passPriority(player2Id);

             // State should remain unchanged
             expect(gameState.priorityPlayerId).toBe(player1Id);
             expect(gameState.consecutivePriorityPasses).toBe(0);
         });

         describe('after stack resolution or empty stack passes', () => {
            let resolveNextStackItemSpy: jest.SpyInstance;
            let checkStateBasedActionsSpy: jest.SpyInstance;
            let grantPrioritySpy: jest.SpyInstance;
            let advanceTurnStateSpy: jest.SpyInstance;

            beforeEach(() => {
                // Mock ActionManager on the engine instance
                resolveNextStackItemSpy = jest.spyOn(engine.actionManager, 'resolveNextStackItem').mockImplementation(() => {});
                // Mock StateManager on the engine instance (or directly if TurnManager holds it)
                // Assuming TurnManager has a stateManager instance, or it's on engine.stateManager
                // From TurnManager constructor: this.stateManager = stateManager;
                checkStateBasedActionsSpy = jest.spyOn(engine.stateManager, 'checkStateBasedActions').mockReturnValue(false);
                grantPrioritySpy = jest.spyOn(turnManager, 'grantPriority').mockImplementation(() => {});
                advanceTurnStateSpy = jest.spyOn(turnManager, 'advanceTurnState' as any).mockImplementation(() => {});

                // Ensure players are set up for 2-player game logic in passPriority
                gameState.players = [
                    createMockPlayerState(player1Id),
                    createMockPlayerState(player2Id)
                ];
                gameState.activePlayerId = player1Id;
                gameState.priorityPlayerId = player1Id; // Start with player1 having priority
            });

            afterEach(() => {
                resolveNextStackItemSpy.mockRestore();
                checkStateBasedActionsSpy.mockRestore();
                grantPrioritySpy.mockRestore();
                advanceTurnStateSpy.mockRestore();
            });

            it('should resolve stack item, check SBAs, and grant priority to active player if stack is not empty and all pass', () => {
                gameState.stack = [{
                    stackId: 'stackItem1',
                    type: 'Spell',
                    sourceCardId: 'cardDef1',
                    sourceInstanceId: 'cardInstance1',
                    controllerId: player1Id,
                    targets: []
                }];
                gameState.priorityPlayerId = player1Id;
                turnManager.passPriority(player1Id); // P1 passes
                
                // Priority should now be P2, grantPrioritySpy was called for P2
                expect(grantPrioritySpy).toHaveBeenCalledWith(player2Id);
                grantPrioritySpy.mockClear(); // Clear for the next check

                gameState.priorityPlayerId = player2Id; // Manually set for P2 to pass
                turnManager.passPriority(player2Id); // P2 passes

                expect(resolveNextStackItemSpy).toHaveBeenCalledTimes(1);
                expect(checkStateBasedActionsSpy).toHaveBeenCalledTimes(1);
                expect(grantPrioritySpy).toHaveBeenCalledWith(player1Id); // Priority back to active player
                expect(advanceTurnStateSpy).not.toHaveBeenCalled();
            });

            it('should not grant priority if game ended after stack resolution', () => {
                gameState.stack = [{
                    stackId: 'stackItem2',
                    type: 'Spell',
                    sourceCardId: 'cardDef2',
                    sourceInstanceId: 'cardInstance2',
                    controllerId: player1Id,
                    targets: []
                }];
                checkStateBasedActionsSpy.mockReturnValue(true); // Simulate game ended

                gameState.priorityPlayerId = player1Id;
                turnManager.passPriority(player1Id); // P1 passes
                grantPrioritySpy.mockClear(); 

                gameState.priorityPlayerId = player2Id; // Manually set for P2 to pass
                turnManager.passPriority(player2Id); // P2 passes

                expect(resolveNextStackItemSpy).toHaveBeenCalledTimes(1);
                expect(checkStateBasedActionsSpy).toHaveBeenCalledTimes(1);
                expect(grantPrioritySpy).not.toHaveBeenCalled();
                expect(advanceTurnStateSpy).not.toHaveBeenCalled();
            });

            it('should advance turn state if stack is empty and all players pass', () => {
                gameState.stack = []; // Empty stack
                gameState.priorityPlayerId = player1Id;
                turnManager.passPriority(player1Id); // P1 passes
                grantPrioritySpy.mockClear();

                gameState.priorityPlayerId = player2Id; // Manually set for P2 to pass
                turnManager.passPriority(player2Id); // P2 passes

                expect(resolveNextStackItemSpy).not.toHaveBeenCalled();
                expect(checkStateBasedActionsSpy).not.toHaveBeenCalled(); // SBAs not checked directly here before advanceTurnState
                expect(grantPrioritySpy).not.toHaveBeenCalled(); // grantPriority not called directly, advanceTurnState handles it
                expect(advanceTurnStateSpy).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('advanceStep', () => {
        let clearManaPoolSpy: jest.SpyInstance;
        let advancePhaseSpy: jest.SpyInstance;
        let performStepEntryActionsSpy: jest.SpyInstance;

        beforeEach(() => {
            // Spy on ResourceManager's clearManaPool via the engine's instance
            clearManaPoolSpy = jest.spyOn(engine.resourceManager, 'clearManaPool');
            // Spy on TurnManager's own methods
            advancePhaseSpy = jest.spyOn(turnManager, 'advancePhase' as any); // advancePhase is public, but good practice if it were private
            performStepEntryActionsSpy = jest.spyOn(turnManager, 'performStepEntryActions' as any);
        });

        afterEach(() => {
            clearManaPoolSpy.mockRestore();
            advancePhaseSpy.mockRestore();
            performStepEntryActionsSpy.mockRestore();
        });

        it('should advance from UNTAP to UPKEEP and not clear mana pools', () => {
            gameState.currentPhase = 'BEGIN';
            gameState.currentStep = 'UNTAP';

            (turnManager as any).advanceStep();

            expect(gameState.currentStep).toBe('UPKEEP');
            expect(gameState.currentPhase).toBe('BEGIN'); // Should remain in the same phase
            expect(clearManaPoolSpy).not.toHaveBeenCalled();
            expect(performStepEntryActionsSpy).toHaveBeenCalledWith('UPKEEP', 'BEGIN');
            expect(advancePhaseSpy).not.toHaveBeenCalled();
        });

        it('should advance from UPKEEP to DRAW and clear mana pools', () => {
            gameState.currentPhase = 'BEGIN';
            gameState.currentStep = 'UPKEEP';

            (turnManager as any).advanceStep();

            expect(gameState.currentStep).toBe('DRAW');
            expect(gameState.currentPhase).toBe('BEGIN');
            expect(clearManaPoolSpy).toHaveBeenCalledTimes(gameState.players.length);
            expect(performStepEntryActionsSpy).toHaveBeenCalledWith('DRAW', 'BEGIN');
            expect(advancePhaseSpy).not.toHaveBeenCalled();
        });

        it('should call advancePhase when advancing from DRAW (last step of BEGIN)', () => {
            gameState.currentPhase = 'BEGIN';
            gameState.currentStep = 'DRAW';
            // advancePhase will change the step and phase, and call performStepEntryActions itself.
            // So we only check if advancePhase was called and mana was cleared before that.

            (turnManager as any).advanceStep();
            
            expect(clearManaPoolSpy).toHaveBeenCalledTimes(gameState.players.length);
            expect(advancePhaseSpy).toHaveBeenCalledTimes(1);
            // performStepEntryActions will be called by advancePhase, not directly by this advanceStep call for the *next* phase's first step
            // We can check it wasn't called for 'DRAW' or 'BEGIN' by this specific advanceStep call's tail end.
            expect(performStepEntryActionsSpy).not.toHaveBeenCalledWith('DRAW', 'BEGIN'); 
        });

        it('should advance from BEGIN_COMBAT to DECLARE_ATTACKERS (COMBAT phase) and not clear mana pools', () => {
            gameState.currentPhase = 'COMBAT';
            gameState.currentStep = 'COMBAT_BEGIN';

            (turnManager as any).advanceStep();

            expect(gameState.currentStep).toBe('DECLARE_ATTACKERS');
            expect(gameState.currentPhase).toBe('COMBAT');
            expect(clearManaPoolSpy).not.toHaveBeenCalled();
            expect(performStepEntryActionsSpy).toHaveBeenCalledWith('DECLARE_ATTACKERS', 'COMBAT');
            expect(advancePhaseSpy).not.toHaveBeenCalled();
        });

        it('should reset to MAIN_PRE if current step is invalid for the phase', () => {
            gameState.currentPhase = 'MAIN';
            gameState.currentStep = 'INVALID_STEP' as GameStep; // Force an invalid step
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error log in test output

            (turnManager as any).advanceStep();

            expect(gameState.currentPhase).toBe('MAIN');
            expect(gameState.currentStep).toBe('MAIN_PRE');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Critical Error: Current step INVALID_STEP not found in phase MAIN'));
            expect(performStepEntryActionsSpy).toHaveBeenCalledWith('MAIN_PRE', 'MAIN');
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('advancePhase', () => {
        let nextTurnSpy: jest.SpyInstance;
        let consoleErrorSpy: jest.SpyInstance;
        let getCurrentPhaseStepsForPhaseSpy: jest.SpyInstance;

        beforeEach(() => {
            nextTurnSpy = jest.spyOn(turnManager, 'nextTurn' as any).mockImplementation(() => {
                // Mock nextTurn to prevent actual turn change, just verify it's called
                // and set some basic next turn state for predictability if needed by other assertions.
                gameState.turnNumber += 1;
                gameState.activePlayerId = gameState.activePlayerId === player1Id ? player2Id : player1Id;
                gameState.currentPhase = 'BEGIN';
                gameState.currentStep = 'UNTAP';
            });
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            // Spy on the method that `advancePhase` uses to get steps for the new phase.
            getCurrentPhaseStepsForPhaseSpy = jest.spyOn(turnManager as any, 'getCurrentPhaseStepsForPhase');
        });

        afterEach(() => {
            nextTurnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
            getCurrentPhaseStepsForPhaseSpy.mockRestore();
        });

        it('should advance from BEGIN (DRAW) to MAIN phase (MAIN_PRE)', () => {
            gameState.currentPhase = 'BEGIN';
            gameState.currentStep = 'DRAW'; // Last step of BEGIN

            (turnManager as any).advancePhase();

            expect(gameState.currentPhase).toBe('MAIN');
            expect(gameState.currentStep).toBe('MAIN_PRE');
            expect(nextTurnSpy).not.toHaveBeenCalled();
        });

        it('should advance from first MAIN (MAIN_PRE) to COMBAT phase (COMBAT_BEGIN)', () => {
            gameState.currentPhase = 'MAIN';
            gameState.currentStep = 'MAIN_PRE'; // Assuming this is treated as end of first main for phase advance

            (turnManager as any).advancePhase();

            expect(gameState.currentPhase).toBe('COMBAT');
            expect(gameState.currentStep).toBe('COMBAT_BEGIN');
            expect(nextTurnSpy).not.toHaveBeenCalled();
        });

        it('should advance from COMBAT (COMBAT_END) to MAIN phase (MAIN_PRE - current behavior)', () => {
            gameState.currentPhase = 'COMBAT';
            gameState.currentStep = 'COMBAT_END'; // Last step of COMBAT

            (turnManager as any).advancePhase();

            // NOTE: Current TurnManager logic sets the step to MAIN_PRE when transitioning to MAIN phase,
            // regardless of whether it's the first or second MAIN phase contextually.
            // This might need review for game rules accuracy (typically post-combat is MAIN_POST).
            expect(gameState.currentPhase).toBe('MAIN');
            expect(gameState.currentStep).toBe('MAIN_PRE'); 
            expect(nextTurnSpy).not.toHaveBeenCalled();
        });

        it('should advance from second MAIN (MAIN_POST) to END phase (END_STEP)', () => {
            gameState.currentPhase = 'MAIN';
            gameState.currentStep = 'MAIN_POST'; // Last step of second MAIN

            (turnManager as any).advancePhase();

            expect(gameState.currentPhase).toBe('END');
            expect(gameState.currentStep).toBe('END_STEP');
            expect(nextTurnSpy).not.toHaveBeenCalled();
        });

        it('should call nextTurn when advancing from END phase (CLEANUP)', () => {
            gameState.currentPhase = 'END';
            gameState.currentStep = 'CLEANUP'; // Last step of END

            (turnManager as any).advancePhase();

            expect(nextTurnSpy).toHaveBeenCalledTimes(1);
            // The state of currentPhase/currentStep will be set by the mocked nextTurn
            expect(gameState.currentPhase).toBe('BEGIN'); 
            expect(gameState.currentStep).toBe('UNTAP');
        });

        it('should fallback to MAIN_PRE if a new phase has no defined steps', () => {
            gameState.currentPhase = 'BEGIN'; // From BEGIN to a hypothetical broken phase
            gameState.currentStep = 'DRAW';
            
            // Make getCurrentPhaseStepsForPhase return empty array for the 'MAIN' phase (which is next after 'BEGIN')
            getCurrentPhaseStepsForPhaseSpy.mockImplementation((phase: GamePhase) => {
                if (phase === 'MAIN') return [];
                // For other phases, use the actual implementation to avoid breaking other parts of the test setup
                // This requires a bit more careful spy setup if we were to call the original, 
                // but for this specific test, just returning for 'MAIN' is enough.
                const originalMethod = (turnManager as any).constructor.prototype.getCurrentPhaseStepsForPhase;
                return originalMethod.call(turnManager, phase);
            });
            // A more robust way if originalMethod isn't easily accessible or if it's static:
            // const actualPhaseSteps = { ...((turnManager as any).constructor as typeof TurnManager).phaseSteps };
            // if (phase === 'MAIN') return []; else return actualPhaseSteps[phase] || [];

            (turnManager as any).advancePhase();

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: No steps found for new phase MAIN'));
            expect(gameState.currentPhase).toBe('MAIN'); // Fallback phase
            expect(gameState.currentStep).toBe('MAIN_PRE'); // Fallback step
            expect(nextTurnSpy).not.toHaveBeenCalled();
        });
    });
});
