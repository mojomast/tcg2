# 2. Deck Building & Card System

## Deck Construction Rules

Building a balanced and effective deck is a critical aspect of Badass TCG. The following rules govern deck construction:

### Core Rules

| Parameter | Standard Format | Quick Format | Tournament Format |
|-----------|-----------------|--------------|-------------------|
| Minimum Deck Size | 60 cards | 40 cards | 60 cards |
| Maximum Deck Size | No limit (but recommended ≤90) | 60 cards | 80 cards |
| Resource Generator Ratio | ~40% (24+ for 60-card deck) | ~40% (16+ for 40-card deck) | ~40% (24+ for 60-card deck) |
| Card Copy Limits | Max 4 copies of any card | Max 3 copies of any card | Max 4 copies of any card |
| Sideboard Size | 15 cards | None | 15 cards |
| Banned/Restricted List | See current ban list | See current ban list | See current ban list |

### Color Identity Rules

Color identity refers to the alignment of a card with specific mana types (as detailed in [Game Mechanics](1_game_mechanics.md)).

1. **Pure Decks**: Focus on a single mana color, providing consistency but limiting options
2. **Dual-Color Decks**: Combine two complementary colors for more versatile strategies
3. **Multi-Color Decks**: Three or more colors enable powerful combinations but increase risk of resource scarcity
4. **Colorless Cards**: Can be included in any deck regardless of color identity

### Deck Archetypes

```
+---------------+     +---------------+     +---------------+
|               |     |               |     |               |
|   AGGRO       |     |   CONTROL     |     |   COMBO       |
|   Fast        |     |   Slow        |     |   Variable    |
|   Low Cost    |     |   Defensive   |     |   Specific    |
|   Direct      |     |   Disruptive  |     |   Synergistic |
|               |     |               |     |               |
+---------------+     +---------------+     +---------------+

+---------------+     +---------------+
|               |     |               |
|   MIDRANGE    |     |   HYBRID      |
|   Balanced    |     |   Flexible    |
|   Adaptive    |     |   Multiple    |
|   Resilient   |     |   Strategies  |
|               |     |               |
+---------------+     +---------------+
```

Each archetype favors specific card types, costs, and strategies:

- **Aggro**: Low-cost creatures, direct damage spells, minimal resource generators
- **Control**: Counterspells, removal, card draw, higher resource generator count
- **Combo**: Card draw, tutors (card search), combo pieces, protection spells
- **Midrange**: Efficient creatures, removal, flexible answers, balanced resource distribution
- **Hybrid**: Combines elements from multiple archetypes for unpredictability

## Card Attributes & Properties

Each card in Badass TCG contains specific attributes that define its function, power level, and mechanical identity.

### Universal Card Attributes

All cards share these basic attributes:

1. **Name**: Unique identifier
2. **Cost**: Required mana to play (may include colorless and/or colored mana)
3. **Type**: Primary card category (Creature, Spell, Enchantment, Resource)
4. **Subtype**: Further classification within the primary type (e.g., Dragon, Aura)
5. **Rarity**: Common, Uncommon, Rare, Mythic, or Legendary
6. **Rules Text**: Card effects and abilities
7. **Flavor Text**: Non-mechanical lore/storytelling (optional)
8. **Set Symbol**: Indicates which expansion the card belongs to
9. **Collector Number**: Unique ID within a set

### Type-Specific Attributes

#### Creature Cards
- **Power**: Attack damage dealt
- **Toughness**: Health/damage absorption
- **Speed Type**: Normal or Fast (ignores summoning sickness)
- **Combat Abilities**: Special combat-related keywords

#### Spell Cards
- **Speed**: Instant or Sorcery
- **Target Requirements**: What the spell can affect
- **Duration**: One-time or persistent effect

#### Enchantment Cards
- **Attachment Type**: Global, Player-attached, or Card-attached
- **Duration**: Permanent or temporary
- **Trigger Condition**: When effects activate (if applicable)

#### Resource Generator Cards
- **Mana Type**: Color(s) produced
- **Entry Effect**: Special effect when played (if any)
- **Activation Cost**: Cost to use (if not free)

### Keyword Abilities

Keywords are shorthand for common abilities. Key examples include:

| Keyword | Description | Card Types |
|---------|-------------|------------|
| Flying | Can only be blocked by creatures with Flying | Creature |
| Haste | Can attack the turn it enters play | Creature |
| Flash | Can be played at instant speed | Any |
| Deathtouch | Any damage dealt is lethal | Creature |
| Lifelink | Damage dealt adds to player's life total | Creature |
| Draw | Draw additional cards | Any |
| Scry | Look at top card(s) of library and rearrange/discard | Any |
| Counter | Nullify a spell or ability | Instant |

## Example Cards

### Example 1: Creature Card (Common)

