# 1. Game Mechanics

## Turn Structure & Phases

The turn sequence in Badass TCG follows a structured approach that balances strategic planning with reactive gameplay. Each player's turn is divided into distinct phases that govern what actions can be taken.

### Phase Sequence

```
+---------------+     +---------------+     +----------------+     +---------------+
|               |     |               |     |                |     |               |
|  BEGIN PHASE  +---->+  MAIN PHASE   +---->+  COMBAT PHASE  +---->+   END PHASE   |
|               |     |               |     |                |     |               |
+-------+-------+     +-------+-------+     +--------+-------+     +-------+-------+
        |                     |                      |                     |
        v                     v                      v                     v
+-------+-------+     +-------+-------+     +--------+-------+     +-------+-------+
|               |     |               |     |                |     |               |
| • Draw Card   | | • Play Cards    | | • Declare      | | • Discard     |
| • Untap All   | | • Activate      | |   Attackers    | |   (if > 7)    |
| • Gain        | |   Abilities     | | • Declare      | | • End of Turn |
|   Resources   | | • Stack         | |   Blockers     | |   Triggers    |
|               | |   Resolution    | | • Combat       | |               |
|               | |                 | |   Resolution   | |               |
+---------------+     +---------------+     +----------------+     +---------------+
```

### Phase Details

#### Begin Phase
1. **Untap**: All tapped cards are untapped
2. **Upkeep**: Trigger any "at beginning of upkeep" effects
3. **Draw**: Draw one card from your deck
4. **Resource Gain**: Gain resource points based on your generators (see Resource System)

#### Main Phase
1. Play cards from hand (creatures, spells, enchantments, resource generators)
2. Activate abilities on cards in play
3. Your opponent can respond with Instant spells and abilities

#### Combat Phase
1. **Declare Attackers**: Choose which creatures will attack
2. **Declare Blockers**: Defending player assigns blockers
3. **Combat Resolution**: Damage is calculated and applied
4. **Post-Combat Main**: Second opportunity to play cards (optional)

#### End Phase
1. **End Step**: Trigger "at end of turn" effects
2. **Cleanup**: Discard down to maximum hand size (7)
3. Pass turn to opponent

## Resource System

Badass TCG implements a dual-resource system that adds strategic depth while maintaining accessibility.

### Primary Resources: Mana

```
+---------------+     +---------------+     +---------------+
|               |     |               |     |               |
|  RED MANA     |     |  BLUE MANA    |     |  GREEN MANA   |
|  Aggressive   |     |  Control      |     |  Growth       |
|  Damage       |     |  Counter      |     |  Ramp         |
|  Haste        |     |  Draw         |     |  Big          |
|               |     |               |     |               |
+---------------+     +---------------+     +---------------+

+---------------+     +---------------+
|               |     |               |
|  BLACK MANA   |     |  WHITE MANA   |
|  Sacrifice    |     |  Protection   |
|  Removal      |     |  Healing      |
|  Recursion    |     |  Small Armies |
|               |     |               |
+---------------+     +---------------+
```

1. **Mana Sources**: Played as cards that generate specific mana colors
2. **Mana Pool**: Refreshes each turn based on your sources
3. **Color Identity**: Each card requires specific mana colors to cast
4. **Conversion**: Unused mana does NOT carry over between turns/phases

### Secondary Resource: Energy

Energy is a persistent resource that doesn't reset each turn.

1. **Energy Counters**: Accumulated through card effects
2. **Persistent**: Unlike mana, energy remains until spent
3. **Activation**: Powers special abilities on specific cards
4. **Generation**: Gained through specific cards and effects

### Resource Configuration Types

#### Type 1: Balanced (Default)
- Start with 0 mana generators
- Play 1 mana generator per turn
- Max hand size: 7
- Starting life: 20

#### Type 2: Accelerated
- Start with 1 mana generator of chosen color
- Play 1 mana generator per turn
- Max hand size: 5
- Starting life: 15

## Card Types & Mechanics

### Creature Cards

Creatures are the primary way to deal damage and defend.

**Properties**:
- Mana Cost: Amount and color of mana required to cast
- Power: Damage dealt in combat
- Toughness: Health/damage absorption
- Abilities: Special effects and powers
- Type: Creature subtype (e.g., Dragon, Warrior)

**Key Mechanics**:
- **Summoning Sickness**: Cannot attack the turn they enter play
- **Tapping**: Turned sideways to indicate it has attacked/activated
- **Keywords**: Special abilities like Flying, Trample, etc.

### Spell Cards

