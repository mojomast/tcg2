# 3. UI Design Specification

## Game Board Layout

The Badass TCG interface is designed to provide clear visibility of all game elements while maintaining an intuitive flow of information. The board is split into two main sections (player and opponent areas) with shared zones in the middle.

### Full Desktop Wireframe

```
+----------------------------------------------------------------------+
|                         OPPONENT INFO BAR                            |
| [NAME][AVATAR][LIFE:20][DECK:40][HAND:7][ENERGY:0][POISON:0][TIME]  |
+----------------------------------------------------------------------+
|                                                                      |
|  +--------+  +-------------------------------------------+  +------+ |
|  |        |  |                                           |  |      | |
|  | OPPO.  |  |         OPPONENT BATTLEFIELD              |  | OPPO.| |
|  | DECK   |  |                                           |  | DISC.| |
|  |        |  | +-----------+ +-----------+ +-----------+ |  |      | |
|  +--------+  | | CREATURE  | | CREATURE  | | CREATURE  | |  +------+ |
|              | +-----------+ +-----------+ +-----------+ |           |
|              |                                           |           |
|              | +-----------+ +-----------+ +-----------+ |           |
|  +--------+  | | RESOURCE  | | RESOURCE  | | RESOURCE  | |  +------+ |
|  |        |  | +-----------+ +-----------+ +-----------+ |  |      | |
|  | OPPO.  |  |                                           |  | OPPO. | |
|  | HAND   |  +-------------------------------------------+  | EXILE | |
|  |        |                                                 |      | |
|  +--------+                                                 +------+ |
|                                                                      |
|                     +-------------------+                            |
|                     |                   |                            |
|                     |   STACK ZONE      |                            |
|                     |                   |                            |
|                     +-------------------+                            |
|                                                                      |
|  +--------+  +-------------------------------------------+  +------+ |
|  |        |  |                                           |  |      | |
|  | YOUR   |  | +-----------+ +-----------+ +-----------+ |  | YOUR | |
|  | HAND   |  | | RESOURCE  | | RESOURCE  | | RESOURCE  | |  | EXILE| |
|  |        |  | +-----------+ +-----------+ +-----------+ |  |      | |
|  | [7]    |  |                                           |  +------+ |
|  |        |  | +-----------+ +-----------+ +-----------+ |           |
|  |        |  | | CREATURE  | | CREATURE  | | CREATURE  | |           |
|  +--------+  | +-----------+ +-----------+ +-----------+ |  +------+ |
|              |                                           |  |      | |
|              |         YOUR BATTLEFIELD                  |  | YOUR | |
|  +--------+  |                                           |  | DISC.| |
|  |        |  +-------------------------------------------+  |      | |
|  | YOUR   |                                                 |      | |
|  | DECK   |                                                 +------+ |
|  |        |                                                          |
|  +--------+                                                          |
|                                                                      |
+----------------------------------------------------------------------+
|                          YOUR INFO BAR                               |
| [NAME][AVATAR][LIFE:20][DECK:40][HAND:7][ENERGY:0][POISON:0][PHASE] |
+----------------------------------------------------------------------+
|         [MAIN ACTIONS]          |      [SECONDARY ACTIONS]           |
|  [PLAY] [ATTACK] [END TURN]     | [SETTINGS] [CONCEDE] [CHAT]        |
+----------------------------------------------------------------------+
```

### Core Zones and Their Functions

1. **Battlefield**: Central area where creatures, resources, and enchantments are played
2. **Hand**: Player's cards (visible only to the player)
3. **Deck**: Source of new cards (face down)
4. **Discard Pile**: Where used or destroyed cards go (face up, can be examined)
5. **Exile Zone**: For cards removed from game (out of normal play)
6. **Stack Zone**: Shows spells and abilities waiting to resolve
7. **Info Bars**: Display player status information

## Card Zone Organization

Each zone follows specific organizational principles to maintain clarity and game state readability.

### Battlefield Organization

The battlefield has distinct sub-zones for different card types:

```
+----------------------------------------------+
|                                              |
|  +----------+  +----------+  +----------+    |
|  | ENCHANT  |  | ENCHANT  |  | ENCHANT  |    |
|  +----------+  +----------+  +----------+    |
|                                              |
|  +----------+  +----------+  +----------+    |
|  | CREATURE |  | CREATURE |  | CREATURE |    | 
|  +----------+  +----------+  +----------+    |
|                                              |
|  +----------+  +----------+  +----------+    |
|  | RESOURCE |  | RESOURCE |  | RESOURCE |    |
|  +----------+  +----------+  +----------+    |
|                                              |
+----------------------------------------------+
```

