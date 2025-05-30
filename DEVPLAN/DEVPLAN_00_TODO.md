# DEVPLAN_00_TODO: Priority Action Items

**Created:** 2025-05-30  
**Status:** Active Development Plan  
**Objective:** Complete the critical path to make TCG2 fully playable

> **📋 REMINDER:** Update corresponding DEVPLAN files as tasks are completed. Mark tasks with [x] and update completion percentages in the main devplan files.

---

## 🔥 CRITICAL PATH - Week 1: Make It Fucking Playable

### PRIORITY 1: Complete Deck Management (DEVPLAN_12) [Estimated: 2-3 days]

**Current Status:** 30% Complete - **CRITICAL BLOCKER**

#### 1.1 Implement Core Deck Functionality

**STATUS:** `GameEngine.playerDrawCard` already exists! Need to implement shuffle and fix deck setup.

- [x] **[2025-05-30T20:59] Fix deck shuffling in GameEngine**
  - [x] **FILE:** `src/game/gameEngine.ts` line 305-307
  - [x] **REPLACE:** Current basic shuffle `shuffleArray(libraryInstanceIds)` with proper Fisher-Yates
  - [x] **SPECIFIC TASK:** Replace line 305-307 with proper Fisher-Yates implementation
  - [x] **TEST:** Verify randomization by logging first 3 cards after shuffle in multiple runs
  - [x] ✅ **Update DEVPLAN_12.md** when complete
  - **FINDING:** Fisher-Yates was already correctly implemented! Added enhanced logging for verification.

- [ ] **Implement proper `drawCard` function wrapper**
  - [ ] **FILE:** `src/services/deckService.ts` (add new method)
  - [ ] **CREATE:** `drawCard(gameState: GameState, playerId: PlayerId): boolean` method
  - [ ] **LOGIC:** Call existing `GameEngine.playerDrawCard()` and return success/failure
  - [ ] **UPDATE:** `deck_count` in PlayerState after successful draw
  - [ ] **HANDLE:** Empty deck case - return false, don't crash
  - [ ] **LOG:** Add specific logging for deck draws vs hand draws
  - [ ] ✅ **Update DEVPLAN_12.md** when complete

- [ ] **Replace current opening hand logic**
  - [ ] **FILE:** `src/game/gameEngine.ts` lines 174-187
  - [ ] **CURRENT ISSUE:** Uses direct `playerDrawCard` calls in `_asyncInitialize`
  - [ ] **REPLACE:** Loop with new `deckService.drawCard()` wrapper
  - [ ] **ADD:** Mulligan support (basic - just redraw if hand size < 7)
  - [ ] **VERIFY:** `deck_count` updates correctly after opening hands
  - [ ] ✅ **Update DEVPLAN_12.md** when complete

#### 1.2 Deck Validation

- [ ] **Add deck validation to DeckService**
  - [ ] **FILE:** `src/services/deckService.ts` (add new method)
  - [ ] **CREATE:** `validateDeck(deckList: DeckList): { valid: boolean, errors: string[] }` method
  - [ ] **CHECK 1:** Minimum 60 cards total (sum all quantities)
  - [ ] **CHECK 2:** Maximum 4 copies of any non-basic land card
  - [ ] **CHECK 3:** All card IDs exist in card database
  - [ ] **RETURN:** Object with validation results and specific error messages
  - [ ] ✅ **Update DEVPLAN_12.md** when complete

- [ ] **Integrate validation into game start**
  - [ ] **FILE:** `src/game/gameEngine.ts` method `_asyncInitialize` around line 100
  - [ ] **ADD:** Call `deckService.validateDeck()` before `getPlayerDeckCards()`
  - [ ] **THROW:** New error type `DeckValidationError` if validation fails
  - [ ] **INCLUDE:** Specific validation errors in the exception message
  - [ ] **SERVER:** Update `server.ts` to catch and handle `DeckValidationError`
  - [ ] ✅ **Update DEVPLAN_12.md** when complete

#### 1.3 Integration & Testing

- [ ] **Create deck lifecycle test**
  - [ ] **FILE:** Create `src/game/__tests__/deckManagement.test.ts`
  - [ ] **TEST 1:** Load deck from database using existing default decks
  - [ ] **TEST 2:** Verify shuffle randomness (run 10 times, check different orders)
  - [ ] **TEST 3:** Draw 7 cards for opening hand, verify hand size and deck_count
  - [ ] **TEST 4:** Draw remaining cards until deck empty, verify empty deck handling
  - [ ] **TEST 5:** Validate deck with 59 cards (should fail)
  - [ ] **TEST 6:** Validate deck with 5+ copies of a card (should fail)
  - [ ] **RUN:** `npm test -- deckManagement.test.ts` to verify all pass
  - [ ] ✅ **Update DEVPLAN_12.md** to 100% when complete

