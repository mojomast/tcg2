# Game Logic Plan (Condensed)

This document outlines the core game rules and mechanics derived from the design documents.

## 1. Core Concepts

- **Players**: 2
- **Objective**: Reduce opponent's life to 0 (standard), deck out, poison counters, or special card conditions.
- **Resources**: Mana (5 colors + colorless) and Energy (persistent).
- **Cards**: Creatures, Spells (Instant, Sorcery), Enchantments, Resource Generators.
- **Zones**: Hand, Deck, Battlefield, Discard Pile (Graveyard), Exile, Stack.

## 2. Resources

### Mana
- **Generation**: From Resource Generator cards (typically tapped).
- **Pool**: Resets each turn during the Begin Phase.
- **Cost**: Cards require specific mana types/amounts.
- **Spending**: Mana is spent from the pool to cast cards or activate abilities.
- **Persistence**: Does not carry over between turns.

### Energy
- **Generation**: Through specific card effects.
- **Pool**: Persistent counters, does not reset.
- **Spending**: Used to activate specific abilities.

## 3. Card Properties & Types

- **Common Attributes**: Name, Cost, Type, Subtype, Rarity, Rules Text, Set Symbol.
- **Creatures**: Power/Toughness, Abilities (Keywords), Speed Type (Normal/Fast).
    - Suffer Summoning Sickness (cannot attack/tap on entry unless Haste).
- **Spells**:
    - **Instant**: Any time player has priority.
    - **Sorcery**: Only during player's Main Phase when stack is empty.
- **Enchantments**: Persistent effects on battlefield (global, player, or card-attached).
- **Resource Generators**: Produce mana (usually requires tapping).

## 4. Combat System

- **Sequence**: Declare Attackers -> Declare Blockers -> Combat Damage Resolution.
- **Attacking**: Active player declares attacking creatures (must be untapped, no summoning sickness unless Haste). Creatures tap to attack (unless Vigilance).
- **Blocking**: Defending player assigns blockers to attacking creatures.
    - Flying creatures can only be blocked by Flying or Reach creatures.
- **Damage Resolution**:
    1. First Strike damage (if any).
    2. Normal combat damage.
    - Creatures deal damage equal to their Power.
    - Damage equal to or greater than Toughness destroys a creature.
    - Deathtouch: Any damage is lethal.
    - Trample: Excess damage to blocker assigned to defending player/planeswalker.
    - Lifelink: Damage dealt adds to controller's life total.

## 5. The Stack & Priority

- **Stack**: LIFO (Last-In, First-Out) zone for spells and abilities waiting to resolve.
- **Priority**: The right for a player to take an action.
    - Active player gets priority at the start of most steps/phases.
    - After an action is taken (spell cast, ability activated), active player gets priority again.
    - If active player passes, non-active player gets priority.
    - If both players pass sequentially, the top item on the stack resolves.
    - If both players pass sequentially and the stack is empty, the game moves to the next step/phase.
- **Responses**: Players can cast Instants or activate abilities when they have priority, often in response to opponent actions.
- **Special Actions**: Some actions (like playing a resource generator) do not use the stack.

## 6. Keywords (Examples)

- **Haste**: Ignores summoning sickness.
- **Flying**: Restricted blocking.
- **Trample**: Excess combat damage to player.
- **First Strike**: Deals combat damage first.
- **Deathtouch**: Any damage is lethal.
- **Lifelink**: Gain life equal to damage dealt.
- **Vigilance**: Doesn't tap to attack.
- **Flash**: Can be cast any time priority is held (like an Instant).

## 7. State Management

- **Canonical State**: Held by the server.
- **Updates**: Client actions validated by server -> state mutated -> updates broadcast via WebSocket.
- **Key State Components**: Player life, energy, poison, cards in zones (hand, battlefield, graveyard, exile), deck count, current turn/phase, active player, stack contents.

## 8. Win Conditions

- Reduce opponent life total to 0 or less.
- Opponent attempts to draw from an empty deck.
- Opponent accumulates 10+ poison counters.
- Resolve a card with a specific win condition.
- Commander damage (format specific).