**Instant Spells**:
- Can be cast at any time, including opponent's turn
- Resolve immediately (subject to stack resolution)
- One-time effect, then discarded

**Sorcery Spells**:
- Can only be cast during your main phase
- More powerful effects than instants
- One-time effect, then discarded

### Enchantment Cards

- Persistent effects that remain in play
- Attached to the battlefield or specific cards
- Provide ongoing bonuses or penalties

### Resource Generator Cards

- Produce mana when tapped
- Primary economic engine of the game
- Limited to one play per turn (normally)

## Combat System

### Attack & Block Sequence

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
| DECLARE ATTACKERS +---->+ DECLARE BLOCKERS +---->+ DAMAGE RESOLUTION|
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
        ^                        |                        |
        |                        v                        v
+-------+--------+     +---------+--------+     +---------+-------+
|                |     |                  |     |                 |
| • Tap Attackers|     | • Assign Blockers|     | • First Strike  |
| • Choose       |     |   to Attackers   |     |   Damage        |
|   Targets      |     | • Multiple       |     | • Normal Damage |
| • Trigger      |     |   Blockers       |     | • Excess Damage |
|   Attack       |     |   Allowed        |     |   Calculation   |
|   Abilities    |     |                  |     |                 |
+----------------+     +------------------+     +-----------------+
```

### Stack Resolution Rules

The stack is a fundamental concept in Badass TCG that determines the order in which spells and abilities resolve.

1. Active player adds spell/ability to the stack
2. Priority passes to opponent
3. Opponent can respond by adding their own spell/ability
4. Priority passes back to active player
5. This continues until both players pass priority
6. Stack resolves LAST IN, FIRST OUT (LIFO)

Example Stack Resolution:
```
+-------------------+     +-------------------+     +-------------------+
| Player 1          |     | Player 2          |     | Resolution Order  |
+-------------------+     +-------------------+     +-------------------+
| 1. Casts Fireball |     | 2. Casts Counterspell   | 1. Counterspell   |
|    (4 damage)     |     |    (targets Fireball)   | 2. Fireball (countered) |
+-------------------+     +-------------------+     +-------------------+
```

### Combat Keywords

- **First Strike**: Deals damage before normal creatures
- **Deathtouch**: Any damage dealt is lethal
- **Trample**: Excess damage goes to player
- **Flying**: Can only be blocked by other Flying creatures
- **Vigilance**: Doesn't tap when attacking

## Win Conditions

Multiple paths to victory create strategic diversity.

| Win Condition | Description | Difficulty |
|---------------|-------------|------------|
| Life Depletion | Reduce opponent's life to 0 | Standard |
| Deck Depletion | Force opponent to draw from empty deck | Alternative |
| Ultimate Cards | Special cards with game-winning conditions | Advanced |
| Poison Counters | Accumulate 10 poison counters on opponent | Alternative |
| Commander Damage | 21+ damage from same legendary creature (Commander format) | Format-specific |

## Player Action Flow

### Priority System

The game uses a priority-based action system:

1. Active player receives priority first in each phase
2. After each action, active player regains priority
3. When active player passes, non-active player receives priority
4. Phase advances when both players pass priority sequentially

### Available Actions

When a player has priority, they may:

- Play a card (if timing restrictions allow)
- Activate an ability on a card they control
- Attack (during combat phase)
- Pass priority

### Action Timing Restrictions

```
+-------------------------+-------------------------+-------------------------+
| Action Type             | Your Turn               | Opponent's Turn        |
+-------------------------+-------------------------+-------------------------+
| Play Resource Generator | Main Phase Only         | Not Allowed            |
| Play Creature           | Main Phase Only         | Not Allowed            |
| Play Sorcery            | Main Phase Only         | Not Allowed            |
| Play Enchantment        | Main Phase Only         | Not Allowed            |
| Play Instant            | Any Phase               | Any Phase              |
| Activate Abilities      | As Specified on Card    | As Specified on Card   |
| Declare Attackers       | Combat Phase Only       | Not Allowed            |
| Declare Blockers        | Not Allowed             | Combat Phase Only      |
+-------------------------+-------------------------+-------------------------+
```

### Special Actions

Some actions don't use the stack and can't be responded to:

- Playing a resource generator
- Turning face-down cards face-up
- Special abilities specifically marked as "special actions"

---

*Cross-references:*
- For card examples that utilize these mechanics, see [Deck Building & Card System](2_deck_building.md)
- For UI implementation of these systems, see [UI Design Specification](3_ui_design.md)