---

### PRIORITY 2: Complete Win/Loss Conditions (DEVPLAN_13) [Estimated: 1-2 days]

**Current Status:** 10% Complete

#### 2.1 State-Based Actions Integration

- [ ] **Locate existing SBA implementation**
  - [ ] **FILE:** Search for `_checkStateBasedActions` in codebase
  - [ ] **CURRENT:** Likely in `src/game/combatManager.ts` or `src/game/gameEngine.ts`
  - [ ] **EXAMINE:** What SBAs are already implemented (creature death, etc.)
  - [ ] **DOCUMENT:** Current SBA call locations and timing

- [ ] **Add life depletion check**
  - [ ] **FILE:** Same file as existing `_checkStateBasedActions`
  - [ ] **ADD:** Check if any player has `life <= 0`
  - [ ] **ACTION:** Set `playerState.hasLost = true` for players with life <= 0
  - [ ] **TRIGGER:** Call `this.endGame()` if any player has lost
  - [ ] **LOG:** "Player {id} loses due to life depletion (life: {amount})"

- [ ] **Add deck depletion check**
  - [ ] **INTEGRATION:** Modify `GameEngine.playerDrawCard()` around line 505
  - [ ] **CURRENT:** Already emits `PLAYER_ATTEMPTED_DRAW_FROM_EMPTY_LIBRARY`
  - [ ] **ADD:** Set `playerState.hasLost = true` when drawing from empty deck
  - [ ] **TRIGGER:** Call `this.endGame()` immediately
  - [ ] **LOG:** "Player {id} loses due to deck depletion"
  - [ ] ✅ **Update DEVPLAN_13.md** when complete

#### 2.2 Game End Handling

- [ ] **Create endGame method in GameEngine**
  - [ ] **FILE:** `src/game/gameEngine.ts` (add new public method)
  - [ ] **SIGNATURE:** `endGame(reason: string, losingPlayerId?: PlayerId): void`
  - [ ] **STEP 1:** Set `gameState.gameEnded = true` (add this field to GameState interface)
  - [ ] **STEP 2:** Set `gameState.winner` and `gameState.loser` (add these fields)
  - [ ] **STEP 3:** Set `gameState.endReason = reason` (add this field)
  - [ ] **STEP 4:** Emit `GAME_OVER` event with winner/loser info
  - [ ] **STEP 5:** Log game end with statistics (turns, duration, etc.)

- [ ] **Add GameState fields for game end**
  - [ ] **FILE:** `src/interfaces/gameState.ts`
  - [ ] **ADD:** `gameEnded: boolean` (default false)
  - [ ] **ADD:** `winner?: PlayerId`
  - [ ] **ADD:** `loser?: PlayerId`
  - [ ] **ADD:** `endReason?: string`
  - [ ] **ADD:** `endTime?: Date`
  - [ ] ✅ **Update DEVPLAN_13.md** when complete

#### 2.3 Client Communication

- [ ] **Add GAME_OVER to event types**
  - [ ] **FILE:** `src/interfaces/gameState.ts`
  - [ ] **ADD:** `GAME_OVER = 'GAME_OVER'` to `EventType` enum
  - [ ] **VERIFY:** Event gets properly typed in TypeScript

- [ ] **Test game over broadcasting**
  - [ ] **FILE:** Use existing server event callback in `src/server.ts`
  - [ ] **CURRENT:** `gameExternalEventCallback` already handles events
  - [ ] **VERIFY:** `GAME_OVER` events are broadcast to room
  - [ ] **LOG:** Confirm both clients receive the event

- [ ] **Add client-side game over handling**
  - [ ] **FILE:** `frontend/src/components/GameBoard.tsx` (or wherever game events are handled)
  - [ ] **FIND:** Existing `game_event` listener
  - [ ] **ADD:** Case for `GAME_OVER` event type
  - [ ] **ACTION:** Show modal or overlay with game results
  - [ ] **DISPLAY:** Winner, loser, reason, and game stats
  - [ ] **OPTION:** "Play Again" or "Return to Menu" buttons
  - [ ] ✅ **Update DEVPLAN_13.md** to 100% when complete

---