**Rules for Battlefield Display**:
- Resources are placed in the bottom row
- Creatures occupy the middle row 
- Enchantments and other permanents go in the top row
- Tapped cards are rotated 90° clockwise
- Cards with counters show numeric indicators
- Targeted/selected cards have a highlight border

### Hand Display

```
+----------------------------------------------+
|                                              |
|  +-----+  +-----+  +-----+  +-----+  +-----+ |
|  |     |  |     |  |     |  |     |  |     | |
|  |CARD |  |CARD |  |CARD |  |CARD |  |CARD | |
|  |     |  |     |  |     |  |     |  |     | |
|  +-----+  +-----+  +-----+  +-----+  +-----+ |
|                                              |
|    [SORT BY: COST | TYPE | COLOR]            |
+----------------------------------------------+
```

**Hand Interaction Features**:
- Cards fan out when hovered
- Playable cards are highlighted based on available resources
- Cards can be sorted by various attributes
- Right-click opens expanded card view with full text

### Stack Zone Display

```
+------------------------+
|      STACK ZONE        |
| +------------------+   |
| | SPELL/ABILITY 3  |   |
| +------------------+   |
| | SPELL/ABILITY 2  |   |
| +------------------+   |
| | SPELL/ABILITY 1  |   |
| +------------------+   |
|    (resolves first)    |
+------------------------+
```

**Stack Interaction Features**:
- Newest additions appear at the top
- Each item shows origin (player icon)
- Arrows indicate targets when applicable
- Tooltips show timing and response options

## Action Controls & UI Elements

### Main Action Buttons

The primary action bar contains the most frequently used commands:

```
+----------------------------------------------------------------------+
|  [PLAY CARD]  |  [ATTACK]  |  [BLOCK]  |  [ACTIVATE]  |  [END TURN]  |
+----------------------------------------------------------------------+
```

**Button States**:
- Contextual Availability: Buttons are only active when the action is legal
- Phase Indication: Current phase is highlighted
- Auto-Pass Options: Toggles for automatically passing in specific phases

### Tooltip System

Tooltips provide additional information without cluttering the UI:

1. **Keyword Tooltips**: Hovering over a keyword shows its rules text
2. **Phase Tooltips**: Explain what actions are allowed in each phase
3. **Card Interaction Tooltips**: Show possible targets and outcomes
4. **Resource Tooltips**: Display available/used resources and conversion options

```
+-----------------------------------+
| FLYING                            |
|                                   |
| This creature can only be blocked |
| by creatures with flying.         |
|                                   |
| [See Rules Reference]             |
+-----------------------------------+
```

### Contextual Actions

Right-clicking on cards or game elements opens a contextual menu with relevant actions:

```
+-----------------------------------+
| ▶ View Full Card                  |
| ▶ Check Related Cards             |
| ▶ View Card History               |
| ▶ Examine Card Rulings            |
+-----------------------------------+
```

## Life & Resource Tracking

### Player Status Panel

```
+----------------------------------------------------------------------+
| PLAYER NAME: MagicMaster        |  PHASE: MAIN 1      |  TURN: 7     |
+----------------------------------------------------------------------+
| LIFE: 18 [+] [-]  |  POISON: 0  |  ENERGY: 3  |  TIME LEFT: 12:45    |
+----------------------------------------------------------------------+
| MANA POOL:  🔴R: 3  |  🔵U: 1  |  ⚪W: 0  |  ⚫B: 2  |  🟢G: 1       |
+----------------------------------------------------------------------+
```

**Status Panel Features**:
- Interactive life counter with +/- buttons
- Color-coded resource display
- Energy counter with usage tooltips
- Turn and phase indicators
- Timer display for tournament play

### Resource Management Interface

```
+----------------------------------------------------------------------+
|                        AVAILABLE RESOURCES                           |
|                                                                      |
| [TAP ALL]  |  [AUTO-PAY]  |  [TAP BY COLOR: 🔴R | 🔵U | ⚪W | ⚫B | 🟢G] |
+----------------------------------------------------------------------+
```

**Resource Management Features**:
- One-click "Tap All Resources" option
- Auto-pay feature for casting spells
- Manual tapping for strategic resource conservation
- Resource allocation preview when casting spells

## Responsive Design

The UI adapts to different screen sizes while maintaining functionality.

### Desktop Layout (Standard)
- Full battlefield view
- Detailed card information
- Advanced tooltips and stat tracking
- Multi-zone simultaneous visibility

### Tablet Layout (Adaptive)
- Slightly condensed battlefield
- Collapsible information panels
- Touch-optimized card interaction
- Scrollable zones

