# DEVPLAN 07: Stack Implementation

**Goal**: Implement the stack mechanism for handling spell and ability resolution using the LIFO (Last-In, First-Out) principle and manage priority passing related to stack operations.

## Tasks

### Stack Data Structure
- [ ] Implement the `stack` array within `GameState` using the `StackItem` interface defined in `DEVPLAN_02`.
- [ ] Each `StackItem` should store necessary info (e.g., card source, effect details, targets, controller).

### Adding to Stack
- [ ] Modify the `play_card` logic (from `DEVPLAN_05`) for Instants and Sorceries to add them as `StackItem`s to the top of the `GameState.stack` instead of directly resolving or going to the battlefield.
- [ ] Create a similar mechanism for activated abilities (placeholder for now).
- [ ] After adding an item to the stack, ensure the active player retains priority.

### Priority Passing & Resolution
- [ ] Refine the `passPriority` logic in `GameEngine`:
    - If player A passes, give priority to player B.
    - If player B passes (and player A passed previously):
        - Check if the stack is empty.
            - If empty: Proceed to the next game step/phase.
            - If not empty: Resolve the top item of the stack.
- [ ] Implement the `resolveTopStackItem` function:
    - Remove the top `StackItem` from `GameState.stack`.
    - Execute the item's effect (placeholder logic for now, e.g., log the resolution).
    - After resolution, grant priority to the active player.

### Integration & Logging
- [ ] Ensure phase/step transitions only occur when the stack is empty and both players have passed priority consecutively.
- [ ] Add logging for items being added to the stack, priority passes related to the stack, and stack item resolutions.
