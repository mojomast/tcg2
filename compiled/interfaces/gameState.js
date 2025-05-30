// Action Types for Player Actions
export var ActionType;
(function (ActionType) {
    ActionType["PLAY_CARD"] = "PLAY_CARD";
    ActionType["ACTIVATE_ABILITY"] = "ACTIVATE_ABILITY";
    ActionType["PASS_PRIORITY"] = "PASS_PRIORITY";
    ActionType["DECLARE_ATTACKER"] = "DECLARE_ATTACKER";
    ActionType["DECLARE_BLOCKER"] = "DECLARE_BLOCKER";
    // Add more game actions
})(ActionType || (ActionType = {}));
// Basic Event Types
export var EventType;
(function (EventType) {
    EventType["ZONE_CHANGE"] = "ZONE_CHANGE";
    EventType["ACTION_INVALID"] = "ACTION_INVALID";
    EventType["SPELL_CAST"] = "SPELL_CAST";
    EventType["CARD_PLAYED"] = "CARD_PLAYED";
    EventType["ABILITY_ACTIVATED"] = "ABILITY_ACTIVATED";
    EventType["STACK_ITEM_RESOLVED"] = "STACK_ITEM_RESOLVED";
    EventType["RESOURCE_PLAYED"] = "RESOURCE_PLAYED";
    EventType["PLAYER_ATTEMPTED_DRAW_FROM_EMPTY_LIBRARY"] = "PLAYER_ATTEMPTED_DRAW_FROM_EMPTY_LIBRARY";
    EventType["CARD_DRAWN"] = "CARD_DRAWN";
    EventType["GAME_OVER"] = "GAME_OVER";
    EventType["PRIORITY_CHANGED"] = "PRIORITY_CHANGED";
    EventType["TURN_PHASE_CHANGED"] = "TURN_PHASE_CHANGED";
    EventType["STEP_CHANGED"] = "STEP_CHANGED";
    EventType["MANA_POOL_UPDATED"] = "MANA_POOL_UPDATED";
    EventType["LIFE_TOTAL_CHANGED"] = "LIFE_TOTAL_CHANGED";
    EventType["ERROR"] = "ERROR";
    EventType["GAME_READY"] = "GAME_READY";
    EventType["GAME_STATE_UPDATE"] = "game_state_update";
    EventType["CARD_DISCARDED"] = "CARD_DISCARDED";
    EventType["TURN_PASSED"] = "TURN_PASSED";
    // Add more event types as needed (e.g., PLAYER_PRIORITY_CHANGED, TURN_CHANGED, COMBAT_DECLARED)
})(EventType || (EventType = {}));