### PRIORITY 3: Finish Play Card Action (DEVPLAN_05) [Estimated: 1 day]

**Current Status:** 85% Complete

#### 3.1 Complete WebSocket Integration

- [ ] **Add play_card WebSocket event listener**
  - [ ] **FILE:** `src/server.ts` around line 540 (after existing event listeners)
  - [ ] **PATTERN:** Copy structure from existing `discard_card` listener
  - [ ] **EVENT:** `socket.on('play_card', (data: { playerId: string, cardInstanceId: string, targets?: string[] }) => { ... })`
  - [ ] **VALIDATE:** `data.playerId` matches `socket.data.playerId`
  - [ ] **CALL:** `gameEngine.playCard(data.playerId, data.cardInstanceId, data.targets)`
  - [ ] **SUCCESS:** Call `broadcastGameStateUpdate(gameEngine)` if successful
  - [ ] **ERROR:** Emit `action_error` to socket if failed
  - [ ] **LOG:** "Player {id} attempted to play card {cardId}"

- [ ] **Fix GameEngine.playCard method**
  - [ ] **FILE:** `src/game/gameEngine.ts` lines 477-485
  - [ ] **CURRENT ISSUE:** Method doesn't return success/failure status
  - [ ] **CHANGE:** Return `boolean` indicating success
  - [ ] **CATCH:** Wrap `actionManager.playCard()` in try-catch
  - [ ] **RETURN:** `true` if successful, `false` if validation failed
  - [ ] **PROPAGATE:** Let critical errors bubble up
  - [ ] ✅ **Update DEVPLAN_05.md** when complete

#### 3.2 Basic Target Validation

- [ ] **Find existing ActionManager.playCard**
  - [ ] **FILE:** `src/game/actionManager.ts`
  - [ ] **LOCATE:** Current `playCard` method implementation
  - [ ] **EXAMINE:** What validation already exists
  - [ ] **IDENTIFY:** Where target validation should be added

- [ ] **Add basic target validation placeholder**
  - [ ] **LOCATION:** In `actionManager.playCard()` after mana cost validation
  - [ ] **CHECK 1:** If targets provided, verify target count matches card requirements
  - [ ] **CHECK 2:** If targets required but none provided, fail validation
  - [ ] **CHECK 3:** If targets provided for non-targeted spell, ignore them
  - [ ] **SIMPLE RULES:** 
    - Instant/Sorcery with "target" in rules text requires 1 target
    - Creatures/Resources never require targets
    - Invalid targets = validation failure
  - [ ] **LOG:** "Target validation passed/failed for card {cardId}"
  - [ ] ✅ **Update DEVPLAN_05.md** to 100% when complete

---

## 🛠️ MEDIUM PRIORITY - Week 2: Polish & Test

### PRIORITY 4: Combat System Testing (DEVPLAN_06) [Estimated: 2-3 days]

**Current Status:** 90% Complete

#### 4.1 Comprehensive Test Coverage

- [ ] **Diagnose Jest configuration issues**
  - [ ] **FILE:** `jest.config.js` (check if exists)
  - [ ] **RUN:** `npm test` and capture exact error messages
  - [ ] **COMMON ISSUES:**
    - ES modules vs CommonJS imports
    - TypeScript compilation in test environment
    - Missing test setup files
  - [ ] **FIX:** Update Jest config for ES modules and TypeScript
  - [ ] **VERIFY:** `npm test` runs without import errors
  - [ ] ✅ **Update DEVPLAN_06.md** when complete