| Attribute | Value |
|-----------|-------|
| **Name** | Fiery Berserker |
| **Cost** | 1R (1 colorless, 1 red) |
| **Type** | Creature |
| **Subtype** | Human Warrior |
| **Rarity** | Common |
| **Power/Toughness** | 2/1 |
| **Rules Text** | Haste<br>When Fiery Berserker attacks, it gets +1/+0 until end of turn. |
| **Flavor Text** | "He fights not for glory, but for the thrill of the flame." |

### Example 2: Instant Spell (Uncommon)

| Attribute | Value |
|-----------|-------|
| **Name** | Tactical Counterstrike |
| **Cost** | 1U (1 colorless, 1 blue) |
| **Type** | Instant |
| **Rarity** | Uncommon |
| **Rules Text** | Counter target spell unless its controller pays 2.<br>Draw a card if you control a Warrior. |
| **Flavor Text** | "The best defense is a defense with backup plans." |

### Example 3: Enchantment (Rare)

| Attribute | Value |
|-----------|-------|
| **Name** | Verdant Growth |
| **Cost** | 2G (2 colorless, 1 green) |
| **Type** | Enchantment |
| **Rarity** | Rare |
| **Rules Text** | At the beginning of your upkeep, add one energy counter.<br>Whenever you tap a Resource Generator for mana, you may spend 3 energy counters to add one additional mana of that Generator's color. |
| **Flavor Text** | "From one seed, a forest grows." |

### Example 4: Resource Generator (Common)

| Attribute | Value |
|-----------|-------|
| **Name** | Mystic Springs |
| **Cost** | None |
| **Type** | Resource Generator |
| **Rarity** | Common |
| **Rules Text** | Tap: Add one blue mana to your mana pool.<br>If you control 5 or more Resource Generators, Mystic Springs produces one blue and one colorless mana instead. |
| **Flavor Text** | "Its waters flow with arcane energies." |

### Example 5: Legendary Creature (Mythic)

| Attribute | Value |
|-----------|-------|
| **Name** | Kaelix, Storm General |
| **Cost** | 2RW (2 colorless, 1 red, 1 white) |
| **Type** | Legendary Creature |
| **Subtype** | Human Warrior |
| **Rarity** | Mythic |
| **Power/Toughness** | 4/4 |
| **Rules Text** | Vigilance, Haste<br>Whenever Kaelix, Storm General attacks, create a 1/1 white Soldier token with haste.<br>3RW: Kaelix and all Soldiers you control gain +2/+0 and double strike until end of turn. |
| **Flavor Text** | "I don't lead from behind. My soldiers follow my blade, not my orders." |

## Deck Validation Rules

A valid deck must meet all construction requirements and pass these validation checks:

### Card Legality

1. **Format Legality**: All cards must be legal in the chosen format
2. **Banned & Restricted List**: No banned cards; restricted cards limited to 1 copy
3. **Set Rotation**: Standard format only allows cards from the most recent sets

### Rarity Restrictions

| Format | Rarity Restrictions |
|--------|---------------------|
| Standard | No restrictions |
| Limited | Based on draft/sealed pool |
| Pauper | Commons only |
| Commander | One Legendary creature as Commander |
| Mythic Constructed | Maximum 5 Mythic cards per deck |

### Color Restrictions

1. **Commander**: Cards must match the color identity of your Commander
2. **Monocolor Tournaments**: Only cards of the designated color plus colorless
3. **Rainbow Format**: Minimum one card of each color required

### Deck Validation Flowchart

```
+------------------+
| START VALIDATION |
+--------+---------+
         |
         v
+--------+---------+     +-----------------+
| Check Deck Size  +---->+ Reject if       |
|                  |     | < Minimum Size  |
+--------+---------+     +-----------------+
         |
         v
+--------+---------+     +-----------------+
| Check Card Count +---->+ Reject if       |
| Limits (e.g. 4x) |     | > Max Allowed   |
+--------+---------+     +-----------------+
         |
         v
+--------+---------+     +-----------------+
| Check Resource   +---->+ Warning if      |
| Generator Ratio  |     | < Recommended   |
+--------+---------+     +-----------------+
         |
         v
+--------+---------+     +-----------------+
| Check Format    +---->+ Reject if       |
| Restrictions    |     | Violates Rules   |
+--------+---------+     +-----------------+
         |
         v
+--------+---------+
| DECK VALIDATED   |
+------------------+
```

### Resource Curve Recommendations

A balanced mana curve ensures playable options at each stage of the game:

| Mana Cost | Aggro Deck % | Control Deck % | Midrange Deck % |
|-----------|--------------|----------------|-----------------|
| 0-1 | 15-20% | 5-10% | 10-15% |
| 2 | 30-35% | 15-20% | 20-25% |
| 3 | 20-25% | 20-25% | 25-30% |
| 4 | 10-15% | 20-25% | 15-20% |
| 5 | 5-10% | 15-20% | 10-15% |
| 6+ | 0-5% | 15-20% | 5-10% |

---

*Cross-references:*
- For details on how resources work in gameplay, see [Game Mechanics: Resource System](1_game_mechanics.md#resource-system)
- For visualization of cards in the game interface, see [UI Design Specification: Card Zones](3_ui_design.md)

