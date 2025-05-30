# DEVPLAN 15: Testing & Refinement

**Goal**: Conduct initial testing of the core game loop, actions, and systems implemented so far. Identify and fix bugs, and refine the basic functionality.

## Tasks

### Manual Playtesting
- [ ] Set up a basic way to run a 2-player game instance locally (e.g., two browser tabs connected to the same server). (Note: Server is now stable and running, facilitating this step).
- [ ] Manually play through several turns, focusing on:
    - Turn/phase progression.
    - Drawing cards.
    - Playing resource cards.
    - Playing basic creatures.
    - Paying mana costs.
    - Basic combat (attacking, blocking, damage).
    - Basic stack resolution (playing an instant).
    - Life total changes.
    - Win/loss condition triggers (life, deck out).

### Debugging & Logging Review
- [ ] Monitor server and client console logs during playtesting.
- [ ] Investigate any errors or unexpected behavior.
- [ ] Verify state synchronization is working correctly – actions on one client reflect accurately on the other.
- [ ] Add more detailed logging where needed to diagnose issues.

### Bug Fixing
- [ ] Address critical bugs found during playtesting, particularly those affecting the core game loop or state consistency.
- [X] Resolved critical TypeScript compilation errors, enabling the server to compile and run successfully.
- [X] Corrected mana cost payment logic in ActionManager.
- [ ] Fix issues related to priority passing and stack resolution.
- [ ] Correct any errors in mana cost payment or resource tracking.
- [ ] Resolve problems with combat calculations or keyword implementations.

### Code Review & Refactoring (Optional)
- [ ] Review the structure of the `GameEngine` and related modules.
- [ ] Refactor parts of the code for clarity or efficiency based on initial implementation experience.
- [ ] Ensure consistent coding style and add comments where necessary.
