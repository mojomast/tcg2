import { CombatManager } from '../combatManager';
import { GameState, PlayerId, GameObjectId, GameStep, GamePhase, Keyword, BattlefieldCard } from '../../interfaces/gameState';
import { Card, CardType, ManaCost } from '../../interfaces/card';
import { TurnManager } from '../turnManager';
import { StateManager } from '../stateManager';
import { GameEngine } from '../gameEngine'; // For full game setup if needed

// Mock helper for creating cards (can be shared or simplified from actionManager.test.ts)
const createMockBdCard = (id: string, name: string, keywords: Keyword[] = [], tapped = false, summoningSickness = false, power = 1, toughness = 1): BattlefieldCard => {
    const baseCard: Card = {
        id: `card-def-${id}`,
        name,
        type: 'Creature',
        cost: { C: 1 },
        rarity: 'Common',
        rulesText: '',
        setId: 'test-set',
        collectorNumber: '001',
        keywords,
        power,
        toughness,
    };
    return {
        ...baseCard,
        instanceId: id,
        cardId: baseCard.id,
        currentZone: 'battlefield',
        ownerId: 'player1',
        controllerId: 'player1',
        tapped,
        summoningSickness,
        damageMarked: 0,
        counters: {},
        attachments: [],
    };
};

// Mock implementations for constructor dependencies
const mockValidateActionFn = jest.fn();
const mockGetCardFromInstanceIdFn = jest.fn();
const mockFindBattlefieldCardFn = jest.fn();
const mockHasKeywordFn = jest.fn();
const mockGrantPriorityFn = jest.fn();

