# Game Loop Plan (Condensed)

This document outlines the flow of the game, turn structure, and action processing based on the design documents.

## 1. Game Setup

1.  **Initialization**: Players join, decks loaded, initial state created (life totals, etc.).
2.  **Opening Hand**: Each player draws 7 cards.
3.  **Mulligan**: Players may mulligan (Paris rule standard: redraw N-1 cards, then scry 1 if mulliganed).
4.  **Determine First Player**: Randomly.
5.  **Start Game**: First player begins their first turn (skips draw step on turn 1).

## 2. Turn Structure

Each turn consists of the following phases, executed in order:

**BEGIN PHASE**
1.  **Untap Step**: Untap all permanents controlled by the active player.
    - No priority passed.
2.  **Upkeep Step**: Trigger "at the beginning of upkeep" abilities. Players gain priority.
3.  **Draw Step**: Active player draws a card (skipped on player 1's first turn). Players gain priority.
4.  **Resource Gain Step** (Custom): Player gains base resources (e.g., mana pool refreshed based on generators). Players gain priority.

**MAIN PHASE (First)**
- Active player gains priority.
- Can play any card type (Creature, Sorcery, Instant, Enchantment, Resource Generator - limit 1 per turn typically) or activate abilities.
- Priority passes back and forth until both players pass on an empty stack.

**COMBAT PHASE**
1.  **Beginning of Combat Step**: Trigger relevant abilities. Players gain priority.
2.  **Declare Attackers Step**: Active player declares attacking creatures. Players gain priority.
3.  **Declare Blockers Step**: Defending player declares blocking creatures. Players gain priority.
4.  **Combat Damage Step**: Combat damage resolves (First Strike, then Normal). Trigger relevant abilities. Players gain priority.
5.  **End of Combat Step**: Trigger relevant abilities. Players gain priority.

**MAIN PHASE (Second)**
- Same as the first Main Phase. Active player gains priority.
- Provides another window to play non-Instant cards.

**END PHASE**
1.  **End Step**: Trigger "at end of turn" abilities. Players gain priority.
2.  **Cleanup Step**:
    - Discard down to maximum hand size (default 7).
    - Damage wears off creatures.
    - "Until end of turn" effects end.
    - No priority passed unless an ability triggers here.

## 3. Priority & Action Flow

1.  **Priority Grant**: Active player receives priority at the start of each step/phase (except Untap, Cleanup).
2.  **Player Action**: Player with priority can:
    - Cast a spell (if timing allows).
    - Activate an ability.
    - Play a resource generator (Main Phase, empty stack).
    - Perform special actions.
    - Pass priority.
3.  **Action -> Stack**: Most actions (spells, abilities) go onto the stack.
4.  **Response Window**: After an action, the player who took it gets priority back. They can act again or pass.
5.  **Passing Priority**: If a player passes, the opponent gets priority.
6.  **Resolution**: If both players pass sequentially:
    - If stack is not empty: Top item resolves. Active player gets priority.
    - If stack is empty: Game proceeds to the next step/phase.

## 4. Action Processing (Client-Server)

Ref: `4_technical.md`

1.  **Client Input**: Player performs action via UI (e.g., clicks 'Play Card').
2.  **Client Sends Event**: Client sends WebSocket message (e.g., `play_card`) to server with necessary data (card ID, targets).
3.  **Server Receives**: WebSocket server routes message to appropriate Game Engine instance.
4.  **Server Validation**: Game Engine checks if the action is legal based on current `GameState`, rules, timing, priority, resources, targets.
5.  **Validation Failure**: Server sends `game_error` event back to originating client.
6.  **Validation Success**: Game Engine mutates the canonical `GameState` (e.g., moves card to stack, deducts resources).
7.  **State Broadcast**: Server broadcasts relevant state updates via WebSocket (e.g., `stack_update`, `phase_change`, player state changes) to ALL players in the game.
8.  **Client Receives Update**: Clients receive state update events.
9.  **Client Updates UI**: Frontend (React/Redux) updates the UI based on the new state received from the server.

## 5. State Checks

- **Win/Loss Conditions**: Checked whenever game state changes that could trigger them (e.g., life total change, draw attempt from empty deck, poison counter added). Typically checked after an action resolves or state-based actions are processed.
- **State-Based Actions (SBAs)**: Checked whenever a player would receive priority. Examples:
    - Creature with lethal damage is destroyed.
    - Player with 0 or less life loses.
    - Handling of certain static abilities.

## 6. End of Turn

- After Cleanup Step, turn passes to the opponent.
- Active player becomes the non-active player, and vice versa.
- Start the Begin Phase for the new active player.