- [ ] **Create specific combat tests**
  - [ ] **FILE:** `src/game/__tests__/combat.test.ts` (check if exists)
  - [ ] **TEST 1:** 2/2 creature attacks unblocked vs 20 life opponent (expect 18 life)
  - [ ] **TEST 2:** 2/2 attacker vs 1/1 blocker (both die)
  - [ ] **TEST 3:** 3/3 First Strike vs 2/2 blocker (blocker dies, attacker lives)
  - [ ] **TEST 4:** 2/2 Flying vs 2/2 ground creature (can't block)
  - [ ] **TEST 5:** 4/4 Trample vs 2/2 blocker (2 damage to player)
  - [ ] **SETUP:** Use existing test utilities from `src/utils/testingUtils.ts`
  - [ ] **RUN:** Each test individually to isolate issues
  - [ ] ✅ **Update DEVPLAN_06.md** to 100% when complete

### PRIORITY 5: UI Polish & Rendering (DEVPLAN_09, DEVPLAN_10) [Estimated: 2-3 days]

#### 5.1 Complete Card Rendering

- [ ] **Find current battlefield rendering**
  - [ ] **FILE:** `frontend/src/components/PlayerBattlefield.tsx`
  - [ ] **EXAMINE:** How cards are currently displayed (single row vs separated)
  - [ ] **IDENTIFY:** Current CSS classes and layout structure

- [ ] **Separate battlefield by card type**
  - [ ] **MODIFY:** PlayerBattlefield component to group cards by type
  - [ ] **CREATE:** Separate arrays for creatures, resources, enchantments, artifacts
  - [ ] **LAYOUT:** 
    - Top row: Resources (lands/mana producers)
    - Bottom row: Creatures (combat units)
    - Additional rows: Other permanents as needed
  - [ ] **CSS:** Add distinct styling for each row type
  - [ ] **LABELS:** Add row headers "Resources", "Creatures", etc.
  - [ ] **SPACING:** Improve card spacing and alignment within rows
  - [ ] ✅ **Update DEVPLAN_10.md** to 100% when complete

#### 5.2 UI Layout Refinements

- [ ] **Find current priority indicators**
  - [ ] **FILE:** `frontend/src/components/PlayerInfoBar.tsx` or similar
  - [ ] **CURRENT:** Check how priority is currently shown
  - [ ] **EXAMINE:** Priority highlighting, player turn indicators

- [ ] **Enhance priority visual feedback**
  - [ ] **HIGHLIGHT:** Add glowing border or background color for player with priority
  - [ ] **COLORS:** Green = your priority, Yellow = opponent's priority, Red = waiting
  - [ ] **ANIMATION:** Subtle pulse or glow animation for active player
  - [ ] **TEXT:** Clear "Your Turn" / "Opponent's Turn" / "Your Priority" labels

- [ ] **Improve phase/step display**
  - [ ] **FILE:** `frontend/src/components/PhaseDisplay.tsx` or GameBoardInfo
  - [ ] **CURRENT:** Check how phases are displayed
  - [ ] **ENHANCE:** Larger, more prominent phase indicator
  - [ ] **PROGRESS:** Add visual progress bar through turn phases
  - [ ] **CONTEXT:** Show what actions are available in current phase
  - [ ] **COLORS:** Color-code phases (Begin=blue, Main=green, Combat=red, End=purple)
  - [ ] ✅ **Update DEVPLAN_09.md** to 100% when complete

### PRIORITY 6: Manual Playtesting (DEVPLAN_15) [Estimated: 3-5 days]

#### 6.1 End-to-End Testing

- [ ] **Prepare testing environment**
  - [ ] **START:** Run `npm run dev` in backend terminal
  - [ ] **VERIFY:** Server starts without errors on port 3000
  - [ ] **OPEN:** Two browser windows/tabs to `http://localhost:3000`
  - [ ] **ASSIGN:** One as Player 1, one as Player 2
  - [ ] **CONNECT:** Both join the default test game

- [ ] **Test basic game flow**
  - [ ] **STEP 1:** Verify both players see initial game state (life=20, hand size=7)
  - [ ] **STEP 2:** Player 1 plays a resource card (should work)
  - [ ] **STEP 3:** Player 1 passes priority (should advance to next step)
  - [ ] **STEP 4:** Play a creature card (should work and cost mana)
  - [ ] **STEP 5:** Advance to combat, declare attacker
  - [ ] **STEP 6:** Opponent takes damage or declares blocker
  - [ ] **STEP 7:** Verify damage is applied correctly
  - [ ] **STEP 8:** Continue until someone reaches 0 life
  - [ ] **VERIFY:** Game ends with proper winner/loser announcement
  - [ ] ✅ **Update DEVPLAN_15.md** when complete

#### 6.2 Bug Fixing & Debugging

- [ ] **Document bugs during testing**
  - [ ] **CREATE:** `BUGS_FOUND.md` file to track issues
  - [ ] **FORMAT:** Bug description, reproduction steps, expected vs actual behavior
  - [ ] **PRIORITY:** Mark as Critical, High, Medium, Low
  - [ ] **ASSIGN:** Each bug a unique ID (BUG-001, BUG-002, etc.)

- [ ] **Common bug categories to watch for:**
  - [ ] **SYNC ISSUES:** Players see different game states
  - [ ] **PRIORITY BUGS:** Wrong player has priority, stuck waiting
  - [ ] **MANA BUGS:** Incorrect mana costs, can't pay when should be able
  - [ ] **COMBAT BUGS:** Damage not applied, creatures not tapping/dying
  - [ ] **CARD BUGS:** Cards not moving between zones properly
  - [ ] **UI BUGS:** UI not updating, buttons not working

- [ ] **Fix critical bugs first**
  - [ ] **PRIORITY 1:** Any bugs that prevent game from starting
  - [ ] **PRIORITY 2:** Any bugs that prevent game from ending properly
  - [ ] **PRIORITY 3:** Any bugs that break core mechanics (play card, combat)
  - [ ] **PRIORITY 4:** UI polish and edge cases
  - [ ] ✅ **Update DEVPLAN_15.md** when complete

---

## 📋 LOWER PRIORITY - Future Iterations

### PRIORITY 7: Complete Game Actions (DETOUR_02) [Estimated: 2-3 days]
- [ ] **Implement declare attackers UI**
- [ ] **Implement declare blockers UI**
- [ ] **Complete action WebSocket events**
- [ ] ✅ **Update devplan_detour_02_actions.md** when complete

### PRIORITY 8: Energy System (DEVPLAN_14) [Estimated: 2-3 days]
- [ ] **Implement energy generation mechanics**
- [ ] **Add energy spending functions**
- [ ] **Ensure energy persistence between turns**
- [ ] ✅ **Update DEVPLAN_14.md** when complete

### PRIORITY 9: Advanced UI Features (DETOUR_04) [Estimated: 3-5 days]
- [ ] **Implement deckbuilding interface**
- [ ] **Add card database browsing**
- [ ] **Create deck generation UI**
- [ ] ✅ **Update DEVPLAN_DETOUR_04_UI.MD** when complete

---

## 📈 Progress Tracking

### Weekly Goals
- **Week 1 Target:** Complete Critical Path (Priorities 1-3)
- **Week 2 Target:** Complete Medium Priority items
- **Ongoing:** Address bugs and polish as discovered

### Completion Checkpoints

#### End of Week 1:
- [ ] **MILESTONE: Fully playable game loop**
  - [ ] Players can start game with proper decks
  - [ ] Cards can be played and resolve
  - [ ] Combat works end-to-end
  - [ ] Games end with proper win/loss conditions
  - [ ] ✅ **Update DEVPLAN_STATUS_REPORT.md** with new percentages

#### End of Week 2:
- [ ] **MILESTONE: Polished game experience**
  - [ ] Comprehensive testing complete
  - [ ] UI polished and user-friendly
  - [ ] Major bugs fixed
  - [ ] ✅ **Update DEVPLAN_STATUS_REPORT.md** with final assessment

---

## 🔄 Maintenance Reminders

**As you work through these tasks:**

1. **Update progress in individual DEVPLAN files** - Mark tasks complete with [x] and update completion percentages
2. **Update the main STATUS_REPORT** - Refresh completion percentages weekly  
3. **Document any architectural changes** - Update DEVPLAN_REFACTOR_GameEngine.md if needed
4. **Log significant bugs** - Add them to DEVPLAN_15_Testing_Refinement.md
5. **Note any scope changes** - Update relevant devplan files if requirements change
6. **Test after each major change** - Don't let multiple changes accumulate without testing
7. **Commit frequently** - Small, focused commits make debugging easier
8. **Keep notes** - Document what you tried, what worked, what didn't

---

## 🎯 Success Criteria

**Phase 1 Complete When:**
- [ ] **GAME START:** Two players can join and see initial game state (hands, life, turn 1)
- [ ] **CARD PLAY:** Players can play resource and creature cards, paying mana costs
- [ ] **PRIORITY:** Priority passes correctly between players and phases advance
- [ ] **COMBAT:** Players can declare attackers, blockers, and damage is calculated
- [ ] **GAME END:** Games end when a player reaches 0 life with proper winner announcement
- [ ] **STABILITY:** No crashes, no infinite loops, no stuck states
- [ ] **SYNC:** Both players see identical game state at all times

**Phase 2 Complete When:**
- [ ] **TESTING:** All major combat scenarios have automated tests that pass
- [ ] **UI POLISH:** Game state is clearly visible, actions are intuitive
- [ ] **PERFORMANCE:** Game responds quickly (<500ms for most actions)
- [ ] **BUGS:** No known critical or high-priority bugs remain
- [ ] **DOCS:** Code has comments explaining complex logic, README updated

---

*Remember: This project is 72% complete - you're fucking close! Focus on the critical path and resist the urge to add new features until the core game loop is bulletproof.*

