# DEVPLAN 06: Combat System

**Goal**: Implement the fundamental steps of the Combat Phase: declaring attackers, declaring blockers, and basic damage resolution.

## Tasks

### Combat Phase Structure
- [ ] Integrate the Combat Phase steps (Beginning of Combat, Declare Attackers, Declare Blockers, Combat Damage, End of Combat) into the `GameEngine`'s phase/step progression.
- [ ] Grant priority correctly during these steps as outlined in `game_loop_plan.md`.

### Declare Attackers Step
- [ ] Define `declare_attackers` WebSocket event/action (payload: list of attacking creature IDs).
- [ ] Implement handler in `GameEngine`.
- [ ] Validate correct phase/step and priority.
- [ ] Validate selected creatures exist on the battlefield and are controlled by the active player.
- [ ] Validate creatures can attack (untapped, no summoning sickness unless Haste).
- [ ] Update `GameState`: Mark attacking creatures, tap them (unless Vigilance).
- [ ] Add logging for declared attackers.

### Declare Blockers Step
- [ ] Define `declare_blockers` WebSocket event/action (payload: map of `{ blockerId: attackerId }`).
- [ ] Implement handler in `GameEngine`.
- [ ] Validate correct phase/step and priority (non-active player).
- [ ] Validate selected creatures exist, are controlled by the player, and are untapped.
- [ ] Add basic validation for blocking restrictions (e.g., Flying - placeholder).
- [ ] Update `GameState`: Mark blocking creatures and their assignments.
- [ ] Add logging for declared blockers.

### Combat Damage Step (Basic)
- [ ] Implement logic triggered after blockers declared and priority passes.
- [ ] Calculate damage assignment:
    - Unblocked attackers assign damage to the defending player.
    - Blocked attackers assign damage to their blockers.
    - Blockers assign damage to the attackers they block.
- [ ] Apply damage: Update a temporary `damage` marker on creature objects in `GameState`.
- [ ] Implement basic lethal damage check: If damage >= toughness, mark creature for destruction.
- [ ] Move destroyed creatures from battlefield to graveyard zone in `GameState` (this overlaps with State-Based Actions, implement basic version here).
- [ ] Update player life totals for unblocked damage.
- [ ] Add logging for damage dealt and creatures destroyed.