### Mobile Layout (Condensed)

```
+----------------------------------+
|          OPPONENT INFO           |
|     [LIFE: 20]  [CARDS: 3]       |
+----------------------------------+
|                                  |
|     [VIEW OPPONENT BATTLEFIELD]  |
|                                  |
+----------------------------------+
|                                  |
|          STACK ZONE              |
|     [2 ITEMS - TAP TO VIEW]      |
|                                  |
+----------------------------------+
|                                  |
|       YOUR BATTLEFIELD           |
|   [SWIPE TO VIEW ALL CARDS]      |
|                                  |
+----------------------------------+
|                                  |
|           YOUR HAND              |
| [C1] [C2] [C3] [C4] [...+3]     |
|                                  |
+----------------------------------+
| [PLAY] [ATTACK] [BLOCK] [END]   |
+----------------------------------+
```

**Mobile-Specific Features**:
- Zone tabs for quick navigation
- Collapsible opponent's battlefield
- Streamlined action buttons
- Card stacking for space efficiency
- Pinch-to-zoom card details

## Mulligan Interface

The mulligan system allows players to redraw their opening hand if they're unsatisfied.

```
+----------------------------------------------------------------------+
|                         OPENING HAND DECISION                         |
+----------------------------------------------------------------------+
|                                                                      |
|  +-----+  +-----+  +-----+  +-----+  +-----+  +-----+  +-----+      |
|  |     |  |     |  |     |  |     |  |     |  |     |  |     |      |
|  |CARD |  |CARD |  |CARD |  |CARD |  |CARD |  |CARD |  |CARD |      |
|  |     |  |     |  |     |  |     |  |     |  |     |  |     |      |
|  +-----+  +-----+  +-----+  +-----+  +-----+  +-----+  +-----+      |
|                                                                      |
|  Hand Analysis:                                                      |
|  - Resources: 3 (Recommended: 2-4)                                   |
|  - Curve: Low-Cost Heavy                                             |
|  - Colors: 2R, 1U                                                    |
|                                                                      |
+----------------------------------------------------------------------+
|      [KEEP HAND]           |         [MULLIGAN: 6 CARDS]             |
+----------------------------------------------------------------------+
```

**Mulligan System Features**:
- Paris Mulligan rule (draw one fewer card each mulligan)
- Hand analysis tool showing resource count and mana curve
- Option to scry 1 after taking a mulligan
- Card selection for London Mulligan variant (choose cards to put back)

## In-Game Communication & Notifications

### Notification System

```
+----------------------------------------------------------------------+
|  PRIORITY INDICATOR: Your Turn -> Action Required                     |
+----------------------------------------------------------------------+
|                                                                      |
| ⚠️ Opponent cast Tactical Counterstrike targeting your Fiery Berserker |
|                           [PAY 2?] [DECLINE]                         |
|                                                                      |
+----------------------------------------------------------------------+
```

**Notification Types**:
- Priority indicators
- Required action alerts
- Timer warnings
- Game state changes
- Card effect triggers

### Chat & Emote System

```
+----------------------------------------------------------------------+
|                           COMMUNICATION                              |
+----------------------------------------------------------------------+
|                                                                      |
| [EMOTES]  |  [QUICK CHAT]  |  [CUSTOM MESSAGE]  |  [TOGGLE CHAT]     |
|                                                                      |
| 🙂 | 😠 | 🤔 | 👍 | ⏱️ | 🎉  | "Good game" | "Nice move" | "Thinking..." |
|                                                                      |
+----------------------------------------------------------------------+
```

**Communication Features**:
- Pre-defined emotes and phrases
- Optional text chat with profanity filter
- Mute option
- Chess-clock style time acknowledgments

## Card Inspection Interface

Detailed card examination is available throughout gameplay:

```
+----------------------------------------------------------------------+
|                         CARD DETAIL VIEW                             |
+----------------------------------------------------------------------+
|                                                                      |
| +-----------------------------+  +--------------------------------+  |
| |                             |  | Card: Kaelix, Storm General    |  |
| |                             |  | Cost: 2RW                      |  |
| |        CARD ARTWORK         |  | Type: Legendary Creature       |  |
| |                             |  | P/T: 4/4                       |  |
| |                             |  |                                |  |
| +-----------------------------+  | Abilities:                     |  |
| | Kaelix, Storm General       |  | - Vigilance, Haste            |  |
| +-----------------------------+  | - Creates 1/1 tokens on attack |  |
| | Legendary Creature          |  | - 3RW: +2/+0 and double strike|  |
| +-----------------------------+  |                                |  |
|