describe('CombatManager', () => {
    let gameState: GameState;
    let combatManager: CombatManager;
    let turnManagerMock: TurnManager;
    let stateManagerMock: StateManager;
    let gameEngineMock: GameEngine;

    const player1Id: PlayerId = 'player1';
    const player2Id: PlayerId = 'player2';

    beforeEach(() => {
        // Basic GameState setup
        gameState = {
            gameId: 'test-game',
            turnNumber: 1,
            activePlayerId: player1Id,
            priorityPlayerId: player1Id,
            consecutivePriorityPasses: 0,
            startingPlayerId: player1Id,
            currentPhase: 'COMBAT',
            currentStep: 'DECLARE_ATTACKERS',
            players: [
                {
                    playerId: player1Id,
                    life: 20,
                    energy: 0,
                    poisonCounters: 0,
                    manaPool: {},
                    landPlayedThisTurn: false,
                    hand: [],
                    library: [],
                    graveyard: [],
                    exile: [],
                    battlefield: {
                        creatures: [],
                        resources: [],
                        enchantments: [],
                        artifacts: [],
                        planeswalkers: [],
                        other: [],
                    },
                    hasPlayedResourceThisTurn: false,
                    maxHandSize: 7,
                    hasLost: false,
                },
                {
                    playerId: player2Id,
                    life: 20,
                    energy: 0,
                    poisonCounters: 0,
                    manaPool: {},
                    landPlayedThisTurn: false,
                    hand: [],
                    library: [],
                    graveyard: [],
                    exile: [],
                    battlefield: {
                        creatures: [],
                        resources: [],
                        enchantments: [],
                        artifacts: [],
                        planeswalkers: [],
                        other: [],
                    },
                    hasPlayedResourceThisTurn: false,
                    maxHandSize: 7,
                    hasLost: false,
                },
            ],
            stack: [],
            gameObjects: {},
            attackers: {},
            blockers: {},
            gameLog: [],
        } as GameState; // Type assertion for simplicity in test setup

        // Mock TurnManager and StateManager
        // For TurnManager, we mainly need grantPriority
        turnManagerMock = {
            grantPriority: mockGrantPriorityFn,
            // other methods if needed, or use a more complete mock/spy from GameEngine
        } as any; 

        // Mock GameEngine for StateManager
        gameEngineMock = {
            // Add any methods StateManager might call, or leave as basic mock object
            // For now, assuming StateManager doesn't call complex engine methods in this context
        } as any;

        stateManagerMock = new StateManager(gameEngineMock, gameState, mockGetCardFromInstanceIdFn); // Assuming StateManager constructor

        combatManager = new CombatManager(
            gameState,
            turnManagerMock,
            stateManagerMock,
            mockValidateActionFn,
            mockGetCardFromInstanceIdFn,
            mockFindBattlefieldCardFn,
            mockHasKeywordFn
        );

        // Reset mocks before each test
        mockValidateActionFn.mockReset();
        mockGetCardFromInstanceIdFn.mockReset();
        mockFindBattlefieldCardFn.mockReset();
        mockHasKeywordFn.mockReset();
        mockGrantPriorityFn.mockReset();

        // Default mock implementations
        mockValidateActionFn.mockReturnValue(true); // Assume actions are valid unless specified
    });

    describe('declareAttackers', () => {
        it('should tap attackers without Vigilance and not tap attackers with Vigilance', () => {
            const creatureWithVigilanceId: GameObjectId = 'vigilant-creature';
            const creatureWithoutVigilanceId: GameObjectId = 'normal-creature';

            const vigilantCreature = createMockBdCard(creatureWithVigilanceId, 'Vigilant Knight', ['Vigilance']);
            const normalCreature = createMockBdCard(creatureWithoutVigilanceId, 'Basic Soldier', []);

            gameState.players[0].battlefield.creatures.push(vigilantCreature, normalCreature);
            gameState.gameObjects[vigilantCreature.instanceId] = vigilantCreature;
            gameState.gameObjects[normalCreature.instanceId] = normalCreature;

            // Mock findBattlefieldCardFn to return these creatures
            mockFindBattlefieldCardFn.mockImplementation((id: GameObjectId) => {
                if (id === creatureWithVigilanceId) return vigilantCreature;
                if (id === creatureWithoutVigilanceId) return normalCreature;
                return undefined;
            });

            // Mock hasKeywordFn
            mockHasKeywordFn.mockImplementation((id: GameObjectId, keyword: Keyword) => {
                if (id === creatureWithVigilanceId && keyword === 'Vigilance') return true;
                return false;
            });
            
            // Mock getCardFromInstanceIdFn to return the base card definition part
            mockGetCardFromInstanceIdFn.mockImplementation((id: GameObjectId) => {
                 const bfCard = gameState.gameObjects[id];
                 if (bfCard) {
                    // Return a basic Card structure from BattlefieldCard
                    const { instanceId, cardId, currentZone, ownerId, controllerId, tapped, summoningSickness, damageMarked, counters, attachments, ...baseCard } = bfCard;
                    return baseCard as Card;
                 }
                 return undefined;
            });

            const attackersToDeclare = {
                [creatureWithVigilanceId]: player2Id,
                [creatureWithoutVigilanceId]: player2Id,
            };

            combatManager.declareAttackers(player1Id, attackersToDeclare);

            expect(gameState.attackers).toEqual(attackersToDeclare);
            expect(vigilantCreature.tapped).toBe(false); // Should not be tapped
            expect(normalCreature.tapped).toBe(true);   // Should be tapped
            expect(mockGrantPriorityFn).toHaveBeenCalledWith(player1Id);
        });

        it('should prevent a creature with summoning sickness from attacking', () => {
            const sickCreatureId: GameObjectId = 'sick-creature';
            const sickCreature = createMockBdCard(sickCreatureId, 'Sick Puppy', [], false, true); // No keywords, summoningSickness: true

            gameState.players[0].battlefield.creatures.push(sickCreature);
            gameState.gameObjects[sickCreature.instanceId] = sickCreature;

            mockFindBattlefieldCardFn.mockImplementation((id: GameObjectId) => {
                if (id === sickCreatureId) return sickCreature;
                return undefined;
            });
            mockGetCardFromInstanceIdFn.mockImplementation((id: GameObjectId) => {
                 const bfCard = gameState.gameObjects[id];
                 if (bfCard) {
                    const { instanceId, cardId, currentZone, ownerId, controllerId, tapped, summoningSickness, damageMarked, counters, attachments, ...baseCard } = bfCard;
                    return baseCard as Card;
                 }
                 return undefined;
            });
            mockHasKeywordFn.mockReturnValue(false); // No keywords for this creature

            const attackersToDeclare = { [sickCreatureId]: player2Id };
            combatManager.declareAttackers(player1Id, attackersToDeclare);

            expect(gameState.attackers).toEqual({}); // Attack should not have been registered
            // Optionally, check for console.error or a more specific error handling if implemented
        });

        it('should allow a creature without summoning sickness to attack', () => {
            const readyCreatureId: GameObjectId = 'ready-creature';
            // summoningSickness: false (either due to Haste and ETB logic, or it's an old creature)
            const readyCreature = createMockBdCard(readyCreatureId, 'Ready Warrior', [], false, false); 

            gameState.players[0].battlefield.creatures.push(readyCreature);
            gameState.gameObjects[readyCreature.instanceId] = readyCreature;

            mockFindBattlefieldCardFn.mockImplementation((id: GameObjectId) => {
                if (id === readyCreatureId) return readyCreature;
                return undefined;
            });
             mockGetCardFromInstanceIdFn.mockImplementation((id: GameObjectId) => {
                 const bfCard = gameState.gameObjects[id];
                 if (bfCard) {
                    const { instanceId, cardId, currentZone, ownerId, controllerId, tapped, summoningSickness, damageMarked, counters, attachments, ...baseCard } = bfCard;
                    return baseCard as Card;
                 }
                 return undefined;
            });
            mockHasKeywordFn.mockReturnValue(false); // Assuming no Vigilance for tap check simplicity here

            const attackersToDeclare = { [readyCreatureId]: player2Id };
            combatManager.declareAttackers(player1Id, attackersToDeclare);

            expect(gameState.attackers).toEqual(attackersToDeclare);
            expect(readyCreature.tapped).toBe(true); // Should be tapped as it doesn't have Vigilance
            expect(mockGrantPriorityFn).toHaveBeenCalledWith(player1Id);
        });

        // TODO: Add tests for Flying (block restrictions will be in declareBlockers) -> This is for attackers with flying, covered in declareBlockers
    });

    describe('declareBlockers', () => {
        const attackerId: GameObjectId = 'flying-attacker';
        const nonFlyingAttackerId: GameObjectId = 'ground-attacker';
        const blockerFlyingId: GameObjectId = 'flying-blocker';
        const blockerReachId: GameObjectId = 'reach-blocker';
        const blockerNormalId: GameObjectId = 'normal-blocker';

        let flyingAttacker: BattlefieldCard;
        let groundAttacker: BattlefieldCard;
        let flyingBlocker: BattlefieldCard;
        let reachBlocker: BattlefieldCard;
        let normalBlocker: BattlefieldCard;

        beforeEach(() => {
            // Setup attackers in gameState
            flyingAttacker = createMockBdCard(attackerId, 'Flying Beast', ['Flying']);
            groundAttacker = createMockBdCard(nonFlyingAttackerId, 'Ground Pounder', []);
            
            gameState.attackers = {
                [attackerId]: player1Id, // player1 is the target of the attack
                [nonFlyingAttackerId]: player1Id,
            };
            gameState.gameObjects[attackerId] = flyingAttacker;
            gameState.gameObjects[nonFlyingAttackerId] = groundAttacker;

            // Setup potential blockers on player2's battlefield
            flyingBlocker = createMockBdCard(blockerFlyingId, 'Sky Warden', ['Flying']);
            reachBlocker = createMockBdCard(blockerReachId, 'Longarm Archer', ['Reach']);
            normalBlocker = createMockBdCard(blockerNormalId, 'Foot Soldier', []);

            gameState.players[1].battlefield.creatures.push(flyingBlocker, reachBlocker, normalBlocker);
            gameState.gameObjects[blockerFlyingId] = flyingBlocker;
            gameState.gameObjects[blockerReachId] = reachBlocker;
            gameState.gameObjects[blockerNormalId] = normalBlocker;
            
            // Mock functions
            mockFindBattlefieldCardFn.mockImplementation((id: GameObjectId) => {
                return gameState.gameObjects[id] as BattlefieldCard | undefined;
            });
            mockGetCardFromInstanceIdFn.mockImplementation((id: GameObjectId) => {
                 const bfCard = gameState.gameObjects[id];
                 if (bfCard) {
                    const { instanceId, cardId, currentZone, ownerId, controllerId, tapped, summoningSickness, damageMarked, counters, attachments, ...baseCard } = bfCard;
                    return baseCard as Card;
                 }
                 return undefined;
            });
        });

        it('should prevent a non-flying/non-reach creature from blocking a flying attacker', () => {
            mockHasKeywordFn.mockImplementation((id: GameObjectId, keyword: Keyword) => {
                if (id === attackerId && keyword === 'Flying') return true;
                if (id === blockerNormalId && (keyword === 'Flying' || keyword === 'Reach')) return false;
                return false; // Default for others
            });

            const blockersToDeclare = { [blockerNormalId]: attackerId };
            combatManager.declareBlockers(player2Id, blockersToDeclare);

            expect(gameState.blockers[blockerNormalId]).toBeUndefined(); // Block should not be registered
            // Optionally check for console.error or specific error handling
        });

        it('should allow a flying creature to block a flying attacker', () => {
            mockHasKeywordFn.mockImplementation((id: GameObjectId, keyword: Keyword) => {
                if (id === attackerId && keyword === 'Flying') return true;
                if (id === blockerFlyingId && keyword === 'Flying') return true;
                return false;
            });

            const blockersToDeclare = { [blockerFlyingId]: attackerId };
            combatManager.declareBlockers(player2Id, blockersToDeclare);

            expect(gameState.blockers[blockerFlyingId]).toEqual(attackerId);
            expect(mockGrantPriorityFn).toHaveBeenCalledWith(player2Id);
        });

        it('should allow a creature with Reach to block a flying attacker', () => {
            mockHasKeywordFn.mockImplementation((id: GameObjectId, keyword: Keyword) => {
                if (id === attackerId && keyword === 'Flying') return true;
                if (id === blockerReachId && keyword === 'Reach') return true;
                return false;
            });

            const blockersToDeclare = { [blockerReachId]: attackerId };
            combatManager.declareBlockers(player2Id, blockersToDeclare);

            expect(gameState.blockers[blockerReachId]).toEqual(attackerId);
            expect(mockGrantPriorityFn).toHaveBeenCalledWith(player2Id);
        });

        it('should allow a normal creature to block a non-flying attacker', () => {
            // Attacker is nonFlyingAttackerId
            mockHasKeywordFn.mockImplementation((id: GameObjectId, keyword: Keyword) => {
                if (id === nonFlyingAttackerId && keyword === 'Flying') return false;
                // Blocker (normalBlocker) has no relevant keywords for this interaction
                return false;
            });

            const blockersToDeclare = { [blockerNormalId]: nonFlyingAttackerId };
            combatManager.declareBlockers(player2Id, blockersToDeclare);

            expect(gameState.blockers[blockerNormalId]).toEqual(nonFlyingAttackerId);
            expect(mockGrantPriorityFn).toHaveBeenCalledWith(player2Id);
        });

        it('should allow a flying creature to block a non-flying attacker', () => {
            // Attacker is nonFlyingAttackerId
            mockHasKeywordFn.mockImplementation((id: GameObjectId, keyword: Keyword) => {
                if (id === nonFlyingAttackerId && keyword === 'Flying') return false;
                if (id === blockerFlyingId && keyword === 'Flying') return true; // Blocker has flying
                return false;
            });

            const blockersToDeclare = { [blockerFlyingId]: nonFlyingAttackerId };
            combatManager.declareBlockers(player2Id, blockersToDeclare);

            expect(gameState.blockers[blockerFlyingId]).toEqual(nonFlyingAttackerId);
            expect(mockGrantPriorityFn).toHaveBeenCalledWith(player2Id);
        });

        it('should allow a creature with Reach to block a non-flying attacker', () => {
            // Attacker is nonFlyingAttackerId
            mockHasKeywordFn.mockImplementation((id: GameObjectId, keyword: Keyword) => {
                if (id === nonFlyingAttackerId && keyword === 'Flying') return false;
                if (id === blockerReachId && keyword === 'Reach') return true; // Blocker has reach
                return false;
            });

            const blockersToDeclare = { [blockerReachId]: nonFlyingAttackerId };
            combatManager.declareBlockers(player2Id, blockersToDeclare);

            expect(gameState.blockers[blockerReachId]).toEqual(nonFlyingAttackerId);
            expect(mockGrantPriorityFn).toHaveBeenCalledWith(player2Id);
        });
    });
});
